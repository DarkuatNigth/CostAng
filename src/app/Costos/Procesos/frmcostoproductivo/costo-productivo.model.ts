export interface DetalleProcesoAplicableCosto {
  codigoProceso: string;
  proceso: string;
  dolares: number;
}

export interface CostoProductivoCuenta {
  id: number;
  origen: 'CONTABLE' | 'DERIVADO' | string;
  etapaVista: string;
  grupoEtapa: string;
  ecCodigo: string;
  pcCodigo: string;
  tipo: string;
  tipoCosto: string;
  tipo3: string;
  agrupacionCentro: string;
  grupoCentro: string;
  clasificacionMonto: string;
  origenDistribucion: string;
  cuenta: string;
  centroCodigo: string;
  centroCosto: string;
  subcentroCodigo: string;
  subcentroCosto: string;
  rubro: string;
  auxiliar: string;
  naturaleza: string;
  debe: number;
  credito: number;
  montoFuenteSong: number;
  factorAsignacion: number;
  montoCuenta: number;
  entero: number;
  cola: number;
  subtotal: number;
  valorAgregado: number;
  costoDirectoFijo: number;
  costoDirectoVariable: number;
  costoIndirectoFijo: number;
  costoIndirectoVariable: number;
  reclasificadoDescongelado: number;
  librasDriver: number;
  pesoDriver: number;

  // Auditoría de distribución LOG/REC/CLA por libras recibidas frescas.
  librasRecibidasEntero?: number;
  librasRecibidasCola?: number;
  librasProcesadasEntero?: number;
  librasProcesadasCola?: number;
  costoUnitarioRecibido?: number;
  costoUnitarioEntero?: number;
  costoUnitarioCola?: number;

  // Valores exactos calculados por backend para persistencia.
  // No se formatean ni redondean en el front antes de enviarlos.
  enteroPersistencia?: number;
  colaPersistencia?: number;
  valorAgregadoPersistencia?: number;

  total: number;
  diferencia: number;
  destinosSiTexto: string;
  cantidadDestinosSi: number;
  detalleProcesosAplicables: DetalleProcesoAplicableCosto[];
  encontradaSong: boolean;
  cuadra: boolean;
}

export interface CostoProductivoResumen {
  registros: number;
  cuentasContables: number;
  cuentasSinSaldo: number;
  debe: number;
  credito: number;
  montoCuenta: number;
  entero: number;
  cola: number;
  subtotal: number;
  valorAgregado: number;
  valorAgregadoBruto: number;
  valorAgregadoNeto: number;
  reclasificadoDescongelado: number;
  descongelado: number;
  librasDescongelado: number;
  tarifaDescongelado: number;
  descongeladoSinAsignar: number;
  lotesDescongeladoSinSalida: number;
  costoDirectoFijo: number;
  costoDirectoVariable: number;
  costoIndirectoFijo: number;
  costoIndirectoVariable: number;
  total: number;
  diferencia: number;
  cuadra: boolean;
}

export interface DataTablesCostoProductivo {
  Table: CostoProductivoCuenta[];
  Table1: CostoProductivoResumen[];
}

export interface ApiResponseCostoProductivo {
  Codigo: boolean;
  Description: string;
  Dt: DataTablesCostoProductivo;
}

export interface GuardarCostoProductivoRequest {
  anio: string;
  mes: string;
  usuario: string;

  // Snapshot exacto que el usuario consultó.
  registros: CostoProductivoCuenta[];
  resumen: CostoProductivoResumen;
}
