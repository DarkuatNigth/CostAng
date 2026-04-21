//import { Component } from '@angular/core';
import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { FrmactualizacreditotributarioService } from './frmactualizacreditotributario.service';
import { NotificationService } from 'src/app/shared/notify.service';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { error } from 'pdf-lib';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { URL_CONSULT } from 'src/app/config/url.servicios';
import { varUser } from 'src/app/config/url.servicios';
//import { varEmpresa } from 'src/app/config/url.servicios';
declare var $: any;
declare var window;

interface Catalogo {
  codigoDeuda: any;
  tipoDeuda: string;
  codigoTributario: string;
  codigoanterior: string;
}

@Component({
  selector: 'app-frmactualizacreditotributario',
  templateUrl: './frmactualizacreditotributario.component.html',
  styleUrls: ['./frmactualizacreditotributario.component.scss']
})
export class FrmactualizacreditotributarioComponent implements OnInit {
      getDynamicWidth(col: string): number {
        // Todo dinámico: ancho fijo para todas las columnas, sin lógica quemada
        return 180;
      }
    getDynamicColumns(data: any[]): string[] {
      if (data && data.length > 0) {
        return Object.keys(data[0]);
      }
      return [];
    }
  title = 'Cambio Masivo de Sustento Tributario';
  loadingVisible = false;
  disabledBtnGuardar = false;
  tbDeudas: any[] = [];
  tbErrores: any[] = [];
  tb_plantilla: any[] = [];

  @ViewChild('Grid_deudas', { static: false }) Grid_deudas!: DxDataGridComponent;
  Grid_errores: any;
  applyFilterTypes = [
    { key: 'auto', name: 'Immediately' },
    { key: 'onClick', name: 'On Button Click' }
  ];
  currentFilter = this.applyFilterTypes[0].key;

  constructor(
    private _service: FrmactualizacreditotributarioService,
    private _notificationService: NotificationService,
  ) {}

  async ngOnInit() {
    //debugger;
    const data = {
      //idEmpresa: localStorage.getItem(varEmpresa),
      usuarioempresa: localStorage.getItem(varUser)
    };
    if (data.usuarioempresa === null) {
        await this.showAlert('', 'Se terminó el tiempo de su session, volver a ingresar al sistema, ', 'warning');
        return; 
    } 
    else {
      this.onClickNuevo();
    } 
  
  }

 async showAlert(title, mensaje, tipo) {
    this.loadingVisible = false;

    return new Promise(async (resolve) => {
      //debugger;
      await Swal.fire({
        title: title,
        html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
        icon: tipo,
        showCancelButton: false,
        confirmButtonColor: (tipo === 'error' ? '#d33' : tipo === 'warning' ? '#ff9800' :
          tipo === 'success' ? '#4CAF50' : tipo === 'info' ? '#2196F3' : ''),
        confirmButtonText: 'Aceptar'
      }).then((result) => {
          return resolve(true);
      });
    });
  }

  async showAlertConfirm(title, mensaje, tipo) {
    this.loadingVisible = false;

    return new Promise(async (resolve) => {
      const confirm = await
        Swal.fire({
          title: title,
          //text: mensaje,
          html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
          icon: tipo,
          showCancelButton: true,
          confirmButtonColor: '#2196F3',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            return resolve(true);
          } else {
            return resolve(false);
          }
        });
    });
  }


  async onClickNuevo() {
    // Lógica para limpiar o reiniciar el formulario si es necesario
    this.loadingVisible = false;
    this.tbDeudas = []; 
    this.tbErrores = [];
    this.tb_plantilla = [];
  } 

  async onClickGuardar() {
   if (!this.validarDatos()) {
      return;
    }
    await this.actualizarDeudasMasivas();       
  } 
  async actualizarDeudasMasivas() {
    //debugger;
    // Construir el JSON para el SP
    const detalle = this.tbDeudas.map(d => ({
      Deuda: d.Deuda,
      CodTributario: d.CodTributario,
      CodTributarioAnterior: d.CodTributarioAnterior
    }));
    const usuario = localStorage.getItem(varUser);  // método que retorna el usuario logueado
    const jsonDetalle = { i_detalle: detalle, userAud: usuario }; // Reemplaza con el usuario real
    this.loadingVisible = true;

    try {
      const res: ResultWS = await firstValueFrom(this._service.actualizaDeuda(jsonDetalle));
      this.loadingVisible = false;
      if (res && res.Codigo) {
        await this.showAlert('', 'Deudas actualizadas correctamente!!', 'success');
        this.onClickNuevo();
      } else {
        await this.showAlert('', 'No se pudo actualizar las deudas, comuniquese con sistemas.', 'error');  
      }
    } catch (error) {
        await this.showAlert('', 'Error al actualizar las deudas: ' + error, 'error');  
      console.log(error);
      this.loadingVisible = false;
    }
  }
  
  async consultarErroresDeudas() {
    // Construir el JSON para el SP con los nombres correctos según la plantilla
    debugger;
    const detalle = this.tbDeudas.map(d => ({
      Deuda: d.Deuda,
      CodTributario: d.CodTributario,
      CodTributarioAnterior: d.CodTributarioAnterior
    }));
    const jsonDetalle = { i_detalle: detalle };
    this.loadingVisible = true;

    return new Promise<boolean>((resolve) => {
      this._service.getDeudas(jsonDetalle).subscribe(
        (res: ResultWS) => {
          this.loadingVisible = false;
          
          if (res && res.Dt && res.Dt.Table && res.Dt.Table.length > 0) {
            this.tbErrores = res.Dt.Table;
            this.showAlert('', 'Verifique Errores del archivo cargado!!', 'error');
            resolve(true); // Hay errores
          } else {
            this.loadingVisible = false;
            resolve(false); // No hay errores
          }
        },
        (error) => {
          this.showAlert('', 'Error al consultar las deudas: ' + error, 'error');
          console.log(error);
          this.loadingVisible = false;
          resolve(true); // Considera error de consulta como error
        }
      );
    });
  }
  onInitializedDeudas(grid: any) {
    this.Grid_deudas = grid;
      }
  onInitializedError(grid: any) {
    this.Grid_errores = grid;
      }

  
validarDatos(): boolean {
  if (this.tbErrores && this.tbErrores.length > 0) {
    this.showAlert('', 'Verifique Errores de las Deudas', 'error');
    return false;
  }
    if (!this.tbDeudas || this.tbDeudas.length === 0) {   
      this.showAlert('', 'No hay deudas para actualizar', 'warning');
      return false;
    }
  return true;
}
  onClickCargarExcel() {
    // Crear un input de tipo file de manera dinámica
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.style.display = 'none';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.loadingVisible = true;
        const reader = new FileReader();
        reader.onload = async (e: any) => {
          try {
            // Obtener headers dinámicos desde el backend
            const plantillaRes: ResultWS = await firstValueFrom(this._service.getPlantillaDeudas());
            let expectedHeaders: string[] = [];
            if (plantillaRes && plantillaRes.Dt && plantillaRes.Dt.Table && plantillaRes.Dt.Table.length > 0) {
              const table = plantillaRes.Dt.Table as any[];
              if (Array.isArray(table) && table.length > 0) {
                const firstRow = table[0];
                expectedHeaders = Object.keys(firstRow).map(h => h.toString().trim());
              } else {
                this.showAlert('Error', 'No se pudo obtener la estructura de la plantilla desde el servidor.', 'error');
                this.loadingVisible = false;
                return;
              }
            } else {
              this.showAlert('Error', 'No se pudo obtener la estructura de la plantilla desde el servidor.', 'error');
              this.loadingVisible = false;
              return;
            }
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            // Suponiendo que la primera fila es el encabezado
            let headers: any[] = (jsonData[0] as any[]) || [];
            headers = headers.map((h: string) => (h || '').toString().trim());
            // Validación dinámica de estructura (case sensitive y trim)
            const isValid = expectedHeaders.length === headers.length && expectedHeaders.every((col, idx) => headers[idx] === col);
            if (!isValid) {
              this.showAlert('', 'Estructura del archivo no cumple con el formato de los campos!!', 'error');
              this.loadingVisible = false;
              this.onClickNuevo();
              return;
            }
            const rows = jsonData.slice(1) as any[][];
            // Filtrar filas vacías
            const filteredRows = rows.filter((row: any[]) => row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== ''));
            if (filteredRows.length === 0) {
              this.tbDeudas = [];
              this.tbErrores = [];
              this.showAlert('Advertencia', 'La plantilla no contiene registros para procesar.', 'warning');
              this.loadingVisible = false;
              return;
            }
            // Llenar el grid solo con datos válidos
            this.tbDeudas = filteredRows.map((row: any[]) => {
              const obj: any = {};
              headers.forEach((h: string, idx: number) => {
                obj[h] = row[idx];
              });
              return obj;
            });
            // Validar errores en los datos cargados
            const hayErrores = await this.consultarErroresDeudas();
            if (!hayErrores) {
              this.tbErrores = [];
              this.showAlert('', 'Archivo Excel cargado correctamente sin errores!!', 'success');
            }
          } catch (err) {
            this.showAlert('', 'Error al procesar el archivo Excel.', 'error');
          } finally {
            this.loadingVisible = false;
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  async onClickDescargarPlantilla() {
    try {
      const res: ResultWS = await firstValueFrom(this._service.getPlantillaDeudas());
      let headers: string[] = [];
      let rows: any[] = [];
      if (res && res.Dt && res.Dt.Table) {
          const table = res.Dt.Table as any[];
          if (Array.isArray(table) && table.length > 0) {
            const firstRow = table[0];
            if (firstRow && typeof firstRow === 'object') {
              headers = Object.keys(firstRow);
              rows = table.map((row: any) => headers.map(h => row[h]));
              const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
              XLSX.writeFile(wb, 'plantilla_credito_tributario.xlsx');
            } else {
              this.showAlert('', 'La plantilla está vacía, no se puede generar el archivo porque no hay estructura.', 'info');
            }
          } else {

            this.showAlert('', 'La plantilla está vacía, no se puede generar el archivo porque no hay estructura.', 'info');
          }
      } else {
        this.showAlert('Error', 'No se pudo obtener la plantilla desde el servidor.', 'error');
      }
    } catch (error) {
      this.showAlert('', 'Error al descargar la plantilla: ' + error, 'error');
    }
  }
}
