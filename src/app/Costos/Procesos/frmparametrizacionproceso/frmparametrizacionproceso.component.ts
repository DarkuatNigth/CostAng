import { Component,OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { FrmparametrizacionprocesoService } from './frmparametrizacionproceso.service';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert } from 'src/app/utilities/sweetAlert.util';

@Component({
  selector: 'app-frmparametrizacionproceso',
  templateUrl: './frmparametrizacionproceso.component.html',
  styleUrl: './frmparametrizacionproceso.component.scss'
})
export class FrmparametrizacionprocesoComponent implements OnInit{
  loadingVisible = false;
  visibleGrid = false;
  reportes: any[] = [];
  cmbAnio?: number = 0;
  cmbMes?: string = ''; 
  lstCostProcesoFrs = [];
  lstCostProcesoRpc = [];
  listaContacto = [];
  @ViewChild('GridCostGene', { static: false })
  GridCostGene: DxDataGridComponent;

// Objeto para capturar los filtros (Sustituye lo que no tengas)
public parametrosValores: any = {
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1
};

  // Listas para los combos
  public listAnios: any[] = [];

  public listMeses: any[] = [];

    constructor(private _objConsultaService : FrmparametrizacionprocesoService) {
    }
  async ngOnInit() {
    this.loadingVisible = true;
      await this.cargarInfoCombos();
  }


   onInitializedContacto(grid: any) {
    this.GridCostGene = grid;
  }

  async onClickConsultar(strConsulta: string){
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
    console.log("Entrando en método onClickConsultar con los datos completos");
  }

  exportarExcel(){
    console.log("entra en metodo exportarExcel");
  }


  // 1. Lógica de cálculo: Se ejecuta cuando el Grid detecta que el dato cambió oficialmente
  onRowUpdated(e: any) {
    const dataFila = e.data;
    
    const valor = parseFloat(dataFila.Valor) || 0;
    const libras = parseFloat(dataFila.Libras_Proceso) || 0;

    // --- CÁLCULO DE COSTO UNITARIO ---
    if (libras > 0) {
        // Calculamos y redondeamos a 4 decimales
        const calculo = valor / libras;
        dataFila.Costo_Unitario = Number(calculo.toFixed(4));
        
    } else {
        dataFila.Costo_Unitario = 0;
    }

    // Forzamos el repintado de la fila para que el cambio sea visible inmediatamente
    e.component.repaintRows([e.key]);
    
    console.log("Cálculo finalizado y redondeado:", dataFila.Costo_Unitario);
  }
  // onRowUpdated(e: any) {
  //     // 'e.data' contiene la fila actualizada
  //     const dataFila = e.data;
      
  //     // Convertimos a número el valor ingresado y las libras
  //     const valor = parseFloat(dataFila.Valor) || 0;
  //     const libras = parseFloat(dataFila.Libras_Proceso) || 0;

  //     // --- CÁLCULO DE COSTO UNITARIO ---
  //     if (libras > 0) {
  //         dataFila.Costo_Unitario = valor / libras;
  //     } else {
  //         dataFila.Costo_Unitario = 0;
  //     }

  //     // Nota: onRowUpdated refresca la fila automáticamente en la mayoría de los casos.
  //     // Si no ves el cambio, puedes usar: e.component.repaintRows([e.key]);
  //     console.log("Cálculo finalizado:", dataFila.Costo_Unitario);
  // }



  async onGrabarCostosClick() {


  // 2. Validar que todos los campos 'Valor' estén llenos y sean > 0
  // Usamos parseFloat para asegurar que la comparación sea numérica
  // const todosValidos = this.listaCostos.every(item => 
  //     item.Codigo === 8 || (
  //         item.Valor !== null && 
  //         item.Valor !== undefined && 
  //         item.Valor !== '' && 
  //         parseFloat(item.Valor.toString()) > 0
  //     )
  // );

  // if (!todosValidos) {
  //   // Mensaje de error si falta algún valor o hay valores en 0
  //   // alert("Por favor, asegúrese de que todos los procesos tengan un valor mayor a 0.");
  //   await showAlert('',"Todos los campos de valor son obligatorios y deben ser mayores a cero.",'warning');
  //   return;
  // }

  // 3. Si pasa la validación, procedemos a llamar al servicio
  await this.ejecutarGuardado();
}

 async  ejecutarGuardado() {
  // UNIFICACIÓN: Creamos una constante con los datos de ambos listados
  const listaUnificada = [...this.lstCostProcesoFrs, ...this.lstCostProcesoRpc];
    let parametros = {
      'anio': this.cmbAnio.toString(),
      'mes': this.cmbMes.toString(),
      'usuario': varUser.toString(),
      'valores': listaUnificada
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
    
    // this.loadingVisible = false;
  // Aquí invocas a tu servicio pasando el año, mes y el JSON.stringify(this.listaCostos)
  console.log("Validación exitosa. Guardando datos...", this.lstCostProcesoFrs);
}

  async cargarInfoCombos(){
      
      await new Promise(async (resolve) => {
        this._objConsultaService.getDataParametros().subscribe({
          next: async (resp) => {
        if (resp.Codigo) {
          console.log('getDataParametros',resp);
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

  async cargarParametrosProces(){
    let parametros = {
      'strAnio': this.cmbAnio,
      'strMes': this.cmbMes
    };
    
      await new Promise(async (resolve) => {
        this._objConsultaService.getProcParametros(parametros).subscribe({
          next: async (resp) =>{
              if (resp.Codigo) {
                  console.log("obj: ",resp);
                  this.lstCostProcesoFrs = resp.Dt.Table;
                  this.lstCostProcesoRpc = resp.Dt.Table1;

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

  onValueChanged(e: any, cell: any) {
    // 1. Convertir a número para asegurar que el componente lo reconozca
    const nuevoValor = e.value ? parseFloat(e.value) : 0;
    console.log('onValueChanged', e);
    
    const dataFila = e.data;
    dataFila.Valor = Number(parseFloat(dataFila.Valor));
    // 2. Actualizar la fuente de datos original
    cell.data.Valor = nuevoValor;

    // 3. Notificar al DataGrid del cambio para validaciones internas
    cell.setValue(nuevoValor);

    // 4. Recalcular Costo Unitario (viendo tus imágenes: Valor / Libras)
    if (cell.data.Libras_Proceso && cell.data.Libras_Proceso > 0) {
        cell.data.Costo_Unitario = nuevoValor / cell.data.Libras_Proceso;
    }

    // 5. CLAVE: Forzar a DevExtreme a redibujar la fila con el nuevo formato
    cell.component.repaintRows([cell.rowIndex]);
}
 

  formatValue(val: any): string {
    if (val === null || val === undefined) return '0.0000';
    const numeric = Number(val);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(Math.abs(numeric));
  }

  onInputFocus(event: any, cell: any) {
    // Al entrar, mostramos el número puro para editar
    console.log('onInputFocus', event,cell );
    event.target.value = cell.value || '';
  }

  onInputBlur(event: any, cell: any) {
    const text = event.target.value;
    // Limpiamos el texto para obtener el número
    const numeric = parseFloat(text.replace(/[^0-9.-]/g, ''));
    const finalValue = !isNaN(numeric) ? numeric : 0;
    
    console.log('onInputFocus', event,cell );
    // OPCIÓN A: Actualizar el objeto de datos directamente (Más estable)
    //cell.data.Valor = finalValue; 
    if (cell.data.Libras_Proceso > 0) {
        // Calculamos y redondeamos a 4 decimales
        const calculo = finalValue / cell.data.Libras_Proceso;
        cell.data.Costo_Unitario = Number(calculo.toFixed(4));
        
    } else {
        cell.data.Costo_Unitario = 0;
    }
    // Opcional: Si necesitas que el grid dispare el evento (onRowUpdated), 
    // podrías usar cell.component.updateDimensions() o similares, 
    // pero asignar al dato suele bastar si el binding es correcto.

    // Formateamos visualmente el input de nuevo para el usuario
    event.target.value = this.formatValue(finalValue);
  }

}
