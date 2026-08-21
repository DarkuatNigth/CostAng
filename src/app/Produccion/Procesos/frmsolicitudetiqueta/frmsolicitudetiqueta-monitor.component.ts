import { Component, OnInit, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import { FrmsolicitudetiquetaService } from './frmsolicitudetiqueta.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

interface Catalogo {
  codigo: any;
  descripcion: string;
}

interface ItemAsignacion {
  lote: number | string;
  turno: string;
  turnoDescripcion: string;
  estadoLote: string;
  proceso: string;
  proveedor: string;
  piscina: string;
  totalAsignaciones: number;
  maquinasAsignadas: string;
  lbsxprocesar: number;
  tinasAsignadas: number;
  solicitado: number;
  fechaLote: string;
  fechaUltimaAsignacion: string;
  gramaje: string;
  comparativa?: MonitorComparativaLote;
}

interface ResumenLoteActual {
  lote: string;
  talla: string;
  etiquetasSolicitadas: number;
  cajasLiquidadas: number;
  diferenciaEtiquetas: number;
}

interface ResumenLoteMaquinaActual {
  lote: string;
  turno: string;
  maquina: string;
  cla_descripcion: string;
  codtalla: string;
  talla: string;
  etiquetasSolicitadas: number;
  cajasLiquidadas: number;
  diferenciaEtiquetas: number;
}

interface ResumenLoteMaquinaModal {
  lote: string;
  maquina: string;
  descripcionMaquina: string;
  totalSolicitadas: number;
  totalLiquidadas: number;
  totalDiferenciaEtiquetas: number;
  porcentajeCumplimiento: number;
  detalleTallas: {
    codtalla: string;
    talla: string;
    etiquetasSolicitadas: number;
    cajasLiquidadas: number;
    diferenciaEtiquetas: number;
  }[];
}

interface ResumenHistoricoLote {
  lote: string;
  tal_descri: string;
  porcentaje: number;
  orden: number;
}

interface MonitorComparativaLote {
  distribucionActual: {
    talla: string;
    solicitadas: number;
    liquidadas: number;
    diferencia: number;
    porcentajeLiquidadas: number;
  }[];
  distribucionHistorica: { tal_descri: string; porcentaje: number; orden: number }[];
  resumenActual: {
    totalSolicitadas: number;
    totalLiquidadas: number;
    porcentajeCumplimiento: number;
  };
}

@Component({
  selector: 'app-frmsolicitudetiqueta-monitor',
  templateUrl: './frmsolicitudetiqueta-monitor.component.html',
  styleUrl: './frmsolicitudetiqueta-monitor.component.scss'
})
export class FrmsolicitudetiquetaMonitorComponent implements OnInit {
  title = 'Monitor Liquidación de Etiquetas (Entero): Liquidacion Actual vs Historico';
  loadingVisible = false;

  usuarioEmpresa = '';
  cmbGrupo?: string;
  cmbMaquina?: string;
  codTurno = '';
  codJefeLinea = '';
  mostrarLotesCerrados = false;
  puedeVerFiltroLotesCerrados = false;
  lblJefeLinea = '';
  lblTurno = '';

  Grupos: Catalogo[] = [];
  Maquinas: Catalogo[] = [];
  Turnos: Catalogo[] = [
    { codigo: 'D', descripcion: 'Día' },
    { codigo: 'N', descripcion: 'Noche' },
  ];
  Asignacion: ItemAsignacion[] = [];
  resumenActualPorLote: ResumenLoteActual[] = [];
  resumenActualPorLoteMaquina: ResumenLoteMaquinaActual[] = [];
  resumenActualPorLoteMaquinaModal: ResumenLoteMaquinaModal[] = [];
  resumenHistoricoPorLote: ResumenHistoricoLote[] = [];
  comparativaPorLote: Record<string, MonitorComparativaLote> = {};

  coloresDistribucionHistorica: string[] = ['#0d6efd', '#20c997', '#fd7e14'];

  modalReferenceItem: NgbModalRef | undefined;

  @ViewChild('GridAsignacionMonitor', { static: false }) GridAsignacionMonitor: DxDataGridComponent;
  @ViewChild('GridDetailByLoteMaquina', { static: false }) GridDetailByLoteMaquina: DxDataGridComponent;
  @ViewChild('modalDetailByLoteMaquina') modalDetailByLoteMaquina: any;

  constructor(
    private service: FrmsolicitudetiquetaService,
    private modalService: NgbModal
  ) {}

  async ngOnInit() {
    await this.obtieneInfoUsuario();
    this.modalReferenceItem = await this.modalService.open(this.modalDetailByLoteMaquina, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalDetailByLoteMaquina',
    });
    this.modalReferenceItem.close();
  }

  async onMaquinaChange(idMaquina: string) {
    this.cmbMaquina = idMaquina;
    await this.obtieneResumenLiquidacionEtiquetasSolicitadas();
  }

  async onFiltroLotesCerradosChange(valor: boolean) {
    this.mostrarLotesCerrados = !!valor;
    await this.obtieneResumenLiquidacionEtiquetasSolicitadas();
  }

  async onTurnoChange(turno: string) {
    this.codTurno = (turno ?? '').toString();
    this.lblTurno = this.obtenerDescripcionTurno(this.codTurno);
    await this.obtieneResumenLiquidacionEtiquetasSolicitadas();
  }

  async onRefrescar() {
    await this.obtieneResumenLiquidacionEtiquetasSolicitadas();
  }

  onInitializedAsignacion(grid: DxDataGridComponent): void {
    this.GridAsignacionMonitor = grid;
  }

  onInitializedDetailByLoteMaquina(grid: DxDataGridComponent): void {
    this.GridDetailByLoteMaquina = grid;
  }

  onRowPreparedAsignacion(e: any) {
    if (e.data) {
      e.rowElement.style.backgroundColor = e.data.codstatus == '0' ? '#FAFAD2'
        : e.data.codstatus == '1' ? '#D4EFDF' : 'inherit';
    }
  }

  onRowPreparedDetailByLoteMaquina(e: any) {
    if (e.rowType !== 'data' || !e.data) {
      return;
    }

    e.rowElement.style.backgroundColor = '#eef6ff';
    e.rowElement.style.borderLeft = '4px solid #d1d9e6';
  }

  itemAsignacionSelected: ItemAsignacion | null = null;
  async onClickdetailByMaquina(rowData: any) {
    const data = rowData as ItemAsignacion;
    console.log('Detalle por Lote - Máquina:', data);
    this.itemAsignacionSelected = data;
    this.resumenActualPorLoteMaquinaModal = this.construirResumenPorMaquinaModal(data?.lote);
    this.modalReferenceItem = this.modalService.open(this.modalDetailByLoteMaquina, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalDetailByLoteMaquina',
    });
  }

  expandirTodosLosLotes() {
    const instance = this.GridAsignacionMonitor?.instance;
    if (!instance) {
      return;
    }

    this.Asignacion.forEach((item) => {
      instance.expandRow(item.lote);
    });
  }

  contraerTodosLosLotes() {
    const instance = this.GridAsignacionMonitor?.instance;
    if (!instance) {
      return;
    }

    this.Asignacion.forEach((item) => {
      instance.collapseRow(item.lote);
    });
  }

  async obtieneInfoUsuario() {
    this.loadingVisible = true;
    try {
      const usuario = localStorage.getItem(varUser);
      if (!usuario) {
        return;
      }

      this.usuarioEmpresa = usuario;
      const resp: ResultWS = await firstValueFrom(this.service.obtieneInfoUsuario(usuario));
      if (!resp.Codigo) {
        await showAlert('Error', resp.Description, 'error');
        return;
      }

      const data = ((resp.Dt as any)?.Table || []) as any[];
      if (data.length === 0) {
        return;
      }

      const firstRow = data[0];
      this.puedeVerFiltroLotesCerrados = Number(firstRow.cgo_codigo) === 10 || Number(firstRow.cgo_codigo) ===220;
      if (!this.puedeVerFiltroLotesCerrados) {
        this.mostrarLotesCerrados = false;
      }

      this.lblJefeLinea = `${firstRow.codEmpleado ?? ''} ${firstRow.empleado ?? ''}`.trim();
      this.codTurno = (firstRow.turno ?? '').toString();
      this.lblTurno = this.obtenerDescripcionTurno(this.codTurno);
      this.codJefeLinea = (firstRow.codEmpleado ?? '').toString();

      this.Grupos = this.mapCatalogoUnico(data, 'codgrupo', 'grupo');
      this.Maquinas = this.mapCatalogoUnico(data, 'cla_codigo', 'cla_descripcion');

      if (!this.cmbGrupo && this.Grupos.length > 0) {
        this.cmbGrupo = this.Grupos[0].codigo;
      }
      if (!this.cmbMaquina && this.Maquinas.length > 0) {
        this.cmbMaquina = this.Maquinas[0].codigo;
      }

      await this.obtieneResumenLiquidacionEtiquetasSolicitadas();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener informacion del usuario', 'error');
    } finally {
      this.loadingVisible = false;
    }
  }

  async obtieneResumenLiquidacionEtiquetasSolicitadas() {
    if (!this.usuarioEmpresa || !this.codTurno) {
      this.Asignacion = [];
      this.resumenActualPorLote = [];
      this.resumenActualPorLoteMaquina = [];
      this.resumenActualPorLoteMaquinaModal = [];
      this.resumenHistoricoPorLote = [];
      this.comparativaPorLote = {};
      return;
    }

    this.loadingVisible = true;
    try {
      const resp: ResultWS = await firstValueFrom(
        this.service.obtieneResumenLiquidacionEtiquetasSolicitadas(
          this.usuarioEmpresa,
          this.codTurno,
          this.mostrarLotesCerrados
        )
      );

      if (!resp.Codigo) {
        await showAlert('Error', resp.Description ?? 'Error al obtener resumen de liquidacion de etiquetas', 'error');
        this.Asignacion = [];
        this.resumenActualPorLote = [];
        this.resumenActualPorLoteMaquina = [];
        this.resumenActualPorLoteMaquinaModal = [];
        this.resumenHistoricoPorLote = [];
        this.comparativaPorLote = {};
        return;
      }

      const data = ((resp.Dt as any)?.Table || []) as any[];
      const data1 = ((resp.Dt as any)?.Table1 || []) as any[];
      const data2 = ((resp.Dt as any)?.Table2 || []) as any[];
      const data3 = ((resp.Dt as any)?.Table3 || []) as any[];

      this.Asignacion = data.map((item: any) => ({
        lote: item?.lote,
        turno: (item?.turno ?? '').toString(),
        turnoDescripcion: (item?.turnoDescripcion ?? '').toString(),
        estadoLote: (item?.estadoLote ?? '').toString(),
        proceso: (item?.proceso ?? '').toString(),
        proveedor: (item?.proveedor ?? '').toString(),
        piscina: (item?.piscina ?? '').toString(),
        totalAsignaciones: this.toNumber(item?.totalAsignaciones),
        maquinasAsignadas: (item?.maquinasAsignadas ?? '').toString(),
        lbsxprocesar: this.toNumber(item?.lbsxprocesar),
        tinasAsignadas: this.toNumber(item?.tinasAsignadas),
        solicitado: this.toNumber(item?.solicitado),
        fechaLote: (item?.fechaLote ?? '').toString(),
        fechaUltimaAsignacion: (item?.fechaUltimaAsignacion ?? '').toString(),
        gramaje: (item?.gramaje ?? '').toString()
      }));

      this.resumenActualPorLote = data1.map((item: any) => ({
        lote: (item?.lote ?? '').toString(),
        talla: (item?.talla ?? item?.tal_descri ?? '').toString(),
        etiquetasSolicitadas: this.toNumber(item?.etiquetasSolicitadas ?? item?.EtiquetasSolicitadas),
        cajasLiquidadas: this.toNumber(item?.cajasLiquidadas ?? item?.CajasEmpacadas ?? item?.EtiquetasLiquidadas),
        diferenciaEtiquetas: this.toNumber(item?.diferenciaEtiquetas ?? item?.DiferenciadeEtiquetas)
      }));

      this.resumenHistoricoPorLote = data2.map((item: any) => ({
        lote: (item?.lote ?? '').toString(),
        tal_descri: (item?.tal_descri ?? '').toString(),
        porcentaje: this.toNumber(item?.porcentaje),
        orden: this.toNumber(item?.orden)
      }));

      this.resumenActualPorLoteMaquina = data3.map((item: any) => ({
        lote: (item?.lote ?? '').toString(),
        turno: (item?.turno ?? '').toString(),
        maquina: (item?.maquina ?? '').toString(),
        cla_descripcion: (item?.cla_descripcion ?? '').toString(),
        codtalla: (item?.codtalla ?? '').toString(),
        talla: (item?.talla ?? item?.tal_descri ?? '').toString(),
        etiquetasSolicitadas: this.toNumber(item?.etiquetasSolicitadas ?? item?.EtiquetasSolicitadas),
        cajasLiquidadas: this.toNumber(item?.cajasLiquidadas ?? item?.CajasEmpacadas ?? item?.EtiquetasLiquidadas),
        diferenciaEtiquetas: this.toNumber(item?.diferenciaEtiquetas ?? item?.DiferenciadeEtiquetas)
      }));



      this.construirComparativaPorLote();
      this.Asignacion = this.Asignacion.map((item) => {
        const loteKey = this.normalizarLote(item.lote);
        return {
          ...item,
          comparativa: this.comparativaPorLote[loteKey] ?? {
            distribucionActual: [],
            distribucionHistorica: [],
            resumenActual: {
              totalSolicitadas: 0,
              totalLiquidadas: 0,
              porcentajeCumplimiento: 0
            }
          }
        };
      });

      this.GridAsignacionMonitor?.instance?.refresh();
    } catch (error: any) {
      await showAlert('Error', error?.message ?? 'Error al obtener resumen de liquidacion de etiquetas', 'error');
      this.Asignacion = [];
      this.resumenActualPorLote = [];
      this.resumenActualPorLoteMaquina = [];
      this.resumenActualPorLoteMaquinaModal = [];
      this.resumenHistoricoPorLote = [];
      this.comparativaPorLote = {};
    } finally {
      this.loadingVisible = false;
    }
  }

  private construirResumenPorMaquinaModal(lote: string | number | undefined): ResumenLoteMaquinaModal[] {
    const loteKey = this.normalizarLote(lote);
    if (!loteKey) {
      return [];
    }

    const rows = this.resumenActualPorLoteMaquina
      .filter((item) => this.normalizarLote(item.lote) === loteKey);

    const grouped = new Map<string, ResumenLoteMaquinaModal>();

    rows.forEach((row) => {
      const key = `${row.maquina}|${row.cla_descripcion}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          lote: loteKey,
          maquina: row.maquina,
          descripcionMaquina: row.cla_descripcion,
          totalSolicitadas: 0,
          totalLiquidadas: 0,
          totalDiferenciaEtiquetas: 0,
          porcentajeCumplimiento: 0,
          detalleTallas: []
        });
      }

      const acc = grouped.get(key)!;
      acc.totalSolicitadas += row.etiquetasSolicitadas;
      acc.totalLiquidadas += row.cajasLiquidadas;
      acc.totalDiferenciaEtiquetas += row.diferenciaEtiquetas;
      acc.detalleTallas.push({
        codtalla: row.codtalla,
        talla: row.talla,
        etiquetasSolicitadas: row.etiquetasSolicitadas,
        cajasLiquidadas: row.cajasLiquidadas,
        diferenciaEtiquetas: row.diferenciaEtiquetas
      });
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        porcentajeCumplimiento: item.totalSolicitadas > 0
          ? (item.totalLiquidadas / item.totalSolicitadas) * 100
          : 0,
        detalleTallas: [...item.detalleTallas].sort((a, b) => a.talla.localeCompare(b.talla))
      }))
      .sort((a, b) => a.descripcionMaquina.localeCompare(b.descripcionMaquina));
  }

  private construirComparativaPorLote() {
    const actualPorLote = new Map<string, ResumenLoteActual[]>();
    this.resumenActualPorLote.forEach((item) => {
      const loteKey = this.normalizarLote(item.lote);
      if (!loteKey) {
        return;
      }
      if (!actualPorLote.has(loteKey)) {
        actualPorLote.set(loteKey, []);
      }
      actualPorLote.get(loteKey)?.push(item);
    });

    const historicoPorLote = new Map<string, { tal_descri: string; porcentaje: number; orden: number }[]>();
    this.resumenHistoricoPorLote.forEach((item) => {
      const loteKey = this.normalizarLote(item.lote);
      if (!loteKey) {
        return;
      }

      if (!historicoPorLote.has(loteKey)) {
        historicoPorLote.set(loteKey, []);
      }

      historicoPorLote.get(loteKey)?.push({
        tal_descri: item.tal_descri,
        porcentaje: item.porcentaje,
        orden: item.orden
      });
    });

    const comparativas: Record<string, MonitorComparativaLote> = {};
    this.Asignacion.forEach((item) => {
      const loteKey = this.normalizarLote(item.lote);
      if (!loteKey) {
        return;
      }

      const actual = actualPorLote.get(loteKey) ?? [];
      const totalSolicitadas = actual.reduce((acc, row) => acc + row.etiquetasSolicitadas, 0);
      const totalLiquidadas = actual.reduce((acc, row) => acc + row.cajasLiquidadas, 0);

      const distribucionActual = actual.map((row) => ({
        talla: row.talla,
        solicitadas: row.etiquetasSolicitadas,
        liquidadas: row.cajasLiquidadas,
        diferencia: row.diferenciaEtiquetas,
        porcentajeLiquidadas: totalLiquidadas > 0
          ? (row.cajasLiquidadas / totalLiquidadas) * 100
          : 0
      }));

      const distribucionHistorica = (historicoPorLote.get(loteKey) ?? [])
        .map((hist) => ({
          tal_descri: hist.tal_descri,
          porcentaje: hist.porcentaje,
          orden: hist.orden
        }))
        .sort((a, b) => a.orden - b.orden);

      comparativas[loteKey] = {
        distribucionActual,
        distribucionHistorica,
        resumenActual: {
          totalSolicitadas,
          totalLiquidadas,
          porcentajeCumplimiento: totalSolicitadas > 0
            ? (totalLiquidadas / totalSolicitadas) * 100
            : 0
        }
      };
    });

    this.comparativaPorLote = comparativas;
  }


  private normalizarLote(lote: string | number | null | undefined): string {
    return (lote ?? '').toString().trim();
  }

  private mapTurnos(data: any[]): Catalogo[] {
    const seen = new Set<string>();
    const result: Catalogo[] = [];
    data.forEach((item) => {
      const codigo = (item?.turno ?? '').toString().trim();
      if (!codigo || seen.has(codigo)) {
        return;
      }
      seen.add(codigo);
      result.push({
        codigo,
        descripcion: this.obtenerDescripcionTurno(codigo)
      });
    });

    if (result.length === 0) {
      result.push({ codigo: 'D', descripcion: 'Dia' });
      result.push({ codigo: 'N', descripcion: 'Noche' });
    }

    return result;
  }

  private obtenerDescripcionTurno(turno: string): string {
    const value = (turno ?? '').toString().trim().toUpperCase();
    if (value === 'D') {
      return 'Dia';
    }
    if (value === 'N') {
      return 'Noche';
    }
    return value;
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

  formatPercentChartLabel = (arg: any) => `${this.toNumber(arg?.value).toFixed(2)}%`;

  formatPercentAndQtyChartLabel = (arg: any) => {
    const percent = this.toNumber(arg?.value).toFixed(2);
    const qty = this.toNumber(arg?.point?.data?.liquidadas).toLocaleString('en-US');
    return `${percent}% (${qty})`;
  };

  customizePercentTooltip = (arg: any) => ({
    text: `${arg.argumentText}: ${this.toNumber(arg.value).toFixed(2)}% | Liquidadas: ${this.toNumber(arg?.point?.data?.liquidadas).toLocaleString('en-US')}`
  });

  customizeDistribucionTooltip = (arg: any) => ({
    text: `${arg.argumentText}: ${this.toNumber(arg?.value).toFixed(2)}%`
  });

  formatDistribucionLabel = (arg: any) => `${arg.argumentText}: ${this.toNumber(arg?.value).toFixed(2)}%`;

  customizeDistribucionPoint = (pointInfo: any) => ({
    color: this.coloresDistribucionHistorica[pointInfo?.index % this.coloresDistribucionHistorica.length]
  });

  private toNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    const raw = value.toString().trim();
    const normalized = raw.includes(',')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }


}
