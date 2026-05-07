import { Component, OnInit, ViewChild } from '@angular/core';
import { FrmregistrarinventariovaloradoService } from './frmregistrarinventariovalorado.service';
import { showAlert, showAlertConfirm } from 'src/app/utilities/sweetAlert.util';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { DxDataGridComponent } from 'devextreme-angular';

export enum AccionInventario {
  Ninguna = 'NINGUNA',
  Crear = 'CREAR',
  Actualizar = 'ACTUALIZAR'
}
@Component({
  selector: 'app-frmregistrarinventariovalorado',
  templateUrl: './frmregistrarinventariovalorado.component.html',
  styleUrl: './frmregistrarinventariovalorado.component.scss'
})
export class FrmregistrarinventariovaloradoComponent implements OnInit {
  // ✅ Expone el enum al template
  AccionInventario = AccionInventario;
  loadingVisible = false;
  blVerBtnGuardar: boolean = true;
  disabledBtnGuardar = false;
  // ✅ Variable global que almacena la respuesta completa del servidor (una sola vez)
  objConstantePlantilla: any = null;
  lstAnio: any[] = [];
  lstMes: any[] = [];
  lstFechaCorte: any[] = [];

  accionActual: AccionInventario = AccionInventario.Ninguna;
  // --- Valores seleccionados ---
  selectedAnio: any = null;
  selectedMes: any = null;
  fechaCorteDetectada: string | null = null; // fecha de corte que ya existe en BD
  tbInvVal: any[] = [];
  tbErrores: any[] = [];
  title = 'Registro Masivo Inventario Valorado';

  @ViewChild('GridInvVal', { static: false })
  GridInvVal: DxDataGridComponent;
  @ViewChild('GridErrores', { static: false })
  GridErrores: DxDataGridComponent;
  Grid_errores: any;
  applyFilterTypes = [
    { key: 'auto', name: 'Immediately' },
    { key: 'onClick', name: 'On Button Click' }
  ];
  currentFilter = this.applyFilterTypes[0].key;

  constructor(
    private _objService: FrmregistrarinventariovaloradoService,
  ) { }

  get TitAccion(): string {
    switch (this.accionActual) {
      case AccionInventario.Crear:
        return 'Previsualización antes de Crear';
      case AccionInventario.Actualizar:
        return 'Previsualización antes de Actualizar';
      default:
        return 'Registro Masivo Inventario Valorado';
    }
  }
  async ngOnInit() {
    await this.cargarParametros();

  }
  onInitializedDeudas(grid: any) {
    this.GridInvVal = grid;
  }
  onInitializedError(grid: any) {
    this.GridErrores = grid;
  }
  async onClickNuevo() {
    this.tbInvVal = [];
    this.tbErrores = [];
    this.blVerBtnGuardar = true;
    this.selectedAnio = null;
    this.selectedMes = null;
    this.fechaCorteDetectada = null;
    this.accionActual = AccionInventario.Ninguna;
    this.loadingVisible = false;
  }

  async onClickGuardar() {
    // ✅ Guard: año y mes obligatorios
    if (!this.combosCompletos) {
      await showAlert('Atención', 'Debe seleccionar el Año y el Mes antes de guardar.', 'warning');
      return;
    }

    // ✅ Re-validar fecha de corte al guardar (por si acaso)
    const puedeGuardar = this.validarFechaCorte();
    if (!puedeGuardar) return;

    this.loadingVisible = true;

    // 1. Creamos una copia limpia de los datos para la API
    const datosParaEnviar = this.tbInvVal.filter(row => {
      // EXCLUSIÓN DE TOTALES: 
      // Si 'CAM' está vacío, es nulo o es una fila de totales del Excel, la ignoramos.
      return row.CAM && row.CAM.toString().trim() !== "" && row.PROD;
    }).map(row => {
      // Creamos una copia para no afectar la vista del usuario en el Grid
      const filaLimpia = { ...row };

      // Esta función hace la magia: convierte "$ -62,575.66" en -62575.66
      const parsearANumero = (valor: any): number => {
        if (valor === null || valor === undefined || valor === '') return 0;

        if (typeof valor === 'string') {
          // 1. Quitamos el símbolo $, espacios y comas de miles
          let strLimpio = valor.replace(/[$\s,]/g, '');

          // 2. Si después de limpiar solo queda un "-", o nada, devolvemos 0
          if (strLimpio === '-' || strLimpio === '') return 0;

          // 3. Convertimos a número flotante
          return parseFloat(strLimpio);
        }

        return typeof valor === 'number' ? valor : 0;
      };

      // Aplicamos la conversión a todos tus campos numéricos
      filaLimpia.COSTO = parsearANumero(filaLimpia.COSTO);
      filaLimpia.TOTAL = parsearANumero(filaLimpia.TOTAL);
      filaLimpia.LIBRAS = parsearANumero(filaLimpia.LIBRAS);
      filaLimpia.master = parsearANumero(filaLimpia.master);

      // Opcional: Asegurar formato de fecha ISO para evitar errores de cultura
      if (filaLimpia.fecha && filaLimpia.fecha.includes('/')) {
        const [d, m, y] = filaLimpia.fecha.split('/');
        filaLimpia.fecha = `${y}-${m}-${d}`;
      }

      return filaLimpia;
    });
    const objParam = {
      InvVal: datosParaEnviar,
      TieneFechCort: !!this.fechaCorteDetectada,
      FechaCorte: this.getFechaCorte(),
      Accion: this.accionActual === AccionInventario.Actualizar ? 'U' : 'C'

    };
    //console.log('GUARADR : ', objParam);
    await new Promise(async (resolve) => {
      this._objService.postProcParametros(objParam).subscribe({
        next: async (resp) => {
          // Validación de éxito según la respuesta del servicio
          if (resp.Codigo) {
            await showAlert('Completado', resp.Description || 'Datos guardados correctamente', 'success');
            resolve(true);
          } else {
            // Error controlado devuelto por el SP/API
            await showAlert('Atención', resp.Description || 'No se pudo completar el guardado', 'error');
            resolve(false);
          }
        },
        error: async (err) => {
          this.loadingVisible = false;
          // Error de comunicación, red o excepción no controlada (500, 404, etc.)
          console.error("Error técnico al guardar:", err);
          await showAlert('Error de Red', 'No se pudo conectar con el servidor. Intente más tarde.', 'error');
          resolve(false);
        },
        complete: () => {
          this.loadingVisible = false;
        }

      });
    });

  }


  private getFechaCorte(): string {
    const anio: number = Number(this.selectedAnio);
    const mes: number = Number(this.selectedMes);
    // new Date(año, mes, 0) → día 0 del mes siguiente = último día del mes actual
    const ultimoDia = new Date(anio, mes, 0);
    return [
      ultimoDia.getFullYear(),
      String(ultimoDia.getMonth() + 1).padStart(2, '0'),
      String(ultimoDia.getDate()).padStart(2, '0')
    ].join('-');
  }
  async onClickCargarExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;

      this.loadingVisible = true;
      const reader = new FileReader();

      reader.onload = async (e: any) => {
        try {
          // ✅ Usa objConstantePlantilla en lugar de volver a llamar al servicio
          const firstRow = this.objConstantePlantilla;
          const expectedHeaders = Object.keys(firstRow).map((h: string) => h.trim());

          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'dd/mm/yyyy' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

          if (jsonData.length === 0) throw new Error('El archivo Excel está vacío.');

          const headersExcelRaw: string[] = (jsonData[0] || []).map(h => (h || '').toString().trim());
          const headersExcelLower: string[] = headersExcelRaw.map(h => h.toLowerCase());

          const missingHeaders = expectedHeaders.filter(h => !headersExcelLower.includes(h.toLowerCase()));
          if (missingHeaders.length > 0) {
            this.loadingVisible = false;
            await showAlert('Estructura Incorrecta', `El Excel no tiene: ${missingHeaders.join(', ')}`, 'error');
            return;
          }

          this.tbInvVal = jsonData.slice(1)
            .filter(row => row.some(cell => cell !== null && cell !== ''))
            .map(row => {
              const obj: any = {};
              expectedHeaders.forEach(key => {
                const excelIdx = headersExcelLower.indexOf(key.toLowerCase());
                if (excelIdx !== -1) {
                  let valor = row[excelIdx];
                  if (valor instanceof Date) {
                    valor = valor.toISOString().split('T')[0];
                  } else if (typeof valor === 'string') {
                    valor = valor.trim();
                  }
                  obj[key] = valor;
                } else {
                  obj[key] = null;
                }
              });
              return obj;
            });

          this.tbErrores = [];
          this.blVerBtnGuardar = false;
          this.loadingVisible = false;
          await showAlert('', 'Archivo cargado correctamente.', 'success');

        } catch (err: any) {
          await showAlert('Error', err.message || 'Error al procesar el archivo.', 'error');
        } finally {
          this.loadingVisible = false;
        }
      };
      reader.readAsArrayBuffer(file);
    };

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }
  getDynamicColumns(data: any[]): string[] {
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    return [];
  }
  async onClickDescargarPlantilla() {

  }

  async cargarParametros() {
    try {
      this.loadingVisible = true;
      const plantillaRes: any = await firstValueFrom(this._objService.getDataParametros());
      //console.log('cargarParametros: ', plantillaRes);
      if (!plantillaRes?.Dt?.Table || plantillaRes.Dt.Table.length === 0) {
        throw new Error('No se pudo obtener la estructura desde el servidor.');
      }
      this.objConstantePlantilla = plantillaRes.Dt.Table[0] || [];
      // ✅ Fix: lstAnio y lstMes correctamente separados
      this.lstAnio = plantillaRes.Dt.Table1.filter((row: any) => row.tipoData === 'ANIO');
      this.lstMes = plantillaRes.Dt.Table1.filter((row: any) => row.tipoData === 'MES');
      this.lstFechaCorte = plantillaRes.Dt.Table2;

    } catch (err: any) {
      this.loadingVisible = false;
      await showAlert('Error', err.message || 'No se pudo cargar los parámetros.', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }

  get combosCompletos(): boolean {
    return this.selectedAnio !== null && this.selectedMes !== null;
  }

  async validarFechaCorte() {

    const anio: number = Number(this.selectedAnio);
    const mes: number = Number(this.selectedMes);

    // Último día del mes seleccionado: new Date(año, mes, 0)
    const ultimoDia = new Date(anio, mes, 0);

    const fechaCorteStr = this.getFechaCorte();
    //console.log('validarFechaCorte.Lista: ', this.lstFechaCorte, '\n', 'validarFechaCorte.creada:', fechaCorteStr);
    const existe = this.lstFechaCorte.some((f: any) => {
      // 1. Si el objeto tiene propiedades Year, Month, Day (como muestra tu consola)
      if (f.Year && f.Month && f.Day) {
        const y = f.Year;
        const m = String(f.Month).padStart(2, '0');
        const d = String(f.Day).padStart(2, '0');
        const fechaFormateada = `${y}-${m}-${d}`;
        return fechaFormateada === fechaCorteStr;
      }

      // 2. Por si acaso viene como un string de fecha estándar
      const fechaLista = (f.fechaCorte || f.fecha_corte || f.fecha || '').toString().substring(0, 10);
      return fechaLista === fechaCorteStr;
    });
    //console.log('validarFechaCorte : ', existe);
    if (existe) {
      this.fechaCorteDetectada = fechaCorteStr;

      const confirmado = await showAlertConfirm(
        'Inventario ya registrado',
        `Ya existe un inventario valorizado para la fecha de corte <b>${fechaCorteStr}</b>.<br><br>¿Desea <b>actualizar</b> el registro existente?`,
        'question'
      );

      if (!confirmado) {
        // Usuario canceló: limpia la selección de mes y el indicador
        this.selectedMes = null;
        this.fechaCorteDetectada = null;
        return false;
      }
      // ✅ Confirmó actualizar
      this.accionActual = AccionInventario.Actualizar;
    } else {
      this.fechaCorteDetectada = null;
      this.accionActual = AccionInventario.Crear;
    }

    return true;
  }




  onAnioChanged(valor: any) {
    this.selectedAnio = valor;
    this.selectedMes = null;
    this.fechaCorteDetectada = null;
    this.accionActual = AccionInventario.Ninguna;
  }

  async onMesChanged(valor: any) {
    this.selectedMes = valor;
    this.fechaCorteDetectada = null;
    this.accionActual = AccionInventario.Ninguna;

    if (this.combosCompletos) {
      //console.log('onMesChanged');
      await this.validarFechaCorte();
    }
  }



}
