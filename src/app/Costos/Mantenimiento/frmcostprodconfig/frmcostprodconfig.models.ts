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
  codigo: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface ProcesoCostoMantenimiento {
  codigo: string;
  nombre: string;
  etapaCodigo: string;
  etapa: string;
  orden: number;
  activo: boolean;
  enMatriz: boolean;
}

export interface TipoLoteMantenimiento {
  codigo: string;
  nombre: string;
  activo: boolean;
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
  esNuevo?: boolean;
}

export interface ReglaCostoMantenimiento {
  codigo: ReglaCostoCodigo | string;
  descripcion: string;
  aplica: boolean;
  especial: boolean;
}

export interface CostoProductivoMantenimientoApi {
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
}
