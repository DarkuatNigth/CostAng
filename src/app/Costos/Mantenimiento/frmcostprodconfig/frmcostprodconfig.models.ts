export type ReglaCostoCodigo =
  | 'SI'
  | 'NO'
  | 'NA'
  | 'TAR'
  | 'DEP'
  | 'PRO'
  | 'FIC'
  | 'D'
  | 'X2';

export interface EtapaCostoMantenimiento {
  // indicador recibido del backend.
  esDiario?: boolean;
  codigo: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface ProcesoCostoMantenimiento {
  // uso recibido y enviado con el proceso.
  esDiario?: boolean;
  uso?: 'Productivo' | 'Diario' | 'COSTEO' | 'DIARIO';
  codigo: string;
  nombre: string;
  etapaCodigo: string;
  etapa: string;
  orden: number;
  activo: boolean;
  enMatriz: boolean;
  cantidadCuentas?: number;
  esNuevo?: boolean;
  modoValor?: TipoValorProceso | string;
  tipoProcesoCodigo?: string;
  tipoProceso?: string;
  esTarifa?: boolean;
  // indicadores informativos de la matriz.
  esFichaTecnica?: boolean;
  tiposFicha?: string;
  paramId?: number;
  sinProceso?: boolean;
  editarCodigo?: boolean;
}

export interface TipoLoteMantenimiento {
  codigo: string;
  nombre: string;
  activo: boolean;
}

// tipos activos de tb_tiplot todavía no incorporados.
export interface TipoProcesoDisponible {
  codigo: string;
  nombre: string;
  tipoLoteCodigo: string;
  tipoLote: string;
  nivelSugerido: number;
  loteValido: boolean;
}

export interface TipoProcesoMantenimiento {
  codigo: string;
  nombre: string;
  tipoLoteCodigo: string;
  tipoLote: string;
  nivel: number;
  activo: boolean;
  esNuevo?: boolean;
}

export interface AplicacionCostoMantenimiento {
  procesoCodigo: string;
  tipoCodigo: string;
  regla: ReglaCostoCodigo | string;
  activo: boolean;
  aplica?: boolean;
  esEspecial?: boolean;
}

export interface CuentaCostoMantenimiento {
  id: number;
  empresa: number;
  etapaCodigo: string;
  etapa: string;
  centroCodigo: string;
  subcentroCodigo: string;
  cuenta: string;
  activo: boolean;
  procesoResuelto: string;
  driverResuelto: string;
  modoMonto: string;
  requiereCreditoRetiro: boolean;
  cuentaNombre?: string;
  auxiliarCodigo?: string;
  auxiliarNombre?: string;
  centroNombre?: string;
  subcentroNombre?: string;
  procesoCodigo?: string;
  procesoNombre?: string;
  // false indica que el backend calculó el proceso de la cuenta.
  procesoGuardado?: boolean;
  esNuevo?: boolean;
}

export interface ReglaCostoMantenimiento {
  codigo: ReglaCostoCodigo | string;
  descripcion: string;
  aplica: boolean;
  especial: boolean;
}

export interface CostoProductivoMantenimientoApi {
  tiposProcesoDisponibles?: TipoProcesoDisponible[];
  etapas: EtapaCostoMantenimiento[];
  procesos: ProcesoCostoMantenimiento[];
  tiposLote: TipoLoteMantenimiento[];
  tiposProceso: TipoProcesoMantenimiento[];
  matriz: AplicacionCostoMantenimiento[];
  cuentas: CuentaCostoMantenimiento[];
  reglasDisponibles: ReglaCostoMantenimiento[];
}

export interface FilaMatrizCosteo extends TipoProcesoMantenimiento {
  reglas: Record<string, ReglaCostoCodigo | string>;
}

export interface GuardarCostoProductivoMantenimientoRequest {
  usuario: string;
  tiposProceso: TipoProcesoMantenimiento[];
  matriz: AplicacionCostoMantenimiento[];
  cuentas: CuentaCostoMantenimiento[];
  procesos: ProcesoCostoMantenimiento[];
}

export interface ValorizacionesAnuladas {
  hayTransferencia: boolean;
  // el guardado informa la necesidad de ejecutar las anulaciones.
  requiereAnulacion?: boolean;
  frescoCabeceras: number;
  frescoDetalles: number;
  reproCabeceras: number;
  reproDetalles: number;
}

export interface GuardarCostoProductivoMantenimientoResponse {
  valorizacionesAnuladas?: ValorizacionesAnuladas;
}

export const EMPRESA_SONGA = { value: 1, descripcion: 'SONGA' } as const;

export const TipoValorProceso = {
  CALCULADO: 'CALCULADO',
  DOLARES_TOTALES: 'DOLARES_TOTALES',
  TARIFA: 'TARIFA'
} as const;
export type TipoValorProceso = typeof TipoValorProceso[keyof typeof TipoValorProceso];

export const CATALOGO_TIPO_VALOR_PROCESO: { codigo: TipoValorProceso; descripcion: string }[] = [
  { codigo: TipoValorProceso.CALCULADO, descripcion: 'Calculado (no manual)' },
  { codigo: TipoValorProceso.DOLARES_TOTALES, descripcion: 'Dólares totales (manual)' },
  // tarifa por tipo de proceso.
  // { codigo: TipoValorProceso.TARIFA, descripcion: 'Tarifa (por definir)' }
  { codigo: TipoValorProceso.TARIFA, descripcion: 'Tarifa (por tipo de proceso)' }
];

export interface CuentasDisponiblesFiltro {
  empresa: number; texto?: string; cuenta?: string; centro?: string; subcentro?: string;
  // el catálogo ya no filtra por año/mes.
  // anio: number; mes: number; soloDisponibles: boolean; procesoCodigo?: string; pagina: number; cantidad: number;
  soloDisponibles: boolean; procesoCodigo?: string; pagina: number; cantidad: number;
}

export interface CuentaDisponible {
  empresa: number; cuenta: string; cuentaNombre: string; auxiliarCodigo: string; auxiliarNombre: string;
  centroCodigo: string; centroNombre: string; subcentroCodigo: string; subcentroNombre: string;
  etapaCodigo: string; etapaNombre: string; procesoActualCodigo: string; procesoActualNombre: string; asignada: boolean; anulada: boolean; mensaje: string;
}

export interface CuentasDisponiblesResultado { total: number; pagina: number; cantidad: number; items: CuentaDisponible[]; }

// contratos de ParamProc integrados en ProcesoCostoMantenimiento.
// export interface ProcesoParamMantenimiento {
  // id: number; empresa: number; descripcion: string; activo: boolean; editable: boolean;
  // tipCodigo?: string | null; modoValor: TipoValorProceso | string; esTarifa?: boolean; esNuevo?: boolean;
// }
//
// export interface GuardarProcesosParamRequest { usuario: string; procesos: ProcesoParamMantenimiento[]; }

// catálogo reutilizable; 0 conserva el filtro anual del API.
export const MESES: { valor: number; nombre: string }[] = [
  { valor: 0, nombre: 'Todo el a?o' },
  { valor: 1, nombre: 'Enero' }, { valor: 2, nombre: 'Febrero' }, { valor: 3, nombre: 'Marzo' },
  { valor: 4, nombre: 'Abril' }, { valor: 5, nombre: 'Mayo' }, { valor: 6, nombre: 'Junio' },
  { valor: 7, nombre: 'Julio' }, { valor: 8, nombre: 'Agosto' }, { valor: 9, nombre: 'Septiembre' },
  { valor: 10, nombre: 'Octubre' }, { valor: 11, nombre: 'Noviembre' }, { valor: 12, nombre: 'Diciembre' }
];

// contratos de ejecución por niveles.
export interface NivelEjecucion {
  // aviso informativo mientras GUARDAR supera los 20 segundos.
  esperaProlongada?: boolean;
  clave: 'GUARDAR' | 'FRESCO' | 'REPRO';
  titulo: string;
  estado: 'Pendiente' | 'En ejecución' | 'Completado' | 'Error';
  mensaje: string;
}

export interface AnularValorizacionesRequest {
  tipo: 'FRESCO' | 'REPRO';
  // usuario obligatorio para anular valorizaciones.
  usuario: string;
}

export interface AnularValorizacionesResponse {
  tipo: 'FRESCO' | 'REPRO';
  mesesProcesados: number;
  cabecerasAnuladas: number;
  detallesAnulados: number;
  meses: { anio: number; mes: number; cabeceras: number; detalles: number }[];
}
