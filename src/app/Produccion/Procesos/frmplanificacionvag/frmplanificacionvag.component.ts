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
import { ActivatedRoute, Router } from '@angular/router';
import { FrmplanificacionvagconsultaService } from '../frmplanificacionvagconsulta/frmplanificacionvagconsulta.service';
import { parseNumber } from 'devextreme/localization';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

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
  numModulos?: any;
}

interface Turno {
  turno: string;
  turnoDesc: string;
  factorMaximo: number;
  numPersonas: number;
  numModulos: number;
}

interface PersonalDisponible {
  id: number;
  fecha: Date;
  dia: string;
  nroPersonasDia: number;
  nroPersonasNoche: number;
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
  
  idPlanificacion: number = 0;
  isReplanificacion: boolean = false;
  txtObservacion: string = '';
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  cmbPlanta?: string = undefined;
  cmbTurno?: string = undefined;
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
      turnoDesc: 'Día',
      factorMaximo: 0,
      numPersonas: 0,
      numModulos: 0
    },
    {
      turno: 'N',
      turnoDesc: 'Noche',
      factorMaximo: 0,
      numPersonas: 0,
      numModulos: 0
    }
  ];
  DisponibilidadPersonal: PersonalDisponible[] = [];

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
  @ViewChild('GridDisponibilidadPersonal', { static: false }) GridDisponibilidadPersonal: DxDataGridComponent;
  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;

  
  constructor(
    private _service: FrmplanificacionvagService,
    private _serviceConsulta: FrmplanificacionvagconsultaService,
    private _notificationService: NotificationService,
    private _parametrizacionService: FrmplanificacionparametrizacionService,
    public _utilService: UtilService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
  ) {

    this.onClickNuevo();

  }


  async ngOnInit() {
    this.loadingVisible = true;
    this.route.queryParams.subscribe(params => {
      let replanifica = params['replanifica'] ? atob(params['replanifica']) : null;
      if (replanifica) {
        this.isReplanificacion = true;
        this.idPlanificacion = parseInt(replanifica, 10); 
      }

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
      
      this._service.getPedidosParaPlanificacion().subscribe((data) => {
        this.loadingVisible = false;

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
            saldoPedido: item.saldoPedidoMed,
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

        if (this.isReplanificacion) {
          this.generarReplanificacion(this.idPlanificacion);
        } else {
          this.getDisponibilidadPersonal();
        }
      });


      this.loadingVisible = false;

    });
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
      (item) => item.index === visibleRows[e.toIndex].data.index
    );
    let fromIndex = this.facturasSelected.findIndex(
      (item) => item.index === e.itemData.index
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
    let prioridad = parseInt(value, 10);
    rowData.prioridad = prioridad;
    if (!isNaN(prioridad)) {
      this.cleanPlanificacion();
      const {id} = rowData;
      let index = this.facturas.findIndex((item) => item.id === id);
      this.facturas[index].prioridad = prioridad;
      // la agrego a la lista de facturas seleccionadas, y ordeno por prioridad ascendente, fecha estimada de embarque ascendente y id || a.fechaEstimadaEmbarque.getTime() - b.fechaEstimadaEmbarque.getTime() 
      this.facturasSelected.push(this.facturas[index]);
      this.facturasSelected = this.facturasSelected.sort((a, b) => a.prioridad - b.prioridad || ((moment(a.fechaEstimadaEmbarque) < moment(b.fechaEstimadaEmbarque)) ? 0 : 1) ); //|| (a.id < b.id ? -1 : 1)
      this.updateFacturasSelected();      
      let selected = true;
      let saldoPedido = this.facturas[index].saldoPedido;
      if (this.facturas[index].saldoPedido !== this.facturas[index].saldoPedidoMed) {
        let totalPedidoSeleccionado = this.facturasSelected.reduce((acc, item) => {
          return (item.id === id) ? acc + item.saldoPedido : acc;
        }, 0);   
        if (totalPedidoSeleccionado != this.facturas[index].saldoPedidoMed) {
          selected = false;
          saldoPedido = this.facturas[index].saldoPedidoMed - totalPedidoSeleccionado;
          prioridad = null;
        }     
      }
      this.facturas = this.facturas.map((item) => { 
        return (item.id == id) ? { ...item, Selected: selected, prioridad: prioridad, saldoPedido: saldoPedido } : item; 
      });
      this.GridFacturas.instance.refresh();
      
    }
  }

  onChangeSaldoPedido(value: any, rowData: Pedidos) {
    const saldoPedido = parseNumber(value, { type: 'decimal' });
    let totalPedidoSeleccionado = this.facturasSelected.reduce((acc, item) => {
      return (item.id === rowData.id) ? acc + item.saldoPedido : acc;
    }, 0);
    let saldoPendiente = rowData.saldoPedidoMed - totalPedidoSeleccionado;
    if (saldoPedido > saldoPendiente) {
      rowData.saldoPedido = saldoPendiente;
      this.GridFacturas.instance.refresh();
      this._notificationService.error('El valor ingresado supera el saldo pendiente del Pedido');
      return;
    }
    rowData.saldoPedido = saldoPedido;

  }

  previousValue: any; // Variable para almacenar el valor anterior
  onChangeSaldoPedido2(value: any, rowData: Pedidos) {
    const saldoPedido = parseNumber(value, { type: 'decimal' });
    let totalPedidoSeleccionado = this.facturasSelected.reduce((acc, item) => {
      return (item.id === rowData.id && item.index != rowData.index) ? acc + item.saldoPedido : acc;
    }, 0);
    let saldoPendiente = rowData.saldoPedidoMed - totalPedidoSeleccionado;
    if (saldoPedido > saldoPendiente) {
      rowData.saldoPedido = this.previousValue;
      this.GridFacturasSelected.instance.refresh();
      this._notificationService.error('El valor ingresado supera el saldo pendiente del Pedido');
      return;
    }
    rowData.saldoPedido = saldoPedido;
    
    // actualizar el saldo en la lista de facturas
    saldoPendiente = saldoPendiente - saldoPedido;
    this.facturas = this.facturas.map((item) => {
      if (item.id === rowData.id) {
        let totalPedidoSeleccionado = this.facturasSelected.reduce((acc, item) => {
          return (item.id === rowData.id) ? acc + item.saldoPedido : acc;
        }, 0);   
        let saldoPedido = item.saldoPedidoMed - totalPedidoSeleccionado;
        if (totalPedidoSeleccionado === item.saldoPedidoMed) {
          return { ...item, Selected: true, index: null, orderAux: null, prioridad: null };
        } else {
          return { ...item, Selected: false, index: null, orderAux: null, prioridad: null, saldoPedido: saldoPedido };
        }
      } else {
        return item;
      }
    });
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
  }

  parseNumber(value: string): number {
    return parseFloat(value.replace(/,/g, ''));
  }

  onFocusFormat(event: any) {
    this.previousValue = event.target.value;
    event.target.value = this.parseNumber(event.target.value).toString();
    event.target.value = this.formatNumber(event.target.value);
    event.target.select();
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

  onChangeModulos(value: string, rowData: any) {
    const { index } = rowData;
    const indexR = this.facturasSelected.findIndex(x => x.index === index);
    this.facturasSelected[indexR].numModulos = value;
  }

  
  deleteRecord(rowData: any) {
    let {index, id} = rowData;
    this.facturasSelected = this.facturasSelected.filter(item => item.index !== index);
    this.facturas = this.facturas.map((item) => {
      if (item.id === id) {
        let totalPedidoSeleccionado = this.facturasSelected.reduce((acc, item) => {
          return (item.id === id && item.index != index) ? acc + item.saldoPedido : acc;
        }, 0);   
        let saldoPedido = item.saldoPedidoMed - totalPedidoSeleccionado;
        if (totalPedidoSeleccionado === item.saldoPedidoMed) {
          return { ...item, Selected: false, index: null, orderAux: null, prioridad: null };
        } else {
          return { ...item, Selected: false, index: null, orderAux: null, prioridad: null, saldoPedido: saldoPedido };
        }
      } else {
        return item;
      }
      // return (item.id === id) ? { ...item, Selected: false, index: null, prioridad: null } : item;
    });
    this.cleanPlanificacion();
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
    this.indiceColor = 0;
    this.idPlanificacion = 0;
    this.isReplanificacion = false;
    this.fechaDesde = new Date();
    this.fechaHasta = new Date();
    this.fechaHasta.setDate(this.fechaHasta.getDate() + 15)
    this.cmbPlanta = '11'; //S2
    this.cmbTurno = 'D'; 
    this.txtObservacion = '';
    this.numPersonasDia = 200;
    this.numPersonasNoche = 200;
    this.numModulos = 6;
    this.disabledBtnGenerarPlanificacion = true;
    this.disabledTabPlanificacion = true;
    this.Planificacion = [];
    this.facturas = [];
    this.facturasSelected = [];
    
    this._service.getPedidosParaPlanificacion().subscribe((data) => {
      this.loadingVisible = false;

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
          saldoPedido: item.saldoPedidoMed,
          saldoPedidoMed: item.saldoPedidoMed,
          fechaEstimadaEmbarque: item.fechaEstimadaEmbarque,
          factor: item.factor,
          factorAut: item.factorAut,
          Selected: false,
          manualAutomatico: 'M',
        };
      });

      // if (this.isReplanificacion) {
      //   this.generarReplanificacion(this.idPlanificacion);
      // }
    });
    // this.facturas = this.facturas.map((item) => {
    //   item.Selected = false;
    //   item.index = null;
    //   item.orderAux = null;
    //   item.prioridad = null;
    //   return item;
    // });
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
        setTimeout(() => {
          this.router.navigate(['/ext-consultaPlanificacionVA']);
        }, 1000);
      } else {
        this.showAlert('','Error al guardar el registro:' + data.Description ,'error');
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
    this.indiceColor = 0;
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
    let turno = this.turnoObj.find(x => x.turno === this.cmbTurno); // this.turnoObj.find(x => x.turno === 'D');
    console.log('turno', turno);
    let factorSuma = 0;
    let congelaSuma = 0;
    let saldoPendiente = 0;
    let index = 0;
    
    do {
      const item = source[index];
      let saldoPedido = saldoPendiente > 0 ? saldoPendiente : item.saldoPedido;
      saldoPendiente = 0;
      let factor = 0;
      let numPersonas = turno.numPersonas;
      if ((item.manualAutomatico === 'M' && item.factor === 0) || (item.manualAutomatico === 'A' && item.factorAut === 0)) {
        if (origen === 'facturas') {
          this.GridFacturas.instance.refresh();
          this.GridFacturasSelected.instance.refresh();
        }
        this.Planificacion = [];
        this._notificationService.error('Existen registros que no tienen parametrizado el factor de corte, por favor verifique.');
        return
      } 
      if (item.manualAutomatico === 'M') {
        let disponibilidad = this.DisponibilidadPersonal.find(x => moment(x.fecha).format('YYYY-MM-DD') === moment(fecha).format('YYYY-MM-DD'));
        if (disponibilidad) {
          numPersonas = turno.turno === 'D' ? disponibilidad.nroPersonasDia : disponibilidad.nroPersonasNoche;
        }
        factor = saldoPedido / item.factor / numPersonas;
        // factor = saldoPedido / item.factor / turno.numPersonas;
      } else {
        numPersonas = item.numModulos * 2;
        factor = saldoPedido / item.factorAut / item.numModulos;
        // factor = saldoPedido / item.factorAut / this.numModulos;
      }


      if (item.descriCongela === 'IQF' && 
        (factorSuma + (item.manualAutomatico === 'M' ? factor : 0)) <= turno.factorMaximo && 
        (congelaSuma + saldoPedido) <= maxCongelamiento) 
      {
        factorSuma += (item.manualAutomatico === 'M' ? factor : 0);
        congelaSuma += saldoPedido;
        this.addItemsToPlanificacion(item, fecha, turno, factor, numPersonas, saldoPedido, origen);
      } 
      else if (item.descriCongela !== 'IQF' && 
        (factorSuma + (item.manualAutomatico === 'M' ? factor : 0)) <= turno.factorMaximo) 
      {
        factorSuma += (item.manualAutomatico === 'M' ? factor : 0);
        this.addItemsToPlanificacion(item, fecha, turno, factor, numPersonas, saldoPedido, origen);
      }
      else {
        if (item.descriCongela !== 'IQF') {
          // VERIFICO CUANTO FACTOR ME FALTA PARA LLEGAR A MX_DIA
          let factorFaltante = turno.factorMaximo - factorSuma;
          if (factorFaltante > 1) {
            // console.log('factorFaltante verificar en automatico', factorFaltante);
            let saldoParcial = (saldoPedido * factorFaltante) / factor;
            // console.log('saldoParcial verificar en automatico', saldoParcial);
            saldoParcial = this._utilService.redondear(saldoParcial, 'S', 100);
            factorSuma += factorFaltante;
            saldoPendiente = saldoPedido - saldoParcial;
            // congelaSuma += saldoParcial;
            this.addItemsToPlanificacion(item, fecha, turno, factorFaltante, numPersonas, saldoParcial, origen);
          }
        } 
        else {
          if ((factorSuma + (item.manualAutomatico === 'M' ? factor : 0)) > turno.factorMaximo){
            let factorFaltante = turno.factorMaximo - factorSuma;
            if (factorFaltante > 1) {
              let saldoParcial = (saldoPedido * factorFaltante) / factor;
              saldoParcial = this._utilService.redondear(saldoParcial, 'S', 100);
              factorSuma += factorFaltante;
              saldoPendiente = saldoPedido - saldoParcial;
              congelaSuma += saldoParcial;
              this.addItemsToPlanificacion(item, fecha, turno, factorFaltante, numPersonas, saldoParcial, origen);

            }
          }
          else if ((congelaSuma + saldoPedido) > maxCongelamiento && (maxCongelamiento - congelaSuma) > 0) {
            let saldoParcial = maxCongelamiento - congelaSuma;
            if (item.manualAutomatico === 'M') {
              let disponibilidad = this.DisponibilidadPersonal.find(x => moment(x.fecha).format('YYYY-MM-DD') === moment(fecha).format('YYYY-MM-DD'));
              if (disponibilidad) {
                numPersonas = turno.turno === 'D' ? disponibilidad.nroPersonasDia : disponibilidad.nroPersonasNoche;
              }
              factor = saldoParcial / item.factor / numPersonas;
              // factor = saldoParcial / item.factor / turno.numPersonas;
            } else {
              factor = saldoParcial / item.factorAut / this.numModulos;
            }
            factorSuma += (item.manualAutomatico === 'M' ? factor : 0);
            saldoPendiente = saldoPedido - saldoParcial;
            congelaSuma += saldoParcial;
            this.addItemsToPlanificacion(item, fecha, turno, factor, numPersonas, saldoParcial, origen);
          }
        }
      }

      if (turno.factorMaximo - factorSuma < 1 || congelaSuma >= maxCongelamiento) {
        if (turno.turno === 'N' || congelaSuma >= maxCongelamiento){
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

  generarReplanificacion(idPlanificacion: number){
    this.Planificacion = [];
    this.facturasSelected = [];
    this._serviceConsulta.getPlanificacionById(idPlanificacion).subscribe((data) => {
      if (data.Codigo) {
        let plaCab: any = data.Dt.Table;
        let plaDet: any = data.Dt.Table1;
        this.fechaDesde = new Date(plaCab[0].pla_fechaDesde);
        this.fechaHasta = new Date(plaCab[0].pla_fechaHasta);
        this.cmbPlanta = plaCab[0].pla_paCodigo;
        this.numPersonasDia = plaCab[0].pla_nroPersonasDia;
        this.numPersonasNoche = plaCab[0].pla_nroPersonasNoche;
        this.numModulos = plaCab[0].pla_nroModulos;
        this.txtObservacion = 'Replanificación de la planificación: ' + idPlanificacion;
        this.getDisponibilidadPersonal();
        let plaDet2 = [];
        plaDet.forEach((item) => {
          let index = plaDet2.findIndex((x) => x.pedNumero === item.pedNumero && x.prodCodcor === item.prodCodcor && x.talCodigo === item.talCodigo && x.prioridad === item.prioridad);
          if (index === -1) {
            plaDet2.push(item);
          } else {  
            plaDet2[index].librasPlanificadas += item.librasPlanificadas;
          }
        }); 
        
        plaDet2.forEach((item: any) => {
          let indexFactura = this.facturas.findIndex((x) => x.pedNumero == item.pedNumero && x.prodCodcor == item.prodCodcor && x.talCodigo == item.talCodigo && x.Selected == false); // 
          if (indexFactura >= 0) {
            let itemFactura = { ...this.facturas[indexFactura] };
            let Selected = true;
            let saldoPedido = item.librasPlanificadas;
            let saldoPendiente = itemFactura.saldoPedidoMed;

            itemFactura.index = this.facturasSelected.length + 1;
            itemFactura.orderAux = this.facturasSelected.length + 1;
            itemFactura.prioridad = item.prioridad;
            itemFactura.manualAutomatico = item.manualAutomatico;
            itemFactura.numModulos = item.manualAutomatico === 'A' ? item.numModulos : null;

            let totalPedidoSeleccionado = this.facturasSelected.reduce((acc, item2) => {
              return (item2.id === itemFactura.id && item2.index != itemFactura.index) ? acc + item2.saldoPedido : acc;
            }, 0);

            saldoPendiente = saldoPendiente - totalPedidoSeleccionado;

            if (saldoPedido == saldoPendiente) {
              Selected = true;
              saldoPendiente = 0;
            }
            else if (saldoPedido < saldoPendiente) {
              Selected = false;
              saldoPendiente = saldoPendiente - saldoPedido;
            } else {
              saldoPedido = saldoPendiente;
              Selected = true;
              saldoPendiente = 0;
            }
            itemFactura.saldoPedido = saldoPedido;
            itemFactura.Selected = Selected;
            this.facturasSelected.push(itemFactura);
            this.facturas[indexFactura].Selected = Selected;
            this.facturas[indexFactura].saldoPedido = saldoPendiente;
            
          }
        });
        
        // refresh grid
        this.GridFacturas.instance.refresh();
        this.GridFacturasSelected.instance.refresh();


        // this.disabledTabPlanificacion = false;
        // this.tabPanel.instance.option('selectedIndex', 1);
      }
    });
  }

  addItemsToPlanificacion(item: Pedidos, fecha: Date, turno: Turno, factor: number, numPersonas: number, saldoPedido: number, origen: string ) {
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
    if (this.Planificacion.length > 0) {
      if (this.dia != this.getDateCustomFormat(fecha, 1).split(' ')[0] || this.turno != turno.turno)
      {
        this.indiceColor = this.indiceColor == this.colores.length - 1 ? 0 : this.indiceColor + 1;
        this.dia = this.getDateCustomFormat(fecha, 1).split(' ')[0];
        this.turno = turno.turno;
      }
    }
    this.Planificacion.push({
      prioridad: item.prioridad, //this.Planificacion.length + 1,
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
      factor: item.manualAutomatico === 'M' ? item.factor : item.factorAut,
      numPersonas: numPersonas,
      numModulos: item.manualAutomatico === 'A' ? item.numModulos : 0,
      tiempoCorteHora: item.manualAutomatico === 'M' ? item.factor : item.factorAut,
      tiempoCorte: factor,
      numLote: null,     
      numSecuencial: null, 
      colorBackground: this.colores[this.indiceColor],
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
  
  async onChangeValorLote(value: string, data: any) {
    this.indiceColor = 0;
    const { prioridad } = data.data;
    var numLote: number = value == '' ? null : parseInt(value);
    const index = this.Planificacion.findIndex(item => item.prioridad === prioridad);
    if (index >= 0) {
      this.Planificacion[index].numLote = numLote;
    }
  }
  
  async onChangeValorSecuencial(value: string, data: any) {
    this.indiceColor = 0;
    const { prioridad } = data.data;
    var numSecuencial: number = value == '' ? null : parseInt(value);
    const index = this.Planificacion.findIndex(item => item.prioridad === prioridad);
    if (index >= 0) {
      this.Planificacion[index].numSecuencial = numSecuencial;
    }
  }

  async onPlantaChange(idPlanta: string) {
  }

  onRowPrepared(e) {
    if (e.data && e.data.Dia && e.data.Dia !== '' ) {
      e.rowElement.style.backgroundColor = e.data.colorBackground;
      if (e.data.manualAutomatico == 'A' && e.rowType === 'data') {
        // solo pintar la celda no toda la fila
        const manualAutomaticoCell = e.rowElement.querySelector('td[aria-colindex="14"]');
        if (manualAutomaticoCell) {
          manualAutomaticoCell.style.backgroundColor = 'yellow';
        }
      }
    }
  }
  
  onRowPreparedFacturasSelected(e) {
    if (e.data) {
      if ((e.data.manualAutomatico == 'M' && e.data.factor == 0) || (e.data.manualAutomatico == 'A' && e.data.factorAut == 0)) {
        e.rowElement.style.backgroundColor = 'orange';
      }
    }
  }

  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }

  onChangeProceso(data: any, manualAutomatico: string) {
    data.manualAutomatico = manualAutomatico;
    data.numModulos = manualAutomatico === 'A' ? this.numModulos : '';
  }

  onChangeProceso2(data: any, manualAutomatico: string) {
    data.manualAutomatico = manualAutomatico;
    data.numModulos = manualAutomatico === 'A' ? this.numModulos : '';
    this.GridFacturasSelected.instance.refresh();
  }

  allSelected: boolean = false;
  toggleSelectAll(event: any, data: any) {
    this.allSelected = event.target.checked;
    if (this.facturas.filter(x => x.Selected === true).length === this.facturas.length) {
      return;
    }
    let manualAutomatico = this.allSelected && data.column.caption === 'Man' ? 'M' :
      this.allSelected && data.column.caption === 'Aut' ? 'A' : '';
    let numModulos = manualAutomatico === 'A' ? this.numModulos : '';
    this.facturas = this.facturas.map((item) => { 
      return (item.Selected == false) ? { ...item, manualAutomatico, numModulos } : item; 
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
    // this.onFocus('first'); // o 'second' dependiendo de cuál columna debe tener el foco
  }


  async onClickModal(modal: any) {
    // let data:[][] = this.DataModal[keyControl];

    // if(data !== null && data!== undefined && data.length > 0){
    //   this.listaDataModal  = this.DataModal[keyControl];
    //   var Columns = [];
    //   for (let x = 0; x < Object.entries(data[0]).length; x += 1) {
    //       Columns.push(Object.entries(data[0])[x][0].toString());
    //   }
    //   this.columnasDataModal = JSON.parse(JSON.stringify(Columns));
    // }


    this.modalService
      .open(modal, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalConsultas',
      })
      .result.then(
        (result) => {},
        (reason) => {}
      );
  }

  async onChangePerDia(value: number, data: any) {
    const { id } = data.data;
    const index = this.DisponibilidadPersonal.findIndex(x => x.id === id);
    this.DisponibilidadPersonal[index].nroPersonasDia = value;
  }

  async onChangePerNoche(value: number, data: any) {
    const { id } = data.data;
    const index = this.DisponibilidadPersonal.findIndex(x => x.id === id);
    this.DisponibilidadPersonal[index].nroPersonasNoche = value;
  }

  async onChangeFechaDesde(event: any) {
    this.fechaDesde = event.value;
    this.getDisponibilidadPersonal();
  }

  async onChangeFechaHasta(event: any) {
    this.fechaHasta = event.value;
    this.getDisponibilidadPersonal();
  }


  async getDisponibilidadPersonal() {
    this._service.getDisponibilidadPersonal(this.fechaDesde, this.fechaHasta).subscribe((data) => {
      let id = 1;
      this.DisponibilidadPersonal = data.Dt.Table.map((item: any) => {
        return {
          id: id++,
          dia: item.Dia,
          fecha: item.FechaTurno,
          // fecha: new Date(item.FechaTurno),
          nroPersonasDia: item.D,
          nroPersonasNoche: item.N,
        };
      });
    });

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






