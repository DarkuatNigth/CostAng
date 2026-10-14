export interface DiarioDetalleDTO {
  id: number;
  orden: number;
  codigo?: string | null;
  cuentaContable: string;
  clave?: string | null;
  descripcion: string;
  moneda?: string | null;
  debe: number;
  haber: number;
  detalle?: string | null;
}

/**
 * Un retorno puede generar uno o varios asientos.
 * El backend devuelve exclusivamente la información del diario.
 * El cuadre visual (Debe vs Haber) se calcula en Angular.
 */
export interface DiarioRetornoDTO {
  id: number;
  titulo: string;
  subtitulo?: string | null;
  numeroDocumento?: string | null;
  referencia?: string | null;
  glosa?: string | null;
  filas: DiarioDetalleDTO[];
}

export interface RetornosDTO {
  titulo: string;
  mensaje?: string | null;
  diarios: DiarioRetornoDTO[];
}

export interface TransferenciaGifDetalleDTO {
  id: number;
  orden: number;

  /**
   * Fracción 0..1 cuando el Excel contiene un porcentaje en la columna
   * Cálculo. En los demás diarios normalmente viene null.
   */
  calculo?: number | null;

  /**
   * Referencia/origen auxiliar que aparece en algunas líneas del Excel
   * (por ejemplo Hoja Costos.xls / Hoja_Costo_MP).
   */
  origen?: string | null;

  codigo: string;
  clave?: string | null;
  nombreCuenta: string;
  debe: number;
  haber: number;
}

/**
 * Cada bloque contable de la hoja ENE se devuelve como un diario
 * independiente. Angular valida el cuadre de cada bloque por separado.
 */
export interface TransferenciaGifDiarioDTO {
  id: number;
  codigo?: string | null;
  titulo?: string | null;
  glosa?: string | null;

  // Compatibilidad anterior
  grupoLabel?: string | null;
  descripcion?: string | null;

  /** Control de presentación; el backend puede omitirlo y el mock lo incluye. */
  mostrarCalculo?: boolean;
  mostrarOrigen?: boolean;

  filas: TransferenciaGifDetalleDTO[];
}

export interface TransferenciaGifDTO {
  titulo: string;
  periodoTexto: string;
  baseCalculo: number;
  totalGastoIndirecto: number;
  diarios: TransferenciaGifDiarioDTO[];
}

export interface DiariosCierreDTO {
  idGeneracion: number;
  anio: number;
  mes: number;
  periodoTexto: string;
  guardado: boolean;
  estado?: string | null;
  retornos: RetornosDTO;
  transferenciaGif: TransferenciaGifDTO;
}

export interface ConfirmarDiariosCierreRequest {
  idGeneracion: number;
  anio: number;
  mes: number;
  usuario: string;
}

export interface ResultWS<T = any> {
  Codigo: boolean;
  Description: string;
  Dt?: T;
}
