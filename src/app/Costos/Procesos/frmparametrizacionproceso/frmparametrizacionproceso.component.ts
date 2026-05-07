import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { FrmparametrizacionprocesoService } from './frmparametrizacionproceso.service';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import { ProcesoAgrupado } from 'src/app/shared/tab-grid/procesos-agrupacion.config';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-frmparametrizacionproceso',
  templateUrl: './frmparametrizacionproceso.component.html',
  styleUrl: './frmparametrizacionproceso.component.scss'
})
export class FrmparametrizacionprocesoComponent implements OnInit {
  loadingVisible = false;
  modificacionesCosto: any[] = [];
  reportes: any[] = [];
  cmbAnio?: number = 0;
  cmbMes?: string = '';
  listadoTotal: ProcesoAgrupado[] = [];
  public listadoTotal$ = new BehaviorSubject<ProcesoAgrupado[]>([]);


  // Objeto para capturar los filtros (Sustituye lo que no tengas)
  public parametrosValores: any = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1
  };

  // Listas para los combos
  public listAnios: any[] = [];

  public listMeses: any[] = [];

  constructor(
    private _objConsultaService: FrmparametrizacionprocesoService
  ) {
  }
  async ngOnInit() {
    this.loadingVisible = true;
    await this.cargarInfoCombos();
  }



  async onClickConsultar(strConsulta: string) {
    const faltantes: string[] = [];

    // Validamos cada campo individualmente
    if (this.cmbAnio == null || this.cmbAnio == 0) faltantes.push('Año');
    if (this.cmbMes == null || this.cmbMes.length == 0) faltantes.push('Mes');

    // Si hay elementos en el arreglo, mostramos el aviso y cortamos la ejecución
    if (faltantes.length > 0) {
      const mensaje = `Por favor seleccione los campos: ${faltantes.join(', ')}`;
      await showAlert('', mensaje, 'warning');
      return; // Detiene la ejecución si falta algo
    }
    this.loadingVisible = true;
    await this.cargarParametrosProces();
    // Si pasa las validaciones, continúa el flujo
    //console.log("Entrando en método onClickConsultar con los datos completos");
  }

  exportarExcel() {
    //console.log("entra en metodo exportarExcel");
  }


  


  async onGrabarCostosClick() {


    // 3. Si pasa la validación, procedemos a llamar al servicio
    await this.ejecutarGuardado();
  }

  async ejecutarGuardado() {
    // VALIDACIÓN: Evitar guardar si no hay datos cargados
    if (!this.listadoTotal || this.listadoTotal.length === 0) {
      await showAlert('Atención', 'No hay datos para guardar. Realice una consulta primero.', 'warning');
      return;
    }

    
    const parametros = {
      'anio': this.cmbAnio.toString(),
      'mes': this.cmbMes.toString(),
      'usuario': varUser.toString(),
      'valores': this.listadoTotal 
    };
    this.loadingVisible = true;

    await new Promise(async (resolve) => {
      this._objConsultaService.postProcParametros(parametros).subscribe({
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

  async cargarInfoCombos() {

    await new Promise(async (resolve) => {
      this._objConsultaService.getDataParametros().subscribe({
        next: async (resp) => {
          if (resp.Codigo) {
            this.listAnios = resp.Dt.Table;
            this.listMeses = resp.Dt.Table1;
            return resolve(true);
          } else {
            await showAlert('', resp.Description, 'error');
            return resolve(false);
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
    //this.loadingVisible = false;
  }

  async cargarParametrosProces() {
    let parametros = {
      'strAnio': this.cmbAnio,
      'strMes': this.cmbMes
    };
    await new Promise(async (resolve) => {
      this._objConsultaService.getProcParametros(parametros).subscribe({
        next: async (resp) => {
          if (resp.Codigo) {
            //console.log("obj: ", resp);
            //console.log('getDataParametros', resp);

            this.listadoTotal = [
              ...ProcesoAgrupado.mapList(resp.Dt.Table, 'FRS'),
              ...ProcesoAgrupado.mapList(resp.Dt.Table1, 'RPC'),
              ...ProcesoAgrupado.mapList(resp.Dt.Table2, 'TAR')
            ];
            this.listadoTotal$.next(this.listadoTotal);
            this.modificacionesCosto = [];
            return resolve(true);
          } else {
            await showAlert('', resp.Description, 'error');
            return resolve(false);
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
    //this.loadingVisible = false;
  }

  handleDataChange(updatedList: ProcesoAgrupado[]) {
    this.listadoTotal = updatedList;
  }

  // onInputBlurTarifa(event: any, cell: any) {
  //   const text = event.target.value;
  //   const finalValue = parseFloat(text.replace(/[^0-9.-]/g, '')) || 0;
  //   // Formateamos visualmente el input de inmediato
  //   event.target.value = this.formatValue(finalValue);

  //   // Diferimos las actualizaciones del grid para evitar el conflicto
  //   // de vistas durante el ciclo de change detection actual
  //   setTimeout(() => {
  //     cell.component.cellValue(cell.rowIndex, cell.column.dataField, finalValue);

  //     if (cell.data.Libras_Proceso > 0) {
  //       const calculo = finalValue * cell.data.Libras_Proceso;
  //       cell.component.cellValue(cell.rowIndex, 'Costo_Unitario', Number(calculo.toFixed(4)));
  //       const dcSuma = this.lstCostProcesoTarifa.reduce((acc, item: any) => {
  //         return acc + (item.Costo_Unitario || 0);
  //       }, 0);
  //       // Buscamos el elemento en el array de reprocesos
  //       const itemRpc = this.lstCostProcesoFrs.find((item: any) => item.Descripcion === "C.D.Variables");

  //       if (itemRpc) {
  //         // 3. Gestión del Valor Original para no restar sobre lo ya restado
  //         let registroModif = this.modificacionesCosto.find(m => m.descripcion === itemRpc.Descripcion);


  //         if (!registroModif) {
  //           // Si es la primera vez que se modifica, guardamos el valor real de la DB como backup
  //           registroModif = {
  //             TipLote: itemRpc.TipLote,
  //             costoAnterior: itemRpc.Valor,
  //             descripcion: itemRpc.Descripcion,
  //             Costo_Unitario: itemRpc.Libras_Proceso == 0 ? 0 : Number((itemRpc.Valor / itemRpc.Libras_Proceso).toFixed(4))
  //           };
  //           this.modificacionesCosto.push(registroModif);
  //           // 4. VALIDACIÓN CRÍTICA:
  //           // Siempre restamos del valor ORIGINAL guardado, así evitamos restas sucesivas infinitas.
  //           const nuevoValor = registroModif.costoAnterior - dcSuma;

  //           itemRpc.Valor = nuevoValor < 0 ? 0 : nuevoValor;

  //           // 5. Recalcular Costo Unitario del item destino
  //           if (itemRpc.Libras_Proceso > 0) {
  //             itemRpc.Costo_Unitario = Number((itemRpc.Valor / itemRpc.Libras_Proceso).toFixed(4));
  //           }
  //         }
  //       }
  //     } else {
  //       cell.component.cellValue(cell.rowIndex, 'Costo_Unitario', 0);
  //     }
  //   }, 0);
  // }


}
