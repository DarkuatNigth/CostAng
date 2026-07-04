import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { firstValueFrom } from 'rxjs';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';
import { NotificationService } from 'src/app/shared/notify.service';
import { URL_VIEW_REPORT, varUser } from 'src/app/config/url.servicios';
import { FrmsolicitudetiquetaService } from './frmsolicitudetiqueta.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { formatDate } from '@angular/common';
import Swal from 'sweetalert2';
import { showAlert, showAlertConfirm, showEditCostoModal } from 'src/app/utilities/sweetAlert.util';


declare var $: any;
declare var window;

interface Catalogo {
  codigo: any;
  descripcion: string;
}

interface ItemAsignacion {
  codigo: number;
  maquina: string;
  descripcion: string;
  lote: number;
  observacion: string;
  proceso: string;
  proveedor: string;
  piscina: string;
  estado: string;
  hriniproc: string;
  hrfinproc: string;
  alc_lbsxprocesar: number;
  identifica: string;
  Status: string;
  codstatus: string;
  solicitado: number;
  alc_codigo: number;
  numempleado: number;
  asistencia: number;
  faltas: number;
  atrasos: number;
  permvac: number;
  inifinproc: string;
  alc_retiroSobrante: boolean;
  alc_fechamod: Date;
  codigoProveedor: number;
  codigoPlanta: string;
  rlo_fecha: Date;
  alc_tinasxprocesar: number;
  tinasLiquidadas: number;
  tinasXProcesar: number;
}
  

@Component({
  selector: 'app-frmsolicitudetiqueta',
  templateUrl: './frmsolicitudetiqueta.component.html',
  styleUrl: './frmsolicitudetiqueta.component.scss'
})
export class FrmsolicitudetiquetaComponent implements OnInit {
  private readonly reportViewerUrl = URL_VIEW_REPORT;

  title = 'Solicitud de Etiquetas';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  usuarioEmpresa: string = '';
  
  cmbGrupo?: string;
  cmbMaquina?: string;
  lblJefeLinea: string = '';
  lblTurno: string = '';
  codTurno: string = '';
  codJefeLinea: string = '';
  itemAsignacionSelected: ItemAsignacion | null = null;
  itemDetalleSelected: any = null;
  modalPaso: 'detalle' | 'asigna' = 'detalle';
  modalTransitionClass: 'step-next' | 'step-back' = 'step-next';
  
  cmbTipoEtiqueta?: string;
  fechaEtiqueta: Date | null = null;
  cantidadSolicitada: number = 0;
  observacion: string = '';

  Asignacion: any[] = [];
  Grupos: Catalogo[] = [];
  Maquinas: Catalogo[] = [];
  TiposEtiqueta: Catalogo[] = [
    { codigo: 'CA', descripcion: 'Cajas' },
    { codigo: 'IC', descripcion: 'Import.Cajas' },
    { codigo: 'MA', descripcion: 'Master' },
    { codigo: 'MI', descripcion: 'Master Import' }
  ];
  Detalle: any[] = [];
  DetalleSolVsLiq: any[] = [];
  detalleSolVsLiqChartData: any[] = [];
  totalEtiquetasSolicitadas: number = 0;
  totalEtiquetasLiquidadas: number = 0;
  totalDiferenciaEtiquetas: number = 0;
  porcentajeCumplimiento: number = 0;
  tallasFrecuencia: string[] = [];

  modalReferenceItem: NgbModalRef | undefined;
  
  @ViewChild('GridAsignacion', { static: false }) GridAsignacion: DxDataGridComponent;
  @ViewChild('GridDetalle', { static: false }) GridDetalle: DxDataGridComponent;
  @ViewChild('GridDetalleSolVsLiq', { static: false }) GridDetalleSolVsLiq: DxDataGridComponent;
  @ViewChild('modalSolicitarEtiqueta') modalSolicitarEtiqueta: any;
  @ViewChild('modalSolicitadasVsLiquidadas') modalSolicitadasVsLiquidadas: any;

  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;
  


  public constructor(
      private _service: FrmsolicitudetiquetaService,
      private _notificationService: NotificationService,
      private modalService: NgbModal,
  ) {
    this.loadingVisible = true;
    this.loadingVisible = false;
    
  }


  async ngOnInit() {
    window.home = this;  
    this.onClickNuevo();
    await this.obtieneInfoUsuario();
  }


  async onClickNuevo() {
    this.Asignacion = [];
  }


  async onClickGuardar() {
    this.loadingVisible = true;
    this.loadingVisible = false;
  }

  
  async onClickModalSolicitarEtiqueta(rowData: any) {
    this.limpiarModalSolicitarEtiqueta();
    this.itemAsignacionSelected = rowData;
    if (this.itemAsignacionSelected) {
      const tinasasignadas = this.itemAsignacionSelected.alc_tinasxprocesar ?? 0;
      const tinasLiquidadas = this.itemAsignacionSelected.tinasLiquidadas ?? 0;
      this.itemAsignacionSelected.tinasXProcesar = tinasasignadas - tinasLiquidadas;
    }
    this.loadingVisible = true;
    this.modalPaso = 'detalle';
    this.modalTransitionClass = 'step-next';
    this.modalReferenceItem = await this.modalService.open(this.modalSolicitarEtiqueta, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalSolicitarEtiqueta',
    });
    await this.obtienedetallelote(this.itemAsignacionSelected.codigo, this.itemAsignacionSelected.proceso);
    this.loadingVisible = false;
  }


  async onClickSolicitarEtiqueta(rowData: any) {
    this.limpiarFormSolicitarEtiqueta();
    this.itemDetalleSelected = rowData;
    this.modalTransitionClass = 'step-next';
    this.modalPaso = 'asigna';
    await this.obtienelotgeneradoybloqueado();
    await this.ObtieneCantxgenerar();
  }


  async onClickVerFichaTecnica(rowData: any) {
    const codProducto = rowData?.codproducto;
    if (!codProducto) {
      this._notificationService.warning('No se encontró el código de producto para abrir la ficha técnica');
      return;
    }

    const usuario = this.usuarioEmpresa || localStorage.getItem(varUser) || '';
    if (!usuario) {
      this._notificationService.warning('Se terminó el tiempo de su sesión, volver a ingresar al sistema');
      return;
    }
    const usu = this.encryptLegacy(usuario, 2);
    const rpt = this.encryptLegacy('rpt_RepFicTec', 2);
    const param = `codprod:${codProducto}|idioma:ESP`;
    const targetUrl = `${this.reportViewerUrl}?id=${encodeURIComponent(usu)}&rpt=${encodeURIComponent(rpt)}&Param=${encodeURIComponent(param)}`;
    const popup = window.open('about:blank', '_blank');
    if (!popup) {
      this._notificationService.warning('El navegador bloqueó la ventana emergente de la ficha técnica');
      return;
    }
    popup.location.href = targetUrl;
  }


  async onClickImprimirEtiquetaBalanza(rowData: any) {
    let codproducto = rowData?.codproducto;
    let codtalla = rowData?.codtalla;
    let requerimiento = rowData?.reqProducto ?? 0;
    //let esReproceso = rowData?.esReproceso ?? false;
    let troCodigo = rowData?.troCodigo ?? '';
    let secuencialMP = rowData?.secuencialMP ?? '';
    if (!codproducto || !codtalla ) { // || !troCodigo
      this._notificationService.warning('Faltan datos necesarios para imprimir la etiqueta de balanza');
      return;
    }
    await this.grabarDatosBalanza(
      codproducto.toString(),
      codtalla.toString(),
      requerimiento?.toString() ?? '0',
      troCodigo.toString(),
      secuencialMP?.toString() ?? ''
    );
  }


  onClickRegresarDetalle() {
    this.modalTransitionClass = 'step-back';
    this.modalPaso = 'detalle';
  }


  async onClickSolicitarEtiquetaGrabar() {
    if (!this.itemDetalleSelected) {
      this._notificationService.warning('Debe seleccionar un detalle para continuar');
      return;
    }
    if (!this.cmbTipoEtiqueta) {
      this._notificationService.warning('Debe seleccionar un tipo de etiqueta');
      return;
    }
    if (!this.fechaEtiqueta) {
      this._notificationService.warning('Debe ingresar la fecha de etiqueta');
      return;
    }
    if (!this.cantidadSolicitada || this.cantidadSolicitada <= 0) {
      this._notificationService.warning('La cantidad solicitada debe ser mayor a 0');
      return;
    }

    let resp = await showAlertConfirm('Advertencia',`Está Seguro de Realizar la Solicitud?`,'warning');
    if (resp) {
     await this.SolicitarEtiquetas(); 
    }

  }
  
  

  async SolicitarEtiquetas () {
    this.loadingVisible = true;
    try {
      let esTallaFrecuencia = this.tallasFrecuencia.includes(this.itemDetalleSelected.Talla);
      const resp: ResultWS = await firstValueFrom(
        this._service.solicitaetiquetas(
          this.itemAsignacionSelected.maquina.toString(),
          this.codJefeLinea.toString(),
          this.itemDetalleSelected.codproducto.toString(),
          this.itemAsignacionSelected.proceso.toString(),
          this.itemDetalleSelected.codtalla.toString(),
          this.itemDetalleSelected.codtallavta.toString(),
          this.codTurno.toString(),
          this.cmbGrupo.toString(),
          this.itemAsignacionSelected.lote.toString(),
          this.cmbTipoEtiqueta.toString(),
          this.itemDetalleSelected.CodPedido.toString(),
          this.cantidadSolicitada,
          this.observacion.toString(),
          formatDate(this.fechaEtiqueta ?? new Date(), 'yyyy/MM/dd', 'en-US'),
          this.usuarioEmpresa.toString(),
          esTallaFrecuencia
        )
      );
      const data0 = ((resp.Dt as any)?.Table || []) as any[];
      const data1 = ((resp.Dt as any)?.Table1 || []) as any[];
     
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description, 'error');
        return;
      }
      this.modalReferenceItem?.close('1');
      if (data1.length > 0) {
        await showAlert('', 'Transacción Realizada con Exito', 'warning'); // data1[0].msj
        await this.obtieneLotesPlanificadosXMaquina();
      } else {
        await showAlert('', 'Transacción Realizada con Exito', 'warning'); // data0[0].msj
        await this.obtieneLotesPlanificadosXMaquina();
      }

    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al registrar la solicitud de etiquetas', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }


  async onClickModalSolitadasVsLiquidadas(rowData: any) {
    this.loadingVisible = true;
    this.itemAsignacionSelected = rowData;
    this.DetalleSolVsLiq = [];
    this.actualizarMetricasDetalle();
    this.loadingVisible = true;
    this.modalReferenceItem = await this.modalService.open(this.modalSolicitadasVsLiquidadas, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalSolitadasVsLiquidadas',
    });
    await this.obtieneEtiqSolivsLiqui();
    this.loadingVisible = false;
  }


  onInitializedAsignacion(grid: DxDataGridComponent): void {
    this.GridAsignacion = grid;
  }


  onRowPreparedAsignacion(e) {
    if (e.data) {
      e.rowElement.style.backgroundColor = e.data.codstatus == '0' ? '#FAFAD2' 
        : e.data.codstatus == '1' ? '#D4EFDF' : 'inherit';
    }
  }


  onInitializedDetalle(grid: DxDataGridComponent): void {
    this.GridDetalle = grid;
  }

  
  onRowPreparedDetalle(e) {
    if (e.data) {
      if (e.data.impresionDefault == '1') {
        e.rowElement.style.backgroundColor = '#D4EFDF';
        e.rowElement.style.color = '#333333';
        e.rowElement.style.fontWeight = 'bold';
      } else {
        e.rowElement.style.backgroundColor = 'inherit';
        e.rowElement.style.color = 'inherit';
        e.rowElement.style.fontWeight = 'normal';
      }
    }
  }

  
  onInitializedDetalleSolVsLiq(grid: DxDataGridComponent): void {
    this.GridDetalleSolVsLiq = grid;
  }

  
  actualizarMetricasDetalle() {
    const baseData = (this.DetalleSolVsLiq || []).map((item: any) => ({
      talla: (item?.TallaSolicita ?? '').toString(),
      solicitadas: this.toNumber(item?.EtiquetasSolicitadas),
      liquidadas: this.toNumber(item?.CajasEmpacadas),
      diferencia: this.toNumber(item?.DiferenciadeEtiquetas)
    }));
    this.totalEtiquetasSolicitadas = baseData
      .reduce((acc: number, item: any) => acc + item.solicitadas, 0);
    this.totalEtiquetasLiquidadas = baseData
      .reduce((acc: number, item: any) => acc + item.liquidadas, 0);
    this.totalDiferenciaEtiquetas = baseData
      .reduce((acc: number, item: any) => acc + item.diferencia, 0);

    this.detalleSolVsLiqChartData = baseData.map((item: any) => ({
      ...item,
      porcentajeLiquidadas: this.totalEtiquetasLiquidadas > 0
        ? (item.liquidadas / this.totalEtiquetasLiquidadas) * 100
        : 0
    }));

    const tallasOrdenadas = [...this.detalleSolVsLiqChartData]
      .filter((item: any) => item.porcentajeLiquidadas > 0)
      .sort((a: any, b: any) => b.porcentajeLiquidadas - a.porcentajeLiquidadas);

    this.tallasFrecuencia = [];
    if (tallasOrdenadas.length > 0) {
      this.tallasFrecuencia.push(tallasOrdenadas[0].talla);
    }
    if (tallasOrdenadas.length > 1) {
      const diferenciaTop2 = tallasOrdenadas[0].porcentajeLiquidadas - tallasOrdenadas[1].porcentajeLiquidadas;
      if (diferenciaTop2 <= 20) {
        this.tallasFrecuencia.push(tallasOrdenadas[1].talla);
      }
    }
    console.log('Tallas Frecuencia:', this.tallasFrecuencia);
    this.porcentajeCumplimiento = this.totalEtiquetasSolicitadas > 0
      ? (this.totalEtiquetasLiquidadas / this.totalEtiquetasSolicitadas) * 100
      : 0;
  }

  formatPercentChartLabel = (arg: any) => `${this.toNumber(arg?.value).toFixed(2)}%`;

  formatPercentAndQtyChartLabel = (arg: any) => {
    const percent = this.toNumber(arg?.value).toFixed(2);
    const qty = this.toNumber(arg?.point?.data?.liquidadas).toLocaleString('en-US');
    return `${percent}% (${qty})`;
  };

  customizePercentTooltip = (arg: any) => ({
    text: `${arg.argumentText}: ${this.toNumber(arg.value).toFixed(2)}% | Liquidadas: ${this.toNumber(arg?.point?.data?.liquidadas).toLocaleString('en-US')}`
  });

 
  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    const normalized = value.toString().replace(/,/g, '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  
  
  async onMaquinaChange(idMaquina: string) {
    this.cmbMaquina = idMaquina;
    await this.obtieneLotesPlanificadosXMaquina();
  }


  limpiarModalSolicitarEtiqueta() {
    this.itemAsignacionSelected = null;
    this.Detalle = [];
    this.limpiarFormSolicitarEtiqueta();
  }


  limpiarFormSolicitarEtiqueta() {
    this.itemDetalleSelected = null;
    this.cmbTipoEtiqueta = this.TiposEtiqueta.length > 0 ? this.TiposEtiqueta[0].codigo : undefined;
    this.fechaEtiqueta = new Date();
    this.cantidadSolicitada = 0;
    this.observacion = '';
  }

  async obtieneInfoUsuario() {
    this.loadingVisible = true;
    try {
      const usuario = localStorage.getItem(varUser); // 'WEYANCE';//'AOTERO';//localStorage.getItem(varUser); // 'AMEJILLONE';//'AYRODRIGUE'; //'EBAUTISTA';'BECHEVERRI';'JAFRANCO';'JVALDIVIES';'FRAMIREZ';'SRODRIGUEZ';
      if (!usuario) {
        this._notificationService.warning('Se terminó el tiempo de su sesión, volver a ingresar al sistema');
        return;
      }
      this.usuarioEmpresa = usuario;
      const resp: ResultWS = await firstValueFrom(this._service.obtieneInfoUsuario(usuario));
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description, 'error');
        return;
      }
      const data = ((resp.Dt as any)?.Table || []) as any[];
      if (data.length === 0) {
        return;
      }
      const firstRow = data[0];
      this.lblJefeLinea = `${firstRow.codEmpleado ?? ''} ${firstRow.empleado ?? ''}`.trim();
      this.codTurno = (firstRow.turno ?? '').toString();
      this.lblTurno = this.codTurno === 'D' ? 'Día' : this.codTurno === 'N' ? 'Noche' : '';
      this.codJefeLinea = (firstRow.codEmpleado ?? '').toString();
      this.Grupos = this.mapCatalogoUnico(data, 'codgrupo', 'grupo');
      this.Maquinas = this.mapCatalogoUnico(data, 'cla_codigo', 'cla_descripcion');
      if (!this.cmbGrupo && this.Grupos.length > 0) {
        this.cmbGrupo = this.Grupos[0].codigo;
      }
      if (!this.cmbMaquina && this.Maquinas.length > 0) {
        this.cmbMaquina = this.Maquinas[0].codigo;
      }

      await this.obtieneLotesPlanificadosXMaquina();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener información del usuario', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }


  async grabarDatosBalanza(
    codproducto: string,
    codtalla: string,
    requerimiento: string,
    troCodigo: string,
    secuencialMP: string
  ) {
    const asignacion = this.itemAsignacionSelected;
    if (!asignacion) {
      this._notificationService.warning('Debe seleccionar una asignación antes de imprimir');
      return;
    }
    const usuario = this.usuarioEmpresa || localStorage.getItem(varUser) || '';
    if (!usuario) {
      this._notificationService.warning('Se terminó el tiempo de su sesión, volver a ingresar al sistema');
      return;
    }
    const payload = {
      maquina: (asignacion.maquina ?? this.cmbMaquina ?? '').toString(),
      lote: (asignacion.lote ?? '').toString(),
      jefelinea: (this.codJefeLinea ?? '').toString(),
      tiporomaneo: (troCodigo ?? '').toString(),
      codproveedor: (asignacion.codigoProveedor ?? '').toString(),
      piscina: (asignacion.piscina ?? '').toString(),
      codart: (codproducto ?? '').toString(),
      talla: (codtalla ?? '').toString(),
      secuenlote: secuencialMP === '' ? '0' : secuencialMP,
      numrequerimiento: (requerimiento ?? '0').toString(),
      i_user_aud: usuario,
      i_accion: 'I'
    };

    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(this._service.grabaDatosBalanza2(payload));
      if (!resp.Codigo) {
        this._notificationService.error(resp.Description);
        return;
      }

      const printData = ((resp.Dt as any)?.Table || [])[0];
      if (!printData) {
        this._notificationService.warning('No se recibió configuración de impresión para la balanza');
        return;
      }

      /* const printData = {
        "IP_print": "172.18.210.28",
        "Puerto_Print": 9100,
        "zpl": "^XA \r\n^MNM\r\n^PR6\r\n^JZY\r\n^XB\r\n^XB\r\n^FO200,80^AFN,20,20^FD CARTILLA ^FS\r\n^FO600,70^AFN,80,60^FD A^FS\r\n^FO10,115^AFN,18,18^FD Fec.Creacion: 2026/05/28 17:08^FS\r\n^FO10,145^AFN,20,20^FD ROM.RECHAZO^FS\r\n^FO10,180^AFN,20,20^FD BOD.ORI: ^FS\r\n^FO260,180^AFN,20,20^FD PLANTA^FS\r\n^FO10,215^AFN,20,20^FD BOD.DES: ^FS\r\n^FO260,215^AFN,20,20^FD PLNT-DESCABEZADO^FS\r\n^FO10,250^AFN,20,20^FD #Req: ^FS\r\n^FO260,250^AFN,20,20^FD 0^FS\r\n^FO100,310^ADN,11,7^BCN,150,Y,Y,N^FD00000000000000099921^FS\r\n^FO10,475^AFN,20,20^FD LOTE: ^FS\r\n^FO80,475^AFN,60,60^FD  197144^FS\r\n^FO10,530^AFN,20,20^FD PROV: ^FS\r\n^FO180,530^AFN,18,18^FD LANGOSTINOS DEL PACIFICO LANPAC CIA LTDA(Farm ASC)^FS\r\n^FO10,570^AFN,20,20^FD PISCINA: ^FS\r\n^FO260,570^AFN,20,20^FD 6^FS\r\n^FO10,610^AFN,30,30^FD PROD: ^FS\r\n^FO180,610^AFN,28,28^FD 2630 - RECHAZO^FS\r\n^FO10,650^AFN,30,30^FD TALLA: ^FS\r\n^FO250,650^AFN,30,30^FD S/TALLA^FS\r\n^FO10,690^AFN,30,30^FD SEC.MP: 0^FS\r\n^FO10,730^AFN,30,30^FD MAQ: ^FS\r\n^FO290,730^AFN,18,18^FD C5-MAQ.BALZO 9500 LB/HR^FS\r\n^FO10,765^AFN,30,30^FD J.LIN: ^FS\r\n^FO290,765^AFN,18,18^FD 16421^FS\r\n^PQ1\r\n \r\n^PR6\r\n^XZ\r\n ",
        "Cantidad": 1
      } */

      const resp2: ResultReportes = await firstValueFrom(this._service.imprimirEtiquetaBalanza(printData.IP_print, printData.Puerto_Print, printData.zpl));
      if (!resp2.Codigo) {
        await showAlert('Error', resp2.Description ?? 'Error al grabar datos para balanza', 'error');
        return;
      }
      await showAlert('Completo', resp2.Description, 'success');
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al grabar datos para balanza', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }
  

  async obtienelotgeneradoybloqueado () {
    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(
        this._service.Obtienegeneradoybloqueado(
          this.itemAsignacionSelected.lote.toString(),
          this.itemDetalleSelected.codproducto.toString(),
          this.itemDetalleSelected.Talla.toString(),
          this.itemAsignacionSelected.proceso.toString(),
          this.itemDetalleSelected.CodPedido.toString(),
          this.itemAsignacionSelected.maquina.toString()
        )
      );
      const data0 = ((resp.Dt as any)?.Table || []) as any[];
      const data1 = ((resp.Dt as any)?.Table1 || []) as any[];
      if (data0.length > 0) {
        this.itemDetalleSelected.CantGenProducto = data0[0].CantGenProducto;
        this.itemDetalleSelected.cantSolicitada = data0[0].CantGen;
      }
      if (data1.length > 0) {
        this.itemDetalleSelected.bloqueado = data1[0].bloqueado;
      }
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener detalle del lote', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }


  async ObtieneCantxgenerar() {
    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(
        this._service.Obtienecantxgenerar(
          this.itemDetalleSelected.CodPedido.toString(),
          this.itemDetalleSelected.codproducto.toString(),
          this.itemDetalleSelected.codtalla.toString(),
          this.itemAsignacionSelected.proceso.toString(),
        )
      );
      const data0 = ((resp.Dt as any)?.Table || []) as any[];
      if (data0.length > 0) {
        let cantxgen = parseInt(data0[0].cantxgenerar);
        if (this.itemDetalleSelected?.CantMax >= cantxgen) {
          this.itemDetalleSelected.cantPorGenerar = cantxgen;
        } else {
          this.itemDetalleSelected.cantPorGenerar = this.itemDetalleSelected?.CantMax ?? 0;
        }
      }
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener detalle del lote', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }


  async obtieneEtiqSolivsLiqui() {
    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(
        this._service.ObtieneEtiqSolicitaVsLiquidada(
          this.itemAsignacionSelected.lote.toString(),
          this.cmbMaquina.toString(),
          this.codTurno.toString()
        )
      );
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description ?? 'Error al obtener detalle del lote', 'error');
        this.DetalleSolVsLiq = [];
        this.actualizarMetricasDetalle();
        return;
      }
      const data = ((resp.Dt as any)?.Table || []) as any[];
      this.DetalleSolVsLiq = data;
      this.actualizarMetricasDetalle();
      this.GridDetalleSolVsLiq?.instance?.refresh();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener detalle del lote', 'error');
      this.DetalleSolVsLiq = [];
      this.actualizarMetricasDetalle();
    } finally {
      this.loadingVisible = false;
    }
  }


  async obtieneLotesPlanificadosXMaquina() {
    if (!this.cmbMaquina || !this.usuarioEmpresa || !this.codTurno) {
      this.Asignacion = [];
      return;
    }
    this.loadingVisible = true;

    try {
      const resp: ResultWS = await firstValueFrom(
        this._service.obtieneLotesPlanificadosXMaquina(
          this.cmbMaquina.toString(),
          this.usuarioEmpresa,
          this.codTurno
        )
      );
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description ?? 'Error al obtener lotes planificados por máquina', 'error');
        this.Asignacion = [];
        return;
      }
      const data = ((resp.Dt as any)?.Table || []) as any[];
      this.Asignacion = data;
      this.GridAsignacion?.instance?.refresh();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener lotes planificados por máquina', 'error');
      this.Asignacion = [];
    } finally {
      this.loadingVisible = false;
    }
  }

  
  async obtienedetallelote (secuencia: number, proceso: string) {
    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(
        this._service.obtieneDetalleLote(secuencia.toString(), proceso)
      );
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description ?? 'Error al obtener detalle del lote', 'error');
        this.Detalle = [];
        return;
      }
      const data = ((resp.Dt as any)?.Table || []) as any[];
      this.Detalle = data;
      this.GridDetalle?.instance?.refresh();

      // Actualizar el detalle de etiquetas solicitadas vs liquidadas para obtener las etiquetas con mayor frecuencia
      this.DetalleSolVsLiq = [];
      await this.obtieneEtiqSolivsLiqui();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener detalle del lote', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }
  

  mapCatalogoUnico(data: any[], keyCodigo: string, keyDescripcion: string): Catalogo[] {
    const seen = new Set<string>();
    const result: Catalogo[] = [];
    data.forEach((item) => {
      const codigo = item[keyCodigo];
      const descripcion = item[keyDescripcion];
      if (codigo === null || codigo === undefined) {
        return;
      }
      const uniqueKey = codigo.toString();
      if (seen.has(uniqueKey)) {
        return;
      }
      seen.add(uniqueKey);
      result.push({ codigo, descripcion: (descripcion ?? '').toString() });
    });
    return result;
  }


  encryptLegacy(cadena: string, key: number): string {
    let encriptado = '';
    const cad = (cadena ?? '').trim();
    for (let i = 0; i < cad.length; i++) {
      const caracter = this.asc(cad.substring(i, i + 1)) + key;
      encriptado += String.fromCharCode(caracter);
    }
    return encriptado;
  }


  asc(cadena: string): number {
    return cadena.substring(0, 1).charCodeAt(0);
  }


  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }

  
}
