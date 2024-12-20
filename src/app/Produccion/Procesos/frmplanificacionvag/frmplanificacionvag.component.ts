import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { FrmplanificacionvagService } from './frmplanificacionvag.service';
import { DxDataGridModule, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { NotificationService } from 'src/app/shared/notify.service';
import { FrmplanificacionparametrizacionService } from '../../Mantenimiento/frmplanificacionparametrizacion/frmplanificacionparametrizacion.service';
import { formatDate } from '@angular/common';
import { UtilService } from 'src/app/shared/util.service';
import * as moment from 'moment';
import { varUser } from 'src/app/config/url.servicios';
import Swal from 'sweetalert2/src/sweetalert2.js';


declare var $: any;
declare var window;



interface Pedidos {
  id: string;
  index?: number;
  orderAux?: number;
  prioridad?: number;
  codigoTipo: string;
  descriTipo: string;
  cliCodigo: number;
  descriCliente: string;
  pedNumero: string;
  prodCodcor: string;
  descriProducto: string;
  descriTalla: string;
  talCodigo: string;
  proClase: string;	
  proModali: number;
  proCongela: number; 
  descriCongela: string;
  mastersPedido: number;
  saldoPedido: number;
  saldoPedidoMed: number;
  fechaEstimadaEmbarque: Date;
  factor: number;
  factorAut: number;
  Selected: boolean;
  manualAutomatico: string;
}

interface Turno {
  turno: string;
  factorMaximo: number;
  numPersonas: number;
  numModulos: number;
}



@Component({
  selector: 'app-frmplanificacionvag',
  templateUrl: './frmplanificacionvag.component.html',
  styleUrl: './frmplanificacionvag.component.scss',
})
export class FrmplanificacionvagComponent implements OnInit {
  title = 'Planificación de Facturas de Pelado';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  disabledBtnGenerarPlanificacion: boolean = true;
  disabledTabPlanificacion: boolean = true;

  txtObservacion: string = '';
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  cmbPlanta?: string = undefined;
  numPersonasDia: number = 0;
  numPersonasNoche: number = 0;
  numModulos: number = 0;

  listaPlanta: any[] = [];
  facturas: Pedidos[] = [];
  facturasSelected: Pedidos[] = [];
  Planificacion: any[] = [];
  RequerimientoMP: any[] = [];
  RequerimientoDes: any[] = [];
  parametrosGenerales: {
    IQF_S1: number,
    IQF_S2: number,
    MX_DIA: number,
    MX_NOC: number,
  }
  turnoObj: Turno[] = [
    {
      turno: 'D',
      factorMaximo: 0,
      numPersonas: 0,
      numModulos: 0
    },
    {
      turno: 'N',
      factorMaximo: 0,
      numPersonas: 0,
      numModulos: 0
    }
  ];

  colores = ['lightblue', 'lightgreen', 'aquamarine', 'lightpink', 'lightyellow', 'lightsteelblue', 'lightcyan', 'LightSalmon', 'lavender', 'Thistle', 'antiquewhite', 'PowderBlue', 'lightskyblue', 'lightcoral'];
  dia: string = '';
  turno: string = '';
  indiceColor: number = 0;

  DTListaFacturas: any;

  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;
  currentFilter2 = this.applyFilterTypes[0].key;
  

  @ViewChild('GridPlanificacion', { static: false }) GridPlanificacion: DxDataGridComponent;
  @ViewChild('GridFacturas', { static: false }) GridFacturas: DxDataGridComponent;
  @ViewChild('GridFacturasSelected', { static: false }) GridFacturasSelected: DxDataGridComponent;
  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;

  
  constructor(
    private _service: FrmplanificacionvagService,
    private _notificationService: NotificationService,
    private _parametrizacionService: FrmplanificacionparametrizacionService,
    public _utilService: UtilService,
  ) {
    this._notificationService.info( `Ingresa un rango de fecha, y # de personas. Presiona el botón 'Generar Planificación'. El sistema te generará una preplanificación.` );

    this._service.getPedidosParaPlanificacion().subscribe((data) => {
      this.facturas = data.Dt.Table.map((item: any) => {
        return {
          id: `${item.pedNumero}_${item.prodCodcor}_${item.talCodigo}`, 
          codigoTipo: item.codigoTipo,
          descriTipo: item.descriTipo,
          cliCodigo: item.cliCodigo,
          descriCliente: item.descriCliente,
          pedNumero: item.pedNumero,
          prodCodcor: item.prodCodcor,
          descriProducto: item.descriProducto,
          talCodigo: item.talCodigo,
          descriTalla: item.descriTalla,
          proClase: item.proClase,
          proModali: item.proModali,
          proCongela: item.proCongela,
          descriCongela: item.descriCongela,
          mastersPedido: item.mastersPedido,
          saldoPedido: item.saldoPedido,
          saldoPedidoMed: item.saldoPedidoMed,
          fechaEstimadaEmbarque: item.fechaEstimadaEmbarque,
          factor: item.factor,
          factorAut: item.factorAut,
          Selected: false,
          manualAutomatico: 'M',
        };
      });

      
    this.DTListaFacturas = {  
      paginate: true,  
      pageSize: 8,  
      loadMode: 'raw',
      load: ()=>{  
      return this.facturas;  
      }  
    };
    });

    this._parametrizacionService.getParametrizacionGeneral().subscribe((data) => {
      var result: any[] = data.Dt.Table;
      this.parametrosGenerales = {
        IQF_S1: result.find(x => x.pgv_codigo === 'IQF_S1')?.pgv_valor || 0,
        IQF_S2: result.find(x => x.pgv_codigo === 'IQF_S2')?.pgv_valor || 0,
        MX_DIA: result.find(x => x.pgv_codigo === 'MX_DIA')?.pgv_valor || 0,
        MX_NOC: result.find(x => x.pgv_codigo === 'MX_NOC')?.pgv_valor || 0,
      }
      this.turnoObj.find(x => x.turno === 'D').factorMaximo = this.parametrosGenerales.MX_DIA;
      this.turnoObj.find(x => x.turno === 'N').factorMaximo = this.parametrosGenerales.MX_NOC;
    });

    this._service.getCatalogos().subscribe((data) => {
      this.listaPlanta = data.Dt.Table;
    });


    this.onClickNuevo();

  }

  async ngOnInit() {
  }
  
  cleanPlanificacion() {
    this.Planificacion = [];
    this.GridPlanificacion.instance.refresh();
  }
  
  updateFacturasSelected() {
    this.facturasSelected = this.facturasSelected.map((item, index) => {
      item.index = index + 1;
      item.orderAux = item.index;
      return item;
    });
    this.disabledBtnGenerarPlanificacion = !(this.facturasSelected.length > 0);
  }

  onAdd = (e: Parameters<DxDataGridTypes.RowDragging['onAdd']>[0]) => {
    this.cleanPlanificacion();
    const {id} = e.itemData;
    let prioridad = null;
    if (e.toData) {
      prioridad = this.facturasSelected[e.toIndex - 1]?.prioridad || 1;
    }
    this.facturas = this.facturas.map((item) => { 
      return (item.id == id) ? { ...item, Selected: e.toData, prioridad: prioridad } : item; 
    });
    if (e.toData) {
      this.facturasSelected.splice(e.toIndex, 0, this.facturas.find((item) => (item.id == id)));
    } else {
      this.facturasSelected = this.facturasSelected.filter((item) => (item.id !== id));
    }
    
    this.updateFacturasSelected();
  };

  onReorder = (e: DxDataGridTypes.RowDraggingReorderEvent) => {
    this.cleanPlanificacion();
    const visibleRows = e.component.getVisibleRows();
    let prioridad = visibleRows[e.toIndex].data.prioridad;
    let toIndex = this.facturasSelected.findIndex(
      (item) => item.id === visibleRows[e.toIndex].data.id
    );
    let fromIndex = this.facturasSelected.findIndex(
      (item) => item.id === e.itemData.id
    );
    this.facturasSelected.splice(fromIndex, 1);
    this.facturasSelected.splice(toIndex, 0, {...e.itemData, prioridad});
    
    this.updateFacturasSelected();
  };

  
  onChangeOrder(value: string, rowData: any) {
    const index = parseInt(value, 10);
    rowData.index = index;
    if (!isNaN(index)) {
      this.cleanPlanificacion();
      const {pedNumero, prodCodcor, talCodigo} = rowData;
      this.facturas = this.facturas.map((item) => { 
        return (item.pedNumero == pedNumero && item.prodCodcor == prodCodcor && item.talCodigo == talCodigo) ? { ...item, Selected: true } : item; 
      });
      this.facturasSelected.splice(rowData.index - 1, 0, this.facturas.find((item) => (item.pedNumero == pedNumero && item.prodCodcor == prodCodcor && item.talCodigo == talCodigo)));
      // this.DTListaFacturas = {
      //   paginate: true,
      //   pageSize: 8,
      //   loadMode: 'raw',
      //   load: () => {
      //     return this.facturas;
      //   }
      // };
      this.updateFacturasSelected();
    }
  }

  onChangePrioridad(value: string, rowData: any) {
    const prioridad = parseInt(value, 10);
    rowData.prioridad = prioridad;
    if (!isNaN(prioridad)) {
      this.cleanPlanificacion();
      const {id} = rowData;
      let index = this.facturas.findIndex((item) => item.id === id);
      this.facturas = this.facturas.map((item) => { 
        return (item.id == id) ? { ...item, Selected: true, prioridad: prioridad } : item; 
      });
      // la agrego a la lista de facturas seleccionadas, y ordeno por prioridad ascendente, fecha estimada de embarque ascendente y id || a.fechaEstimadaEmbarque.getTime() - b.fechaEstimadaEmbarque.getTime() 
      this.facturasSelected.push(this.facturas[index]);
      this.facturasSelected = this.facturasSelected.sort((a, b) => a.prioridad - b.prioridad || ((moment(a.fechaEstimadaEmbarque) < moment(b.fechaEstimadaEmbarque)) ? 0 : 1) ); //|| (a.id < b.id ? -1 : 1)
      this.updateFacturasSelected();
    }
  }

  onChangeReorder(value: string, rowData: any) {
    const indexTo = parseInt(value, 10);
    const indexFrom = rowData.orderAux;
    if (!isNaN(indexTo)) {
      this.cleanPlanificacion();
      let prioridad = this.facturasSelected[indexTo - 1].prioridad || 1;
      // this.facturasSelected.splice(indexTo - 1, 0, this.facturasSelected.splice(indexFrom - 1, 1)[0]);
      let item = {...this.facturasSelected.splice(indexFrom - 1, 1)[0], prioridad};
      this.facturasSelected.splice(indexTo - 1, 0, item);
      this.updateFacturasSelected();
    }
  }

  
  deleteRecord(rowData: any) {
    let {id} = rowData;
    this.facturasSelected = this.facturasSelected.filter(item => item.id !== id);
    this.facturas = this.facturas.map((item) => {
      return (item.id === id) ? { ...item, Selected: false, index: null, prioridad: null } : item;
    });
    this.updateFacturasSelected();
  }

  getDateCustomFormat(date, format) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const dayName = date.getDay();
    if (format === 1) {
      // return `${dayNames[dayName]} ${day} ${monthNames[monthIndex]} ${year}`;
      return `${dayNames[dayName]} ${day}`;
    }
    return `${dayNames[dayName]} ${day}`;
  }
  
  onClickNuevo() {
    this.fechaDesde = new Date();
    this.fechaHasta = new Date();
    this.fechaHasta.setDate(this.fechaHasta.getDate() + 15)
    this.cmbPlanta = undefined;
    this.txtObservacion = '';
    this.numPersonasDia = 200;
    this.numPersonasNoche = 200;
    this.numModulos = 6;
    this.disabledBtnGenerarPlanificacion = true;
    this.disabledTabPlanificacion = true;
    this.Planificacion = [];
    this.facturasSelected = [];
    this.facturas = this.facturas.map((item) => {
      item.Selected = false;
      item.index = null;
      item.orderAux = null;
      item.prioridad = null;
      return item;
    });
    if (this.GridFacturas) {
      this.GridFacturas.instance.refresh();
    }
    if (this.GridFacturasSelected) {
      this.GridFacturasSelected.instance.refresh();
    }
    if (this.GridPlanificacion) {
      this.GridPlanificacion.instance.refresh();
    }
    if (this.tabPanel) {
      this.tabPanel.instance.option('selectedIndex', 0);
    }
  }

  async onClickConsultar() {
    this.loadingVisible = true;
    if (!this.fechaDesde || !this.fechaHasta) {
      this._notificationService.error('Debe ingresar un rango de fechas para generar la preplanificación');
      this.loadingVisible = false;
      return;
    }
    if (!this.numPersonasDia || !this.numPersonasNoche) {
      this._notificationService.error('Debe ingresar el número de personas para generar la preplanificación');
      this.loadingVisible = false;
      return;
    }
    if (!this.numModulos) {
      this._notificationService.error('Debe ingresar el número de Módulos para generar la preplanificación');
      this.loadingVisible = false;
      return;
    }
    // if (this.cmbPlanta === undefined) {
    //   this._notificationService.error('Debe seleccionar una planta');
    //   this.loadingVisible = false;
    //   return;
    // }
    this.generarPlanificacion('facturas');
    this.loadingVisible = false;
  }

  async onClickGuardar() {
    this.loadingVisible = true;
    if (!this.validarDatos()) {
      this.loadingVisible = false;
      return;
    }
    const data = {
      fechaDesde: formatDate(this.fechaDesde, 'yyyy-MM-dd', 'en-US'),
      fechaHasta: formatDate(this.fechaHasta, 'yyyy-MM-dd', 'en-US'),
      paCodigo: this.cmbPlanta,
      nroPersonasDia: this.numPersonasDia,
      nroPersonasNoche: this.numPersonasNoche,
      nroModulos: this.numModulos,
      observacion: this.txtObservacion,
      estado: 'AC',
      detalle: this.Planificacion,
      userAud: localStorage.getItem(varUser),
      equipoAud: '127.0.0.1'
    };

    await this._service.postPlanificacionVag(data).subscribe((data) => {
      this.loadingVisible = false;
      if (data.Codigo) {
        this.showAlert('','Registro guardado correctamente.','success');
      } else {
        this.showAlert('','Error al guardar el registro','error');
      }
    });
  }

  validarDatos(): boolean {
    if (this.fechaDesde === null || this.fechaHasta === null) {
      this._notificationService.error('Debe ingresar un rango de fechas para la planificación');
      return false;
    }
    if (!this.cmbPlanta) {
      this._notificationService.error('Debe seleccionar una planta');
      return false;
    }
    if (this.numPersonasDia === 0 || this.numPersonasNoche === 0) {
      this._notificationService.error('Debe ingresar el número de personas');
      return false;
    }
    if (this.Planificacion.length === 0) {
      this._notificationService.error('No existe una planificación generada para guardar');
      return false;
    }
    return true;
  }

  async onClickGenerarPlanificacion() {
    this.loadingVisible = true;
    if (!this.fechaDesde || !this.fechaHasta) {
      this._notificationService.error('Debe ingresar un rango de fechas para generar la preplanificación');
      this.loadingVisible = false;
      return;
    }
    if (!this.numPersonasDia || !this.numPersonasNoche) {
      this._notificationService.error('Debe ingresar el número de personas para generar la preplanificación');
      this.loadingVisible = false;
      return;
    }
    if (!this.numModulos) {
      this._notificationService.error('Debe ingresar el número de Módulos para generar la preplanificación');
      this.loadingVisible = false;
      return;
    }

    if (this.facturasSelected.length === 0) {
      this.generarPlanificacion('facturas');
    }else {
      this.generarPlanificacion('facturasSelected');
    }

    this.loadingVisible = false;
  }

  generarPlanificacion(origen: string = '') {
    this.Planificacion = [];
    let fecha = new Date(this.fechaDesde);
    let fechaHasta = new Date(this.fechaHasta);
    this.turnoObj.find(x => x.turno === 'D').numPersonas = this.numPersonasDia;
    this.turnoObj.find(x => x.turno === 'N').numPersonas = this.numPersonasNoche;
    this.turnoObj.find(x => x.turno === 'D').numModulos = this.numModulos;
    this.turnoObj.find(x => x.turno === 'N').numModulos = this.numModulos;
    let source: Pedidos[] = origen === 'facturas' ? this.facturas : this.facturasSelected;
    if (origen === 'facturas') {
      this.facturasSelected = [];
    }

    let maxCongelamiento = this.parametrosGenerales.IQF_S1 + this.parametrosGenerales.IQF_S2;
    let turno = this.turnoObj.find(x => x.turno === 'D');
    let factorSuma = 0;
    let congelaSuma = 0;
    let saldoPendiente = 0;
    let index = 0;
    
    do {
      const item = source[index];
      let saldoPedido = saldoPendiente > 0 ? saldoPendiente : item.saldoPedidoMed;
      saldoPendiente = 0;
      let factor = 0;
      if (item.manualAutomatico === 'M') {
        factor = saldoPedido / item.factor / turno.numPersonas;
      } else if (item.manualAutomatico === 'A') {
        factor = saldoPedido / item.factorAut / this.numModulos;
      }

      if (item.descriCongela === 'IQF' && (factorSuma + factor) <= turno.factorMaximo && (congelaSuma + saldoPedido) <= maxCongelamiento) {
        factorSuma += factor;
        congelaSuma += saldoPedido;
        this.addItemsToPlanificacion(item, fecha, turno, factor, saldoPedido, origen);
      } 
      else if (item.descriCongela !== 'IQF' && (factorSuma + factor) <= turno.factorMaximo) {
        factorSuma += factor;
        this.addItemsToPlanificacion(item, fecha, turno, factor, saldoPedido, origen);
      }
      else {
        if (item.descriCongela !== 'IQF') {
          // VERIFICO CUANTO FACTOR ME FALTA PARA LLEGAR A MX_DIA
          let factorFaltante = turno.factorMaximo - factorSuma;
          if (factorFaltante > 1) {
            let saldoParcial = (saldoPedido * factorFaltante) / factor;
            factorSuma += factorFaltante;
            saldoPendiente = saldoPedido - saldoParcial;
            this.addItemsToPlanificacion(item, fecha, turno, factorFaltante, saldoParcial, origen);
          }
        } 
        else {
          if ((factorSuma + factor) > turno.factorMaximo){
            let factorFaltante = turno.factorMaximo - factorSuma;
            if (factorFaltante > 1) {
              let saldoParcial = (saldoPedido * factorFaltante) / factor;
              factorSuma += factorFaltante;
              congelaSuma += saldoParcial;
              saldoPendiente = saldoPedido - saldoParcial;
              this.addItemsToPlanificacion(item, fecha, turno, factorFaltante, saldoParcial, origen);

            }
          }
          else if ((congelaSuma + saldoPedido) > maxCongelamiento) {
            let saldoParcial = maxCongelamiento - congelaSuma;
            if (item.manualAutomatico === 'M') {
              factor = saldoParcial / item.factor / turno.numPersonas;
            } else {
              factor = saldoParcial / item.factorAut / this.numModulos;
            }
            factorSuma += factor;
            saldoPendiente = saldoPedido - saldoParcial;
            congelaSuma += saldoParcial;
            this.addItemsToPlanificacion(item, fecha, turno, factor, saldoParcial, origen);

          }
        }
      }

      if (turno.factorMaximo - factorSuma < 1 || congelaSuma === maxCongelamiento) {
        if (turno.turno === 'N' || congelaSuma === maxCongelamiento){
          fecha.setDate(fecha.getDate() + 1);
          congelaSuma = 0;
          turno = this.turnoObj.find(x => x.turno === 'D');
        } else if (turno.turno === 'D'){
          turno = this.turnoObj.find(x => x.turno === 'N');
        }
        // turno = turno.turno === 'D' ? this.turnoObj.find(x => x.turno === 'N') : this.turnoObj.find(x => x.turno === 'D');
        factorSuma = 0;
      }

      // si no hay saldo pendiente, avanzo al siguiente pedido
      if (saldoPendiente === 0){   
        if (origen === 'facturas') {
          this.facturas[index].Selected = true;
        }     
        index++;
      }
    } while (index < source.length && fecha <= fechaHasta);

    if (origen === 'facturas') {
      this.GridFacturas.instance.refresh();
      this.GridFacturasSelected.instance.refresh();
    }
    this.disabledTabPlanificacion = false;
    this.tabPanel.instance.option('selectedIndex', 1);

  }

  addItemsToPlanificacion(item: Pedidos, fecha: Date, turno: Turno, factor: number, saldoPedido: number, origen: string ) {
    if (origen === 'facturas') {
      // la agrego a la lista de facturas seleccionadas si no existe
      let itemSelected = this.facturasSelected.find((x) => x.id === item.id);
      if (!itemSelected) {
        item.Selected = true;
        item.index = this.facturasSelected.length + 1;
        item.orderAux = item.index;
        item.prioridad = 1; // item.index;
        this.facturasSelected.push(item);
      }
    }
    this.Planificacion.push({
      prioridad: this.Planificacion.length + 1,
      index: item.index,
      orderAux: item.index,
      pedNumero: item.pedNumero,
      cliCodigo: item.cliCodigo,
      descriCliente: item.descriCliente,
      prodCodcor: item.prodCodcor,
      talCodigo: item.talCodigo,
      descriTalla: item.descriTalla,
      proClase: item.proClase,
      proModali: item.proModali,
      proCongela: item.proCongela,
      descriProducto: item.descriProducto,
      Congelamiento: item.descriCongela,
      manualAutomatico: item.manualAutomatico,
      mastersPedido: item.mastersPedido,
      librasPedido: item.saldoPedidoMed,
      librasPlanificadas: saldoPedido,
      fechaPlanificado: formatDate(fecha, 'yyyy-MM-dd', 'en-US'),
      Dia: this.getDateCustomFormat(fecha, 1),
      turno: turno.turno,
      descriTurno: turno.turno === 'D' ? 'Día' : 'Noche',
      tiempoCorte: factor,
    });
    if (this.Planificacion.length === 1) {
      this.dia = this.getDateCustomFormat(fecha, 1).split(' ')[0];
      this.turno = turno.turno;
    }
  }
  
  onInitializedPlanificacion(grid: any) {
    this.GridPlanificacion = grid;
  }
  
  onInitializedFacturas(grid: any) {
    this.GridFacturas = grid;
  }

  onInitializedFacturasSelected(grid: any) {
    this.GridFacturasSelected = grid;
  }
  
  async onChangeValorFacturas(descripcion: string, data: any) {
    const { co_tipoFacturas } = data.data;
  }


  async onPlantaChange(idPlanta: string) {
  }

  onRowPrepared(e) {
    if (e.data && e.data.Dia && e.data.Dia !== '') {
      if (this.dia != e.data.Dia.split(' ')[0] || this.turno != e.data.turno)
      {
          this.dia = e.data.Dia.split(' ')[0];
          this.turno = e.data.turno;
          this.indiceColor = this.indiceColor == this.colores.length - 1 ? 0 : this.indiceColor + 1;
      }
      e.rowElement.style.backgroundColor = this.colores[this.indiceColor];
    }
  }


  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }

  onChangeProceso(data: any, manualAutomatico: string) {
    data.manualAutomatico = manualAutomatico;
  }

  allSelected: boolean = false;
  toggleSelectAll(event: any, data: any) {
    this.allSelected = event.target.checked;
    if (this.facturas.filter(x => x.Selected === true).length === this.facturas.length) {
      return;
    }
    let manualAutomatico = this.allSelected && data.column.caption === 'Man' ? 'M' :
      this.allSelected && data.column.caption === 'Aut' ? 'A' : '';
    this.facturas = this.facturas.map((item) => { 
      return (item.Selected == false) ? { ...item, manualAutomatico } : item; 
    });
  }

  focusedColumn: string = '';

  onFocus(column: string) {
    this.focusedColumn = column;
  }

  onBlur() {
    this.focusedColumn = '';
  }

  onRowClick(e: any) {
    console.log('row click', e);
    // this.onFocus('first'); // o 'second' dependiendo de cuál columna debe tener el foco
  }



  
  async showAlert(title, mensaje, tipo, event = null) {
    this.loadingVisible = false;

    return new Promise(async (resolve) => {
      await Swal.fire({
        title: title,
        html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
        icon: tipo,
        showCancelButton: false,
        confirmButtonColor: (tipo === 'error' ? '#d33' : tipo === 'warning' ? '#ff9800' :
          tipo === 'success' ? '#4CAF50' : tipo === 'info' ? '#2196F3' : ''),
        confirmButtonText: 'Aceptar'
      }).then((result) => {
          if(event !== null){
           eval(event);
          }
          return resolve(true);
      });
    });
  }

}






