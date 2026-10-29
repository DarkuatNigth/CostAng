/**
 * Modelos generales del componente frmparametrizacionproceso.
 *
 * Se unifican aquí los modelos de la hoja ACTUALIZACION y los modelos
 * del detalle/modal para que el feature tenga un único archivo de modelos.
 */

// ============================================================================
// RESPUESTA BASE PARAM-PROC
// ============================================================================

export interface CostoApiRow {
  Codigo: number;
  codTip?: string | null;
  editable?: boolean;
  TipLote?: string | null;
  Descripcion: string;
  Valor: number;
  Libras_Proceso: number;
  Costo_Unitario: number;
}

export interface LibrasApiRow {
  strProceso: string;
  strGrupo?: string | null;
  strOrigen: 'PFR' | 'RPC' | string;
  strParticionCod: 'EN' | 'SH' | 'EV' | 'SV' | string;
  strParticion: string;
  dcLibras: number;
  intOrden?: number;
}

// ============================================================================
// HOJA ACTUALIZACION
// ============================================================================

export interface TripletaCostos {
  entero: number;
  cola: number;
  valorAgregado: number;
}

export type TipoFilaActualizacion =
  | 'normal'
  | 'total'
  | 'seccion'
  | 'espacio'
  | 'totalProcesos'
  | 'totalGeneral';

export interface FilaActualizacion extends TripletaCostos {
  excelRow: number;
  id: string;
  concepto: string;
  tipo: TipoFilaActualizacion;
  total: number | null;

  mostrarProrrateo?: boolean;
  aplicaWarren?: boolean;

  /** Dólares PFR Entero. Única base permitida para % Absorción Warren; nunca incluye RPC. */
  warrenPfrEntero?: number;
  /**
   * Dólares técnicos PFR Cola de la etapa.
   * Se usan como base Warren, pero NO representan el costo normal visible
   * de Cola, porque la fila visual puede contener PFR + RPC.
   */
  warrenPfrCola?: number;
  /** Libras PFR Entero propias de la etapa. */
  warrenPfrLibrasEntero?: number;
  /** Libras PFR Cola propias de la etapa. */
  warrenPfrLibrasCola?: number;
  /** Costo unitario PFR original de la etapa. */
  warrenPfrCostoUnitario?: number;
  /** Parte unitaria que se extrae de Entero por Warren. */
  warrenUnitarioExtraidoEntero?: number;
  /** Parte unitaria que se agrega a Cola por Warren. */
  warrenUnitarioAgregadoCola?: number;
  prorrateo: number | null;
  ajusteWarren: number | null;
  enteroAjustado: number | null;
  colaAjustada: number | null;
  /**
   * Warren NO modifica Valor Agregado. Cuando Warren está calculado esta
   * columna es una copia del valor original para conservar la misma lectura visual.
   */
  valorAgregadoAjustado: number | null;

  monedaEntero?: boolean;
  monedaCola?: boolean;
  monedaValorAgregado?: boolean;
  resaltarCola?: boolean;
  resaltarTotales?: boolean;

  referencia?: number | null;
  diferenciaReferencia?: number | null;
}

export interface MetricasActualizacion {
  materialEmpaqueColaXLibra: number;
  baseProrrateo: number;
  warrenDiferencia: number;
  warrenActual: number;
  warrenObjetivo: number;
  ajusteWarrenTotal: number;
}

export interface DatosFaltantesActualizacion {
  camaronLiquidado: boolean;
  referenciaTotalLibras: boolean;
}

export interface ResultadoActualizacion {
  filas: FilaActualizacion[];
  metricas: MetricasActualizacion;
  datosFaltantes: DatosFaltantesActualizacion;
  tarifas: CostoApiRow[];
}


export interface GuardarWarrenRequest {
  anio: string;
  mes: string;
  objetivoWarren: number;
  usuario: string;
}

/**
 * Operación única que guarda distribución contable, parámetros PFR/RPC y
 * Warren dentro de la misma transacción de CostosDbContext.
 */
export interface CostoProductivoProcesoOrigenApi {
  strPcCodigo: string;
  strProceso: string;
  strOrigen: string;

  dcLibrasEntero: number;
  dcLibrasCola: number;
  dcLibrasValorAgregado: number;

  dcDolaresEntero: number;
  dcDolaresCola: number;
  dcDolaresValorAgregado: number;

  dcTotalLibras?: number;
  dcTotalDolares?: number;
  dcCostoUnitario?: number;
}

export interface WarrenBaseProcesoSnapshot {
  intCodigo: number;
  strDescripcion: string;
  blAbsorbe: boolean;

  // Total visible de la fila: PFR + RPC.
  dcMontoEnteroVisible: number;
  dcMontoColaVisible: number;

  // Base técnica PFR usada por Warren.
  dcMontoPfrEntero: number;
  dcMontoPfrCola: number;
  dcLibrasPfrEntero: number;
  dcLibrasPfrCola: number;
}

export interface GuardarCierreParamProcRequest {
  anio: string;
  mes: string;
  objetivoWarren: number;
  usuario: string;

  // Snapshot exacto del GET actual. El POST no reconsulta Producción/SONG.
  detalleContable: CostoProductivoDetalleModalApi[];
  procesosOrigen: CostoProductivoProcesoOrigenApi[];
  parametrosPfr: CostoApiRow[];
  parametrosRpc: CostoApiRow[];
  warrenBase: WarrenBaseProcesoSnapshot[];
}

/** resumen persistido por el cierre, sin cálculos en Angular. */
export interface CierreParamProcResumenApi {
  estado: string;
  frescoGuardados: number;
  frescoNuevos: number;
  frescoActualizados: number;
  frescoAnulados: number;
  frescoDetalles: number;
  reproGuardados: number;
  reproNuevos: number;
  reproActualizados: number;
  reproAnulados: number;
  reproDetalles: number;
  detallesAnulados: number;
  warrenGuardado: boolean;
  advertencias: string[];
}

// /** callApi conserva el sobre del backend en resp.data; no extrae objData. */
// export interface CierreParamProcResultadoApi {
//   blStatus: boolean;
//   strMensaje: string;
//   objData: {
//     objCostoProductivo: any;
//     lstParametrosPfr: CostoApiRow[];
//     lstParametrosRpc: CostoApiRow[];
//     objWarren: any;
//     objResumen: CierreParamProcResumenApi;
//   };
// }
/** callApi conserva el sobre del backend en resp.data; no extrae Dt. */
export interface CierreParamProcResultadoApi {
  Codigo: boolean;
  Description: string;
  Dt: {
    objCostoProductivo: any;
    lstParametrosPfr: CostoApiRow[];
    lstParametrosRpc: CostoApiRow[];
    objWarren: any;
    objResumen: CierreParamProcResumenApi;
  };
}

// paso 2 usa exclusivamente el periodo persistido y usuario.
export interface GuardarCierreValorizacionRequest {
  anio: string;
  mes: string;
  usuario: string;
}

/** Table7: cabecera Warren devuelta por param-proc. */
export interface WarrenPeriodoResumenApi {
  existeWarren?: boolean;
  objetivoWarren?: number;
  costoColaActual?: number;
  diferenciaWarren?: number;
  ajusteTotal?: number;
  baseAbsorcionEntero?: number;
  librasCola?: number;
}

/** Table8: detalle Warren por proceso. */
export interface WarrenProcesoApi {
  intCodigo?: number;
  strDescripcion?: string;
  dcLibrasEntero?: number;
  dcLibrasCola?: number;
  dcMontoEnteroOriginal?: number;
  dcMontoColaOriginal?: number;
  dcPorcentajeAbsorcion?: number;
  dcAjusteWarren?: number;
  dcMontoEnteroWarren?: number;
  dcMontoColaWarren?: number;
  dcCostoUnitarioEnteroOriginal?: number;
  dcCostoUnitarioColaOriginal?: number;
  dcUnitarioExtraidoEntero?: number;
  dcUnitarioAgregadoCola?: number;
  dcCostoUnitarioEnteroWarren?: number;
  dcCostoUnitarioColaWarren?: number;
  blUsaBaseGlobalCola?: boolean;
}

export interface WarrenGuardadoResponse extends WarrenPeriodoResumenApi {}

// ============================================================================
// RESUMEN Y DETALLE DE ETAPAS (TABLE4 / TABLE5)
// ============================================================================

export interface ResumenLibrasProcesadasApi {
  Codigo?: string;
  Descripcion: string;

  Libras_Entero: number;
  Libras_Cola: number;
  Libras_Valor_Agregado: number;
  Total?: number;

  /**
   * Costo total de materia prima por partición.
   *
   * PFR:
   *   LiquidacionResultado.dcTotalDol
   *
   * RPC / VAG:
   *   MatPrimaReproceso.dbCostoTotal
   *
   * Regla general RPC/VAG:
   *   backend considera 2. PROCESADO.
   *
   * Excepción informativa RLIQ ("Camarón Liquidado Fresco"):
   *   backend la construye desde 1. RECIBIDO + Proc Prod PP + productos
   *   definidos por negocio. RLIQ solo puede traer Entero/Cola; V.A. = 0.
   */
  Dolares_Entero?: number;
  Dolares_Cola?: number;
  Dolares_Valor_Agregado?: number;
  Dolares_Total?: number;

  /**
   * False para filas informativas de conciliación que deben mostrarse pero no
   * sumarse nuevamente en el Total. Ej.: Camarón Liquidado Reproceso.
   */
  IncluirEnTotal?: boolean;

  /**
   * Fila cabecera del grupo visual "Compra Camarón".
   * Cuando es true, el componente permite desplegar/ocultar sus subniveles.
   */
  EsGrupoCompra?: boolean;

  /**
   * Fila visual subordinada a "Compra Camarón".
   * Se utiliza únicamente para presentación; no altera el contrato del backend.
   */
  EsSubnivelCompra?: boolean;

  Orden?: number;
}

export interface DetalleEtapaApi {
  Etapa: string;
  Origen: string;
  CodigoProceso: string;
  ProcesoProductivo: string;
  /**
   * Solo se utiliza para Brine. El backend lo obtiene de strTipEmbala
   * y entrega FONDO / PANERA / vacío.
   */
  TipoEmbalaje?: string;
  ParticionCod: string;
  Particion: string;
  Libras: number;
  Orden?: number;
}

export interface CeldaParticionVista {
  libras: number | null;
  dolares: number | null;
  unitario: number | null;
  librasParticipacion?: number;
  porcParticipacion?: number;
  sinLibras?: boolean;
}

export interface FilaCostoVista extends FilaActualizacion {
  enteroVista: CeldaParticionVista;
  colaVista: CeldaParticionVista;
  valorAgregadoVista: CeldaParticionVista;
  /** Total de la fila: Libras / Dólares / Unitario. */
  totalVista: CeldaParticionVista;

  /** Bloque posterior a Warren: Entero ajustado con libras y unitario. */
  enteroWarrenVista: CeldaParticionVista;
  /** Bloque posterior a Warren: Cola ajustada con libras y unitario. */
  colaWarrenVista: CeldaParticionVista;
  /** Warren no modifica V.A.; se replica con estructura completa. */
  valorAgregadoWarrenVista: CeldaParticionVista;
  tieneDetalleEtapa: boolean;
  etapaBackend?: string;
  origenDetalle?: 'PFR' | 'RPC' | null;

  /** Código de costos.tb_procesocosto resuelto desde Table6. */
  pcCodigoCosto?: string;

  /** Indica si Table6 tiene al menos una cuenta para esta fila/proceso. */
  tieneDetalleCuenta?: boolean;
}

/**
 * Fila ya pivoteada para el DataGrid del modal.
 * No contiene TipoProducto porque el usuario necesita una sola fila por
 * proceso/código/origen, con las libras Entero/Cola/V.A. en columnas.
 * En Brine TipoEmbalaje forma parte de la llave y mantiene FONDO/PANERA.
 */
export interface DetalleEtapaPivot {
  proceso: string;
  codigoProceso: string;
  origen: string;
  tipoEmbalaje: string;
  librasEntero: number;
  librasCola: number;
  librasValorAgregado: number;
  total: number;
  porcParticipacion?: number;
  dolaresAsignados?: number;
}

// ============================================================================
// DETALLE CONTABLE COSTO PRODUCTIVO (TABLE6)
// ============================================================================

/**
 * Contrato normalizado del detalle contable que llega en Table6.
 *
 * El backend obtiene esta información desde la distribución productiva guardada
 * para el período. ParticionCodigo puede no venir en versiones anteriores del SP;
 * en ese caso el mapper la deriva de Particion.
 */
export interface CostoProductivoDetalleModalApi {
  EtapaCodigo: string;
  Etapa: string;
  ProcesoCodigo: string;
  Proceso: string;
  Cuenta: string;
  DescripcionCuenta: string;
  CentroCodigo: string;
  SubcentroCodigo: string;
  AgrupacionCentro: string;
  GrupoCentro: string;
  ParticionCodigo?: string;
  Particion: string;
  Naturaleza?: string;
  Dolares: number;
  SubcentroNombre?: string;
  CentroNombre?: string;
}

/**
 * ViewModel utilizado por el modal existente del componente.
 *
 * ParamProcMapper lo construye desde Table6.
 */
export interface CuentaContableMock {
  particion: string;
  numeroCuenta: string;
  descripcionCuenta: string;
  dolares: number;

  etapaCodigo?: string;
  etapa?: string;
  procesoCodigo?: string;
  proceso?: string;
  centroCodigo?: string;
  subcentroCodigo?: string;
  agrupacionCentro?: string;
  grupoCentro?: string;
  naturaleza?: string;
  subcentroNombre?: string;
  centroNombre?: string;
}

/**
 * Fila resumida del primer modal contable.
 *
 * Se agrupa EXCLUSIVAMENTE por GrupoCentro para que conceptos repetidos como
 * REMUNERACION aparezcan una sola vez, aun cuando provengan de distintas
 * AgrupacionCentro. El detalle de cuentas se conserva en `cuentas` y se muestra
 * en un segundo modal informativo.
 */
export interface GrupoCuentaContableVista {
  grupoCentro: string;
  cantidadCuentas: number;
  dolares: number;
  cuentas: CuentaContableMock[];
}

// contrato exacto del catálogo productivo de Table10.
export interface ProcesoCatalogoApi {
  pcCodigo: string;
  nombre: string;
  etapaCodigo: string;
  orden: number;
  conocido: boolean;
}
