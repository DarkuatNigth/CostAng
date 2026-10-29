import notify from 'devextreme/ui/notify';
import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FrmparametrizacionprocesoService } from './frmparametrizacionproceso.service';
import { ParamProcMapper, PremioDetalleApi } from './param-proc.mapper';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import { varUser } from 'src/app/config/url.servicios';
import {
  CuentaContableMock,
  GrupoCuentaContableVista,
  DetalleEtapaPivot,
  FilaCostoVista,
  ResumenLibrasProcesadasApi,
  FilaActualizacion,
  ResultadoActualizacion,
  GuardarCierreParamProcRequest,
  CierreParamProcResultadoApi,
  GuardarWarrenRequest
} from './param-proc.models';
import { callApi } from 'src/app/config/Helpers';

type ParticionCuenta = 'EN' | 'SH' | 'VA';

export type ContentModal = {
  title: string;
  contentBody: TemplateRef<any>;
  size: string;
  contentFooter?: TemplateRef<any>;
  showFooter?: boolean;
  draggable?: boolean;
};

@Component({
  selector: 'app-frmparametrizacionproceso',
  templateUrl: './frmparametrizacionproceso.component.html',
  styleUrl: './frmparametrizacionproceso.component.scss'
})
export class FrmparametrizacionprocesoComponent implements OnInit {
  @ViewChild('ModalGeneral')
  ModalGeneral!: TemplateRef<any>;

  @ViewChild('ContentModalDetalleEtapa')
  ContentModalDetalleEtapa!: TemplateRef<any>;

  @ViewChild('ContentModalDetallePremio')
  ContentModalDetallePremio!: TemplateRef<any>;

  @ViewChild('FooterModalDetalleEtapa')
  FooterModalDetalleEtapa!: TemplateRef<any>;

  @ViewChild('ContentModalCuentaContable')
  ContentModalCuentaContable!: TemplateRef<any>;

  @ViewChild('FooterModalCuentaContable')
  FooterModalCuentaContable!: TemplateRef<any>;

  @ViewChild('ModalDetalleCuentasGrupo')
  ModalDetalleCuentasGrupo!: TemplateRef<any>;

  loadingVisible = false;
  loadingMensaje = 'Cargando...';
  guardandoCierre = false;
  // estado independiente del panel de carga.
  valorizandoCierre = false;
  valorizacionCierreFallida = false;
  private periodoValorizacionCierre: { anio: string; mes: string } | null = null;

  cmbAnio!: number;
  cmbMes!: string;
  listAnios: any[] = [];
  listMeses: any[] = [];

  resultado: ResultadoActualizacion | null = null;
  private dtParamProcActual: any = null;
  filasVista: FilaCostoVista[] = [];
  resumenLibras: ResumenLibrasProcesadasApi[] = [];

  /**
   * Control visual del grupo Compra Camarón.
   * Se mantiene cerrado por defecto para mostrar primero el resumen compacto.
   */
  compraCamaronExpandida = false;

  warrenObjetivo = 0.83;
  warrenCalculado = false;
  warrenGuardado = false;

  modalActual: ContentModal | null = null;

  filaDetalleSeleccionada: FilaCostoVista | null = null;
  detalleEtapa: DetalleEtapaPivot[] = [];
  detallePremioGrid: any[] = [];

  filaCuentaSeleccionada: FilaCostoVista | null = null;
  particionCuentaSeleccionada: ParticionCuenta | null = null;

  /** Detalle crudo de Table6 filtrado por proceso + partición. */
  detalleCuentas: CuentaContableMock[] = [];

  /** Primer modal: una sola fila por GrupoCentro (ej. REMUNERACION). */
  detalleCuentasAgrupadas: GrupoCuentaContableVista[] = [];

  /** Segundo modal: cuentas pertenecientes al grupo seleccionado. */
  grupoCuentaSeleccionado: GrupoCuentaContableVista | null = null;
  detalleCuentasGrupo: CuentaContableMock[] = [];

  private readonly mapper = new ParamProcMapper();

  constructor(
    private readonly service: FrmparametrizacionprocesoService,
    public readonly modalService: NgbModal
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarInfoCombos();
  }

  get filas(): FilaActualizacion[] {
    return this.resultado?.filas ?? [];
  }

  get warrenActual(): number {
    return this.resultado?.metricas.warrenActual ?? 0;
  }

  get ajusteWarrenTotal(): number {
    return this.resultado?.metricas.ajusteWarrenTotal ?? 0;
  }

  get baseProrrateo(): number {
    return this.resultado?.metricas.baseProrrateo ?? 0;
  }

  /**
   * Total real de % Absorción Warren.
   *
   * Suma únicamente filas normales absorbentes.
   * No incluye subtotales ni totales porque eso duplicaría porcentajes.
   *
   * Cuando Warren tiene ajuste y está correctamente distribuido:
   * totalPorcentajeAbsorcion = 1.00 = 100%.
   */
  get totalPorcentajeAbsorcion(): number {
    if (!this.resultado || !this.warrenCalculado) {
      return 0;
    }

    return this.resultado.filas
      .filter(row =>
        row.tipo === 'normal' &&
        row.aplicaWarren === true &&
        row.prorrateo !== null
      )
      .reduce(
        (total, row) =>
          total + Number(row.prorrateo ?? 0),
        0
      );
  }

  get costoEnteroXLibra(): number {
    const camaron = this.filas.find(x => x.id === 'camaron');
    const totalProcesos = this.filas.find(x => x.id === 'total-procesos');
    const libras = camaron?.entero ?? 0;

    return libras > 0
      ? (totalProcesos?.entero ?? 0) / libras
      : 0;
  }

  get costoColaXLibra(): number {
    const camaron = this.filas.find(x => x.id === 'camaron');
    const totalProcesos = this.filas.find(x => x.id === 'total-procesos');
    const libras = camaron?.cola ?? 0;

    return libras > 0
      ? (totalProcesos?.cola ?? 0) / libras
      : 0;
  }

  get costoEnteroAjustadoXLibra(): number {
    if (!this.warrenCalculado) return 0;

    const camaron = this.filas.find(x => x.id === 'camaron');
    const totalProcesos = this.filas.find(x => x.id === 'total-procesos');
    const libras = Number(camaron?.entero ?? 0);
    const dolares = Number(totalProcesos?.enteroAjustado ?? 0);

    return libras > 0
      ? dolares / libras
      : 0;
  }

  get costoColaAjustadoXLibra(): number {
    if (!this.warrenCalculado) return 0;

    const camaron = this.filas.find(x => x.id === 'camaron');
    const totalProcesos = this.filas.find(x => x.id === 'total-procesos');
    const libras = Number(camaron?.cola ?? 0);
    const dolares = Number(totalProcesos?.colaAjustada ?? 0);

    return libras > 0
      ? dolares / libras
      : 0;
  }

  get periodoLabel(): string {
    const mes = this.listMeses.find(x => String(x.CODIGO) === String(this.cmbMes));
    const anio = this.listAnios.find(x => Number(x.CODIGO) === Number(this.cmbAnio));

    return [
      mes?.DESCRIPCION ?? this.cmbMes ?? '',
      anio?.DESCRIPCION ?? this.cmbAnio ?? ''
    ]
      .filter(Boolean)
      .join(' - ');
  }

  /**
   * Filas que deben mostrarse en el cuadro de materia prima.
   *
   * Los subniveles siguen existiendo siempre dentro de resumenLibras para no
   * alterar cálculos ni totales; este getter únicamente controla su visibilidad.
   */
  get resumenLibrasVisibles(): ResumenLibrasProcesadasApi[] {
    return this.resumenLibras.filter(
      item =>
        !item.EsSubnivelCompra ||
        this.compraCamaronExpandida
    );
  }

  /**
   * Abre/cierra la composición de Compra Camarón.
   */
  toggleCompraCamaron(): void {
    const tieneSubniveles = this.resumenLibras.some(
      item => item.EsSubnivelCompra === true
    );

    if (!tieneSubniveles) {
      this.compraCamaronExpandida = false;
      return;
    }

    this.compraCamaronExpandida =
      !this.compraCamaronExpandida;
  }

  /**
   * Las filas subordinadas de Compra Camarón son explicativas.
   *
   * "Camarón Liquidado Túnel" y "Camarón Liquidado Fresco" ya están
   * contenidas dentro de Compra Camarón; por eso no vuelven a sumarse.
   */
  private get resumenMateriaPrimaTotalizables(): ResumenLibrasProcesadasApi[] {
    return this.resumenLibras.filter(
      x => x.IncluirEnTotal !== false
    );
  }

  get resumenTotalEntero(): number {
    return this.resumenMateriaPrimaTotalizables.reduce(
      (acc, x) => acc + this.num(x.Libras_Entero),
      0
    );
  }

  get resumenTotalCola(): number {
    return this.resumenMateriaPrimaTotalizables.reduce(
      (acc, x) => acc + this.num(x.Libras_Cola),
      0
    );
  }

  get resumenTotalVa(): number {
    return this.resumenMateriaPrimaTotalizables.reduce(
      (acc, x) => acc + this.num(x.Libras_Valor_Agregado),
      0
    );
  }

  get resumenTotalGeneral(): number {
    return this.resumenTotalEntero +
      this.resumenTotalCola +
      this.resumenTotalVa;
  }

  get resumenMateriaPrimaDolaresEntero(): number {
    return this.resumenMateriaPrimaTotalizables.reduce(
      (acc, x) => acc + this.num(x.Dolares_Entero),
      0
    );
  }

  get resumenMateriaPrimaDolaresCola(): number {
    return this.resumenMateriaPrimaTotalizables.reduce(
      (acc, x) => acc + this.num(x.Dolares_Cola),
      0
    );
  }

  get resumenMateriaPrimaDolaresVa(): number {
    return this.resumenMateriaPrimaTotalizables.reduce(
      (acc, x) => acc + this.num(x.Dolares_Valor_Agregado),
      0
    );
  }

  get resumenMateriaPrimaDolaresTotal(): number {
    return this.resumenMateriaPrimaDolaresEntero +
      this.resumenMateriaPrimaDolaresCola +
      this.resumenMateriaPrimaDolaresVa;
  }

  costoMateriaPrimaUnitario(
    dolares: number | null | undefined,
    libras: number | null | undefined
  ): number | null {
    return this.calcularUnitario(
      this.num(dolares),
      this.num(libras)
    );
  }

  get totalLibrasPremio(): number {
    return this.detallePremioGrid.reduce(
      (acc, x) => acc + x.libras,
      0
    );
  }

  get totalDolaresPremio(): number {
    return this.detallePremioGrid.reduce(
      (acc, x) => acc + x.dolares,
      0
    );
  }

  get detalleTotalEntero(): number {
    return this.detalleEtapa.reduce(
      (acc, x) => acc + x.librasEntero,
      0
    );
  }

  get detalleTotalCola(): number {
    return this.detalleEtapa.reduce(
      (acc, x) => acc + x.librasCola,
      0
    );
  }

  get detalleTotalVa(): number {
    return this.detalleEtapa.reduce(
      (acc, x) => acc + x.librasValorAgregado,
      0
    );
  }

  get detalleTotalGeneral(): number {
    return this.detalleEtapa.reduce(
      (acc, x) => acc + x.total,
      0
    );
  }

  /**
   * Brine se presenta agrupado adicionalmente por tipo de embalaje
   * (FONDO / PANERA) usando el dato enviado por backend desde strTipEmbala.
   */
  get esEtapaBrine(): boolean {
    const etapa = String(
      this.filaDetalleSeleccionada?.etapaBackend ??
      this.filaDetalleSeleccionada?.concepto ??
      ''
    )
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();

    return etapa === 'BRINE';
  }

  get cuentaTotal(): number {
    return this.detalleCuentas.reduce(
      (acc, x) => acc + x.dolares,
      0
    );
  }

  get nombreParticionCuenta(): string {
    switch (this.particionCuentaSeleccionada) {
      case 'EN': return 'Entero';
      case 'SH': return 'Cola';
      case 'VA': return 'Valor Agregado';
      default: return '';
    }
  }

  get nombreAgrupacionCuenta(): string {
    return Array.from(new Set(this.detalleCuentas.map(x => (x.agrupacionCentro || '').trim()).filter(Boolean))).join(' / ');
  }

  get detallePremio(): PremioDetalleApi[] { return this.mapper.detallePremio(); }

  async onClickConsultar(): Promise<void> {
    const faltantes: string[] = [];

    if (!this.cmbAnio) faltantes.push('Año');
    if (!this.cmbMes) faltantes.push('Mes');

    if (faltantes.length > 0) {
      await showAlert(
        '',
        `Por favor seleccione los campos: ${faltantes.join(', ')}`,
        'warning'
      );
      return;
    }

    await this.cargarParametrosProceso();
  }

  onWarrenChange(value?: number): void {
    const n = Number(value ?? this.warrenObjetivo);
    this.warrenObjetivo = Number.isFinite(n) ? n : 0;

    if (!this.resultado) return;

    this.mapper.limpiarWarren(
      this.resultado,
      this.warrenObjetivo
    );

    this.warrenCalculado = false;
    this.warrenGuardado = false;
    this.refrescarVista();
  }

  async calcularWarren(): Promise<void> {
    if (!this.resultado) return;

    // capturar fallos de validacion y permitir reintento.
    try {
      this.mapper.recalcularWarren(
        this.resultado,
        this.warrenObjetivo
      );

      this.warrenCalculado = true;
      this.warrenGuardado = false;
      this.refrescarVista();
    } catch (error) {
      this.warrenCalculado = false;
      this.warrenGuardado = false;
      this.loadingVisible = false;
      this.loadingMensaje = 'Cargando...';
      await showAlert('Error', this.escaparMensajeCierre(error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      this.loadingVisible = false;
      this.loadingMensaje = 'Cargando...';
    }
  }

  async onClickGuardarCierre(): Promise<void> {
    if (this.guardandoCierre) return;
    if (this.valorizandoCierre) return;

    if (!this.resultado || !this.warrenCalculado) {
      await showAlert(
        '',
        'Primero debe calcular Warren antes de guardar el cierre.',
        'warning'
      );
      return;
    }

    if (!this.cmbAnio || !this.cmbMes) {
      await showAlert('', 'Debe seleccionar año y mes.', 'warning');
      return;
    }

    this.guardandoCierre = true;
    this.warrenGuardado = false;
    this.loadingMensaje = 'Guardando cierre...';
    this.loadingVisible = true;

    try {
      const dt = this.dtParamProcActual ?? {};

      // ---------------------------------------------------------------------
      // DESCABEZADO
      //
      // La fila visible ya contiene el cálculo consolidado:
      //
      //   CU = Dólares totales Descabezado
      //        / Libras totales Descabezado PFR + RPC
      //
      // Antes del POST se clonan los snapshots y se sincroniza Descabezado:
      // - mismo CU consolidado para PFR/RPC;
      // - dólares PFR/RPC repartidos según sus libras;
      // - Table9 consistente con Table/Table1.
      // ---------------------------------------------------------------------
      const parametrosPfr =
        (dt.Table ?? []).map((x: any) => ({ ...x }));

      const parametrosRpc =
        (dt.Table1 ?? []).map((x: any) => ({ ...x }));

      const procesosOrigen =
        (dt.Table9 ?? []).map((x: any) => ({ ...x }));

      this.sincronizarDescabezadoParaCierre(
        parametrosPfr,
        parametrosRpc,
        procesosOrigen
      );

      const request: GuardarCierreParamProcRequest = {
        anio: String(this.cmbAnio),
        mes: String(this.cmbMes),
        objetivoWarren: this.warrenObjetivo,
        usuario: varUser,

        // Se guarda exactamente el snapshot que el usuario está revisando.
        // El POST no vuelve a consultar Producción ni SONG.
        detalleContable: (dt.Table6 ?? []).map((x: any) => ({ ...x })),
        procesosOrigen,
        parametrosPfr,
        parametrosRpc,
        warrenBase: this.mapper.construirWarrenBaseSnapshot(
          this.resultado
        )
      };

      const resp = await callApi<CierreParamProcResultadoApi>(
        this.service.guardarCierre(request)
      );
      const resumen = resp.data?.Dt?.objResumen;
      if (!resp.ok || resp.data?.Codigo === false) {
        this.loadingVisible = false;
        await showAlert('', this.escaparMensajeCierre(resp.message || resp.data?.Description || 'No se pudo guardar el cierre.'), 'error');
        return;
      }
      if (resumen?.estado !== 'PARAMETROS_GUARDADOS' || !resumen.warrenGuardado) {
        this.loadingVisible = false;
        await showAlert('', this.escaparMensajeCierre(resp.message || resp.data?.Description || 'No se confirmaron los parámetros del cierre.'), 'error');
        return;
      }

      this.warrenGuardado = true;
      this.loadingVisible = false;
      notify('Cierre guardado correctamente', 'success', 2500);
      void this.ejecutarValorizacionCierre(request.anio, request.mes);
    } catch (error) {
      this.warrenGuardado = false;
      this.loadingVisible = false;
      this.loadingMensaje = 'Cargando...';
      this.guardandoCierre = false;
      await showAlert('Error', this.escaparMensajeCierre(error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      this.loadingVisible = false;
      this.loadingMensaje = 'Cargando...';
      this.guardandoCierre = false;
    }
  }

  // reintentar el periodo guardado, aunque cambien los filtros.
  onClickReintentarValorizacion(): void {
    if (this.guardandoCierre || this.valorizandoCierre || !this.valorizacionCierreFallida || !this.periodoValorizacionCierre) return;
    const { anio, mes } = this.periodoValorizacionCierre;
    void this.ejecutarValorizacionCierre(anio, mes);
  }

  private async ejecutarValorizacionCierre(anio: string, mes: string): Promise<void> {
    if (this.valorizandoCierre) return;
    this.valorizandoCierre = true;
    this.valorizacionCierreFallida = false;
    this.periodoValorizacionCierre = { anio, mes };
    let mensajeError = '';
    try {
      // Un POST sin snapshot ni cancelacion ligada a la vida del componente.
      const resp = await callApi<CierreParamProcResultadoApi>(
        this.service.guardarCierreValorizacion({ anio, mes, usuario: varUser })
      );
      const resumen = resp.data?.Dt?.objResumen;
      if (!resp.ok || resp.data?.Codigo === false || resumen?.estado !== 'AC') {
        mensajeError = resp.message || resp.data?.Description || 'No se confirmó la valorización completa.';
      } else {
        const advertencias = resumen.advertencias?.length ?? 0;
        notify(`Valorización ${mes}/${anio}: fresco ${resumen.frescoGuardados} cabeceras y ${resumen.frescoDetalles} detalles; reproceso ${resumen.reproGuardados} cabeceras y ${resumen.reproDetalles} detalles.${advertencias ? ` Advertencias recibidas: ${advertencias}.` : ''}`, 'success', 5000);
      }
    } catch {
      mensajeError = 'No se pudo confirmar la valorización. Puede reintentar.';
    } finally {
      this.valorizandoCierre = false;
      this.valorizacionCierreFallida = !!mensajeError;
    }
    if (mensajeError) {
      await showAlert('', 'Los parámetros del cierre quedaron guardados, pero la valorización de fresco y reproceso falló: ' + this.escaparMensajeCierre(mensajeError), 'warning');
    }
  }

  private escaparMensajeCierre(texto: string): string {
    return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Compatibilidad temporal con botones/vistas anteriores. */
  async onClickGuardarWarren(): Promise<void> {
    await this.onClickGuardarCierre();
  }

  restaurarWarren(): void {
    this.warrenObjetivo = 0.83;

    if (this.resultado) {
      this.mapper.limpiarWarren(
        this.resultado,
        this.warrenObjetivo
      );
    }

    this.warrenCalculado = false;
    this.warrenGuardado = false;
    this.refrescarVista();
  }

  async abrirDetalleEtapa(row: FilaCostoVista): Promise<void> {
    if (!row?.tieneDetalleEtapa) return;

    if (row.id === 'premio') {
      this.filaDetalleSeleccionada = row;
      this.detallePremioGrid = this.detallePremio.map(x => ({ origen: x.Origen === 'PFR' ? 'Fresco' : x.Origen === 'RPC' ? 'Reproceso' : x.Origen, tipoPremio: x.Certificado, lote: x.Lote, producto: x.Producto, descripcion: x.Descripcion, talla: x.Talla, libras: x.Libras, dolares: x.Premio }));
      const modal: ContentModal = {
        title: 'Detalle Premio',
        size: 'xl',
        contentBody: this.ContentModalDetallePremio,
        contentFooter: this.FooterModalDetalleEtapa,
        showFooter: true,
        draggable: true
      };
      this.OpenModal(modal);
      return;
    }

    this.loadingVisible = true;

    try {
      this.filaDetalleSeleccionada = row;
      this.detalleEtapa = this.mapper.pivotDetalleEtapa(row);

      const modal: ContentModal = {
        title: `Detalle Etapa - ${row.concepto}`,
        size: 'xl',
        contentBody: this.ContentModalDetalleEtapa,
        contentFooter: this.FooterModalDetalleEtapa,
        showFooter: true,
        draggable: true
      };

      this.OpenModal(modal);
    }catch(error){
      this.loadingVisible = false;
      console.error('Error al abrir detalle de etapa:', error);
    } 
    finally {
      this.loadingVisible = false;
    }
  }

  async abrirDetalleCuenta(
    row: FilaCostoVista,
    particion: ParticionCuenta
  ): Promise<void> {
    if (!row || row.tipo !== 'normal') return;

    this.loadingVisible = true;

    try {
      this.filaCuentaSeleccionada = row;
      this.particionCuentaSeleccionada = particion;

      const nombreParticion = this.obtenerNombreParticion(particion);

      this.detalleCuentas = this.mapper.cuentasMock(row).filter(
        x =>
          x.particion
            .trim()
            .toUpperCase() ===
          nombreParticion
            .trim()
            .toUpperCase()
      );

      if (this.detalleCuentas.length === 0) {
        this.loadingVisible = false;
        await showAlert(
          '',
          'No existen valores contables para la partición seleccionada.',
          'warning'
        );
        return;
      }

      // El primer modal ya no muestra una línea por cuenta. Consolida por
      // GrupoCentro para que, por ejemplo, REMUNERACION aparezca una sola vez.
      this.detalleCuentasAgrupadas =
        this.mapper.agruparCuentasPorGrupo(this.detalleCuentas);

      const modal: ContentModal = {
        title: `Detalle Cuenta contable - ${this.nombreAgrupacionCuenta || `${row.concepto} / ${nombreParticion}`}`,
        size: 'lg',
        contentBody: this.ContentModalCuentaContable,
        contentFooter: this.FooterModalCuentaContable,
        showFooter: true,
        draggable: true
      };

      this.OpenModal(modal);
    } finally {
      this.loadingVisible = false;
    }
  }

  abrirDetalleGrupoCuenta(event: any): void {
    if (event?.rowType && event.rowType !== 'data') return;

    const grupo = event?.data as GrupoCuentaContableVista | undefined;
    if (!grupo) return;

    this.grupoCuentaSeleccionado = grupo;
    this.detalleCuentasGrupo = [...(grupo.cuentas ?? [])].sort((a, b) =>
      a.numeroCuenta.localeCompare(b.numeroCuenta) ||
      a.descripcionCuenta.localeCompare(b.descripcionCuenta)
    );

    this.modalService.open(
      this.ModalDetalleCuentasGrupo,
      {
        size: 'xl',
        centered: true,
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        windowClass: 'modal-costos-paramproc modal-cuentas-grupo'
      }
    );
  }

  OpenModal(modal: ContentModal): void {
    this.modalActual = modal;

    this.modalService.open(
      this.ModalGeneral,
      {
        size: modal.size as any,
        centered: true,
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
        windowClass: 'modal-costos-paramproc'
      }
    );
  }

  cerrarModal(): void {
    this.modalService.dismissAll();
    this.modalActual = null;
  }

  trackByFila(_: number, row: FilaCostoVista): string {
    return row.id;
  }

  esCero(value: number | null | undefined): boolean {
    return value == null ||
      Math.abs(Number(value)) < 0.0000001;
  }

  private refrescarVista(): void {
    if (!this.resultado) {
      this.filasVista = [];
      this.resumenLibras = [];
      return;
    }

    this.filasVista = this.mapper.decorarFilas(
      this.resultado
    );

    this.resumenLibras = this.mapper.construirResumen(
      this.resultado
    );
  }

  private async cargarInfoCombos(): Promise<void> {
    this.loadingVisible = true;

    const resp = await callApi<any>(this.service.getDataParametros());
    if (resp.ok) {
      this.listAnios = resp.data.Dt?.Table ?? [];
      this.listMeses = resp.data.Dt?.Table1 ?? [];
      this.loadingVisible = false;
    } else {
      this.loadingVisible = false;
      await showAlert('', resp.message, 'error');
    }

  }

  private async cargarParametrosProceso(): Promise<void> {
    this.loadingVisible = true;

    // incluye construir, aplicar Warren y decorar dentro de la captura.
    this.warrenCalculado = false;
    this.warrenGuardado = false;
    try {
      const parametros = {
        strAnio: this.cmbAnio,
        strMes: this.cmbMes
      };

      const resp = await callApi<any>(this.service.getProcParametros(parametros));
      if (resp.ok) {
        // console.log('Respuesta de cargarParametrosProceso:', resp);
        const dt = resp.data.Dt ?? {};
        this.dtParamProcActual = dt;

        this.mapper.cargarPayload(dt);
        this.resultado = this.mapper.construir(
          dt,
          this.warrenObjetivo
        );
        this.refrescarVista();

        // Cada nueva consulta inicia con Compra Camarón contraída.
        this.compraCamaronExpandida = false;

        const tieneWarrenGuardado =
          this.mapper.aplicarWarrenGuardado(
            this.resultado,
            dt.Table7,
            dt.Table8
          );

        this.warrenObjetivo =
          this.resultado.metricas.warrenObjetivo;

        this.warrenCalculado = tieneWarrenGuardado;
        this.warrenGuardado = tieneWarrenGuardado;

        // Volver a decorar después de aplicar el Warren persistido.
        this.refrescarVista();

        if (
          tieneWarrenGuardado &&
          Math.abs(
            this.costoColaAjustadoXLibra -
            this.warrenObjetivo
          ) > 0.0001
        ) {
          this.warrenCalculado = false;
          this.warrenGuardado = false;

          this.loadingVisible = false;
          this.loadingMensaje = 'Cargando...';
          await showAlert(
            'Warren',
            `El Warren guardado no cuadra contra el snapshot actual. ` +
            `Objetivo: ${this.warrenObjetivo.toFixed(4)}; ` +
            `resultado visual: ${this.costoColaAjustadoXLibra.toFixed(4)}.`,
            'error'
          );
        }
        this.loadingVisible = false;
      } else {
        this.loadingVisible = false;
        await showAlert('', resp.message, 'error');
      }

    } catch (error) {
      this.warrenCalculado = false;
      this.warrenGuardado = false;
      this.loadingVisible = false;
      this.loadingMensaje = 'Cargando...';
      await showAlert('Error', this.escaparMensajeCierre(error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      this.loadingVisible = false;
      this.loadingMensaje = 'Cargando...';
    }
  }

  /**
   * Sincroniza Descabezado antes del cierre.
   *
   * Regla:
   *   CU consolidado =
   *      dólares totales Descabezado
   *      / (libras PFR + libras RPC)
   *
   * Los dólares se reparten por origen usando ese mismo CU:
   *   dólares PFR = libras PFR * CU
   *   dólares RPC = total dólares - dólares PFR
   *
   * Así PFR y RPC guardan:
   *   - sus propias libras;
   *   - sus propios dólares;
   *   - el mismo costo unitario consolidado.
   *
   * También se sincroniza Table9 porque el backend usa procesosOrigen
   * durante la construcción final del cierre.
   */
  private sincronizarDescabezadoParaCierre(
    parametrosPfr: any[],
    parametrosRpc: any[],
    procesosOrigen: any[]
  ): void {
    const filaDescabezado = this.filasVista.find(
      x => x.id === 'descabezado'
    );

    const objPfr = parametrosPfr.find(
      (item: any) =>
        this.normalizarDescripcion(
          item?.Descripcion ??
          item?.strDescripcion
        ) === 'DESCABEZADO'
    );

    const objRpc = parametrosRpc.find(
      (item: any) =>
        this.normalizarDescripcion(
          item?.Descripcion ??
          item?.strDescripcion
        ) === 'DESCABEZADO'
    );

    if (!filaDescabezado || !objPfr || !objRpc) {
      return;
    }

    const dcLibrasPfr =
      this.num(
        objPfr?.Libras_Proceso ??
        objPfr?.dcLibras
      );

    const dcLibrasRpc =
      this.num(
        objRpc?.Libras_Proceso ??
        objRpc?.dcLibras
      );

    const dcLibrasTotal =
      dcLibrasPfr +
      dcLibrasRpc;

    const dcDolaresTotal =
      this.num(
        filaDescabezado?.totalVista?.dolares
      );

    if (
      dcLibrasTotal <= 0 ||
      Math.abs(dcDolaresTotal) <= 0.000001
    ) {
      return;
    }

    const dcCostoUnitario =
      dcDolaresTotal /
      dcLibrasTotal;

    const dcDolaresPfr =
      dcLibrasPfr *
      dcCostoUnitario;

    // El RPC absorbe el residuo para conservar exactamente el total visible.
    const dcDolaresRpc =
      dcDolaresTotal -
      dcDolaresPfr;

    this.actualizarParametroDescabezado(
      objPfr,
      dcDolaresPfr,
      dcCostoUnitario
    );

    this.actualizarParametroDescabezado(
      objRpc,
      dcDolaresRpc,
      dcCostoUnitario
    );

    const objOrigenPfr = procesosOrigen.find(
      (item: any) =>
        this.normalizarDescripcion(
          item?.strPcCodigo ??
          item?.PcCodigo ??
          item?.ProcesoCodigo
        ) === 'DES' &&
        this.normalizarDescripcion(
          item?.strOrigen ??
          item?.Origen
        ) === 'PFR'
    );

    const objOrigenRpc = procesosOrigen.find(
      (item: any) =>
        this.normalizarDescripcion(
          item?.strPcCodigo ??
          item?.PcCodigo ??
          item?.ProcesoCodigo
        ) === 'DES' &&
        this.normalizarDescripcion(
          item?.strOrigen ??
          item?.Origen
        ) === 'RPC'
    );

    if (objOrigenPfr) {
      this.actualizarProcesoOrigenDescabezado(
        objOrigenPfr,
        dcDolaresPfr,
        dcCostoUnitario
      );
    }

    if (objOrigenRpc) {
      this.actualizarProcesoOrigenDescabezado(
        objOrigenRpc,
        dcDolaresRpc,
        dcCostoUnitario
      );
    }
  }

  private actualizarParametroDescabezado(
    item: any,
    dcDolares: number,
    dcCostoUnitario: number
  ): void {
    item.Valor =
      dcDolares;

    item.Costo_Unitario =
      dcCostoUnitario;

    // Compatibilidad defensiva con nombres C#.
    if ('dcValor' in item) {
      item.dcValor =
        dcDolares;
    }

    if ('dcCostUnitario' in item) {
      item.dcCostUnitario =
        dcCostoUnitario;
    }
  }

  private actualizarProcesoOrigenDescabezado(
    item: any,
    dcDolares: number,
    dcCostoUnitario: number
  ): void {
    // Descabezado vive físicamente en Cola.
    item.dcDolaresEntero = 0;
    item.dcDolaresCola = dcDolares;
    item.dcDolaresValorAgregado = 0;

    item.dcTotalDolares =
      dcDolares;

    item.dcCostoUnitario =
      dcCostoUnitario;

    // Compatibilidad con posibles respuestas PascalCase.
    if ('DolaresEntero' in item) {
      item.DolaresEntero = 0;
    }

    if ('DolaresCola' in item) {
      item.DolaresCola = dcDolares;
    }

    if ('DolaresValorAgregado' in item) {
      item.DolaresValorAgregado = 0;
    }

    if ('TotalDolares' in item) {
      item.TotalDolares = dcDolares;
    }

    if ('CostoUnitario' in item) {
      item.CostoUnitario = dcCostoUnitario;
    }
  }

  private normalizarDescripcion(
    value: any
  ): string {
    return String(
      value ?? ''
    )
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private obtenerNombreParticion(
    particion: ParticionCuenta
  ): string {
    switch (particion) {
      case 'EN': return 'Entero';
      case 'SH': return 'Cola';
      case 'VA': return 'Valor Agregado';
      default: return '';
    }
  }

  private calcularUnitario(
    dolares: number,
    libras: number
  ): number | null {
    return libras > 0
      ? dolares / libras
      : null;
  }

  private num(value: any): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
}
