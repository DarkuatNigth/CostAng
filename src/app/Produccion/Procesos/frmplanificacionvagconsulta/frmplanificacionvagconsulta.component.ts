import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { NotificationService } from 'src/app/shared/notify.service';
import { FrmplanificacionvagconsultaService } from './frmplanificacionvagconsulta.service';
import { formatDate } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UtilService } from 'src/app/shared/util.service';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { varUser } from 'src/app/config/url.servicios';
import { Router } from '@angular/router';


declare var $: any;
declare var window;

export interface CabeceraRequerimiento {
  observ: string;
  tiplot: string;
  codprod: string;
  proClase: string;
  descriProducto: string;
  ConLote: string;
  factura: string;
  talPed: number;
  descriTalla: string;
  MastPed: number;
  LibPed: number;
  MaxLibPed: number;
  boddes: string;
  // detPlanifica_id: number;
  certificadoASC: string;
  numLote: number;
}

export interface DetalleRequerimiento {
  numdet: number;
  codpro: string;
  despro?: string;
  codtal?: number;
  codtalvta?: number;
  numcaj: number;
  libras: number;
  lote: number;
}

@Component({
  selector: 'app-frmplanificacionvagconsulta',
  templateUrl: './frmplanificacionvagconsulta.component.html',
  styleUrl: './frmplanificacionvagconsulta.component.scss'
})
export class FrmplanificacionvagconsultaComponent implements OnInit {
  title = 'Seguimiento y Control - Planificacion VA';
  loadingVisible: boolean = false;
  disabledBtnGenerarRequerimiento: boolean = false;
  disabledTabRequerimientoProFresco: boolean = false;
  disabledTabRequerimientoProTerminado: boolean = false;
  librasPlanificadasTotal: number = 0;
  idPlanificacion: number = 0;
  estado: string = '';
  fechaDesdeFormat: string = '';
  fechaHastaFormat: string = ''; 
  fechaConsultaDesde: Date = new Date();
  fechaConsultaHasta: Date = new Date();
  esPlanificacionHistorica: boolean = false;

  cabeceraReq: CabeceraRequerimiento = {} as CabeceraRequerimiento;
  observacion: string = '';
  loteAsignado: string = '';
  cmbBodegaDestino: string = undefined;
  listaBodegaDestino: any[] = [];
  itemSelectedForReq: any = {};
  dataCmbTalla:any[] = [];

  Planificacion = [];
  PlanificacionSearch = [];
  RequerimientoProFresco: DetalleRequerimiento[] = [];
  RequerimientoProTerminado: DetalleRequerimiento[] = [];
  modalReferenceItem: any;
  totalLibrasRequerimientos: number = 0;

  
  colores = ['lightblue', 'lightgreen', 'aquamarine', 'lightpink', 'lightyellow', 'lightsteelblue', 'lightcyan', 'LightSalmon', 'lavender', 'Thistle', 'antiquewhite', 'PowderBlue', 'lightskyblue', 'lightcoral'];
  dia: string = '';
  turno: string = '';
  indiceColor: number = 0;

  @ViewChild('GridPlanificacion', { static: false }) GridPlanificacion: DxDataGridComponent;
  @ViewChild('GridPlanificacionSearch', { static: false }) GridPlanificacionSearch: DxDataGridComponent;
  @ViewChild('GridRequerimientoProFresco', { static: false }) GridRequerimientoProFresco: DxDataGridComponent;
  @ViewChild('GridRequerimientoProTerminado', { static: false }) GridRequerimientoProTerminado: DxDataGridComponent;
  @ViewChild('modalRequerimientoProducto') modalRequerimientoProducto: any;
  @ViewChild('modalConsulta') modalConsulta: any;
  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;

  
  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;

  
  constructor(
    private _service: FrmplanificacionvagconsultaService,
    private _notificationService: NotificationService,
    private _utilService: UtilService,
    private modalService: NgbModal,
    private router: Router
  ) {
    this.fechaConsultaDesde.setDate(this.fechaConsultaDesde.getDate() - 7);
    this._service.getLastPlanificacion().subscribe((data) => {
      this.loadDataPlanificacion(data);
    });

    this.limpiarNuevo();

  }


  async ngOnInit() {
    
  }

  
  onClickReplanificar() {
    // encriptar en base64 idPlanificacion
    let idPlanificacion = btoa(this.idPlanificacion.toString());
    this.router.navigate(['/ext-planificacionVA'], { queryParams: { replanifica: idPlanificacion } });
  }

  limpiarNuevo() {
    this.esPlanificacionHistorica = false;
    if (this.tabPanel) {
      this.tabPanel.instance.option('selectedIndex', 0);
    }
    var user = localStorage.getItem(varUser);
    this._service.getBodegaDestino(user).subscribe((data) => {
      this.listaBodegaDestino = data.Dt.Table;
    });
  }


  async onClickConsultar() {    
    this.modalReferenceItem = await this.modalService.open(this.modalConsulta, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalGenerarRequerimiento',
    });
  }


  async onClickRptExcel() {
    this.loadingVisible = true;

    const valorExport = await new Promise(async (resolve) => {
      await this._service.callApiReportePlanificacion(this.idPlanificacion).subscribe(async (rr) => {
        let resp = JSON.parse(JSON.parse(JSON.stringify(rr)));
        if (resp.Codigo) {
            var byteCharacters = atob(resp.doc);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            saveAs(new Blob([byteArray], { type: 'application/octet-stream' }), 'PlanificacionVA.xlsx');
            this.loadingVisible = false;
            return resolve(true);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });

    if(valorExport){
      await this.showAlert('','Excel generado exitosamente.','success');
    }

    this.loadingVisible = false;
  }


  async onClickRptVentasExcel() {
    this.loadingVisible = true;

    const valorExport = await new Promise(async (resolve) => {
      await this._service.callApiReportePlanificacionVentas(this.idPlanificacion).subscribe(async (rr) => {
        let resp = JSON.parse(JSON.parse(JSON.stringify(rr)));
        if (resp.Codigo) {
            var byteCharacters = atob(resp.doc);
            var byteNumbers = new Array(byteCharacters.length);
            for (var i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            saveAs(new Blob([byteArray], { type: 'application/octet-stream' }), 'PlanificacionVA.xlsx');
            this.loadingVisible = false;
            return resolve(true);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });

    if(valorExport){
      await this.showAlert('','Excel generado exitosamente.','success');
    }

    this.loadingVisible = false;
  }


  async onClickSearchPlanificacion() {
    this.loadingVisible = true;
    let filter = {
      fechaDesde: formatDate(this.fechaConsultaDesde, 'yyyy-MM-dd', 'en-US'),
      fechaHasta: formatDate(this.fechaConsultaHasta, 'yyyy-MM-dd', 'en-US'),
    };
    this._service.getPlanificacionSearch(filter).subscribe((data) => {
      this.PlanificacionSearch = data.Dt.Table.map((item: any) => {
        return {
          id: item.pla_id,
          fechaDesde: item.pla_fechaDesde,
          fechaHasta: item.pla_fechaHasta,
          paCodigo: item.pla_paCodigo,
          descriPlanta: item.descriPlanta,
          nroPersonasDia: item.pla_nroPersonasDia,
          nroPersonasNoche: item.pla_nroPersonasNoche,
          nroModulos: item.pla_nroModulos,
          observacion: item.pla_observacion,
          estado: item.pla_estado,
        };
      });
      this.GridPlanificacionSearch.instance.refresh();
      this.loadingVisible = false;
    });
  }
  
  async onClickCargarPlanificacionHistorica(modal: any) {

    if (this.PlanificacionSearch.length === 0) {
      this._notificationService.warning('No existen planificaciones para cargar');
      return;
    }
    this.loadingVisible = true;
    let filter = {
      fechaDesde: formatDate(this.fechaConsultaDesde, 'yyyy-MM-dd', 'en-US'),
      fechaHasta: formatDate(this.fechaConsultaHasta, 'yyyy-MM-dd', 'en-US'),
    };
    if (modal !== undefined) {
      modal.close();
    }
    this._service.getPlanificacionHistoricaSearch(filter).subscribe((data) => {
      this.loadDataPlanificacion(data);
    });
    this.esPlanificacionHistorica = true;
    this.loadingVisible = false;
  }

  onInitializedPlanificacion(grid: any) {
    this.GridPlanificacion = grid;
  }

  
  onInitializedPlanificacionSearch(grid: any) {
    this.GridPlanificacionSearch = grid;
  }


  onInitializedRequerimientoProFresco(grid: any) {
    this.GridRequerimientoProFresco = grid;
  }


  onInitializedRequerimientoProTerminado(grid: any) {
    this.GridRequerimientoProTerminado = grid;
  }


  onRowPrepared(e) {
    if (e.data && e.data.Dia && e.data.Dia !== '' ) {
      e.rowElement.style.backgroundColor = e.data.colorBackground;
    }
  }

  
  onChangeGridCheckReqMp(value: any, data: any) {
    this.Planificacion.find((x) => x.plaDetId == data.data.plaDetId).checkReqMp = value;
    if (value) {
      this.Planificacion.forEach(async (item) => {
        // se debe permitir chequear mas de un registro solo si coincide (pedido, producto, clase, talla, dia)
        if ((item.pedNumero !== data.data.pedNumero || item.prodCodcor !== data.data.prodCodcor || item.proClase !== data.data.proClase || item.talCodigo !== data.data.talCodigo || item.Dia !== data.data.Dia)
          && (item.numeroReqTerminado === null && item.numeroReqFresco === null)) {
          item.checkReqMp = false;
          item.checkReqDes = false;
        }
        // if (item.plaDetId !== data.data.plaDetId && item.numeroReqFresco === null) {
        //   item.checkReqMp = false;
        // }
      });
    }
    this.GridPlanificacion.instance.refresh();
  }
  

  onChangeGridCheckReqDes(value: any, data: any) {
    this.Planificacion.find((x) => x.plaDetId == data.data.plaDetId).checkReqDes = value;
    if (value) {
      this.Planificacion.forEach(async (item) => {
        // if ((item.pedNumero !== data.data.pedNumero || item.prodCodcor !== data.data.prodCodcor || item.proClase !== data.data.proClase || item.talCodigo !== data.data.talCodigo || item.Dia !== data.data.Dia) 
        //   && (item.numeroReqTerminado === null && item.numeroReqFresco === null)){
        //   item.checkReqMp = false;
        //   item.checkReqDes = false;
        // }
        if (item.plaDetId !== data.data.plaDetId  && item.numeroReqTerminado === null) {
          item.checkReqDes = false;
        }
      });
    }
    this.GridPlanificacion.instance.refresh();
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
      return `${dayNames[dayName]} ${day}`;
    }
    if (format === 2) {
      return `${dayNames[dayName]} ${day} ${monthNames[monthIndex]} ${year}`;
    }
    return `${dayNames[dayName]} ${day}`;
  }
  

  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }

  limpiarRequerimientoProducto() {
    this.cmbBodegaDestino = "00"; 
    this.observacion = '';
    this.RequerimientoProFresco = [];
    this.RequerimientoProTerminado = [];
    this.totalLibrasRequerimientos = 0;
  }

  async onClickGenerarRequerimiento() {
    this.limpiarRequerimientoProducto();
    this.itemSelectedForReq = this.Planificacion.filter((x) => (x.checkReqDes && x.numeroReqTerminado === null));
    if (this.itemSelectedForReq.length === 0) {
      this._notificationService.warning('Debe seleccionar al menos un registro para generar el requerimiento de producto');
      return;
    }
    
    this.modalReferenceItem = await this.modalService.open(this.modalRequerimientoProducto, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalGenerarRequerimiento',
    });

    this.disabledTabRequerimientoProFresco = true;
    this.disabledTabRequerimientoProTerminado = true;
    // totalizar libras de requerimientos
    this.librasPlanificadasTotal = 0;
    for (let i = 0; i < this.itemSelectedForReq.length; i++) {
      // if (this.itemSelectedForReq[i].checkReqMp) {
      //   this.disabledTabRequerimientoProFresco = false;
      // }
      // if (this.itemSelectedForReq[i].checkReqDes) {
      //   this.disabledTabRequerimientoProTerminado = false;
      // }
      this.librasPlanificadasTotal += this.itemSelectedForReq[i].librasPlanificadas;
    }

    // setTimeout(() => {
    //   if (this.tabPanel) {
    //     this.tabPanel.instance.option('selectedIndex', (!this.disabledTabRequerimientoProFresco ? 0 : 1));
    //   }
    // }, 500);

    let MastPed = 0;
    MastPed = await this.calcularCajasProdByLibras(this.librasPlanificadasTotal, this.itemSelectedForReq[0].prodCodcor, 'M');
    
    this.cmbBodegaDestino = "VQ"; // 'TR VAG S2'
    this.cabeceraReq = {
      observ: '',
      tiplot: '21',
      codprod: this.itemSelectedForReq[0].prodCodcor,
      proClase: this.itemSelectedForReq[0].proClase,
      descriProducto: this.itemSelectedForReq[0].descriProducto,
      ConLote: this.itemSelectedForReq[0].numLote > 0 ? 'S' : 'N',
      factura: this.itemSelectedForReq[0].pedNumero,
      talPed: this.itemSelectedForReq[0].talCodigo,
      descriTalla: this.itemSelectedForReq[0].descriTalla,
      MastPed: MastPed,
      LibPed: this.librasPlanificadasTotal,
      MaxLibPed: 0,
      boddes: this.cmbBodegaDestino,
      // detPlanifica_id: this.itemSelectedForReq.plaDetId,
      certificadoASC: this.itemSelectedForReq[0].certificadoASC,
      numLote: this.itemSelectedForReq[0].numLote,
    }

    if (!this.disabledTabRequerimientoProFresco){
      // this.onClickAgregarProFresco();
    }

    this.onClickAgregarProTerminado();
    
  }


  async onClickAgregarProFresco () {
    let codprod = '';
    let desProd = '';
    let codtal = null;
    if (this.RequerimientoProFresco.length > 0) {
      if (this.RequerimientoProFresco[this.RequerimientoProFresco.length - 1].codpro === '' ||
          this.RequerimientoProFresco[this.RequerimientoProFresco.length - 1].numcaj === 0 ||
          this.RequerimientoProFresco[this.RequerimientoProFresco.length - 1].libras === 0 ||
          this.RequerimientoProFresco[this.RequerimientoProFresco.length - 1].codtal === null
        ) {
        this._notificationService.warning('Complete los datos del último registro');
        return;
      }
    } else {
      codprod = this.itemSelectedForReq[0].proClase === 'A' ? '320' : '321';
      desProd = this.itemSelectedForReq[0].proClase === 'A' ? 'SHELLON FRESCO' : 'SHELLON FRESCO B';
      codtal = await this.SSLlenaTallas(codprod.toString(), this.cabeceraReq.descriTalla);
    }
    let reqFr = {
      numdet: this.RequerimientoProFresco.length + 1,
      codpro: codprod,
      despro: desProd,
      codtal: codtal || null,
      codtalvta: codtal || null,
      numcaj: 0,
      libras: 0,
      lote: 0,
    };
    this.RequerimientoProFresco = [...this.RequerimientoProFresco, reqFr];
    if (this.GridRequerimientoProFresco){
      this.GridRequerimientoProFresco.instance.refresh();
    }
  }

  
  onClickDeleteProFresco(rowData: any) {
    let {numdet} = rowData;
    this.RequerimientoProFresco = this.RequerimientoProFresco.filter(item => item.numdet !== numdet);
    this.RequerimientoProFresco.forEach((item, index) => {
      item.numdet = index + 1;
    });
    if (this.GridRequerimientoProFresco){
      this.GridRequerimientoProFresco.instance.refresh();
    }
  }

  async onClickAgregarProTerminado () {
    let codprod = '';
    let desProd = '';
    let codtal = null;
    if (this.RequerimientoProTerminado.length > 0) {
      if (this.RequerimientoProTerminado[this.RequerimientoProTerminado.length - 1].codpro === '' ||
          this.RequerimientoProTerminado[this.RequerimientoProTerminado.length - 1].numcaj === 0 ||
          this.RequerimientoProTerminado[this.RequerimientoProTerminado.length - 1].libras === 0 ||
          this.RequerimientoProTerminado[this.RequerimientoProTerminado.length - 1].codtal === null) {
        this._notificationService.warning('Complete los datos del último registro');
        return;
      }
    } else {
      codprod = this.itemSelectedForReq[0].proClase === 'A' ? '5010' : '5011';
      desProd = this.itemSelectedForReq[0].proClase === 'A' ? 'CHAMPMAR 6x1800g' : 'MARCOL 6x1800g B';
      codtal = await this.SSLlenaTallas(codprod.toString(), this.cabeceraReq.descriTalla);
    }
    let reqTe = {
      numdet: this.RequerimientoProTerminado.length + 1,
      codpro: codprod,
      despro: desProd,
      codtal: codtal || null,
      codtalvta: codtal || null,
      numcaj: 0,
      libras: 0,
      lote: 0,
    };
    this.RequerimientoProTerminado = [...this.RequerimientoProTerminado, reqTe];
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  onClickDeleteProTerminado(rowData: any) {
    let {numdet} = rowData;
    this.RequerimientoProTerminado = this.RequerimientoProTerminado.filter(item => item.numdet !== numdet);
    this.RequerimientoProTerminado.forEach((item, index) => {
      item.numdet = index + 1;
    });
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  validarDatos () {
    if (this.cmbBodegaDestino === undefined || this.cmbBodegaDestino === '00') {
      this._notificationService.warning('Debe seleccionar la bodega destino');
      return false;
    }
    if (!this.disabledTabRequerimientoProFresco) {
      if (this.RequerimientoProFresco.length === 0) {
        this._notificationService.warning('Debe ingresar al menos un producto fresco');
        return false;
      }
      for (let i = 0; i < this.RequerimientoProFresco.length; i++) {
        if (this.RequerimientoProFresco[i].codpro === '') {
          this._notificationService.warning('Debe ingresar el código de producto fresco');
          return false;
        }
        if (this.RequerimientoProFresco[i].codtal === null) {
          this._notificationService.warning('Debe seleccionar la talla de producto fresco');
          return false;
        }
        if (this.RequerimientoProFresco[i].libras === 0) {
          this._notificationService.warning('Debe ingresar la cantidad de libras de producto fresco');
          return false;
        }
        if (this.RequerimientoProFresco[i].numcaj === 0) {
          this._notificationService.warning('Debe ingresar la cantidad de cajas de producto fresco');
          return false;
        }

      }
    }
    if (!this.disabledTabRequerimientoProTerminado) {
      if (this.RequerimientoProTerminado.length === 0) {
        this._notificationService.warning('Debe ingresar al menos un producto terminado');
        return false;
      }
      for (let i = 0; i < this.RequerimientoProTerminado.length; i++) {
        if (this.RequerimientoProTerminado[i].codpro === '') {
          this._notificationService.warning('Debe ingresar el código de producto terminado');
          return false;
        }
        if (this.RequerimientoProTerminado[i].codtal === null) {
          this._notificationService.warning('Debe seleccionar la talla de producto terminado');
          return false;
        }
        if (this.RequerimientoProTerminado[i].libras === 0) {
          this._notificationService.warning('Debe ingresar la cantidad de libras de producto terminado');
          return false;
        }
        if (this.RequerimientoProTerminado[i].numcaj === 0) {
          this._notificationService.warning('Debe ingresar la cantidad de cajas de producto terminado');
          return false;
        }
      }
    }
    if (this.calcularTotalLibrasRequerimientos() > this.librasPlanificadasTotal) {
      return false;
    }
    return true;
  }


  async onClickGuardarRequerimientoProducto () {
    this.loadingVisible = true;
    if (!this.validarDatos()) {
      this.loadingVisible = false;
      return;
    }
    this.cabeceraReq.observ = this.observacion;
    this.cabeceraReq.boddes = this.cmbBodegaDestino;

    let detPlanifica = [];
    for (let i = 0; i < this.itemSelectedForReq.length; i++) {
      let objDet = {
        detPlanifica_id : this.itemSelectedForReq[i].plaDetId,
        reqFresco: this.itemSelectedForReq[i].checkReqMp ? 1 : 0,
        reqTerminado: this.itemSelectedForReq[i].checkReqDes ? 1 : 0,
      };
      detPlanifica.push(objDet);
    }

    let dataReq = {
      cab: this.cabeceraReq,
      detPlanifica: detPlanifica,
      detFr: this.RequerimientoProFresco,
      detTe: this.RequerimientoProTerminado,
      userAud: localStorage.getItem(varUser)
    };

    await this._service.postRequerimientoProductoVA(dataReq).subscribe((data) => {
      this.loadingVisible = false;
      if (data.Codigo) {
        this.showAlert('', 'Registro guardado correctamente', 'success'); // , 'this.modalReferenceItem.close();'
        this.modalReferenceItem.close();
        this._service.getLastPlanificacion().subscribe((data) => {
          this.loadDataPlanificacion(data);
        });    
        this.limpiarNuevo();
      } else {
        this.showAlert('', `Error al guardar el registro` + data.Description, 'error');
      }
    });


  }

  
  async onRowProgDoubleClick(e: any, modal: any) {
    const id = e.data.id;
    this.loadingVisible = true;
    if (modal !== undefined) {
      modal.close();
    }
    this._service.getPlanificacionById(id).subscribe((data) => {
      this.loadDataPlanificacion(data);
    });
    this.esPlanificacionHistorica = false;
    this.loadingVisible = false;
  }


  async loadDataPlanificacion(data) {
    let datosCab: any = data.Dt.Table;
    if (datosCab.length > 0) {
      this.idPlanificacion = datosCab[0].pla_id;
      this.fechaDesdeFormat = this.getDateCustomFormat(new Date(datosCab[0].pla_fechaDesde), 2);
      this.fechaHastaFormat = this.getDateCustomFormat(new Date(datosCab[0].pla_fechaHasta), 2);
      this.estado = datosCab[0].pla_estado;
      // si estado es diferente de AC deshabilitar botón de generar requerimiento
      this.disabledBtnGenerarRequerimiento = this.estado !== 'AC';

    }
    var dia = this.getDateCustomFormat(new Date(data.Dt.Table1[0].fechaPlanificado), 1).split(' ')[0];
    var turno = data.Dt.Table1[0].turno;
    var indiceColor = 0;
    this.Planificacion = data.Dt.Table1.map((item: any) => {
      if (dia != this.getDateCustomFormat(new Date(item.fechaPlanificado), 1).split(' ')[0] || turno != item.turno)
      {
          dia = this.getDateCustomFormat(new Date(item.fechaPlanificado), 1).split(' ')[0];
          turno = item.turno;
          indiceColor = indiceColor == this.colores.length - 1 ? 0 : indiceColor + 1;
      }
      return {
        plaDetId: item.plaDetId,
        prioridad: item.prioridad,
        checkReqMp: (item.numeroReqFresco !== null && item.numeroReqFresco !== 0) , 
        checkReqDes: (item.numeroReqTerminado !== null && item.numeroReqTerminado !== 0),
        // index: item.index,
        // orderAux: item.index,
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
        librasPedido: item.librasPedido,
        librasPlanificadas: item.librasPlanificadas,
        librasDespFresco: item.librasDespFresco,
        totalLibrasPeladas: item.totalLibrasPeladas,
        librasDespTerminado: item.librasDespTerminado,
        fechaPlanificado: formatDate(new Date(item.fechaPlanificado), 'yyyy-MM-dd', 'en-US'),
        Dia: this.getDateCustomFormat(new Date(item.fechaPlanificado), 1),
        turno: item.turno,
        descriTurno: item.turno === 'D' ? 'Día' : 'Noche',
        tiempoCorte: item.tiempoCorte,
        colorBackground: this.colores[indiceColor],
        certificadoASC: item.certificadoASC,
        numLote: item.numLote,
        numeroReqFresco: item.numeroReqFresco,
        numeroReqTerminado: item.numeroReqTerminado,
        reqFrescolibrasDesp: item.reqFrescolibrasDesp,
        reqTerminadolibrasDesp: item.reqTerminadolibrasDesp,
      };
    });
    // this.GridFacturas.instance.refresh();
  }

  
  async onChangeValorProductoFre(value: any, cell: any) {
    const { numdet } = cell.data;
    value = this._utilService.validateNumberInt(value);
    await this._service.getProductoRequerimientoSearch({ codpro: value, tipo: 'PP'}).subscribe(async (data) => {
      var dat: any = data.Dt.Table;
      const index = this.RequerimientoProFresco.findIndex(x => x.numdet === numdet);
      if (dat.length > 0) {
        this.RequerimientoProFresco[index].codpro = value.toString();
        this.RequerimientoProFresco[index].despro = dat[0].pro_desesp;
        let codtal = await this.SSLlenaTallas(value.toString(), this.cabeceraReq.descriTalla);
        if (codtal !== null) {
          this.RequerimientoProFresco[index].codtal = codtal;
          this.RequerimientoProFresco[index].codtalvta = codtal;
        }
      } else {
        this.RequerimientoProFresco[index].codpro = '';
        this.RequerimientoProFresco[index].despro = '';
        this.showAlert('', 'Producto no existe ó no tiene la clasificación de producto fresco.', 'error');
      }
      if (this.GridRequerimientoProFresco){
        this.GridRequerimientoProFresco.instance.refresh();
      }
    });
  }


  async onChangeValorLibrasFre(value: any, cell: any) {
    const { numdet, codpro } = cell.data;
    value = this._utilService.validateNumberInt(value);
    this.RequerimientoProFresco.find(x => x.numdet === numdet).libras = value;
    let cajas = await this.calcularCajasProdByLibras(value, codpro);
    this.RequerimientoProFresco.find(x => x.numdet === numdet).numcaj = cajas;    
    this.totalLibrasRequerimientos = this.calcularTotalLibrasRequerimientos();
    // autocompletar la cantidad de libras si el total es 27000 y de fresco pongo 20000, en descongelado debe de poner 7000
    if (this.totalLibrasRequerimientos < this.cabeceraReq.LibPed && this.RequerimientoProTerminado.length == 1 && this.RequerimientoProTerminado[0].libras == 0){
      this.RequerimientoProTerminado[0].libras = this.cabeceraReq.LibPed - value;
      this.RequerimientoProTerminado[0].numcaj = await this.calcularCajasProdByLibras(this.RequerimientoProTerminado[0].libras, this.RequerimientoProTerminado[0].codpro);
      this.totalLibrasRequerimientos = this.calcularTotalLibrasRequerimientos();
      if (this.GridRequerimientoProTerminado){
        this.GridRequerimientoProTerminado.instance.refresh();
      }
    }
    if (this.GridRequerimientoProFresco){
      this.GridRequerimientoProFresco.instance.refresh();
    }
  }
  
  
  async OnChangeCmbTallaFre(value,cell){
    const { numdet } = cell.data;
    this.RequerimientoProFresco.find(x => x.numdet === numdet).codtal = value;
    this.RequerimientoProFresco.find(x => x.numdet === numdet).codtalvta = value;
    if (this.GridRequerimientoProFresco){
      this.GridRequerimientoProFresco.instance.refresh();
    }
  }

  async onChangeValorProductoTer(value: any, cell: any) {
    const { numdet } = cell.data;
    value = this._utilService.validateNumberInt(value);
    await this._service.getProductoRequerimientoSearch({ codpro: value, tipo: 'PT'}).subscribe(async (data) => {
      var dat: any = data.Dt.Table;
      const index = this.RequerimientoProTerminado.findIndex(x => x.numdet === numdet);
      if (dat.length > 0) {
        this.RequerimientoProTerminado[index].codpro = value.toString();
        this.RequerimientoProTerminado[index].despro = dat[0].pro_desesp;
        let codtal = await this.SSLlenaTallas(value.toString(), this.cabeceraReq.descriTalla);
        if (codtal !== null) {
          this.RequerimientoProTerminado[index].codtal = codtal;
          this.RequerimientoProTerminado[index].codtalvta = codtal;
        }
      } else {
        this.RequerimientoProTerminado[index].codpro = '';
        this.RequerimientoProTerminado[index].despro = '';
        this.showAlert('', 'Producto no existe ó no tiene la clasificación de producto terminado.', 'error');
      }
      if (this.GridRequerimientoProTerminado){
        this.GridRequerimientoProTerminado.instance.refresh();
      }
    });
  }


  async onChangeValorLibrasTer(value: any, cell: any) {
    const { numdet, codpro } = cell.data;
    value = this._utilService.validateNumberInt(value);
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).libras = value;
    let cajas = await this.calcularCajasProdByLibras(value, codpro);
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).numcaj = cajas;    
    this.totalLibrasRequerimientos = this.calcularTotalLibrasRequerimientos();
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  async OnChangeCmbTallaTer(value,cell){
    const { numdet } = cell.data;
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).codtal = value;
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).codtalvta = value;
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  SSLlenaTallas(codigoProd, descriTalla): Promise<any>{
    if (this.dataCmbTalla.filter(d=> d["codpro"] == codigoProd).length > 0){
      let talla = this.dataCmbTalla.find(x => x.codpro === codigoProd && x.descripcion === descriTalla);
      if (talla !== undefined) {
        return talla.codigo;
      } else {
        return null;
      }
    }
    return new Promise(async (resolve) => {
      await this._service.getTallasVtaProd(codigoProd).subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0 && resp.Dt.Table.length > 0) {
            let dt: any = resp.Dt.Table;

            if(this.dataCmbTalla !== undefined && this.dataCmbTalla.length > 0){
              let dtTallas = this.dataCmbTalla;
              for (let index = 0; index < dt.length; index++) {
                dtTallas.push(dt[index]);
              }
  
              this.dataCmbTalla = JSON.parse(JSON.stringify(dtTallas));
            }
            else
            {
              this.dataCmbTalla = JSON.parse(JSON.stringify(resp.Dt.Table));
            }


            let codtal: number | null = null;
            let talla = dt.find(x => x.descripcion === descriTalla);
            if (talla !== undefined) {
              codtal = talla.codigo
            }

            return resolve(codtal);
          }
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(null);
        }
      });
    });
    
  }

  
  calcularTotalLibrasRequerimientos(){
    let librasProTerminado = this.RequerimientoProTerminado.reduce((acc, item) => acc + item.libras, 0);
    let librasProFresco = this.RequerimientoProFresco.reduce((acc, item) => acc + item.libras, 0);
    let librasTotal = librasProTerminado + librasProFresco;
    // La cantidad total de libras no puede ser mayor al 2% más de la cantidad planificada    
    if (librasTotal > (this.cabeceraReq.LibPed * 1.02)) {
      this._notificationService.warning('La cantidad total de libras no puede ser mayor al 2% más de la cantidad planificada');
    }
    return librasTotal;
  }


  async calcularCajasProdByLibras(libras, codpro, tipo = 'C'): Promise<number>{
    return new Promise(async (resolve) => {
      await this._service.getCajasProdByLibras(codpro, libras).subscribe(async (data) => {
        var cajas = 0;
        var masters = 0;
        if (data.Codigo) {
          var dat: any = data.Dt.Table;
          if (dat.length > 0) {
            cajas = dat[0].cajas;
            masters = dat[0].masters;
          }
        }
        if (tipo === 'C'){
          return resolve(cajas);
        }
        else if (tipo === 'M'){
          return resolve(masters);
        }
      });
    });
  }


  filter(d, codpro){
    if(d !== undefined && d.length > 0){
      return d.filter(d=> d["codpro"] === codpro.toString());
    }
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
