import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { firstValueFrom } from 'rxjs';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';
import { NotificationService } from 'src/app/shared/notify.service';
import { URL_VIEW_REPORT, varUser } from 'src/app/config/url.servicios';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { formatDate } from '@angular/common';
import { showAlert, showAlertConfirm, showEditCostoModal } from 'src/app/utilities/sweetAlert.util';
import { FrminiciofinloteService } from './frminiciofinlote.service';
import { FrmsolicitudetiquetaService } from '../frmsolicitudetiqueta/frmsolicitudetiqueta.service';

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
  selector: 'app-frminiciofinlote',
  templateUrl: './frminiciofinlote.component.html',
  styleUrl: './frminiciofinlote.component.scss'
})
export class FrminiciofinloteComponent implements OnInit {

  title = 'Inicio / Termino Proceso';
  loadingVisible: boolean = false;
  usuarioEmpresa: string = '';

  cmbGrupo?: string;
  cmbMaquina?: string;
  lblJefeLinea: string = '';
  lblTurno: string = '';
  codTurno: string = '';
  codJefeLinea: string = '';
  itemAsignacionSelected: ItemAsignacion | null = null;

  cmbMotivos?: string;
  chkRetiroMatLotAnt: boolean = false;
  librasProc: number = 0;
  observacion: string = '';

  Asignacion: any[] = [];
  Grupos: Catalogo[] = [];
  Maquinas: Catalogo[] = [];
  TiposMotivos: Catalogo[] = [];
  DetalleSolVsLiq: any[] = [];
  detalleSolVsLiqChartData: any[] = [];
  totalEtiquetasSolicitadas: number = 0;
  totalEtiquetasLiquidadas: number = 0;
  totalDiferenciaEtiquetas: number = 0;
  porcentajeCumplimiento: number = 0;

  popupInfoVisible:boolean = false;
  popupInfoVisible2:boolean = false;

  public constructor(
        private _service: FrminiciofinloteService,
        private _serviceSolicitudEtiqueta: FrmsolicitudetiquetaService,
        private _notificationService: NotificationService,
        private modalService: NgbModal,
  ) {
    this.loadingVisible = true;
    this.loadingVisible = false;
    
  }
  
  modalReferenceItem: NgbModalRef | undefined;
  @ViewChild('GridAsignacion', { static: false }) GridAsignacion: DxDataGridComponent;
  @ViewChild('GridDetalleSolVsLiq', { static: false }) GridDetalleSolVsLiq: DxDataGridComponent;
  @ViewChild('modalSolicitarEtiqueta') modalSolicitarEtiqueta: any;


  async ngOnInit() {
    window.home = this;  
    // this.onClickNuevo();
    await this.obtieneInfoUsuario();
    await this.obtienelistadomotivos();
  }

  
  toggleInformacion(){
    this.popupInfoVisible = !this.popupInfoVisible;
  }
  

  toggleInformacion2(){
    this.popupInfoVisible2 = !this.popupInfoVisible2;
  }
  
  
  async onClickModalSolicitarEtiqueta(rowData: any) {
    this.limpiarModalSolicitarEtiqueta();
    this.itemAsignacionSelected = rowData;
    console.log('itemAsignacionSelected:', this.itemAsignacionSelected);
    this.DetalleSolVsLiq = [];
    this.actualizarMetricasDetalle();
    this.loadingVisible = true;
    this.modalReferenceItem = await this.modalService.open(this.modalSolicitarEtiqueta, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalSolicitarEtiqueta',
    });
    // await this.obtienedetallelote(this.itemAsignacionSelected.codigo, this.itemAsignacionSelected.proceso);
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

  
  onInitializedDetalleSolVsLiq(grid: DxDataGridComponent): void {
    this.GridDetalleSolVsLiq = grid;
  }

  actualizarMetricasDetalle() {
    this.detalleSolVsLiqChartData = (this.DetalleSolVsLiq || []).map((item: any) => ({
      talla: (item?.TallaSolicita ?? '').toString(),
      solicitadas: this.toNumber(item?.EtiquetasSolicitadas),
      liquidadas: this.toNumber(item?.CajasEmpacadas),
      diferencia: this.toNumber(item?.DiferenciadeEtiquetas)
    }));

    this.totalEtiquetasSolicitadas = this.detalleSolVsLiqChartData
      .reduce((acc: number, item: any) => acc + item.solicitadas, 0);
    this.totalEtiquetasLiquidadas = this.detalleSolVsLiqChartData
      .reduce((acc: number, item: any) => acc + item.liquidadas, 0);
    this.totalDiferenciaEtiquetas = this.detalleSolVsLiqChartData
      .reduce((acc: number, item: any) => acc + item.diferencia, 0);
    this.porcentajeCumplimiento = this.totalEtiquetasSolicitadas > 0
      ? (this.totalEtiquetasLiquidadas / this.totalEtiquetasSolicitadas) * 100
      : 0;
  }

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

  async onChkRetiroMatLotAntChange(event: any) {
    if (!this.chkRetiroMatLotAnt) {
      this.cmbMotivos = this.TiposMotivos.length > 0 ? this.TiposMotivos[0].codigo : undefined;
    }
  }

  async btn_proceso_Click(tipoProc: 'INI' | 'FIN'): Promise<boolean> {
    if (tipoProc === 'FIN') {
      const librasVacias = !this.librasProc || this.librasProc <= 0;
      const observacionVacia = !(this.observacion ?? '').trim();
      if (librasVacias && observacionVacia) {
        await showAlert('Alerta', 'Faltan Datos por Registrar. Verifique', 'warning');
        return false;
      }
    }

    const confirmar = await showAlertConfirm('Confirmación', 'Esta Seguro de Realizar la Transacción?', 'question');
    if (!confirmar) {
      return false;
    }

    await this.InicioFinProceso(tipoProc);
    return true;
  }


  async InicioFinProceso(tipoProc: 'INI' | 'FIN') {
    if (!this.itemAsignacionSelected) {
      await showAlert('Alerta', 'No existe una asignación seleccionada', 'warning');
      return;
    }

    this.loadingVisible = true;
    try {
      const item = this.itemAsignacionSelected;
      const resp: ResultWS = await firstValueFrom(
        this._service.iniciofinproceso({
          tipo: tipoProc,
          codasignacion: (item.alc_codigo ?? '').toString(),
          numemple: (item.numempleado ?? '').toString(),
          asistencia: (item.asistencia ?? '').toString(),
          faltas: (item.faltas ?? '').toString(),
          atrasos: (item.atrasos ?? '').toString(),
          permvac: (item.permvac ?? '').toString(),
          usuario: (this.usuarioEmpresa ?? '').toString(),
          lbsproc: (this.librasProc ?? '').toString(),
          observacion: (this.observacion ?? '').toString(),
          maquina: (item.maquina ?? '').toString(),
          lote: (item.lote ?? '').toString(),
          retiraMatLot: !!this.chkRetiroMatLotAnt,
          motivoretiro: this.chkRetiroMatLotAnt ? (this.cmbMotivos ?? '').toString() : null
        })
      );

      const data0 = ((resp.Dt as any)?.Table || []) as any[];
      const data1 = ((resp.Dt as any)?.Table1 || []) as any[];
      const mensaje = (data1[0]?.msj ?? data0[0]?.msj ?? resp.Description ?? '').toString();

      if (!resp.Codigo) {
        await showAlert('Error', mensaje || 'No se pudo realizar la transacción', 'error');
        return;
      }

      this.modalReferenceItem?.close('1');
      await showAlert('Mensaje', mensaje || 'Transacción realizada con éxito', 'success');
      await this.obtieneLotesPlanificadosXMaquina();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al realizar inicio/fin de proceso', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }
  


  limpiarModalSolicitarEtiqueta() {
    this.itemAsignacionSelected = null;
    // this.Detalle = [];
  }


  async obtieneInfoUsuario() {
    this.loadingVisible = true;
    try {
      const usuario = localStorage.getItem(varUser); // 'WEYANCE';//'WEYANCE','AMEJILLONE';//'AYRODRIGUE'; //'EBAUTISTA';'BECHEVERRI';'JAFRANCO';'JVALDIVIES';'FRAMIREZ';'SRODRIGUEZ';
      if (!usuario) {
        this._notificationService.warning('Se terminó el tiempo de su sesión, volver a ingresar al sistema');
        return;
      }
      this.usuarioEmpresa = usuario;
      const resp: ResultWS = await firstValueFrom(this._serviceSolicitudEtiqueta.obtieneInfoUsuario(usuario));
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

  async obtieneEtiqSolivsLiqui() {
    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(
        this._serviceSolicitudEtiqueta.ObtieneEtiqSolicitaVsLiquidada(
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
        this._serviceSolicitudEtiqueta.obtieneLotesPlanificadosXMaquina(
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

  async obtienelistadomotivos() {
    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(this._service.obtieneListadoMotivos());
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description ?? 'Error al obtener listado de motivos', 'error');
        this.TiposMotivos = [];
        this.cmbMotivos = undefined;
        return;
      }

      const data = ((resp.Dt as any)?.Table || []) as any[];
      this.TiposMotivos = this.mapCatalogoUnico(data, 'codigo', 'descripcion');
      this.cmbMotivos = this.TiposMotivos.length > 0 ? this.TiposMotivos[0].codigo : undefined;
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener listado de motivos', 'error');
      this.TiposMotivos = [];
      this.cmbMotivos = undefined;
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


}
