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
  numeroReq?: string;
  estado?: string;
  observ: string;
  tiplot: string;
  genLotOtr: string;
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
  numSecuencial: number;
  esmaquina: string;
  tipoProceso: string;
  tipoLote: string;
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
  esVistaRequerimiento: boolean = false;

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
    this.esVistaRequerimiento = false;
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
    if (e.data && e.data.Dia && e.data.Dia !== '' && !this.esPlanificacionHistorica ) {
      e.rowElement.style.backgroundColor = e.data.colorBackground;
      if (e.data.manualAutomatico == 'A' && e.rowType === 'data') {
        // solo pintar la celda no toda la fila
        const manualAutomaticoCell = e.rowElement.querySelector('td[aria-colindex="16"]');
        if (manualAutomaticoCell) {
          manualAutomaticoCell.style.backgroundColor = 'yellow';
        }
      }
    }
  }

  
  onChangeGridCheckReqMp(value: any, data: any) {
    this.Planificacion.find((x) => x.plaDetId == data.data.plaDetId).checkReqMp = value;
    if (value) {
      this.Planificacion.forEach(async (item) => {
        // se debe permitir chequear mas de un registro solo si coincide (pedido, producto, clase, talla, dia)
        // if ((item.pedNumero !== data.data.pedNumero || item.prodCodcor !== data.data.prodCodcor || item.proClase !== data.data.proClase || item.talCodigo !== data.data.talCodigo || item.Dia !== data.data.Dia)
        //   && (item.numeroReqTerminado === null && item.numeroReqFresco === null)) {
        //   item.checkReqMp = false;
        //   item.checkReqDes = false;
        // }
        if (item.plaDetId !== data.data.plaDetId) {
          if (item.numeroReqTerminado === null) {
            item.checkReqDes = false;
          }
          if (item.numeroReqFresco === null) {
            item.checkReqMp = false;
          }          
        }
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
        if (item.plaDetId !== data.data.plaDetId) {
          if (item.numeroReqTerminado === null) {
            item.checkReqDes = false;
          }
          if (item.numeroReqFresco === null) {
            item.checkReqMp = false;
          }          
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
    this.esVistaRequerimiento = false;
    this.limpiarRequerimientoProducto();
    this.itemSelectedForReq = this.Planificacion.filter((x) => (x.checkReqDes && x.numeroReqTerminado === null) || (x.checkReqMp && x.numeroReqFresco === null));
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
      if (this.itemSelectedForReq[i].checkReqMp && this.itemSelectedForReq[i].numeroReqFresco === null) {
        this.disabledTabRequerimientoProFresco = false;
      }
      if (this.itemSelectedForReq[i].checkReqDes && this.itemSelectedForReq[i].numeroReqTerminado === null) {
        this.disabledTabRequerimientoProTerminado = false;
      }
      this.librasPlanificadasTotal += this.itemSelectedForReq[i].librasPlanificadas;
    }

    let MastPed = 0;
    MastPed = await this.calcularCajasProdByLibras(this.librasPlanificadasTotal, this.itemSelectedForReq[0].prodCodcor, 'M');
    MastPed = this._utilService.redondear(MastPed, 'S', 1);
    
    this.cmbBodegaDestino = "VQ"; // 'TR VAG S2'
    this.cabeceraReq = {
      numeroReq: null,
      estado: '',
      observ: '',
      tiplot: this.itemSelectedForReq[0].tipLotOtr,
      genLotOtr: this.itemSelectedForReq[0].numSecuencial ? '2' : '1',
      codprod: this.itemSelectedForReq[0].prodCodcor,
      proClase: this.itemSelectedForReq[0].proClase,
      descriProducto: this.itemSelectedForReq[0].descriProducto,
      ConLote: 'N', //this.itemSelectedForReq[0].numLote > 0 ? 'S' : 'N',
      factura: this.itemSelectedForReq[0].pedNumero,
      talPed: this.itemSelectedForReq[0].talCodigo,
      descriTalla: this.itemSelectedForReq[0].descriTalla,
      MastPed: MastPed,
      LibPed: this.librasPlanificadasTotal,
      MaxLibPed: 0,
      boddes: this.cmbBodegaDestino,
      // detPlanifica_id: this.itemSelectedForReq.plaDetId,
      certificadoASC: this.itemSelectedForReq[0].certificadoASC,
      numLote: this.itemSelectedForReq[0].numLote || null,
      numSecuencial: this.itemSelectedForReq[0].numSecuencial || null,
      esmaquina: this.itemSelectedForReq[0].manualAutomatico === 'A' ? '1' : null,
      tipoProceso: this.itemSelectedForReq[0].tipoProceso,
      tipoLote: "Valor Agregado"
    }

    if (!this.disabledTabRequerimientoProFresco){
      this.onClickAgregarProFresco();
    }
    if (!this.disabledTabRequerimientoProTerminado){
      this.onClickAgregarProTerminado();
    }
    
    setTimeout(() => {
      if (!this.disabledTabRequerimientoProFresco) {
        $('.dx-tab-text').each(function() {
          if ($(this).text() === 'Producto Fresco') {
            $(this).click();
          }
        });
      } else {
        $('.dx-tab-text').each(function() {
          if ($(this).text() === 'Producto Terminado') {
            $(this).click();
          }
        });
      }
    }, 500);


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

  
  async onClickDeleteProFresco(rowData: any) {
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

  async onClickDeleteProTerminado(rowData: any) {
    let {numdet} = rowData;
    this.RequerimientoProTerminado = this.RequerimientoProTerminado.filter(item => item.numdet !== numdet);
    this.RequerimientoProTerminado.forEach((item, index) => {
      item.numdet = index + 1;
    });
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  async onClickReqFresco(rowData: any) {
    this.esVistaRequerimiento = true;
    this.limpiarRequerimientoProducto();
    
    this.modalReferenceItem = await this.modalService.open(this.modalRequerimientoProducto, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalGenerarRequerimiento',
    });

    this.disabledTabRequerimientoProFresco = false;
    this.disabledTabRequerimientoProTerminado = true;
    
    this._service.getRequerimientoProducto(rowData.numeroReqFresco).subscribe((data) => {
      if (data.Codigo) {
        let datosCab: any = data.Dt.Table;
        let datosDet: any = data.Dt.Table1;
        if (datosCab.length > 0) {
          let estadoDescri = datosCab[0].rpc_estado === 'AC' ? 'ACTIVO' :
                            datosCab[0].rpc_estado === 'EN' ? 'ENVIADO' :
                            datosCab[0].rpc_estado === 'AN' ? 'ANULADO' :
                            datosCab[0].rpc_estado === 'AP' ? 'APROBADO' :
                            datosCab[0].rpc_estado === 'PR' ? 'PRE APROBADO' :
                            datosCab[0].rpc_estado === 'DE' ? 'DENEGADO' :
                            datosCab[0].rpc_estado === 'DS' ? 'DESPACHADO' :
                            datosCab[0].rpc_estado === 'DP' ? 'DESPACHADO PARCIAL' : '';
          this.cmbBodegaDestino = datosCab[0].rpc_boddes.toString().trim();
          this.cabeceraReq = {
            numeroReq: datosCab[0].rpc_numero,
            estado: estadoDescri,
            observ: datosCab[0].rpc_observ,
            tiplot: datosCab[0].rpc_tiplot,
            genLotOtr: datosCab[0].rpc_GenLotOtr,
            codprod: datosCab[0].rpc_prodPed,
            proClase: rowData.proClase,
            descriProducto: rowData.descriProducto,
            ConLote: datosCab[0].rpc_ConLote, 
            factura: datosCab[0].rpc_factura,
            talPed: datosCab[0].rpc_talPed,
            descriTalla: rowData.descriTalla,
            MastPed: datosCab[0].rpc_MastPed,
            LibPed: datosCab[0].rpc_libPed,
            MaxLibPed: 0,
            boddes: datosCab[0].rpc_boddes,
            certificadoASC: rowData.certificadoASC,
            numLote: datosCab[0].rpc_loteExistente,
            numSecuencial: datosCab[0].rpc_nroSeLotOtr,
            esmaquina: rowData.manualAutomatico === 'A' ? '1' : null,
            tipoProceso: rowData.tipoProceso,
            tipoLote: "Valor Agregado"
          }

          this.RequerimientoProFresco = datosDet.map((item: any) => {
            return {
              numdet: item.rpd_numdet,
              codpro: item.rpd_codpro,
              despro: item.rpd_despro,
              codtal: item.rpd_codtal,
              codtalvta: item.rpd_codtalvta,
              numcaj: item.rpd_numcaj,
              libras: item.rpd_libras, 
              lote: item.rpd_lote,
            };
          });
          this.totalLibrasRequerimientos = this.RequerimientoProFresco.reduce((acc, item) => acc + item.libras, 0);
          if (this.GridRequerimientoProFresco){
            this.GridRequerimientoProFresco.instance.refresh();
          }

        }
      }
    });

    
    setTimeout(() => {
      $('.dx-tab-text').each(function() {
        if ($(this).text() === 'Producto Fresco') {
          $(this).click();
        }
      });
    }, 500);

  }

  async onClickReqTerminado(rowData: any) {
    this.esVistaRequerimiento = true;
    this.limpiarRequerimientoProducto();
    
    this.modalReferenceItem = await this.modalService.open(this.modalRequerimientoProducto, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalGenerarRequerimiento',
    });

    this.disabledTabRequerimientoProFresco = true;
    this.disabledTabRequerimientoProTerminado = false;
    
    this._service.getRequerimientoProducto(rowData.numeroReqTerminado).subscribe((data) => {
      if (data.Codigo) {
        let datosCab: any = data.Dt.Table;
        let datosDet: any = data.Dt.Table1;
        if (datosCab.length > 0) {
          let estadoDescri = datosCab[0].rpc_estado === 'AC' ? 'ACTIVO' :
                            datosCab[0].rpc_estado === 'EN' ? 'ENVIADO' :
                            datosCab[0].rpc_estado === 'AN' ? 'ANULADO' :
                            datosCab[0].rpc_estado === 'AP' ? 'APROBADO' :
                            datosCab[0].rpc_estado === 'PR' ? 'PRE APROBADO' :
                            datosCab[0].rpc_estado === 'DE' ? 'DENEGADO' :
                            datosCab[0].rpc_estado === 'DS' ? 'DESPACHADO' :
                            datosCab[0].rpc_estado === 'DP' ? 'DESPACHADO PARCIAL' : '';
          this.cmbBodegaDestino = datosCab[0].rpc_boddes.toString().trim();
          this.cabeceraReq = {
            numeroReq: datosCab[0].rpc_numero,
            estado: estadoDescri,
            observ: datosCab[0].rpc_observ,
            tiplot: datosCab[0].rpc_tiplot,
            genLotOtr: datosCab[0].rpc_GenLotOtr,
            codprod: datosCab[0].rpc_prodPed,
            proClase: rowData.proClase,
            descriProducto: rowData.descriProducto,
            ConLote: datosCab[0].rpc_ConLote, 
            factura: datosCab[0].rpc_factura,
            talPed: datosCab[0].rpc_talPed,
            descriTalla: rowData.descriTalla,
            MastPed: datosCab[0].rpc_MastPed,
            LibPed: datosCab[0].rpc_libPed,
            MaxLibPed: 0,
            boddes: datosCab[0].rpc_boddes,
            certificadoASC: rowData.certificadoASC,
            numLote: datosCab[0].rpc_loteExistente,
            numSecuencial: datosCab[0].rpc_nroSeLotOtr,
            esmaquina: rowData.manualAutomatico === 'A' ? '1' : null,
            tipoProceso: rowData.tipoProceso,
            tipoLote: "Valor Agregado"
          }

          this.RequerimientoProTerminado = datosDet.map((item: any) => {
            return {
              numdet: item.rpd_numdet,
              codpro: item.rpd_codpro,
              despro: item.rpd_despro,
              codtal: item.rpd_codtal,
              codtalvta: item.rpd_codtalvta,
              numcaj: item.rpd_numcaj,
              libras: item.rpd_libras, 
              lote: item.rpd_lote,
            };
          });
          this.totalLibrasRequerimientos = this.RequerimientoProTerminado.reduce((acc, item) => acc + item.libras, 0);
          if (this.GridRequerimientoProTerminado){
            this.GridRequerimientoProTerminado.instance.refresh();
          }

        }
      }
    });
    
    setTimeout(() => {
      $('.dx-tab-text').each(function() {
        if ($(this).text() === 'Producto Terminado') {
          $(this).click();
        }
      });
    }, 500);

  }

  async validarDatos () {
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
        // calcular el stock en base de datos
        let validaStock = await this.verificarStockProducto(this.RequerimientoProTerminado[i].codpro, this.RequerimientoProTerminado[i].codtal, this.RequerimientoProTerminado[i].numcaj);
        if (!validaStock){
          return false;
        }
        
      }
    }
    if (this.calcularTotalLibrasRequerimientos() > (this.librasPlanificadasTotal * 1.05)) {
      return false;
    }
    return true;
  }


  async onClickGuardarRequerimientoProducto () {
    this.loadingVisible = true;
    if (! await this.validarDatos()) {
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

    await this._service.postRequerimientoProductoVA(dataReq).subscribe(
      (data) => {
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
      },
      (error) => {
        console.log(error);
        this.loadingVisible = false;
        this.showAlert('', 'Error al guardar el registro', error.message);
      }
    );
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
        planId: item.planId,
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
        tiempoCorteHora: item.tiempoCorteHora,
        numPersonas: item.numPersonas,
        numModulos: item.numModulos,
        colorBackground: this.colores[indiceColor],
        certificadoASC: item.certificadoASC,
        numLote: item.numLote,
        numSecuencial: item.numSecuencial,
        numeroReqFresco: item.numeroReqFresco,
        numeroReqTerminado: item.numeroReqTerminado,
        reqFrescolibrasDesp: item.reqFrescolibrasDesp,
        reqTerminadolibrasDesp: item.reqTerminadolibrasDesp,
        tipLotOtr: item.tipLotOtr,
        tipoProceso: item.tipoProceso,
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
      let cajasTer = await this.calcularCajasProdByLibras(this.RequerimientoProTerminado[0].libras, this.RequerimientoProTerminado[0].codpro);
      this.RequerimientoProTerminado[0].numcaj = this._utilService.redondear(cajasTer, 'S', 1);
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
    const { numdet, numcaj } = cell.data;
    let codpro = this._utilService.validateNumberInt(value);
    await this._service.getProductoRequerimientoSearch({ codpro: codpro, tipo: 'PT'}).subscribe(async (data) => {
      var dat: any = data.Dt.Table;
      const index = this.RequerimientoProTerminado.findIndex(x => x.numdet === numdet);
      if (dat.length > 0) {
        this.RequerimientoProTerminado[index].codpro = codpro.toString();
        this.RequerimientoProTerminado[index].despro = dat[0].pro_desesp;
        let codtal = await this.SSLlenaTallas(codpro.toString(), this.cabeceraReq.descriTalla);
        if (codtal !== null) {
          this.RequerimientoProTerminado[index].codtal = codtal;
          this.RequerimientoProTerminado[index].codtalvta = codtal;
          if (codpro && codtal && numcaj > 0){
            await this.verificarStockProducto(codpro, codtal, numcaj);
          }
        } else {
          this.RequerimientoProTerminado[index].codtal = null;
          this.RequerimientoProTerminado[index].codtalvta = null;
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
    const { numdet, codpro, codtal } = cell.data;
    value = this._utilService.validateNumberInt(value);
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).libras = value;
    let cajas = await this.calcularCajasProdByLibras(value, codpro);
    cajas = this._utilService.redondear(cajas, 'S', 1);
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).numcaj = cajas;    
    this.totalLibrasRequerimientos = this.calcularTotalLibrasRequerimientos();
    if (codpro && codtal && cajas > 0){
      await this.verificarStockProducto(codpro, codtal, cajas);
    }
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  async OnChangeCmbTallaTer(value,cell){
    const { numdet, codpro, numcaj } = cell.data;
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).codtal = value;
    this.RequerimientoProTerminado.find(x => x.numdet === numdet).codtalvta = value;
    let codtal = value;
    if (codpro && codtal && numcaj > 0){
      await this.verificarStockProducto(codpro, codtal, numcaj);
    }
    if (this.GridRequerimientoProTerminado){
      this.GridRequerimientoProTerminado.instance.refresh();
    }
  }

  async verificarStockProducto(codpro, codtal, cajas: number){
    let valida = true;
    var data = await this._service.getStockProducto(codpro, codtal, 0).toPromise();
    if (data.Codigo) {
      let datosDet: any = data.Dt.Table1;
      if (data.Dt.Table.length > 0) {
        let stockObj: any = data.Dt.Table;
        let SaldoTodo: number = stockObj[0].Column1;
        let SaldoDisponible: number = stockObj[0].Column2;
        let SaldoBloqueado: number = stockObj[0].Column3;
        let SaldoBloqueadoPreLiberado: number = stockObj[0].Column4;  
        if (cajas > SaldoTodo) {
          this._notificationService.warning(`No existe stock suficiente para el producto terminado ${codpro} en la talla seleccionada`);
          valida = false;
        }      
      }
    }
    return valida;
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
    // La cantidad total de libras no puede ser mayor al 5% más de la cantidad planificada    
    if (librasTotal > (this.cabeceraReq.LibPed * 1.05)) {
      this._notificationService.warning('La cantidad total de libras no puede ser mayor al 5% más de la cantidad planificada');
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

  
  async onChangeValorLote(value: string, data: any) {
    this.indiceColor = 0;
    const { plaDetId } = data.data;
    var numLote: number = value == '' ? null : parseInt(value);
    await this._service.updateLotePlanificacion(plaDetId, numLote, localStorage.getItem(varUser)).subscribe((data) => {
      if (data.Codigo) {
        const index = this.Planificacion.findIndex(item => item.plaDetId === plaDetId);
        if (index >= 0) {
          this.Planificacion[index].numLote = numLote;
        }
        // this.showAlert('', 'Número de lote actualizado correctamente', 'success');
      } else {
        this.showAlert('', 'Error al actualizar el número de lote', 'error');
      }
    });
  }
  
  async onChangeValorSecuencial(value: string, data: any) {
    this.indiceColor = 0;
    const { plaDetId } = data.data;
    var numSecuencial: number = value == '' ? null : parseInt(value);
    const index = this.Planificacion.findIndex(item => item.plaDetId === plaDetId);
    await this._service.updateSecuencialPlanificacion(plaDetId, numSecuencial, localStorage.getItem(varUser)).subscribe((data) => {
      if (data.Codigo) {
        const index = this.Planificacion.findIndex(item => item.plaDetId === plaDetId);
        if (index >= 0) {
          this.Planificacion[index].numSecuencial = numSecuencial;
        }
        // this.showAlert('', 'Número de secuencial actualizado correctamente', 'success');
      } else {
        this.showAlert('', 'Error al actualizar el número de secuencial', 'error');
      }
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
