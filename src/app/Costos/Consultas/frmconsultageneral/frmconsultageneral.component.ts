import { Component, ViewChild } from '@angular/core';
import { FrmconsultageneralService } from './frmconsultageneral.service';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert, showAlertConfirm, showEditCostoModal } from 'src/app/utilities/sweetAlert.util';
import { exportDataGrid as excel_exporter, exportPivotGrid } from 'devextreme/excel_exporter';
import { DxDataGridTypes, DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPivotGridComponent } from 'devextreme-angular/ui/pivot-grid';
import * as moment from 'moment';
import 'moment/locale/es';

declare var window;
@Component({
  selector: 'app-frmconsultageneral',
  templateUrl: './frmconsultageneral.component.html',
  styleUrl: './frmconsultageneral.component.scss'
})
export class FrmconsultageneralComponent {
  modificacionesCosto: any[] = [];
  blPoderEditar : boolean | null= false;
  @ViewChild('Griddata', { static: false }) Griddata: DxDataGridComponent;
  @ViewChild(DxPivotGridComponent, { static: false }) pivotGrid!: DxPivotGridComponent;
  loadingVisible = false;
  isListVisible = true;
  title = 'Consulta General';
  ShowConsulta: boolean = false;
  ShowGuardar: boolean = false;
  ShowImprimir: boolean = false;
  hiddenExporting = true;
  visibleGrid = false;

  // Define las columnas con formato de moneda y precisión de 4
  resultadosColumnsNames = [
    { dataField: 'PrecioCompra', caption: 'Precio Compra', format: { type: 'currency', precision: 4 } },
    { dataField: 'TotalDol', caption: 'Total $', format: { type: 'currency', precision: 2 } },
    { dataField: 'Premio', caption: 'Premio', format: { type: 'currency', precision: 4 } },
    { dataField: 'Costo Mat Empaque', caption: 'Costo Mat. Empaque', format: { type: 'currency', precision: 4 } },
    { dataField: 'Costo Total Mat Empaque', caption: 'Costo Total Mat.', format: { type: 'currency', precision: 4 } },

    // Para los objetos anidados (la clave para que funcione)
    { dataField: 'Costos Directos.dcCostoDirecto', caption: 'Costo Directo', format: { type: 'currency', precision: 4 } },
    { dataField: 'Costos Directos.dcCostoFijo', caption: 'Costo Fijo', format: { type: 'currency', precision: 4 } },

    { dataField: 'Proceso Primario.dcRecepcion', caption: 'Recepción', format: { type: 'currency', precision: 4 } },
    { dataField: 'Proceso Primario.dcClasificacion', caption: 'Clasificación', format: { type: 'currency', precision: 4 } },

    // Agrega "Certificado" como texto normal
    { dataField: 'Certificado', caption: 'Certificado' }
  ];
  ShowOtraAccionDescarga: boolean = false;

  selectedItemConsulta: any = null;
  filtrosConsulta: any[] = [];
  listParamSp = [];
  resultadosPrev: any[] = [];
  resultados: any[] = [];
  reportes: any[] = [];
  fieldPivot: any[] = [];
  pivotDataSource: any;
  parametrosValores: { [key: string]: any } = {};
  parametrosValoresSelect: { [key: string]: string[] } = {};
  gridDataSource: { [key: string]: any } = {}; // Almacena la fuente de datos del grid-dropdown
  gridColumn: { [key: string]: any[] } = {}; // Almacena la fuente de datos del grid-dropdown

  rowIniTitle = 0;
  rowEndTitle = 0;
  numRowColumns = 0;

  positionRowDelete: any[] = [];
  detalleGrupos: any[] = [];
  constructor(private _objConsultaService: FrmconsultageneralService) {
  }
  toggleList() {
    this.isListVisible = !this.isListVisible;
    let classes: string[] = ['col-md-8', 'col-lg-8'];
    if (!this.isListVisible) {
      document.getElementById('sec_resultado').classList.remove(...classes);
    } else {
      document.getElementById('sec_resultado').classList.add(...classes);
    }

  }

  isColumnFixed(dataField: string): boolean {
    if (!dataField) return false;
  
  // Ponemos los nombres EXACTOS de los dataFields que quieres congelar (todo en minúsculas).
  // He incluido las variaciones (con y sin los prefijos str/int) para que no falle.
  const camposFijosExactos = [
    // 'intlote', 'strprod',  'prod',
    // 'strnomtal', 'nomtal', 
    'lote',  'codprod', 'descripcion',  'talla',
    'lot_numero', 'loteunificado', 'descriproduc', 'tal_descri'
  ]; 
  
  const campoLimpio = dataField.toLowerCase();

  // En lugar de includes de texto, verificamos si el campo exacto existe en nuestro arreglo
  return camposFijosExactos.includes(campoLimpio);
  }
  async onCellDblClick(e: any) {
    if (e.column.caption === 'Costo X Libra' || e.column.dataField === 'costo_x_libra') {
      e.cancel = true; // Bloquea la edición por defecto del Grid
      const rowData = e.data;
      const Lote = rowData.Lote || rowData.lot_numero;
      // 1. Usamos tu librería para confirmar la intención
      const confirmar = await showAlertConfirm(
        'Editar Costo',
        `¿Desea editar el valor de Costo X Libra para el lote <b>${Lote}</b>?`,
        'question'
      );

      if (confirmar) {
        // // 2. Usamos prompt nativo para pedir el nuevo valor
        // const nuevoCostoStr = prompt(`Ingrese el nuevo Costo X Libra para el lote ${rowData.lote || rowData.Lote}:`, e.value);

        // if (nuevoCostoStr === null || nuevoCostoStr.trim() === '') {
        //   return; // El usuario canceló o lo dejó vacío
        // }

        // // 3. Usamos prompt nativo para pedir el motivo
        // const razon = prompt("Por favor, ingrese el motivo del cambio:");

        // if (razon === null || razon.trim() === '') {
        //   await showAlert('Atención', 'Debe ingresar un motivo para poder realizar el cambio.', 'warning');
        //   return; // El usuario canceló o lo dejó vacío
        // }

        // const nuevoCosto = parseFloat(nuevoCostoStr);

        // // C. Actualizar visualmente la celda en el Grid
        // this.Griddata.instance.cellValue(e.rowIndex, e.column.dataField, nuevoCosto);

    // Llamamos a la nueva ventana personalizada de SweetAlert2
        const datosModificados = await showEditCostoModal(Lote, e.value);

        // Si el usuario canceló, datosModificados será null
        if (datosModificados) {
          const { nuevoCosto, razon } = datosModificados;
          this.Griddata.instance.cellValue(e.rowIndex, e.column.dataField, nuevoCosto);
        // D. Almacenar en la estructura
        this.modificacionesCosto.push({
          Lote: rowData.Lote || rowData.lot_numero,
          CodProd: rowData.rld_prodcod || rowData.CodProd,
          Talla: rowData.tal_descri || rowData.Talla,
          Libras: rowData.libras || rowData.Libras,
          valorNuevo: nuevoCosto,
          razon: razon.trim()
        });

        await showAlert('Completado', 'Costo actualizado correctamente.', 'success');
        console.log('Modificaciones:', this.modificacionesCosto);
        }
      }
    }
  }
  async onClickConsultar(tipoConsulta: string, estado: { pasaValidacion: boolean } = { pasaValidacion: false }) {

    estado.pasaValidacion = true;

    if (this.selectedItemConsulta === null) {
      await showAlert('', 'Por favor, seleccione una consulta antes de continuar.', 'warning');
      estado.pasaValidacion = false;
      return;
    }

    this.hideList();

    this.listParamSp = [];
    let paramRPT = [];

    this.loadingVisible = true;

    this.listParamSp.push({ "Name": "i_empresa", "Type": "VarChar", "Value": "1" });

    paramRPT.push({ tipo: 'i_empresa', valor: "1" });


    for (let key in this.parametrosValores) {


      if (key.includes('_descri') && this.filtrosConsulta.find(x => x?.name === key) === undefined) {

        continue;
      }

      if (this.filtrosConsulta.find(x => x?.name === key)?.Obligatorio === 1 && (this.parametrosValores[key] === ''
        || this.parametrosValores[key] === null || this.parametrosValores[key] === undefined || this.parametrosValores[key] === '-1')) {

        estado.pasaValidacion = false;
        await showAlert('', this.filtrosConsulta.find(x => x?.name === key)?.label + ' es obligatorio', 'warning');
        return;
      }


      if (this.parametrosValores[key] !== '' && this.filtrosConsulta.find(x => x.name === key)?.tipo !== undefined) {
        if (this.filtrosConsulta.find(x => x?.name === key).tipo === 'fecha') {
          let val = moment(this.parametrosValores[key]).format('YYYY/MM/DD');
          this.listParamSp.push({ "Name": key, "Type": "VarChar", "Value": val });
          paramRPT.push({ tipo: key, valor: val });

        } else if (this.filtrosConsulta.find(x => x?.name === key).tipo === 'checkbox') {
          if (this.parametrosValores[key] === true) {
            this.listParamSp.push({ "Name": key, "Type": "VarChar", "Value": '1' });
            paramRPT.push({ tipo: key, valor: '1' });
          }
        }
        else {
          this.listParamSp.push({ "Name": key, "Type": "NVarChar", "Value": (this.parametrosValores[key] === null ? null : this.parametrosValores[key].toString()) });
          paramRPT.push({ tipo: key, valor: (this.parametrosValores[key] === null ? "null" : this.parametrosValores[key].toString()) });

        }
      } else {
        let arKey = key.split(':');
        if (arKey.length > 1) {
          this.listParamSp.push({ "Name": arKey[0], "Type": "NVarChar", "Value": arKey[1] });
          paramRPT.push({ tipo: arKey[0], valor: arKey[1] });
        } else {
          if (key === 'user') {
            this.listParamSp.push({ "Name": "user", "Type": "VarChar", "Value": await localStorage.getItem(varUser) });
            paramRPT.push({ tipo: 'user', valor: await localStorage.getItem(varUser) });
          } else {
            this.listParamSp.push({ "Name": key, "Type": "NVarChar", "Value": null });
            paramRPT.push({ tipo: key, valor: "null" });
          }
        }
      }


    }


    for (let key in this.parametrosValoresSelect) {
      if (this.parametrosValoresSelect[key] !== null && this.parametrosValoresSelect[key].length > 0) {
        let objArr = this.parametrosValoresSelect[key].map(x => ({ valor: x }));
        let jsonValue = JSON.stringify(objArr);

        /* if (tipoConsulta === 'Imprimir'){
          debugger;
          jsonValue = JSON.stringify(jsonValue);
        } */

        // Buscar si la clave ya existe en listParamSp
        let existingParamSp = this.listParamSp.find(param => param.Name === key);
        if (existingParamSp) {
          existingParamSp.Value = jsonValue; //Actualizar si ya existe
        } else {
          this.listParamSp.push({ "Name": key, "Type": "NVarChar", "Value": jsonValue });
        }

        // Buscar si la clave ya existe en paramRPT
        let existingParamRPT = paramRPT.find(param => param.tipo === key);
        if (existingParamRPT) {
          existingParamRPT.valor = jsonValue; //Actualizar si ya existe
        } else {
          paramRPT.push({ tipo: key, valor: jsonValue });
        }
      }
    }


    if (tipoConsulta === 'Consultar') {

      await new Promise(async (resolve) => {
        await this._objConsultaService.getConsultaDatosByFilters(this.listParamSp, this.selectedItemConsulta.spConsulta).subscribe(async (resp) => {
          setTimeout(() => {

          }, 1000);

          if (resp.Codigo) {
            console.log("objeto => ", resp.Codigo);
            if (Object.keys(resp.Dt).length > 0) {

              if (this.selectedItemConsulta.esHtml) {
                let dt: any[] = resp.Dt.Table;

                if (dt.length > 0) {
                  var contenidoHTML = Object.values(dt[0])[0].toString();
                  if (contenidoHTML !== '') {
                    const blob = new Blob([contenidoHTML], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }
                }
                return resolve(true);
              }

              this.resultados = resp.Dt.Table;
              // this.blPoderEditar = resp.Dt.Table1;
              // console.log('consultar: ', resp.Dt.Table1);
              this.detalleGrupos = [];

              if (Object.keys(resp.Dt).length > 0) {
                for (let i = 0; i < Object.keys(resp.Dt).length; i++) {
                  if (Object.values(resp.Dt)[i].length > 0) {
                    if (Object.keys(Object.values(resp.Dt)[i][0])[0].toString().trim() === "AgruparData") {
                      this.detalleGrupos = Object.values(resp.Dt)[i];
                    }
                  }
                }
              }

              let keysToGroup: string[] = this.detalleGrupos.map((item) => item.NameGrupo);

              if (this.resultados.length > 0) {
                // 1. Generar la estructura de columnas con soporte para bandas (recursivo)
                // Pasamos 'keysToGroup' para mantener tu lógica de agrupación de filas
                this.resultadosColumnsNames = this.generarEstructuraColumnas(this.resultados[0], '', keysToGroup);

                // 2. IMPORTANTE: No modificar 'this.resultados'
                // DevExtreme usa los puntos (ej: "Proceso Primario.dcRecepcion") para navegar 
                // automáticamente en el objeto JSON que viene del backend.
                // Quitamos el .map que hacía el replaceAll.
              }
              // if(this.resultados.length > 0){
              //   var Columns = [];
              //   for (let x = 0; x < Object.entries(this.resultados[0]).length; x += 1) {
              //       Columns.push(Object.entries(this.resultados[0])[x][0].toString());
              //   }
              //   this.resultadosColumnsNames = Columns.map((key) => {
              //     const groupIndex = keysToGroup.indexOf(key);

              //     return {
              //       dataField: key.replaceAll('.', ''), // Reemplazar espacios por guiones bajos
              //       caption: key, // Generar el título automáticamente
              //       //alignment:"center"
              //       ...(groupIndex !== -1 ? { groupIndex } : {}),
              //       //...(key === 'Periodo' ? { groupIndex: 1 } : {})
              //     };
              //   });


              //   if (this.resultados.length > 0) {
              //     this.resultados = this.resultados.map((row) => {
              //       const newRow = {};
              //       Object.keys(row).forEach((key:any) => {
              //         // Reemplazar el punto (.) por un espacio en las claves
              //         const newKey = key.replaceAll('.', ''); // O puedes hacer otro tipo de reemplazo
              //         newRow[newKey] = row[key];
              //       });
              //       return newRow;
              //     });
              //   }
              // }


              this.fieldPivot = [];
              if (resp.Dt.Table1 && this.detalleGrupos.length <= 0) {
                this.fieldPivot = await this.removeNullValues(resp.Dt.Table1);
              }
              if (this.fieldPivot.length > 0) {
                this.visibleGrid = false;

              } else {
                this.hiddenExporting = false;
                this.visibleGrid = true;
                return resolve(true);
              }

              this.positionRowDelete = resp.Dt.Table2;

              this.numRowColumns = 0;
              for (let x = 0; x < this.fieldPivot.length; x++) {
                if (this.fieldPivot[x].area === 'column') {
                  this.numRowColumns++;
                }
              }

              this.pivotDataSource = {
                store: this.resultados,
                fields: this.fieldPivot,
              };
              if (this.resultados.length > 0) {
                this.ShowGuardar = true;
              }

              setTimeout(() => {
                //this.ExportarExcelPivot();
              }, 100);

            }


            return resolve(true);

          } else {
            await showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
      });
    }


    if (tipoConsulta === 'Grabar') {
      const objConsul =  this.selectedItemConsulta.spConsulta.split('/')[1].split('?')[0];
      const objPost = {
        usuarioCrea : varUser,
        fechaInicio : this.listParamSp.find(item => item.Name == "fecInicio")?.Value?.replace(/\//g, '-') ?? null,
        fechaFin    : this.listParamSp.find(item => item.Name == "fecFin")?.Value?.replace(/\//g, '-') ?? null,
        lstMatPrim : this.modificacionesCosto
      };
      await new Promise(async (resolve) => {
        await this._objConsultaService.postGrabarDatos(objPost, objConsul).subscribe(
          {
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

          }

        );
      });

    }


    this.loadingVisible = false;
  }


  generarEstructuraColumnas(obj: any, parentKey: string = '', keysToGroup: string[] = []): any[] {
    let columns = [];
    const camposPorcentaje = ["rendimiento %"];
    // Lista de campos que deben llevar formato de dólar
    const camposMoneda = [
      'PrecioCompra', 'TotalDol', 'Premio', 'Costo Mat Empaque',
      'Costo Total Mat Empaque', 'dcCostoDirecto', 'dcCostoFijo',
      'dcCostoIndirecto', 'dcCostoVariable', 'dcRecepcion',
      'dcClasificacion', 'dcCodificacion', 'dcDescabezado',
      'dcDecorado', 'dcRetractilado', 'dcBrine', 'dcIQF',
      'dcTunel', 'dcPelado', 'dcHidratacion', 'dcCocido',
      'Costo X Secuencial', '$ Monto', 'C.Copacking',
      'Costo Unitario', 'Costo Total'
    ];
    // for (const key in obj) {
    //     // Construimos la ruta completa (ej: "Proceso Primario.dcRecepcion")
    //     const fullKey = parentKey ? `${parentKey}.${key}` : key;
    //     const value = obj[key];

    //     // Si el valor es un objeto y no es nulo ni array, creamos una BANDA (encabezado superior)
    //     if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    //         columns.push({
    //             caption: key, // Título del grupo
    //             //align: 'center',
    //             // Alinea el título del GRUPO
    //             alignment: 'center',
    //             // Llamada recursiva para los hijos del objeto
    //             columns: this.generarEstructuraColumnas(value, fullKey, keysToGroup)
    //         });
    //     } else {
    //         // Es una columna final (campo de datos)
    //         const groupIndex = keysToGroup.indexOf(fullKey);

    //         columns.push({
    //             dataField: fullKey, // DevExtreme mapea esto automáticamente al objeto anidado
    //             // Alinea el título de la COLUMNA FINAL
    //             //alignment: 'center',
    //             caption: key.replace(/^(str|dc|int|dt)/, ''), // Limpia prefijos técnicos
    //             dataType: typeof value === 'number' ? 'number' : 'string',
    //             ...(groupIndex !== -1 ? { groupIndex } : {}) // Mantiene tu agrupación de filas
    //         });
    //     }
    // }
    // return columns;
    for (const key in obj) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      const value = obj[key];

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        columns.push({
          caption: key,
          alignment: 'center',
          columns: this.generarEstructuraColumnas(value, fullKey, keysToGroup)
        });
      } else {
        const groupIndex = keysToGroup.indexOf(fullKey);
        const isNumber = typeof value === 'number';
        const esMoneda = camposMoneda.includes(key);
        const esPorcentaje = camposPorcentaje.includes(key.toLowerCase()); // <--- NUEVA DETECCIÓN

        // Determinamos el formato según el tipo
        let columnFormat: any = null;
        console.log("Valor determinacion: ",);
        if (esMoneda) {
          const precision = key.toLowerCase().includes('costo mat') ? 4 : 2;
          columnFormat = { type: 'currency', precision: precision };
        }
        else if (esPorcentaje) {
          // Formato Porcentaje: Multiplica por 100 y pone el %
          // Precision 2 mostrará 0.9999... como 100.00%
          columnFormat = { type: 'percent', precision: 2 };
        }

        // --- LÓGICA DE PRECISIÓN ---
        // Si el nombre contiene "Empaque", usamos 4 decimales; si no, solo 2.
        const precisionDecimal = key.toLowerCase().includes('costo mat') ? 4 : 2;
        console.log('precisionDecimal: ', precisionDecimal);
        columns.push({
          dataField: fullKey,
          caption: key.replace(/^(str|dc|int|dt)/, ''),
          dataType: isNumber ? 'number' : 'string',
          alignment: isNumber ? 'right' : 'left',
          ...(columnFormat ? { format: columnFormat } : {}), // <--- APLICA EL FORMATO CALCULADO
          ...(groupIndex !== -1 ? { groupIndex } : {}),// ---> ¡AGREGA ESTA LÍNEA! <---
          fixed: this.isColumnFixed(fullKey)
        });
        // columns.push({
        //   dataField: fullKey,
        //   caption: key.replace(/^(str|dc|int|dt)/, ''), 
        //   dataType: isNumber ? 'number' : 'string',
        //   // Aplicamos el formato solo si es moneda con la precisión calculada
        //   ...(esMoneda ? { 
        //       format: { 
        //           type: 'currency', 
        //           precision: precisionDecimal, 
        //           currency: 'USD' // Opcional: fuerza el símbolo de dólar
        //       } 
        //   } : {}),
        //   ...(groupIndex !== -1 ? { groupIndex } : {})
        // });
      }
    }
    return columns;
  }

  async onclickExportarExcel() {
    this.loadingVisible = true;
    //if(this.visibleGrid){
    // if(this.selectedItemConsulta.esPivotManual){
    //   await this.ExportarExcelGrid();
    //   this.loadingVisible = false;
    //   return;
    // }

    if (!this.selectedItemConsulta.esPivot && !this.selectedItemConsulta.esPivotManual) {

      let estado = { pasaValidacion: false };
      await this.onClickConsultar('Exportar', estado);

      if (estado.pasaValidacion === false) {
        this.loadingVisible = false;
        return;
      }

      this.loadingVisible = true;

      if (this.resultados.length > 500000) {
        await this.ExportarCSVGrid();
      } else {
        //await this.ExportarExcelGrid();
        await this.ExportarExcelGridOtro();
      }
    }
    //else{
    //   await this.ExportarExcelPivot();
    // }
    this.loadingVisible = false;

  }


  async onclickExportarOtraAccion() {

  }


  hideList() {
    this.isListVisible = false;
    let classes: string[] = ['col-md-8', 'col-lg-8'];
    document.getElementById('sec_resultado').classList.remove(...classes);
  }

  async ngOnInit() {
    window.home = this;
    this.ShowGuardar = true;
    this.cleanData();
    this.cargarConsultasUsario();
  }


  filtrosFiltrados(tipo) {
    if (tipo === 'textGroup') {
      return this.filtrosConsulta ? this.filtrosConsulta.filter(item => item.tipo === 'textGroup') : [];
    } else {
      return this.filtrosConsulta ? this.filtrosConsulta.filter(item => item.tipo !== 'textGroup' && item.tipo !== "") : [];
    }
  }

  async cargarConsultasUsario() {
    this._objConsultaService.getConsultasByUser(await localStorage.getItem(varUser)).subscribe(async (resp) => {
      if (resp.Codigo) {
        console.log('cargarConsultasUsario', resp);
        this.reportes = resp.Dt.Table;
      } else {
        await showAlert('', resp.Description, 'error');
      }
    });
  }


  async cleanData() {
    //this.reportes = [];
    this.title = '';
    this.selectedItemConsulta = null;
    this.filtrosConsulta = [];
    this.parametrosValores = {};
    this.parametrosValoresSelect = {};
    this.gridDataSource = {};
    this.gridColumn = {};

    this.resultados = [];
    this.resultadosColumnsNames = [];
  }


  async onItemClickConsulta(event: any) {
    this.loadingVisible = true;
    this.cleanData();
    this.hiddenExporting = true;

    this.ShowConsulta = false;
    this.ShowGuardar = false;
    this.ShowImprimir = false;
    this.ShowOtraAccionDescarga = false;

    this.selectedItemConsulta = event.itemData || null;

    if (this.selectedItemConsulta) {

      if (this.selectedItemConsulta.spConsulta !== null && this.selectedItemConsulta.spConsulta !== undefined
        && this.selectedItemConsulta.spConsulta !== '') {
        this.ShowConsulta = true;
        if (!this.selectedItemConsulta.esPivot && !this.selectedItemConsulta.esPivotManual) {
          this.hiddenExporting = false;
        }
      }

      if (this.selectedItemConsulta.nombrerpt !== null && this.selectedItemConsulta.nombrerpt !== undefined
        && this.selectedItemConsulta.nombrerpt !== '') {
        this.ShowImprimir = true;
      }
      //debugger;
      if (this.selectedItemConsulta.permiteSoloExportar) {
        this.ShowConsulta = false;
        this.hiddenExporting = false;
      }

      if (this.selectedItemConsulta.otraAccionDescarga !== '') {
        this.ShowOtraAccionDescarga = true;
      }


      this.title = this.selectedItemConsulta.descriConsulta;
      await this.cargarParametros();
    }
    this.loadingVisible = false;
  }

  async cargarParametros() {

    const valorMenu = await new Promise(async (resolve) => {
      await this._objConsultaService.getDataParametros(this.selectedItemConsulta.idConsulta).subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            console.log('cargarParametros', resp);
            this.filtrosConsulta = resp.Dt.Table;
            for (let i = 0; i < this.filtrosConsulta.length; i++) {
              this.parametrosValores[this.filtrosConsulta[i].name] = '';
              // Si el parámetro es una lista o un grid-dropdown, cargar datos desde el SP
              if (this.filtrosConsulta[i].tipo === 'lista' || this.filtrosConsulta[i].tipo === 'dropdown' && this.filtrosConsulta[i].sp !== '') {
                console.log('Si el parámetro es una lista o un grid-dropdown, cargar datos desde el SP', this.filtrosConsulta[i].name, this.filtrosConsulta[i].sp);
                // let data:[][] = await this.ObtenerListasParametros(this.filtrosConsulta[i].name, this.filtrosConsulta[i].sp);                  
                // if(data != null && data.length > 0){
                //   this.gridDataSource[this.filtrosConsulta[i].name] = data;
                //   var Columns = [];
                //   for (let x = 0; x < Object.entries(data[0]).length; x += 1) {
                //       Columns.push(Object.entries(data[0])[x][0].toString());
                //   }
                //   this.gridColumn[this.filtrosConsulta[i].name] = JSON.parse(JSON.stringify(Columns));
                // }
              }
              if (this.filtrosConsulta[i].tipo === 'textGroup' && this.filtrosConsulta[i].sp !== '') {
                console.log('TEXT GROUP', this.filtrosConsulta[i].name, this.filtrosConsulta[i].sp);
                //let data2:[][] = await this.ObtenerListasParametros(this.filtrosConsulta[i].name, this.filtrosConsulta[i].sp);                  
                //this.DataModal[this.filtrosConsulta[i].name] = data2;
              }
              if (this.filtrosConsulta[i].tipo === 'fecha') {
                this.parametrosValores[this.filtrosConsulta[i].name] = new Date();
              }
            }
          }
          return resolve(true);
        } else {
          await showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });

  }






  async removeNullValues(arr: any[]) {
    return arr.map(obj =>
      Object.entries(obj)
        .filter(([_, value]) => value !== null) // Filtrar solo valores que NO sean null
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    );
  }



  async ExportarExcelGridOtro() {


    // Agregar el título en la primera fila
    let titulo = '';
    for (let f = 0; f < this.filtrosConsulta.length; f++) {
      if (this.filtrosConsulta[f]?.Obligatorio === 1) {
        let valor = this.parametrosValores[this.filtrosConsulta[f].name];
        if (this.filtrosConsulta[f]?.tipo === 'fecha') {
          valor = moment(this.parametrosValores[this.filtrosConsulta[f].name]).format('YYYY/MM/DD');
        }
        if (this.filtrosConsulta[f]?.tipo === 'lista') {
          var hh = this.gridDataSource[this.filtrosConsulta[f].name]

          if (hh !== undefined) {
            var desc = hh.find(x => x.Codigo === valor)?.Descripcion;
          }
          valor = desc !== undefined ? desc : valor;
        }

        titulo = `${this.filtrosConsulta[f].label}: ${valor}`;

        if (this.filtrosConsulta[f]?.tipo === 'fecha') {
          let ff = f;
          while (ff < this.filtrosConsulta.length) {
            ff++;
            if (this.filtrosConsulta[ff]?.tipo === 'fecha') {
              titulo = titulo + ' ' + `${this.filtrosConsulta[ff].label}: ${moment(this.parametrosValores[this.filtrosConsulta[ff].name]).format('YYYY/MM/DD')}`;
            }
          }
        }


        if (this.filtrosConsulta[f]?.tipo === 'lista') {
          let ff = f;
          while (ff < this.filtrosConsulta.length) {
            ff++;

            if (this.filtrosConsulta[ff]?.tipo === 'lista') {

              var valor2 = this.parametrosValores[this.filtrosConsulta[ff].name]
              var hh2 = this.gridDataSource[this.filtrosConsulta[ff].name]

              if (hh2 !== undefined) {
                var desc2 = hh2.find(x => x.Codigo === valor2)?.Descripcion;

                titulo = titulo + ' - ' + `${this.filtrosConsulta[ff].label}: ${desc2}`;
              }
            }
          }
        }

        break;
      }
    }
    const elemento = this.selectedItemConsulta.spConsulta.split('/')[1].split('?')[0];
    const payload = {
      title: this.title,
      title2: titulo,
      columnas: null,//this.resultadosColumnsNames.map(col => col.caption), // o col.dataField
      sp: elemento,//this.selectedItemConsulta.spConsulta,
      modelParam: this.listParamSp
      //data: this.resultados.map(row => this.resultadosColumnsNames.map(col => row[col.dataField]))
    };
    console.log('Obj del payload: ', payload);
    const valorMenu = await new Promise(async (resolve) => {

      await this._objConsultaService.callExcellFile(payload).subscribe({
        next: (blob) => {

          //const blob = resp.body!;
          this.loadingVisible = false;
          const fileURL = URL.createObjectURL(blob);
          //window.open(fileURL); // Abre el PDF en nueva pestaña

          const a = document.createElement('a');
          a.href = fileURL;
          a.download = `${this.title}.xlsx`;
          a.click();

          return resolve(true);
        },
        error: async (error) => {
          if (error.error instanceof Blob && error.error.type === 'application/json') {
            const errorText = await error.error.text(); // Leer contenido del blob
            const errorJson = JSON.parse(errorText);    // Convertir a JSON
            await showAlert('Error al generar Archivo', errorJson.message || 'Error desconocido', 'error');
          } else {
            // Otro tipo de error
            await showAlert('Error al generar Archivo', error?.message || 'Error desconocido', 'error');
          }

          return resolve(false);
        }
      });
    });

  }


  async ExportarCSVGrid() {

    const maxRecordsPerFile = 1000000;
    const totalRecords = this.resultados.length;
    const numFiles = Math.ceil(totalRecords / maxRecordsPerFile);
    for (let i = 0; i < numFiles; i++) {
      const start = i * maxRecordsPerFile;
      const end = start + maxRecordsPerFile;
      const chunk = this.resultados.slice(start, end);
      const csvData = this.convertToCSV(chunk);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${this.title}_Doc_${i + 1}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }


  private convertToCSV(objArray: any[]): string {
    const array = [Object.keys(objArray[0])].concat(objArray);
    return array.map(it => {
      return Object.values(it).map((val: any) => {
        if (typeof val === 'string') {
          if (val.charAt(0) === '0' && this.esNumerico(val)) { // /^\d+$/.test(val)
            return `'${val}`;
          }
          return val.replace(/(\r\n|\n|\r|\t)/gm, ' ');
        }
        return val;
      }
      ).join(';');
      // return Object.values(it).join(';');
    }).join('\n');
  }


  esNumerico(valor: string): boolean {
    return !isNaN(parseFloat(valor)) && isFinite(Number(valor));
  }
}
