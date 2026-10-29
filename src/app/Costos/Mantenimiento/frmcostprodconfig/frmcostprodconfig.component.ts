import { AnularValorizacionesResponse, NivelEjecucion } from './frmcostprodconfig.models';
// liberar la fuente del catalogo y el debounce al destruir la pantalla.
import { Component, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
// fuente procesada por el servidor, sin volver a filtrar la pagina en cliente.
import CustomStore from 'devextreme/data/custom_store';
import DataSource from 'devextreme/data/data_source';
import { callApi } from 'src/app/config/Helpers';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert, showAlertConfirm } from 'src/app/utilities/sweetAlert.util';
// personalizar solo los botones de la confirmación creada por el helper existente.
import Swal from 'sweetalert2/src/sweetalert2.js';
import { FrmcostprodconfigService } from './frmcostprodconfig.service';
import { construirMatrizCatalogo } from './matriz-procesos-dinamicos';
// exportación local de la configuración y cambios pendientes.
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { construirHojasConfiguracion } from './exportar-configuracion-excel';
import type { Column } from 'devextreme/ui/data_grid';
import {
  AplicacionCostoMantenimiento,
  CostoProductivoMantenimientoApi,
  CuentaCostoMantenimiento,
  CuentaDisponible,
  CuentasDisponiblesResultado,
  EMPRESA_SONGA,
  CATALOGO_TIPO_VALOR_PROCESO,
  TipoValorProceso,
  EtapaCostoMantenimiento,
  FilaMatrizCosteo,
  GuardarCostoProductivoMantenimientoRequest,
  GuardarCostoProductivoMantenimientoResponse,
  ProcesoCostoMantenimiento,
  ReglaCostoCodigo,
  ReglaCostoMantenimiento,
  TipoLoteMantenimiento,
  TipoProcesoDisponible,
  TipoProcesoMantenimiento
} from './frmcostprodconfig.models';

type TabConfig = 'matriz' | 'tipos' | 'cuentas' | 'procesos';

@Component({
  selector: 'app-frmcostprodconfig',
  templateUrl: './frmcostprodconfig.component.html',
  styleUrl: './frmcostprodconfig.component.scss'
})
export class FrmcostprodconfigComponent implements OnInit, OnDestroy {
  @ViewChildren('tabGrid') tabGrids!: QueryList<DxDataGridComponent>;
  tiposProcesoDisponibles: TipoProcesoDisponible[] = [];
  tipoDisponibleCodigo = '';
  agregarProceso = '';
  loadingVisible = false;
  tabActiva: TabConfig = 'matriz';

  etapas: EtapaCostoMantenimiento[] = [];
  procesos: ProcesoCostoMantenimiento[] = [];
  tiposLote: TipoLoteMantenimiento[] = [];
  tiposProceso: TipoProcesoMantenimiento[] = [];
  matriz: AplicacionCostoMantenimiento[] = [];
  cuentas: CuentaCostoMantenimiento[] = [];
  reglasDisponibles: ReglaCostoMantenimiento[] = [];

  filasMatriz: FilaMatrizCosteo[] = [];

  popupReglaVisible = false;
  reglaTipoCodigo = '';
  reglaTipoNombre = '';
  reglaProcesoCodigo = '';
  reglaProcesoNombre = '';
  reglaSeleccionada: ReglaCostoCodigo | string = 'NA';

  popupTipoVisible = false;
  tipoEdicion: TipoProcesoMantenimiento = this.nuevoTipoVacio();

  private cuentaOriginal?: CuentaCostoMantenimiento;
  private cuentaEtapaCambiada = false;
  popupCuentaVisible = false;
  cuentaEdicion: CuentaCostoMantenimiento = this.nuevaCuentaVacia();

  cuentasCargando = false;
  // transferencia local sobre las cuentas cargadas y el mapa dirty existente.
  private cuentasCargadas = false;
  popupTransferirVisible = false;
  transferirEtapaOrigen = '';
  transferirProcesoOrigen = '';
  transferirEtapaDestino = '';
  transferirProcesoDestino = '';
  transferirClaves: number[] = [];
  transferirCuentas: CuentaCostoMantenimiento[] = [];
  transferirProcesosOrigen: ProcesoCostoMantenimiento[] = [];
  transferirProcesosDestino: ProcesoCostoMantenimiento[] = [];
  popupAgregarVisible = false;
  modoAgregar: 'unica' | 'grupo' = 'unica';
  agregarEtapa = '';
  agregarDisponibles: CuentaDisponible[] = [];
  agregarTotal = 0;
  agregarPagina = 1;
  agregarTexto = '';
  // los nombres comparten el unico texto global que admite la API.
  agregarFiltros: Record<string, string | null> = {};
  private readonly agregarCamposTexto = ['cuentaNombre', 'auxiliarCodigo', 'centroNombre', 'subcentroNombre'];
  private readonly agregarSeleccionadas = new Map<string, CuentaDisponible>();
  readonly agregarFuente = new DataSource({
    paginate: false,
    store: new CustomStore({
      key: ['empresa', 'cuenta', 'centroCodigo', 'subcentroCodigo'],
      loadMode: 'processed',
      // Las consultas las coordina buscarDisponibles, con debounce y control de version.
      load: () => Promise.resolve({ data: this.agregarDisponibles, totalCount: this.agregarTotal }),
      byKey: key => Promise.resolve(this.agregarSeleccionadas.get(this.claveCuenta(key))
        ?? this.agregarDisponibles.find(x => this.claveCuenta(x) === this.claveCuenta(key)))
    })
  });
  agregarSoloDisponibles = false;
  agregarSeleccion: CuentaDisponible[] = [];
  agregarUnica?: CuentaDisponible;
  agregarClaves: any[] = [];
  agregarCargando = false;
  readonly empresa = EMPRESA_SONGA;
  popupProcesoVisible = false;
  // aviso compartido; las claves evitan repetir el aviso local al editar un alta pendiente.
  // estado exclusivo de ejecución y reintento.
  popupEjecucionVisible = false;
  ejecucionEnCurso = false;
  nivelesEjecucion: NivelEjecucion[] = [];
  resumenEjecucion = '';
  // conservar el contexto aunque el guardado limpie las transferencias pendientes.
  transferenciasEjecucion: string[] = [];
  private esperaGuardadoTimer?: ReturnType<typeof setTimeout>;
  private requestEjecucion?: GuardarCostoProductivoMantenimientoRequest;
  private requiereAnulacionEjecucion = false;
  // respaldo de la transferencia declarada en el front durante esta ejecución.
  private frescoCabecerasEjecucion = 0;
  private reproCabecerasEjecucion = 0;

  popupAvisoRecosteoVisible = false;
  avisoRecosteoGuardar = false;
  avisoRecosteoProcesos: { nombre: string; codigo: string }[] = [];
  private readonly procesosAvisadosRecosteo = new Set<string>();
  private resolverAvisoRecosteo?: (confirmado: boolean) => void;
  private avisoRecosteoConfirmado = false;
  procesoEdicion: ProcesoCostoMantenimiento = this.nuevoProcesoVacio();
  private readonly procesosDirty = new Map<string, ProcesoCostoMantenimiento>();
  // estado exclusivo de la modal unificada.
  readonly modo = TipoValorProceso;
  readonly catalogoModo = CATALOGO_TIPO_VALOR_PROCESO;
  private procesoOriginal?: ProcesoCostoMantenimiento;
  private readonly nombresVinculados = new Map<number, string>();
  private readonly clavesProcesosNuevos = new WeakMap<ProcesoCostoMantenimiento, string>();
  private siguienteProceso = 0;
  private busquedaTimer?: any;
  private busquedaVersion = 0;
  private cuentasVersion = 0;

  private readonly tiposDirty = new Map<string, TipoProcesoMantenimiento>();
  private readonly matrizDirty = new Map<string, AplicacionCostoMantenimiento>();
  private readonly cuentasDirty = new Map<string, CuentaCostoMantenimiento>();
  // origen de las transferencias, asociado a las cuentas pendientes existentes.
  private readonly cuentasTransferidasOrigen = new Map<string, CuentaCostoMantenimiento>();
  private tempCuentaId = -1;

  constructor(
    private readonly service: FrmcostprodconfigService
  ) {}

  // varUser es la clave; obtener el usuario real y admitir texto o JSON.
  private usuarioActual(): string {
    const valorCrudo = (localStorage.getItem(varUser) ?? '').trim();
    let usuario = valorCrudo;
    if (valorCrudo.startsWith('{') || valorCrudo.startsWith('"')) {
      try {
        const valor = JSON.parse(valorCrudo);
        if (typeof valor === 'string') {
          usuario = valor;
        } else if (valor && typeof valor === 'object') {
          for (const clave of ['usuario', 'user', 'UserName', 'codigo']) {
            if (typeof valor[clave] === 'string' && valor[clave].trim()) {
              usuario = valor[clave];
              break;
            }
          }
        }
      } catch {
        // conservar el valor crudo cuando no sea JSON valido.
      }
    }
    return usuario.trim() || 'UserPROD';
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  get hayCambios(): boolean {
    return this.tiposDirty.size > 0 ||
      this.matrizDirty.size > 0 ||
      this.cuentasDirty.size > 0 || this.procesosDirty.size > 0;
  }

  // separar diarios de todas las selecciones productivas.
  readonly usosProceso = [
    { codigo: 'Productivo', descripcion: 'Productivo' },
    { codigo: 'Diario', descripcion: 'Diario contable' }
  ];

  esProcesoDiario = (item: ProcesoCostoMantenimiento): boolean =>
    !!item.esDiario || item.uso === 'Diario' || item.uso === 'DIARIO' || item.etapaCodigo === 'DM' ||
    this.etapas.some(x => x.codigo === item.etapaCodigo && !!x.esDiario);

  // conservar la referencia del resultado hasta que cambien sus entradas.
  private etapasProductivasCache?: {
    etapas: EtapaCostoMantenimiento[];
    etapasLength: number;
    resultado: EtapaCostoMantenimiento[];
  };

  get etapasProductivas(): EtapaCostoMantenimiento[] {
    const cache = this.etapasProductivasCache;
    if (!cache ||
        cache.etapas !== this.etapas ||
        cache.etapasLength !== this.etapas.length) {
      this.etapasProductivasCache = {
        etapas: this.etapas,
        etapasLength: this.etapas.length,
        resultado: this.etapas.filter(x => !x.esDiario && x.codigo !== 'DM')
      };
    }
    return this.etapasProductivasCache!.resultado;
  }

  get procesoDiario(): boolean { return this.esProcesoDiario(this.procesoEdicion); }

  cambiarUsoProceso(uso: 'Productivo' | 'Diario'): void {
    if (this.procesoEnEdicion) return;
    const diario = uso === 'Diario';
    Object.assign(this.procesoEdicion, {
      uso, esDiario: diario, etapaCodigo: diario ? 'DM' : '', orden: 0,
      modoValor: this.modo.CALCULADO, tipoProcesoCodigo: '', tipoProceso: '',
      esTarifa: false, esFichaTecnica: false, tiposFicha: '', paramId: 0, enMatriz: false
    });
    this.actualizarOrdenProceso();
  }

  // conservar la referencia del resultado hasta que cambien sus entradas.
  private procesosMatrizCache?: {
    procesos: ProcesoCostoMantenimiento[];
    procesosLength: number;
    etapas: EtapaCostoMantenimiento[];
    etapasLength: number;
    resultado: ProcesoCostoMantenimiento[];
  };

  private lstColumnasMatriz: Column[] = [];

  get columnasMatriz(): Column[] {
    void this.procesosMatriz;
    return this.lstColumnasMatriz;
  }

  get procesosMatriz(): ProcesoCostoMantenimiento[] {
    const cache = this.procesosMatrizCache;
    if (!cache ||
        cache.procesos !== this.procesos ||
        cache.procesosLength !== this.procesos.length ||
        cache.etapas !== this.etapas ||
        cache.etapasLength !== this.etapas.length) {
      const objMatriz = construirMatrizCatalogo(this.etapas, this.procesos);
      this.lstColumnasMatriz = objMatriz.columnas;
      this.procesosMatrizCache = {
        procesos: this.procesos,
        procesosLength: this.procesos.length,
        etapas: this.etapas,
        etapasLength: this.etapas.length,
        resultado: objMatriz.procesos
      };
    }
    return this.procesosMatrizCache!.resultado;
  }

  async cargar(): Promise<void> {
    this.loadingVisible = true;
    // distinguir una lista vacía cargada de una consulta pendiente.
    this.cuentasCargadas = false;
    ++this.cuentasVersion;
    this.cuentasCargando = false;

    try {
      const resp = await callApi<any>(this.service.consultar(false));
      if (!resp.ok) {
        this.loadingVisible = false;
        await showAlert('', resp.message, 'error');
        return;
      }

      const data = (resp.data?.Dt ?? {}) as CostoProductivoMantenimientoApi;

      this.etapas = [...(data.etapas ?? [])];
      this.procesos = [...(data.procesos ?? [])];
      // conservar el bloqueo original aunque se cambie de modo antes de guardar.
      this.nombresVinculados.clear();
      this.procesos.filter(x => !this.esProcesoDiario(x) && x.paramId && x.modoValor !== this.modo.TARIFA)
        .forEach(x => this.nombresVinculados.set(x.paramId!, x.nombre));
      this.tiposLote = [...(data.tiposLote ?? [])];
      this.tiposProceso = [...(data.tiposProceso ?? [])];
      this.tiposProcesoDisponibles = [...(data.tiposProcesoDisponibles ?? [])];
      this.matriz = [...(data.matriz ?? [])];
      this.cuentas = [...(data.cuentas ?? [])];
      this.reglasDisponibles = (data.reglasDisponibles?.length
        ? [...data.reglasDisponibles]
        : this.reglasFallback());

      this.tiposDirty.clear();
      this.matrizDirty.clear();
      this.cuentasDirty.clear();
      // una carga correcta descarta las transferencias pendientes.
      this.cuentasTransferidasOrigen.clear();
      this.procesosDirty.clear();
      // una carga correcta inicia una nueva sesión de edición.
      this.procesosAvisadosRecosteo.clear();
      this.construirMatriz();
      this.loadingVisible = false;
      void this.cargarCuentas();
    } finally {
      this.loadingVisible = false;
    }
  }

  // esperar la consulta existente sin duplicarla ni guardar cambios.
  exportandoExcel = false;

  async exportarExcel(): Promise<void> {
    if (this.exportandoExcel || this.loadingVisible) return;
    this.exportandoExcel = true;
    try {
      while (this.cuentasCargando) await new Promise<void>(resolve => setTimeout(resolve, 100));
      if (!this.cuentasCargadas) await this.cargarCuentas();
      while (this.cuentasCargando) await new Promise<void>(resolve => setTimeout(resolve, 100));
      if (!this.cuentasCargadas) {
        await showAlert('', 'No se pudieron cargar las cuentas para exportar.', 'warning');
        return;
      }
      const hojas = construirHojasConfiguracion({
        etapas: this.etapas, procesos: this.procesos, procesosMatriz: this.procesosMatriz,
        tiposProceso: this.tiposProceso, tiposLote: this.tiposLote,
        filasMatriz: this.filasMatriz, cuentas: this.cuentas,
        tiposDirty: new Set(this.tiposDirty.keys()), matrizDirty: new Set(this.matrizDirty.keys()),
        cuentasDirty: new Set(this.cuentasDirty.keys()),
        // Las altas usan claves temporales en el mapa; normalizar desde sus valores.
        procesosDirty: new Set(Array.from(this.procesosDirty.values()).map(p =>
          p.sinProceso ? `param:${p.paramId}` : `proceso:${p.codigo}`))
      });
      if (!hojas.some(h => h.filas.length)) {
        await showAlert('', 'No hay datos para exportar.', 'info');
        return;
      }
      const libro = new Workbook();
      for (const hoja of hojas) {
        // Excel no admite / en el nombre de una hoja.
        const sheet = libro.addWorksheet(hoja.nombre.replace(/\//g, '-'));
        sheet.addRow(hoja.columnas);
        sheet.addRows(hoja.filas);
        sheet.getRow(1).font = { bold: true };
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
        sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: hoja.columnas.length } };
        sheet.columns.forEach((column, i) => {
          let ancho = hoja.columnas[i].length;
          hoja.filas.forEach(fila => { ancho = Math.max(ancho, String(fila[i] ?? '').length); });
          column.width = Math.min(50, Math.max(14, ancho + 2));
        });
      }
      const buffer = await libro.xlsx.writeBuffer();
      const hoy = new Date();
      const fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `ConfiguracionCostoProductivo_${fecha}.xlsx`);
    } catch (error) {
      await showAlert('', 'No se pudo exportar la configuración a Excel.', 'error');
    } finally {
      this.exportandoExcel = false;
    }
  }

  async cargarCuentas(): Promise<void> {
    const version = ++this.cuentasVersion;
    this.cuentasCargando = true;
    try {
      const resp = await callApi<any>(this.service.consultarCuentas());
      if (version !== this.cuentasVersion) return;
      if (!resp.ok) { await showAlert('', resp.message, 'error'); return; }
      const pendientes = Array.from(this.cuentasDirty.values());
      const claves = new Set(pendientes.map(x => this.claveCuenta(x)));
      this.cuentas = [...pendientes, ...((resp.data?.Dt ?? []) as CuentaCostoMantenimiento[])
        .filter(x => !this.cuentasDirty.has(String(x.id)) && !claves.has(this.claveCuenta(x)))];
      // la modal comparte esta carga, incluso si se abrió durante la consulta.
      this.cuentasCargadas = true;
      if (this.popupTransferirVisible) this.actualizarOrigenTransferencia();
    } finally {
      if (version === this.cuentasVersion) this.cuentasCargando = false;
    }
  }

  seleccionarTab(tab: TabConfig): void {
    this.tabActiva = tab;
    // ajustar las grillas después de que Angular muestre la sección, sin consultar.
    setTimeout(() => this.tabGrids?.forEach(grid => {
      grid.instance.updateDimensions();
    }));
  }

  // ===========================================================================
  // MATRIZ DE COSTEO
  // ===========================================================================

  aplicaRegla(row: FilaMatrizCosteo, procesoCodigo: string): boolean {
    const regla = this.obtenerRegla(row, procesoCodigo);
    return regla !== 'NO' && regla !== 'NA';
  }

  etiquetaRegla(row: FilaMatrizCosteo, procesoCodigo: string): string {
    const regla = this.obtenerRegla(row, procesoCodigo);
    return regla === 'SI' || regla === 'NO' ? '' : regla;
  }

  claseRegla(row: FilaMatrizCosteo, procesoCodigo: string): string {
    const regla = this.obtenerRegla(row, procesoCodigo);
    if (regla === 'NA') return 'rule-na';
    if (regla === 'TAR') return 'rule-tar';
    if (regla === 'DEP' || regla === 'PRO') return 'rule-cond';
    if (regla === 'FIC' || regla === 'D') return 'rule-special';
    return '';
  }

  cambiarAplicacion(
    row: FilaMatrizCosteo,
    procesoCodigo: string,
    value: boolean
  ): void {
    const reglaActual = this.obtenerRegla(row, procesoCodigo);
    const nuevaRegla: ReglaCostoCodigo = value ? 'SI' : 'NO';

    if (reglaActual === nuevaRegla) return;

    row.reglas[procesoCodigo] = nuevaRegla;
    this.marcarReglaDirty(row.codigo, procesoCodigo, nuevaRegla);
  }

  abrirReglaDesdeCelda(e: any): void {
    const procesoCodigo = String(e?.column?.name ?? '').trim().toUpperCase();
    const row = e?.data as FilaMatrizCosteo;

    if (!row || !this.esProcesoMatriz(procesoCodigo)) return;
    this.abrirRegla(row, procesoCodigo);
  }

  abrirRegla(row: FilaMatrizCosteo, procesoCodigo: string): void {
    this.reglaTipoCodigo = row.codigo;
    this.reglaTipoNombre = row.nombre;
    this.reglaProcesoCodigo = procesoCodigo;
    this.reglaProcesoNombre = this.nombreProceso(procesoCodigo);
    this.reglaSeleccionada = this.obtenerRegla(row, procesoCodigo);
    this.popupReglaVisible = true;
  }

  aplicarReglaAvanzada(): void {
    const row = this.filasMatriz.find(x => x.codigo === this.reglaTipoCodigo);
    if (!row) return;

    const regla = this.normalizarRegla(this.reglaSeleccionada);
    row.reglas[this.reglaProcesoCodigo] = regla;
    this.marcarReglaDirty(
      row.codigo,
      this.reglaProcesoCodigo,
      regla
    );

    this.popupReglaVisible = false;
  }

  private construirMatriz(): void {
    const index = new Map<string, string>();

    this.matriz.forEach(x => {
      index.set(
        this.keyRegla(x.tipoCodigo, x.procesoCodigo),
        this.normalizarRegla(x.regla)
      );
    });

    const procesos = this.procesosMatriz;

    this.filasMatriz = this.tiposProceso
      .map(tipo => {
        const reglas: Record<string, string> = {};
        procesos.forEach(proceso => {
          reglas[proceso.codigo] = index.get(
            this.keyRegla(tipo.codigo, proceso.codigo)
          ) ?? 'NA';
        });

        return {
          ...tipo,
          reglas
        } as FilaMatrizCosteo;
      })
      .sort((a, b) =>
        Number(a.nivel ?? 0) - Number(b.nivel ?? 0) ||
        a.nombre.localeCompare(b.nombre)
      );
  }

  private obtenerRegla(
    row: FilaMatrizCosteo,
    procesoCodigo: string
  ): ReglaCostoCodigo | string {
    return this.normalizarRegla(row?.reglas?.[procesoCodigo] ?? 'NA');
  }

  private marcarReglaDirty(
    tipoCodigo: string,
    procesoCodigo: string,
    regla: string
  ): void {
    const key = this.keyRegla(tipoCodigo, procesoCodigo);

    this.matrizDirty.set(key, {
      tipoCodigo,
      procesoCodigo,
      regla: this.normalizarRegla(regla),
      activo: true
    });
  }

  private keyRegla(tipoCodigo: string, procesoCodigo: string): string {
    return `${String(tipoCodigo).trim().toUpperCase()}|${String(procesoCodigo).trim().toUpperCase()}`;
  }

  private esProcesoMatriz(codigo: string): boolean {
    return this.procesosMatriz.some(x => x.codigo === codigo);
  }

  nombreProceso(codigo: string): string {
    return this.procesos.find(x => x.codigo === codigo)?.nombre ??
      codigo;
  }

  // ===========================================================================
  // TIPOS / NIVELES
  // ===========================================================================

  nuevoTipo(): void {
    this.resetearTipo();
    this.popupTipoVisible = true;
  }

  editarTipo(item: TipoProcesoMantenimiento): void {
    this.tipoEdicion = { ...item, esNuevo: false };
    this.popupTipoVisible = true;
  }

  guardarTipoLocal(): void {
    if (this.tipoNuevoInvalido) {
      void showAlert('', 'Seleccione un tipo disponible con lote válido que no está agregado.', 'warning');
      return;
    }
    const item: TipoProcesoMantenimiento = {
      ...this.tipoEdicion,
      codigo: String(this.tipoEdicion.codigo ?? '').trim().toUpperCase(),
      nombre: String(this.tipoEdicion.nombre ?? '').trim(),
      tipoLoteCodigo: String(this.tipoEdicion.tipoLoteCodigo ?? '').trim().toUpperCase(),
      nivel: Number(this.tipoEdicion.nivel ?? 2),
      activo: !!this.tipoEdicion.activo
    };

    if (!item.codigo || !item.nombre || !item.tipoLoteCodigo) {
      showAlert('', 'Código, descripción y tipo de lote son obligatorios.', 'warning');
      return;
    }

    if (!Number.isInteger(item.nivel) || item.nivel < 1 || item.nivel > (item.esNuevo ? 9 : 5)) {
      showAlert('', item.esNuevo ? 'El nivel debe estar entre NV1 y NV9.' : 'El nivel debe estar entre NV1 y NV5.', 'warning');
      return;
    }

    const existente = this.tiposProceso.find(x => x.codigo === item.codigo);
    if (item.esNuevo && existente) {
      showAlert('', `El código ${item.codigo} ya existe.`, 'warning');
      return;
    }

    item.tipoLote = this.tiposLote.find(x => x.codigo === item.tipoLoteCodigo)?.nombre ?? '';

    if (existente) {
      Object.assign(existente, item, { esNuevo: false });
    } else {
      this.tiposProceso.push({ ...item, esNuevo: true });

      // Una alta nueva queda completa desde el primer guardado: no habrá que
      // ejecutar luego un script para llenar su matriz.
      this.procesosMatriz.forEach(proceso => {
        this.marcarReglaDirty(item.codigo, proceso.codigo, 'NA');
      });
    }

    // invalidar la cache tras Object.assign o push, incluso sin cambiar length.
    this.tiposProceso = [...this.tiposProceso];
    this.tiposDirty.set(item.codigo, { ...item });
    // excluir también los tipos agregados pendientes de guardado.
    this.tiposProcesoDisponibles = this.tiposProcesoDisponibles.filter(x => x.codigo !== item.codigo);
    this.construirMatrizConCambiosPendientes();
    this.popupTipoVisible = false;
  }

  private construirMatrizConCambiosPendientes(): void {
    this.construirMatriz();

    this.matrizDirty.forEach(cambio => {
      const row = this.filasMatriz.find(x => x.codigo === cambio.tipoCodigo);
      if (row) row.reglas[cambio.procesoCodigo] = cambio.regla;
    });
  }

  // ===========================================================================
  // CUENTAS
  // ===========================================================================

  nuevaCuenta(): void {
    // this.cuentaEdicion = this.nuevaCuentaVacia();
    // this.cuentaEdicion.id = this.tempCuentaId--;
    // this.cuentaEdicion.esNuevo = true;
    // this.popupCuentaVisible = true;
    void this.abrirAgregarCuentas();
  }

  async abrirAgregarCuentas(): Promise<void> {
    this.agregarSeleccionadas.clear();
    this.agregarSeleccion = [];
    this.agregarClaves = [];
    this.agregarUnica = undefined;
    this.agregarEtapa = '';
    this.agregarProceso = '';
    this.popupAgregarVisible = true;
    await this.buscarDisponibles();
  }

  // no consultar nuevamente si la carga inicial está en curso o terminó.
  async abrirTransferirCuentas(): Promise<void> {
    this.resetearTransferir();
    this.popupTransferirVisible = true;
    if (!this.cuentasCargadas && !this.cuentasCargando) await this.cargarCuentas();
  }

  resetearTransferir(): void {
    this.transferirEtapaOrigen = '';
    this.transferirProcesoOrigen = '';
    this.transferirEtapaDestino = '';
    this.transferirProcesoDestino = '';
    this.transferirClaves = [];
    this.transferirCuentas = [];
    this.transferirProcesosOrigen = [];
    this.transferirProcesosDestino = [];
  }

  actualizarOrigenTransferencia(): void {
    this.transferirProcesosOrigen = this.procesosTransferencia(this.transferirEtapaOrigen);
    this.transferirProcesoOrigen = '';
    this.actualizarCuentasTransferencia();
  }

  // procesos configurados activos, incluidos los nuevos y los que no tienen cuentas.
  private procesosTransferencia(etapaCodigo: string): ProcesoCostoMantenimiento[] {
    const cantidades = new Map<string, number>();
    this.cuentas.filter(x => x.activo && x.etapaCodigo === etapaCodigo)
      .forEach(x => {
        const codigo = x.procesoCodigo;
        if (!codigo) return;
        cantidades.set(codigo, (cantidades.get(codigo) || 0) + 1);
      });
    return this.procesos
      .filter(x => !this.esProcesoDiario(x) && x.activo && !x.sinProceso && x.etapaCodigo === etapaCodigo)
      .map(x => ({ ...x, cantidadCuentas: cantidades.get(x.codigo) || 0 }));
  }

  textoOrigenTransferencia(item: ProcesoCostoMantenimiento): string {
    return item ? `${item.nombre} (${item.codigo}) · ${item.cantidadCuentas ?? 0} cuentas` : '';
  }

  actualizarCuentasTransferencia(): void {
    this.transferirClaves = [];
    this.transferirCuentas = this.transferirProcesoOrigen ? this.cuentas.filter(x => x.activo &&
      x.etapaCodigo === this.transferirEtapaOrigen &&
      x.procesoCodigo === this.transferirProcesoOrigen) : [];
    this.actualizarDestinoTransferencia();
  }

  actualizarDestinoTransferencia(): void {
    this.transferirProcesoDestino = '';
    this.transferirProcesosDestino = this.procesosTransferencia(this.transferirEtapaDestino)
      .filter(x => x.codigo !== this.transferirProcesoOrigen);
  }

  get puedeTransferir(): boolean {
    return this.popupTransferirVisible && this.cuentasCargadas && !this.cuentasCargando && !this.loadingVisible &&
      this.transferirProcesosOrigen.some(x => x.codigo === this.transferirProcesoOrigen) &&
      this.transferirProcesosDestino.some(x => x.codigo === this.transferirProcesoDestino) &&
      this.transferirProcesoOrigen !== this.transferirProcesoDestino && this.transferirClaves.length > 0;
  }

  confirmarTransferencia(): void {
    if (!this.puedeTransferir) return;
    const destino = this.procesos.find(x => !this.esProcesoDiario(x) && x.activo && !x.sinProceso &&
      x.etapaCodigo === this.transferirEtapaDestino && x.codigo === this.transferirProcesoDestino);
    if (!destino) return;
    const claves = new Set(this.transferirClaves);
    const seleccionadas = this.cuentas.filter(x => claves.has(x.id) && x.activo &&
      x.etapaCodigo === this.transferirEtapaOrigen &&
      x.procesoCodigo === this.transferirProcesoOrigen);
    if (!seleccionadas.length) return;
    seleccionadas.forEach(item => {
      // conservar el primer origen; una cuenta nueva no anula valorizaciones.
      if (!item.esNuevo && !this.cuentasTransferidasOrigen.has(String(item.id))) {
        this.cuentasTransferidasOrigen.set(String(item.id), { ...item });
      }
      item.etapaCodigo = destino.etapaCodigo;
      item.etapa = this.etapas.find(x => x.codigo === destino.etapaCodigo)?.nombre ?? destino.etapa;
      item.procesoCodigo = destino.codigo;
      item.procesoNombre = destino.nombre;
      item.procesoResuelto = destino.codigo;
      this.cuentasDirty.set(String(item.id), { ...item });
    });
    this.cuentas = [...this.cuentas];
    this.popupTransferirVisible = false;
    setTimeout(() => void showAlert('', `${seleccionadas.length} cuentas movidas a ${destino.nombre}. Presione Guardar para aplicar.`, 'info'), 450);
  }

  // sincronizar los editores de texto sin concatenar terminos (la API busca una frase).
  onTextoCatalogoCambio(value: string): void {
    // el binding del buscador superior tambien emite onValueChanged.
    if ((value ?? '') === this.agregarTexto) return;
    this.agregarTexto = value ?? '';
    this.agregarCamposTexto.forEach(campo => this.agregarFiltros[campo] = null);
    this.onBusquedaCambio();
  }

  onFiltroAgregarCambio(e: any): void {
    if (!this.popupAgregarVisible) return;
    if (e.fullName === 'searchPanel.text') {
      if ((e.value ?? '') !== this.agregarTexto) this.onTextoCatalogoCambio(e.value);
      return;
    }
    const columna = /^columns\[(\d+)\]\.filterValue$/.exec(e.fullName ?? '');
    if (!columna) return;
    const campo = e.component.columnOption(Number(columna[1]), 'dataField');
    if (!['cuenta', 'centroCodigo', 'subcentroCodigo', ...this.agregarCamposTexto].includes(campo)) return;
    const valor = e.value === null || e.value === undefined || e.value === '' ? null : String(e.value);
    // Ignorar ecos de bindings y limpiezas programaticas para no recargar en bucle.
    if ((this.agregarFiltros[campo] ?? null) === valor) return;
    if (this.agregarCamposTexto.includes(campo)) {
      this.agregarCamposTexto.forEach(nombre => this.agregarFiltros[nombre] = null);
      this.agregarTexto = valor ?? '';
    }
    this.agregarFiltros[campo] = valor;
    this.onBusquedaCambio();
  }

  // un solo debounce de 400 ms, tambien para la fila y el panel de busqueda.
  onEditorAgregarPreparando(e: any): void {
    if (e.parentType === 'filterRow' || e.parentType === 'searchPanel') e.updateValueTimeout = 0;
  }

  // evitar consultas pendientes y recursos retenidos al salir.
  ngOnDestroy(): void {
    // liberar también el aviso informativo del nivel 1.
    clearTimeout(this.esperaGuardadoTimer);
    clearTimeout(this.busquedaTimer);
    ++this.busquedaVersion;
    this.agregarFuente.dispose();
  }

  onBusquedaCambio(): void {
    // los reseteos de editores ocultos no disparan consultas.
    if (!this.popupAgregarVisible) return;
    clearTimeout(this.busquedaTimer);
    ++this.busquedaVersion;
    this.agregarCargando = true;
    // cada filtro inicia una nueva paginacion global.
    this.agregarPagina = 1;
    this.busquedaTimer = setTimeout(() => void this.buscarDisponibles(1), 400);
  }

  async buscarDisponibles(pagina = 1): Promise<void> {
    // no cargar resultados en un modal cerrado.
    if (!this.popupAgregarVisible) return;
    clearTimeout(this.busquedaTimer);
    const version = ++this.busquedaVersion;
    this.agregarCargando = true;
    try {
      const resp = await callApi<any>(this.service.cuentasDisponibles({
        empresa: this.empresa.value, texto: this.agregarTexto,
        cuenta: this.agregarFiltros['cuenta'] ?? undefined,
        centro: this.agregarFiltros['centroCodigo'] ?? undefined,
        subcentro: this.agregarFiltros['subcentroCodigo'] ?? undefined,
        soloDisponibles: this.agregarSoloDisponibles, pagina, cantidad: 50
      }));
      if (version !== this.busquedaVersion) return;
      if (!resp.ok) {
        this.agregarDisponibles = [];
        this.agregarUnica = undefined;
        this.agregarTotal = 0;
        // limpiar tambien la fuente remota al fallar.
        await this.agregarFuente.reload();
        await showAlert('', resp.message, 'error');
        return;
      }
      const data = (resp.data?.Dt ?? {}) as CuentasDisponiblesResultado;
      // disabledExpr no existe en dx-select-box 23.1.7; disabled es la propiedad nativa del elemento.
      this.agregarDisponibles = (data.items ?? []).map(x => ({ ...x, disabled: x.asignada }));
      this.agregarTotal = data.total ?? 0;
      this.agregarPagina = data.pagina ?? pagina;
      this.agregarUnica = undefined;
      // actualizar snapshots sin perder selecciones de otras paginas.
      this.agregarDisponibles.forEach(item => {
        const clave = this.claveCuenta(item);
        if (item.asignada) this.agregarSeleccionadas.delete(clave);
        else if (this.agregarSeleccionadas.has(clave)) this.agregarSeleccionadas.set(clave, item);
      });
      this.sincronizarSeleccionAgregar();
      await this.agregarFuente.reload();
    } finally {
      if (version === this.busquedaVersion) this.agregarCargando = false;
    }
  }

  onSeleccionUnica(item?: CuentaDisponible): void {
    this.agregarUnica = item && !item.asignada ? item : undefined;
  }

  onFilaDisponible(e: any): void {
    if (e.rowType !== 'data') return;
    e.rowElement.classList.toggle('fila-asignada', !!e.data.asignada);
    e.rowElement.title = e.data.asignada ? e.data.mensaje : e.data.anulada ? 'Se reactivará' : '';
  }

  onSeleccionGrupo(e: any): void {
    if (this.agregarCargando || !this.popupAgregarVisible) return;
    // los ecos de selectedRowKeys no son cambios del usuario.
    if (!(e.currentSelectedRowKeys?.length || e.currentDeselectedRowKeys?.length)) return;
    const visibles = new Map(this.agregarDisponibles.map(x => [this.claveCuenta(x), x]));
    (e.currentDeselectedRowKeys ?? []).forEach((key: CuentaDisponible) => {
      const clave = this.claveCuenta(key);
      if (visibles.has(clave)) this.agregarSeleccionadas.delete(clave);
    });
    (e.currentSelectedRowKeys ?? []).forEach((key: CuentaDisponible) => {
      const item = visibles.get(this.claveCuenta(key));
      if (item && !item.asignada) this.agregarSeleccionadas.set(this.claveCuenta(item), item);
    });
    this.sincronizarSeleccionAgregar();
    const asignadas = (e.selectedRowsData ?? []).filter((x: CuentaDisponible) => x.asignada);
    if (asignadas.length) void e.component.deselectRows(asignadas.map((x: CuentaDisponible) => ({
      empresa: x.empresa, cuenta: x.cuenta, centroCodigo: x.centroCodigo, subcentroCodigo: x.subcentroCodigo
    })));
  }

  private sincronizarSeleccionAgregar(): void {
    this.agregarSeleccion = Array.from(this.agregarSeleccionadas.values());
    this.agregarClaves = this.agregarSeleccion.map(x => ({
      empresa: x.empresa, cuenta: x.cuenta, centroCodigo: x.centroCodigo, subcentroCodigo: x.subcentroCodigo
    }));
  }

  confirmarAgregar(): void {
    if (this.agregarCargando) return;
    const etapa = this.etapas.find(x => x.codigo === this.agregarEtapa);
    const proceso = this.procesosAgregarDisponibles.find(x => x.codigo === this.agregarProceso);
    const seleccion = this.modoAgregar === 'unica' ? (this.agregarUnica ? [this.agregarUnica] : []) : Array.from(this.agregarSeleccionadas.values()); // incluye todas las paginas.
    if (!etapa || !proceso || !seleccion.length) {
      void showAlert('', 'Seleccione una etapa, un proceso productivo activo de esa etapa y al menos una cuenta.', 'warning');
      return;
    }
    const claves = new Set([...this.cuentas.filter(x => x.activo), ...this.cuentasDirty.values()].map(x => this.claveCuenta(x)));
    for (const cuenta of seleccion) {
      const clave = this.claveCuenta({ ...cuenta, empresa: this.empresa.value });
      if (cuenta.asignada || claves.has(clave)) {
        void showAlert('', cuenta.asignada ? cuenta.mensaje : `La cuenta ${cuenta.cuenta} ya está configurada o tiene cambios pendientes.`, 'warning');
        return;
      }
      claves.add(clave);
    }
    const nuevas: CuentaCostoMantenimiento[] = seleccion.map(x => ({
      ...this.nuevaCuentaVacia(), id: this.tempCuentaId--, empresa: this.empresa.value,
      procesoCodigo: proceso.codigo,
      etapaCodigo: etapa.codigo, etapa: etapa.nombre, cuenta: x.cuenta, cuentaNombre: x.cuentaNombre,
      centroCodigo: x.centroCodigo, centroNombre: x.centroNombre,
      subcentroCodigo: x.subcentroCodigo, subcentroNombre: x.subcentroNombre,
      auxiliarCodigo: x.auxiliarCodigo, auxiliarNombre: x.auxiliarNombre,
      activo: true, esNuevo: true, procesoResuelto: proceso.codigo, procesoNombre: proceso.nombre, driverResuelto: 'Se resolverá al guardar'
    }));
    this.cuentas = [...nuevas, ...this.cuentas];
    nuevas.forEach(x => this.cuentasDirty.set(String(x.id), { ...x }));
    this.popupAgregarVisible = false;
  }

  // valor de presentación sin modificar el contrato ni los datos guardados.
  etapaEspecifica(item: CuentaCostoMantenimiento): string {
    return item.procesoNombre?.trim() || item.procesoResuelto || '';
  }

  // cada onHidden limpia solo el estado de su modal, después de aceptar.
  resetearRegla(): void {
    this.reglaTipoCodigo = '';
    this.reglaTipoNombre = '';
    this.reglaProcesoCodigo = '';
    this.reglaProcesoNombre = '';
    this.reglaSeleccionada = 'NA';
  }

  resetearTipo(): void { this.tipoEdicion = this.nuevoTipoVacio(); this.tipoDisponibleCodigo = ''; }
  resetearCuenta(): void {
    this.cuentaEdicion = this.nuevaCuentaVacia();
    this.cuentaOriginal = undefined;
    this.cuentaEtapaCambiada = false;
  }
  resetearProceso(): void { this.procesoEdicion = this.nuevoProcesoVacio(); this.procesoOriginal = undefined; }

  resetearAgregar(): void {
    // limpiar filtros y seleccion solo al cerrar la modal.
    this.agregarFiltros = {};
    this.agregarSeleccionadas.clear();
    clearTimeout(this.busquedaTimer);
    this.busquedaTimer = undefined;
    ++this.busquedaVersion;
    this.agregarSeleccion = [];
    this.agregarClaves = [];
    this.agregarUnica = undefined;
    this.agregarTexto = '';
    this.agregarDisponibles = [];
    this.agregarTotal = 0;
    this.agregarPagina = 1;
    this.agregarEtapa = '';
    this.agregarProceso = '';
    this.modoAgregar = 'unica';
    this.agregarSoloDisponibles = false;
    this.agregarCargando = false;
  }

  private claveCuenta(c: Pick<CuentaCostoMantenimiento, 'empresa' | 'cuenta' | 'centroCodigo' | 'subcentroCodigo'>): string {
    return `${Number(c.empresa)}|${String(c.cuenta).trim()}|${String(c.centroCodigo).trim()}|${String(c.subcentroCodigo).trim()}`;
  }

  cambiarActivoCuenta(item: CuentaCostoMantenimiento, value: boolean): void {
    if (item.activo === value) return;
    // una reactivación requiere proceso válido.
    if (value && !this.procesos.some(x => !this.esProcesoDiario(x) && x.activo && !x.sinProceso &&
      x.etapaCodigo === item.etapaCodigo && x.codigo === item.procesoCodigo)) {
      this.editarCuenta(item);
      this.cuentaEdicion.activo = true;
      return;
    }
    item.activo = value;
    this.cuentasDirty.set(String(item.id), { ...item });
  }

  editarCuenta(item: CuentaCostoMantenimiento): void {
    this.cuentaOriginal = { ...item };
    this.cuentaEtapaCambiada = false;
    this.cuentaEdicion = { ...item };
    this.popupCuentaVisible = true;
  }

  // selector limitado a procesos activos de la etapa.
  // conservar la referencia del resultado hasta que cambien sus entradas.
  private procesosCuentaDisponiblesCache?: {
    procesos: ProcesoCostoMantenimiento[];
    procesosLength: number;
    etapas: EtapaCostoMantenimiento[];
    etapasLength: number;
    etapaCodigo: CuentaCostoMantenimiento["etapaCodigo"];
    resultado: ProcesoCostoMantenimiento[];
  };

  get procesosCuentaDisponibles(): ProcesoCostoMantenimiento[] {
    const cache = this.procesosCuentaDisponiblesCache;
    if (!cache ||
        cache.procesos !== this.procesos ||
        cache.procesosLength !== this.procesos.length ||
        cache.etapas !== this.etapas ||
        cache.etapasLength !== this.etapas.length ||
        cache.etapaCodigo !== this.cuentaEdicion.etapaCodigo) {
      this.procesosCuentaDisponiblesCache = {
        procesos: this.procesos,
        procesosLength: this.procesos.length,
        etapas: this.etapas,
        etapasLength: this.etapas.length,
        etapaCodigo: this.cuentaEdicion.etapaCodigo,
        resultado: this.procesos.filter(x => !this.esProcesoDiario(x) && x.activo && !x.sinProceso && x.etapaCodigo === this.cuentaEdicion.etapaCodigo)
      };
    }
    return this.procesosCuentaDisponiblesCache!.resultado;
  }

  cambiarEtapaCuenta(codigo: string): void {
    if (codigo === this.cuentaEdicion.etapaCodigo) return;
    this.cuentaEdicion.etapaCodigo = codigo || '';
    this.cuentaEdicion.procesoCodigo = '';
    this.cuentaEdicion.procesoNombre = '';
    this.cuentaEdicion.procesoResuelto = '';
    this.cuentaEtapaCambiada = true;
  }

  get cuentaProcesoInvalido(): boolean {
    const item = this.cuentaEdicion;
    const requiereProceso = item.esNuevo || !this.cuentaOriginal || this.cuentaEtapaCambiada ||
      item.etapaCodigo !== this.cuentaOriginal.etapaCodigo ||
      (item.procesoCodigo || '') !== (this.cuentaOriginal.procesoCodigo || '') ||
      (item.activo && !this.cuentaOriginal.activo);
    return !!requiereProceso && !this.procesosCuentaDisponibles.some(x => x.codigo === item.procesoCodigo);
  }

  // el backend identifica expresamente los procesos calculados.
  textoProcesoCuenta(item: CuentaCostoMantenimiento): string {
    const texto = item.procesoNombre?.trim() || item.procesoResuelto || item.procesoCodigo || '';
    return item.procesoGuardado === false ? `${texto} (calculado)`.trim() : texto;
  }

  guardarCuentaLocal(): void {
    // validar antes de incorporar cambios al guardado.
    if (this.cuentaProcesoInvalido) {
      void showAlert('', 'Seleccione un proceso productivo activo de la etapa de la cuenta.', 'warning');
      return;
    }
    const item: CuentaCostoMantenimiento = {
      ...this.cuentaEdicion,
      empresa: this.empresa.value,
      etapaCodigo: String(this.cuentaEdicion.etapaCodigo ?? '').trim().toUpperCase(),
      centroCodigo: String(this.cuentaEdicion.centroCodigo ?? '').trim(),
      subcentroCodigo: String(this.cuentaEdicion.subcentroCodigo ?? '').trim(),
      cuenta: String(this.cuentaEdicion.cuenta ?? '').trim(),
      activo: !!this.cuentaEdicion.activo
    };

    if (!item.etapaCodigo || !item.centroCodigo || !item.subcentroCodigo || !item.cuenta) {
      showAlert('', 'Etapa, centro, subcentro y cuenta son obligatorios.', 'warning');
      return;
    }

    // const duplicada = this.cuentas.some(x =>
    //   x.id !== item.id &&
    //   Number(x.empresa) === Number(item.empresa) &&
    //   String(x.cuenta).trim() === item.cuenta
    // );
    const duplicada = this.cuentas.some(x => x.id !== item.id && this.claveCuenta(x) === this.claveCuenta(item));

    if (duplicada) {
      showAlert('', `La cuenta ${item.cuenta} ya está configurada para la empresa ${item.empresa}.`, 'warning');
      return;
    }

    item.etapa = this.etapas.find(x => x.codigo === item.etapaCodigo)?.nombre ?? '';
    const proceso = this.procesos.find(x => x.codigo === item.procesoCodigo);
    if (proceso) {
      item.procesoResuelto = proceso.codigo;
      item.procesoNombre = proceso.nombre;
    }
    item.driverResuelto = item.esNuevo ? 'Se resolverá al guardar' : item.driverResuelto;

    const existente = this.cuentas.find(x => x.id === item.id);
    if (existente) {
      Object.assign(existente, item);
    } else {
      this.cuentas.unshift({ ...item });
    }

    this.cuentasDirty.set(String(item.id), { ...item });
    this.popupCuentaVisible = false;
  }

  // ===========================================================================
  // PROCESOS
  // ===========================================================================

  // procesos y ParamProc se editan y guardan juntos.
  nuevoProceso(): void {
    this.resetearProceso();
    this.actualizarOrdenProceso();
    this.popupProcesoVisible = true;
  }

  editarProceso(item: ProcesoCostoMantenimiento): void {
    this.procesoOriginal = item;
    this.procesoEdicion = { ...item, uso: item.etapaCodigo === 'DM' ? 'Diario' : 'Productivo',
      esDiario: item.etapaCodigo === 'DM', modoValor: item.modoValor || this.modo.CALCULADO };
    this.popupProcesoVisible = true;
  }

  get procesoEnEdicion(): boolean { return !!this.procesoOriginal; }

  get nombreProcesoBloqueado(): boolean {
    return !this.procesoDiario && (!!this.procesoEdicion.sinProceso || this.nombresVinculados.has(this.procesoEdicion.paramId || 0));
  }

  get modosProcesoDisponibles() {
    return this.procesoEdicion.sinProceso
      ? this.catalogoModo.filter(x => x.codigo !== this.modo.TARIFA || this.procesoEdicion.modoValor === this.modo.TARIFA)
      : this.catalogoModo;
  }

  // conservar la referencia del resultado hasta que cambien sus entradas.
  private tiposTarifaDisponiblesCache?: {
    tiposProceso: TipoProcesoMantenimiento[];
    tiposProcesoLength: number;
    resultado: TipoProcesoMantenimiento[];
  };

  get tiposTarifaDisponibles(): TipoProcesoMantenimiento[] {
    const cache = this.tiposTarifaDisponiblesCache;
    if (!cache ||
        cache.tiposProceso !== this.tiposProceso ||
        cache.tiposProcesoLength !== this.tiposProceso.length) {
      this.tiposTarifaDisponiblesCache = {
        tiposProceso: this.tiposProceso,
        tiposProcesoLength: this.tiposProceso.length,
        resultado: this.tiposProceso.filter(x => x.activo)
      };
    }
    return this.tiposTarifaDisponiblesCache!.resultado;
  }

  get tipoDisponibleSeleccionado(): TipoProcesoDisponible | undefined {
    return this.tiposProcesoDisponibles.find(x => x.codigo === this.tipoDisponibleCodigo);
  }

  get tipoNuevoInvalido(): boolean {
    return !!this.tipoEdicion.esNuevo && (!this.tipoDisponibleSeleccionado?.loteValido ||
      this.tiposProceso.some(x => x.codigo === this.tipoDisponibleCodigo));
  }

  textoTipoDisponible(item: TipoProcesoDisponible): string {
    return item ? `${item.codigo} - ${item.nombre} (${item.tipoLoteCodigo})` : '';
  }

  seleccionarTipoDisponible(codigo: string): void {
    this.tipoDisponibleCodigo = codigo || '';
    const tipo = this.tipoDisponibleSeleccionado;
    this.tipoEdicion = { ...this.tipoEdicion, codigo: tipo?.codigo ?? '', nombre: tipo?.nombre ?? '',
      tipoLoteCodigo: tipo?.tipoLoteCodigo ?? '', tipoLote: tipo?.tipoLote ?? '', nivel: tipo?.nivelSugerido ?? 2 };
  }

  actualizarOrdenProceso(): void {
    if (!this.procesoEdicion.esNuevo || this.procesoEdicion.sinProceso || (this.procesoDiario && this.procesoEnEdicion)) return;
    this.procesoEdicion.orden = Math.max(0, ...this.procesos
      .filter(x => x !== this.procesoOriginal && !x.sinProceso && x.etapaCodigo === this.procesoEdicion.etapaCodigo)
      .map(x => Number(x.orden) || 0)) + 1;
  }

  // conservar la referencia del resultado hasta que cambien sus entradas.
  private procesosAgregarDisponiblesCache?: {
    procesos: ProcesoCostoMantenimiento[];
    procesosLength: number;
    etapas: EtapaCostoMantenimiento[];
    etapasLength: number;
    agregarEtapa: string;
    resultado: ProcesoCostoMantenimiento[];
  };

  get procesosAgregarDisponibles(): ProcesoCostoMantenimiento[] {
    const cache = this.procesosAgregarDisponiblesCache;
    if (!cache ||
        cache.procesos !== this.procesos ||
        cache.procesosLength !== this.procesos.length ||
        cache.etapas !== this.etapas ||
        cache.etapasLength !== this.etapas.length ||
        cache.agregarEtapa !== this.agregarEtapa) {
      this.procesosAgregarDisponiblesCache = {
        procesos: this.procesos,
        procesosLength: this.procesos.length,
        etapas: this.etapas,
        etapasLength: this.etapas.length,
        agregarEtapa: this.agregarEtapa,
        resultado: this.procesos.filter(x => !this.esProcesoDiario(x) && x.activo && !x.sinProceso && x.etapaCodigo === this.agregarEtapa)
      };
    }
    return this.procesosAgregarDisponiblesCache!.resultado;
  }

  // requisitos comunes para cuenta única y grupo.
  get mensajeAgregar(): string {
    if (!this.agregarEtapa) return 'Seleccione una etapa y un proceso productivo.';
    if (!this.procesosAgregarDisponibles.some(x => x.codigo === this.agregarProceso)) {
      return 'Seleccione un proceso productivo activo de la etapa.';
    }
    if (this.modoAgregar === 'unica' ? !this.agregarUnica : !this.agregarSeleccion.length) {
      return 'Seleccione al menos una cuenta.';
    }
    return '';
  }

  // información TAR/FIC sin cambiar las reglas de costeo.
  tiposProcesoMatrizTexto = (item: ProcesoCostoMantenimiento): string => {
    if (this.esProcesoDiario(item)) return '';
    return [item.tipoProcesoCodigo ? `Tarifa: ${item.tipoProcesoCodigo}` : '',
      item.tiposFicha ? `Ficha: ${item.tiposFicha}` : ''].filter(Boolean).join(' · ');
  }

  get tiposTarifaProcesoLectura(): string {
    return this.procesoOriginal?.tipoProcesoCodigo || '';
  }

  cambiarEtapaAgregar(): void { this.agregarProceso = ''; }

  actualizarCodigoProceso(): void {
    if (!this.procesoEdicion.esNuevo || this.procesoEdicion.editarCodigo || this.procesoOriginal) return;
    const conectores = new Set(['DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'Y', 'E', 'EN', 'A', 'PARA', 'CON', 'POR']);
    const palabras = this.procesoEdicion.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
      .split(/\s+/).map(x => x.replace(/[^A-Z0-9]/g, '')).filter(x => x && !conectores.has(x));
    this.procesoEdicion.codigo = (palabras[0] || '').slice(0, 3);
  }

  etiquetaModoProceso = (item: ProcesoCostoMantenimiento): string => {
    if (this.esProcesoDiario(item)) return '';
    return item.modoValor === TipoValorProceso.TARIFA ? 'Tarifa'
      : item.modoValor === TipoValorProceso.DOLARES_TOTALES ? 'Dólares totales' : 'Calculado';
  }

  tipoProcesoTexto = (item: ProcesoCostoMantenimiento): string =>
    this.esProcesoDiario(item) ? '' : item.tipoProceso || item.tipoProcesoCodigo || '';

  // etiquetas y valores filtrables de la grilla.
  usoProcesoTexto = (item: ProcesoCostoMantenimiento): string => this.esProcesoDiario(item) ? 'Diarios' : 'Costeo';
  tarifaProcesoValor = (item: ProcesoCostoMantenimiento): boolean | null => this.esProcesoDiario(item) ? null : !!item.esTarifa;
  fichaProcesoValor = (item: ProcesoCostoMantenimiento): boolean | null => this.esProcesoDiario(item) ? null : !!item.esFichaTecnica;

  guardarProcesoLocal(): void {
    // ignorar un segundo clic cuando el alta ya cerró la modal de proceso.
    if (!this.popupProcesoVisible || this.resolverAvisoRecosteo) return;
    this.actualizarOrdenProceso();
    const original = this.procesoOriginal;
    const item: ProcesoCostoMantenimiento = {
      ...this.procesoEdicion, codigo: String(this.procesoEdicion.codigo ?? '').trim().toUpperCase(),
      nombre: String(this.procesoEdicion.nombre ?? '').trim(),
      etapaCodigo: String(this.procesoEdicion.etapaCodigo ?? '').trim().toUpperCase(),
      orden: Number(this.procesoEdicion.orden ?? 0), activo: !!this.procesoEdicion.activo,
      modoValor: this.procesoEdicion.modoValor || this.modo.CALCULADO
    };
    // validar el uso elegido antes de deducirlo de la etapa.
    const blDiario = this.procesoEdicion.uso === 'Diario' || this.procesoEdicion.uso === 'DIARIO';
    if (!item.sinProceso && (blDiario !== (item.etapaCodigo === 'DM'))) {
      void showAlert('', 'Productivo no puede usar la etapa DM; Diario contable debe usar la etapa DM.', 'warning');
      return;
    }
    // diarios existentes conservan código, etapa y orden; solo nombre/activo cambian.
    if (original && this.esProcesoDiario(original)) {
      Object.assign(item, original, { nombre: item.nombre, activo: item.activo });
    }
    item.esDiario = this.esProcesoDiario(item);
    item.uso = item.esDiario ? 'Diario' : 'Productivo';
    if (item.esDiario) {
      Object.assign(item, { modoValor: this.modo.CALCULADO, tipoProcesoCodigo: '', tipoProceso: '',
        esTarifa: false, esFichaTecnica: false, tiposFicha: '', paramId: 0, enMatriz: false });
    }
    const advertir = (mensaje: string) => { void showAlert('', mensaje, 'warning'); };
    if (!this.catalogoModo.some(x => x.codigo === item.modoValor)) { advertir('Seleccione un modo de valor válido.'); return; }
    if (item.sinProceso) {
      if (!original || !original.paramId) { advertir('No se encontró la fila de parámetros. Recargue los datos.'); return; }
      // Solo Activo y el modo no tarifario pueden cambiar en una fila huérfana.
      Object.assign(item, original, { activo: item.activo,
        modoValor: original.modoValor === this.modo.TARIFA ? original.modoValor : item.modoValor });
      if (original.modoValor !== this.modo.TARIFA && item.modoValor === this.modo.TARIFA) {
        advertir('Una fila sin proceso solo admite Calculado o Dólares totales.'); return;
      }
    } else {
      const etapa = this.etapas.find(x => x.codigo === item.etapaCodigo);
      // el uso debe corresponder a la etapa DM.
      if ((item.uso === 'Diario') !== (item.etapaCodigo === 'DM')) {
        advertir('Diario contable requiere la etapa DM; Productivo requiere una etapa productiva.'); return;
      }
      if (!item.nombre || item.nombre.length > 100 || !etapa || !Number.isInteger(item.orden)) {
        advertir('Nombre (máximo 100 caracteres), etapa existente y orden entero son obligatorios.'); return;
      }
      if (original && item.codigo !== original.codigo) { advertir('El código no se puede cambiar al editar.'); return; }
      if (this.nombreProcesoBloqueado && item.nombre !== original?.nombre) {
        advertir('La descripción es llave del costeo'); return;
      }
      if (item.esNuevo && item.editarCodigo) {
        if (!/^[A-Z0-9]{3,5}$/.test(item.codigo)) { advertir('El código debe tener de 3 a 5 caracteres A-Z o 0-9.'); return; }
        if (this.procesos.some(x => x !== original && x.codigo === item.codigo) || this.tiposProceso.some(x => x.codigo === item.codigo)) {
          advertir('El código ya existe como proceso o tipo de proceso.'); return;
        }
      } else if (item.esNuevo && !item.codigo) {
        advertir('El nombre debe permitir generar un código con letras o números.'); return;
      }
      if (!item.esDiario && !item.activo && Number(item.cantidadCuentas || 0) > 0) { advertir('No se puede inactivar un proceso con cuentas activas.'); return; }
      if (item.modoValor === this.modo.TARIFA) {
        const tipo = this.tiposProceso.find(x => x.codigo === item.tipoProcesoCodigo && x.activo);
        if (!tipo || this.procesos.some(x => x.codigo === tipo.codigo)) { advertir('Seleccione un tipo de proceso activo para la tarifa.'); return; }
        item.tipoProceso = tipo.nombre;
      } else if (original?.modoValor === this.modo.TARIFA) {
        item.tipoProcesoCodigo = ''; item.tipoProceso = '';
      }
      item.etapa = etapa.nombre;
      item.esTarifa = item.modoValor === this.modo.TARIFA || (original?.modoValor !== this.modo.TARIFA && !!original?.esTarifa);
    }
    const destino = original || { ...item };
    Object.assign(destino, item);
    if (!original) this.procesos = [...this.procesos, destino];
    // La vista previa automática puede repetirse: el servidor resuelve colisiones al guardar.
    let clave = item.sinProceso ? `param:${item.paramId}` : `proceso:${item.codigo}`;
    if (item.esNuevo) {
      clave = this.clavesProcesosNuevos.get(destino) || `nuevo:${++this.siguienteProceso}`;
      this.clavesProcesosNuevos.set(destino, clave);
    }
    this.procesosDirty.set(clave, { ...item });
    this.procesos = [...this.procesos];
    this.popupProcesoVisible = false;
    // informar solo al confirmar un proceso nuevo, una vez por clave temporal.
    if (!item.esDiario && item.esNuevo && !this.procesosAvisadosRecosteo.has(clave)) {
      this.procesosAvisadosRecosteo.add(clave);
      void this.mostrarAvisoRecosteo([item], false);
    }
  }

  private nuevoProcesoVacio(): ProcesoCostoMantenimiento {
    return { uso: 'Productivo', esDiario: false, codigo: '', nombre: '', etapaCodigo: '', etapa: '', orden: 0, activo: true, enMatriz: false,
      cantidadCuentas: 0, esNuevo: true, modoValor: TipoValorProceso.CALCULADO, tipoProcesoCodigo: '',
      tipoProceso: '', esTarifa: false, paramId: 0, sinProceso: false, editarCodigo: false };
  }

  // ===========================================================================
  // GUARDADO
  // ===========================================================================

  async guardarCambios(): Promise<void> {
    // impedir aperturas y envíos duplicados mientras se confirma o guarda.
    if (this.loadingVisible || this.resolverAvisoRecosteo || this.popupEjecucionVisible) return;
    if (!this.hayCambios) {
      await showAlert('', 'No existen cambios pendientes.', 'info');
      return;
    }

    // La confirmación global es independiente del aviso informativo ya visto al crear.
    const procesosNuevos = Array.from(this.procesosDirty.values()).filter(x => x.esNuevo && !this.esProcesoDiario(x));
    const requiereRecosteo = procesosNuevos.length > 0 || this.hayTransferenciasPendientes;
    if (requiereRecosteo && !await this.mostrarAvisoRecosteo(procesosNuevos, true)) return;

    const request: GuardarCostoProductivoMantenimientoRequest = {
      usuario: this.usuarioActual(),
      procesos: Array.from(this.procesosDirty.values()).map(x => ({ ...x,
        uso: x.etapaCodigo === 'DM' ? 'Diario' : 'Productivo' })),
      tiposProceso: Array.from(this.tiposDirty.values()).map(x => ({ ...x })),
      matriz: Array.from(this.matrizDirty.values()).map(x => ({ ...x })),
      cuentas: Array.from(this.cuentasDirty.values()).map(x => ({ ...x }))
    };

    if (this.hayTransferenciasPendientes) {
      this.iniciarEjecucion(request);
      await this.ejecutarNiveles();
      return;
    }
    this.loadingVisible = true;
    try {
      const resp = await callApi<{ Dt?: GuardarCostoProductivoMantenimientoResponse }>(this.service.guardar(request));
      if (!resp.ok) {
        this.loadingVisible = false;
        await showAlert('', resp.message, 'error');
        return;
      }
      this.loadingVisible = false;
      const anuladas = resp.data?.Dt?.valorizacionesAnuladas;
      if (anuladas?.hayTransferencia || anuladas?.requiereAnulacion) {
        this.iniciarEjecucion(request);
        this.nivelesEjecucion[0].estado = 'Completado';
        this.requiereAnulacionEjecucion = true;
        this.cuentasTransferidasOrigen.clear();
        await this.ejecutarNiveles();
        return;
      }
      await showAlert('', 'Configuración guardada correctamente.' +
        (requiereRecosteo ? ' Recuerde volver a costear el consolidado de ParamProc.' : ''), 'success');
      this.cuentasTransferidasOrigen.clear();
      await this.cargar();
    } finally {
      this.loadingVisible = false;
    }
  }

  // conservar el request para reintentar únicamente el guardado fallido.
  private iniciarEjecucion(request: GuardarCostoProductivoMantenimientoRequest): void {
    // una sola captura para el encabezado y los tres niveles.
    clearTimeout(this.esperaGuardadoTimer);
    this.transferenciasEjecucion = this.obtenerTransferenciasEjecucion();
    // capturar antes de guardar y limpiar las transferencias pendientes.
    this.requestEjecucion = request;
    this.resumenEjecucion = '';
    this.requiereAnulacionEjecucion = false;
    this.frescoCabecerasEjecucion = 0;
    this.reproCabecerasEjecucion = 0;
    this.nivelesEjecucion = [
      { clave: 'GUARDAR', titulo: 'Guardando cuentas y transferencia', estado: 'Pendiente', mensaje: '' },
      { clave: 'FRESCO', titulo: 'Anulando valorizaciones de materia prima fresca', estado: 'Pendiente', mensaje: '' },
      { clave: 'REPRO', titulo: 'Anulando valorizaciones de reproceso', estado: 'Pendiente', mensaje: '' }
    ];
    this.popupEjecucionVisible = true;
  }

  get hayErrorEjecucion(): boolean {
    return this.nivelesEjecucion.some(nivel => nivel.estado === 'Error');
  }

  // ofrecer la acción solo al terminar sin anulación indicada por el backend.
  get puedeAnularValorizacionesManualmente(): boolean {
    return this.popupEjecucionVisible && !this.ejecucionEnCurso &&
      !this.requiereAnulacionEjecucion && !!this.requestEjecucion &&
      !!this.resumenEjecucion && this.nivelesEjecucion.length === 3 &&
      this.nivelesEjecucion.every(nivel => nivel.estado === 'Completado');
  }

  // consentimiento explícito; conservar GUARDAR completado y reutilizar estados y reintentos.
  async anularValorizacionesManualmente(): Promise<void> {
    if (!this.puedeAnularValorizacionesManualmente) return;
    this.ejecucionEnCurso = true;
    let confirmado = false;
    try {
      const confirmacion = showAlertConfirm('',
        'Se anularán TODAS las valorizaciones de materia prima fresca y de reproceso de todos los meses (con su detalle). Deberá recalcular el costo unitario de cada parámetro proceso. ¿Desea continuar?',
        'warning');
      Swal.update({ confirmButtonText: 'Anular', cancelButtonText: 'Cancelar' });
      confirmado = await confirmacion;
    } finally {
      this.ejecucionEnCurso = false;
    }
    if (!confirmado || !this.puedeAnularValorizacionesManualmente) return;

    // la marca pertenece a esta ejecución y sus reintentos; se limpia al cerrar/iniciar.
    this.requiereAnulacionEjecucion = true;
    this.resumenEjecucion = '';
    for (const nivel of this.nivelesEjecucion) {
      if (nivel.clave === 'GUARDAR') continue;
      nivel.estado = 'Pendiente';
      nivel.mensaje = '';
      nivel.esperaProlongada = false;
    }
    await this.ejecutarNiveles();
  }

  async ejecutarNiveles(): Promise<void> {
    if (this.ejecucionEnCurso || !this.requestEjecucion) return;
    this.ejecucionEnCurso = true;
    try {
      for (const nivel of this.nivelesEjecucion) {
        if (nivel.estado === 'Completado') continue;
        nivel.estado = 'En ejecución';
        nivel.mensaje = '';
        // cada intento empieza con su propio plazo de espera.
        nivel.esperaProlongada = false;
        try {
          if (nivel.clave === 'GUARDAR') {
            this.esperaGuardadoTimer = setTimeout(() => {
              if (nivel.estado === 'En ejecución') nivel.esperaProlongada = true;
            }, 20000);
            const resp = await callApi<{ Dt?: GuardarCostoProductivoMantenimientoResponse }>(
              this.service.guardar(this.requestEjecucion));
            if (!resp.ok) throw new Error(resp.message || 'No se pudo guardar la configuración.');
            const anuladas = resp.data?.Dt?.valorizacionesAnuladas;
            this.requiereAnulacionEjecucion = !!(anuladas?.hayTransferencia || anuladas?.requiereAnulacion);
            this.cuentasTransferidasOrigen.clear();
            nivel.mensaje = 'Configuración guardada correctamente.';
          } else if (this.requiereAnulacionEjecucion) {
            const resp = await callApi<{ Dt?: AnularValorizacionesResponse }>(this.service.anularValorizaciones(nivel.clave, this.usuarioActual()));
            if (!resp.ok) throw new Error(resp.message || 'No se pudieron anular las valorizaciones.');
            const resultado = resp.data?.Dt;
            if (!resultado || resultado.tipo !== nivel.clave) {
              throw new Error('La API no devolvió el resultado de la anulación solicitada.');
            }
            if (nivel.clave === 'FRESCO') this.frescoCabecerasEjecucion = resultado.cabecerasAnuladas;
            else this.reproCabecerasEjecucion = resultado.cabecerasAnuladas;
            nivel.mensaje = `${resultado.mesesProcesados} meses procesados; ${resultado.cabecerasAnuladas} cabeceras y ${resultado.detallesAnulados} detalles anulados.`;
          } else {
            nivel.mensaje = 'No se detectó transferencia en este guardado (las cuentas ya estaban en su proceso). Si ya las movió antes, use "Anular valorizaciones de todos modos".';
          }
          nivel.estado = 'Completado';
        } catch (error: unknown) {
          nivel.estado = 'Error';
          nivel.mensaje = error instanceof Error ? error.message : String(error);
          await showAlert('', nivel.mensaje, 'error');
          return;
        } finally {
          // detener el aviso al completar o fallar, también al reintentar.
          clearTimeout(this.esperaGuardadoTimer);
          this.esperaGuardadoTimer = undefined;
          nivel.esperaProlongada = false;
        }
      }
      this.resumenEjecucion = this.requiereAnulacionEjecucion
        ? `Se anularon ${this.frescoCabecerasEjecucion} cabeceras de fresco y ${this.reproCabecerasEjecucion} de reproceso (con su detalle). Recalcule el costo unitario de cada parámetro proceso.`
        : 'Configuración guardada correctamente. No se requiere anulación.';
      // limpiar al completar todos los niveles; conservar ante errores para reintentar.
    } finally {
      this.ejecucionEnCurso = false;
    }
  }

  impedirCierreEjecucion(event: { cancel: boolean | PromiseLike<boolean> }): void {
    if (this.ejecucionEnCurso) event.cancel = true;
  }

  async resetearEjecucion(): Promise<void> {
    // limpiar únicamente el contexto y temporizador de esta modal.
    clearTimeout(this.esperaGuardadoTimer);
    this.esperaGuardadoTimer = undefined;
    this.transferenciasEjecucion = [];
    const guardado = this.nivelesEjecucion[0]?.estado === 'Completado';
    this.popupEjecucionVisible = false;
    this.ejecucionEnCurso = false;
    this.nivelesEjecucion = [];
    this.resumenEjecucion = '';
    this.requestEjecucion = undefined;
    this.requiereAnulacionEjecucion = false;
    // impedir que el respaldo se arrastre a otra ejecución.
    this.frescoCabecerasEjecucion = 0;
    this.reproCabecerasEjecucion = 0;
    if (guardado) await this.cargar();
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  // resolver al terminar el cierre permite limpiar antes de continuar con la API.
  // reutiliza cuentasDirty y omite movimientos devueltos al origen o inactivados.
  get hayTransferenciasPendientes(): boolean {
    return Array.from(this.cuentasTransferidasOrigen.entries())
      .some(([id, origen]) => this.esTransferenciaPendiente(origen, this.cuentasDirty.get(id)));
  }

  // mismo criterio existente; excluye altas, inactivas y retornos al origen.
  private esTransferenciaPendiente(origen: CuentaCostoMantenimiento, cuenta?: CuentaCostoMantenimiento): boolean {
    const normalizar = (valor?: string) => (valor ?? '').trim().toUpperCase();
    return !!cuenta?.activo && !cuenta.esNuevo &&
        ((!!normalizar(origen.etapaCodigo) && normalizar(origen.etapaCodigo) !== normalizar(cuenta.etapaCodigo)) ||
         (!!normalizar(origen.procesoCodigo) && normalizar(origen.procesoCodigo) !== normalizar(cuenta.procesoCodigo)));
  }

  // agrupar por códigos de origen/destino y presentar los nombres disponibles.
  private obtenerTransferenciasEjecucion(): string[] {
    const normalizar = (valor?: string) => (valor ?? '').trim().toUpperCase();
    const grupos = new Map<string, { origen: string; destino: string; cantidad: number }>();
    const nombre = (cuenta: CuentaCostoMantenimiento): string => {
      const codigo = normalizar(cuenta.procesoCodigo || cuenta.procesoResuelto);
      return this.procesos.find(proceso => normalizar(proceso.codigo) === codigo &&
        normalizar(proceso.etapaCodigo) === normalizar(cuenta.etapaCodigo))?.nombre?.trim() ||
        cuenta.procesoNombre?.trim() || `Proceso sin nombre (${codigo || 'sin código'})`;
    };
    for (const [id, origen] of this.cuentasTransferidasOrigen) {
      const cuenta = this.cuentasDirty.get(id);
      if (!cuenta || !this.esTransferenciaPendiente(origen, cuenta)) continue;
      const clave = JSON.stringify([
        normalizar(origen.procesoCodigo || origen.procesoResuelto),
        normalizar(cuenta.procesoCodigo || cuenta.procesoResuelto)
      ]);
      const grupo = grupos.get(clave);
      if (grupo) grupo.cantidad++;
      else grupos.set(clave, { origen: nombre(origen), destino: nombre(cuenta), cantidad: 1 });
    }
    return Array.from(grupos.values()).map(grupo =>
      `${grupo.origen} → ${grupo.destino} (${grupo.cantidad} ${grupo.cantidad === 1 ? 'cuenta' : 'cuentas'})`);
  }

  private mostrarAvisoRecosteo(procesos: ProcesoCostoMantenimiento[], guardar: boolean): Promise<boolean> {
    this.avisoRecosteoProcesos = procesos.map(x => ({ nombre: x.nombre, codigo: x.codigo }));
    this.avisoRecosteoGuardar = guardar;
    this.avisoRecosteoConfirmado = false;
    return new Promise<boolean>(resolve => {
      this.resolverAvisoRecosteo = resolve;
      this.popupAvisoRecosteoVisible = true;
    });
  }

  aceptarAvisoRecosteo(): void {
    if (!this.popupAvisoRecosteoVisible) return;
    this.avisoRecosteoConfirmado = true;
    this.popupAvisoRecosteoVisible = false;
  }

  resetearAvisoRecosteo(): void {
    const resolver = this.resolverAvisoRecosteo;
    const confirmado = this.avisoRecosteoConfirmado;
    this.popupAvisoRecosteoVisible = false;
    this.avisoRecosteoGuardar = false;
    this.avisoRecosteoProcesos = [];
    this.avisoRecosteoConfirmado = false;
    this.resolverAvisoRecosteo = undefined;
    // La marca por proceso pertenece a la sesión, no al estado transitorio de esta modal.
    resolver?.(confirmado);
  }

  private normalizarRegla(value: any): ReglaCostoCodigo | string {
    const regla = String(value ?? 'NA').trim().toUpperCase();
    return regla || 'NA';
  }

  private nuevoTipoVacio(): TipoProcesoMantenimiento {
    return {
      codigo: '',
      nombre: '',
      tipoLoteCodigo: '',
      tipoLote: '',
      nivel: 2,
      activo: true,
      esNuevo: true
    };
  }

  private nuevaCuentaVacia(): CuentaCostoMantenimiento {
    return {
      id: 0,
      empresa: 1,
      etapaCodigo: '',
      etapa: '',
      centroCodigo: '',
      subcentroCodigo: '',
      cuenta: '',
      activo: true,
      procesoResuelto: '',
      driverResuelto: '',
      modoMonto: '',
      requiereCreditoRetiro: false,
      esNuevo: true
    };
  }

  private reglasFallback(): ReglaCostoMantenimiento[] {
    return [
      { codigo: 'SI', descripcion: 'Aplica normalmente', aplica: true, especial: false },
      { codigo: 'NO', descripcion: 'No aplica', aplica: false, especial: false },
      { codigo: 'NA', descripcion: 'No aplica / no disponible', aplica: false, especial: true },
      { codigo: 'TAR', descripcion: 'Aplica por tarifario', aplica: true, especial: true },
      { codigo: 'DEP', descripcion: 'Aplicación condicionada', aplica: true, especial: true },
      { codigo: 'PRO', descripcion: 'Depende del proceso/congelamiento', aplica: true, especial: true },
      { codigo: 'FIC', descripcion: 'Ficha técnica', aplica: true, especial: true },
      { codigo: 'D', descripcion: 'Regla especial D', aplica: true, especial: true }
    ];
  }
}
