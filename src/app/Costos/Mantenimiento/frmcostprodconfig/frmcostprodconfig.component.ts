import { Component, OnInit } from '@angular/core';
import { callApi } from 'src/app/config/Helpers';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import { FrmcostprodconfigService } from './frmcostprodconfig.service';
import {
  AplicacionCostoMantenimiento,
  CostoProductivoMantenimientoApi,
  CuentaCostoMantenimiento,
  EtapaCostoMantenimiento,
  FilaMatrizCosteo,
  GuardarCostoProductivoMantenimientoRequest,
  ProcesoCostoMantenimiento,
  ReglaCostoCodigo,
  ReglaCostoMantenimiento,
  TipoLoteMantenimiento,
  TipoProcesoMantenimiento
} from './frmcostprodconfig.models';

type TabConfig = 'matriz' | 'tipos' | 'cuentas';

@Component({
  selector: 'app-frmcostprodconfig',
  templateUrl: './frmcostprodconfig.component.html',
  styleUrl: './frmcostprodconfig.component.scss'
})
export class FrmcostprodconfigComponent implements OnInit {
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

  popupCuentaVisible = false;
  cuentaEdicion: CuentaCostoMantenimiento = this.nuevaCuentaVacia();

  private readonly tiposDirty = new Map<string, TipoProcesoMantenimiento>();
  private readonly matrizDirty = new Map<string, AplicacionCostoMantenimiento>();
  private readonly cuentasDirty = new Map<string, CuentaCostoMantenimiento>();
  private tempCuentaId = -1;

  private readonly procesoNombre: Record<string, string> = {
    CDF: 'C.D. Fijos',
    CDV: 'C.D. Variables',
    CIF: 'C.I. Fijos',
    CIV: 'C.I. Variables',
    LOG: 'Logística',
    REC: 'Recepción',
    CLA: 'Clasificación',
    COD: 'Codificación',
    DES: 'Descabezado',
    DSC: 'Descongelado',
    PEL: 'Pelado',
    HID: 'Hidratación',
    COC: 'Cocido',
    DEC: 'Decorado',
    RET: 'Retractilado',
    BRI: 'Brine',
    IQF: 'IQF',
    TUN: 'Túnel'
  };

  constructor(
    private readonly service: FrmcostprodconfigService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  get hayCambios(): boolean {
    return this.tiposDirty.size > 0 ||
      this.matrizDirty.size > 0 ||
      this.cuentasDirty.size > 0;
  }

  get procesosMatriz(): ProcesoCostoMantenimiento[] {
    return this.procesos.filter(x => x.enMatriz && x.activo);
  }

  async cargar(): Promise<void> {
    this.loadingVisible = true;

    try {
      const resp = await callApi<any>(this.service.consultar());
      if (!resp.ok) {
        this.loadingVisible = false;
        await showAlert('', resp.message, 'error');
        return;
      }

      const data = (resp.data?.Dt ?? {}) as CostoProductivoMantenimientoApi;

      this.etapas = [...(data.etapas ?? [])];
      this.procesos = [...(data.procesos ?? [])];
      this.tiposLote = [...(data.tiposLote ?? [])];
      this.tiposProceso = [...(data.tiposProceso ?? [])];
      this.matriz = [...(data.matriz ?? [])];
      this.cuentas = [...(data.cuentas ?? [])];
      this.reglasDisponibles = (data.reglasDisponibles?.length
        ? [...data.reglasDisponibles]
        : this.reglasFallback());

      this.tiposDirty.clear();
      this.matrizDirty.clear();
      this.cuentasDirty.clear();
      this.construirMatriz();
      this.loadingVisible = false;
    } finally {
      this.loadingVisible = false;
    }
  }

  seleccionarTab(tab: TabConfig): void {
    this.tabActiva = tab;
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
    return this.procesoNombre[codigo] ??
      this.procesos.find(x => x.codigo === codigo)?.nombre ??
      codigo;
  }

  // ===========================================================================
  // TIPOS / NIVELES
  // ===========================================================================

  nuevoTipo(): void {
    this.tipoEdicion = this.nuevoTipoVacio();
    this.popupTipoVisible = true;
  }

  editarTipo(item: TipoProcesoMantenimiento): void {
    this.tipoEdicion = { ...item, esNuevo: false };
    this.popupTipoVisible = true;
  }

  guardarTipoLocal(): void {
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

    if (item.nivel < 1 || item.nivel > 5) {
      showAlert('', 'El nivel debe estar entre NV1 y NV5.', 'warning');
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

    this.tiposDirty.set(item.codigo, { ...item });
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
    this.cuentaEdicion = this.nuevaCuentaVacia();
    this.cuentaEdicion.id = this.tempCuentaId--;
    this.cuentaEdicion.esNuevo = true;
    this.popupCuentaVisible = true;
  }

  editarCuenta(item: CuentaCostoMantenimiento): void {
    this.cuentaEdicion = { ...item, esNuevo: false };
    this.popupCuentaVisible = true;
  }

  guardarCuentaLocal(): void {
    const item: CuentaCostoMantenimiento = {
      ...this.cuentaEdicion,
      empresa: Number(this.cuentaEdicion.empresa ?? 1),
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

    const duplicada = this.cuentas.some(x =>
      x.id !== item.id &&
      Number(x.empresa) === Number(item.empresa) &&
      String(x.cuenta).trim() === item.cuenta
    );

    if (duplicada) {
      showAlert('', `La cuenta ${item.cuenta} ya está configurada para la empresa ${item.empresa}.`, 'warning');
      return;
    }

    item.etapa = this.etapas.find(x => x.codigo === item.etapaCodigo)?.nombre ?? '';
    item.procesoResuelto = item.esNuevo ? 'Se resolverá al guardar' : item.procesoResuelto;
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
  // GUARDADO
  // ===========================================================================

  async guardarCambios(): Promise<void> {
    if (!this.hayCambios) {
      await showAlert('', 'No existen cambios pendientes.', 'info');
      return;
    }

    const request: GuardarCostoProductivoMantenimientoRequest = {
      usuario: varUser,
      tiposProceso: Array.from(this.tiposDirty.values()).map(x => ({ ...x })),
      matriz: Array.from(this.matrizDirty.values()).map(x => ({ ...x })),
      cuentas: Array.from(this.cuentasDirty.values()).map(x => ({ ...x }))
    };

    this.loadingVisible = true;

    try {
      const resp = await callApi<any>(this.service.guardar(request));
      if (!resp.ok) {
        this.loadingVisible = false;
        await showAlert('', resp.message, 'error');
        return;
      }

      this.loadingVisible = false;
      await showAlert('', 'Configuración guardada correctamente.', 'success');
      await this.cargar();
    } finally {
      this.loadingVisible = false;
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

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
