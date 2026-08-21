// ============================================================
//  formato-campo.model.ts
//  Interfaces + lógica para costos.SPC_FormatoCeldaEndpoint
// ============================================================

// ────────────────────────────────────────────────────────────
//  1.  TIPOS PRIMITIVOS
// ────────────────────────────────────────────────────────────

/**
 * Tipos que devuelve la columna `tipo` del SP.
 *   'number'  ← int | long | decimal | double | float
 *   'string'  ← string / char
 *   'date'    ← DateTime | DateOnly
 *   'bool'    ← bool
 */
export type TipoCampo = 'string' | 'number' | 'date' | 'bool';

/**
 * Tipos de `dataType` que acepta DxDataGrid.
 * 'bool' → 'boolean'  (DevExtreme no acepta 'bool').
 */
export type TipoDx = 'string' | 'number' | 'date' | 'boolean';

/** Formatos que acepta dxColumn.format. */
export type TipoFormatoDx = 'currency' | 'percent' | 'fixedPoint';

// ────────────────────────────────────────────────────────────
//  2.  DTO  –  fila del SP
// ────────────────────────────────────────────────────────────

/**
 * Una fila de costos.SPC_FormatoCeldaEndpoint.
 *
 * CLAVE `nombre`
 * ─────────────
 * Es la clave JSON exacta que genera AListaDeDiccionarios():
 *
 *   Campos raíz simples
 *     → valor del [Column("...")], ej. 'Lote', 'Precio Compra'
 *
 *   Campos de sub-DTOs nested (ProcesoPrimarioDto, etc.)
 *     → nombre de PROPIEDAD C# que serializa Newtonsoft
 *       (no pasan por ObtenerNombreColumna)
 *     → ejemplos: 'dcRecepcion', 'dcClasificacion', 'dcCostoFijo'
 *
 * Los BIT del SP llegan como boolean porque .NET serializa BIT → bool.
 */
export interface FormatoCampoDto {
  nombreEndpoint    : string;
  tipo              : TipoCampo;   // fuente de verdad del tipo
  nombre            : string;      // clave de lookup
  blExcluidoSummary : boolean;     // reemplaza camposExcluidos[]
  blEsMoneda        : boolean;     // reemplaza camposMoneda[]
  blEsPorcentaje    : boolean;     // reemplaza camposPorcentaje[]
  blEsAltaPrecision : boolean;     // reemplaza camposAltaPrecision[]
  blEsEntero        : boolean;
  blEsFijo          : boolean;
}

export interface CostosUnitarios {
  // Proceso Primario
  Recepcion: number;
  Clasificacion: number;
  Cajas: number;
  Descabezado: number;
  // Proceso Presentación
  Decorado: number;
  Retractilado: number;
  // Proceso Congelación
  Brine: number;
  IQF: number;
  Tunel: number;
  // Proceso Secundario
  Pelado: number;
  Hidratacion: number;
  Cocido: number;
  // Costos estructurales
  CostDirVariables: number;
  CostDirFijos: number;
  CostIndirVariables: number;
  CostIndirFijos: number;
  Copacking: number;
  Excedente: number;
}

// ────────────────────────────────────────────────────────────
//  3.  MAPA  –  lookup O(1)
// ────────────────────────────────────────────────────────────

/**
 * Map<nombre, FormatoCampoDto>.
 * La clave es el mismo `key` del for…in que usa generarEstructuraColumnas.
 */
export type FormatoCampoMap = Map<string, FormatoCampoDto>;

// ────────────────────────────────────────────────────────────
//  4.  TIPOS DE SALIDA  –  DevExtreme
// ────────────────────────────────────────────────────────────

export interface ColumnFormatDx {
  type      : TipoFormatoDx;
  precision : number;
  currency ?: 'USD';
}

export interface ColumnaResueltaDx {
  dataField  : string;
  caption    : string;
  dataType   : TipoDx;      // ya resuelto desde FormatoCampoDto.tipo
  alignment  : 'left' | 'right' | 'center';
  format    ?: ColumnFormatDx;
  groupIndex?: number;
  fixed     ?: boolean;
}

export interface ColumnaGrupoDx {
  caption   : string;
  alignment : 'center';
  columns   : ColumnaConfigDx[];
}

export type ColumnaConfigDx = ColumnaResueltaDx | ColumnaGrupoDx;

export function esColumnaSimple(col: ColumnaConfigDx): col is ColumnaResueltaDx {
  return 'dataField' in col;
}

export function esColumnaGrupo(col: ColumnaConfigDx): col is ColumnaGrupoDx {
  return 'columns' in col;
}
/**
 * SummaryItemDx
 * El campo `esTipoNumero` es redundante en runtime (siempre true
 * cuando existe el item) pero documenta que el item fue creado
 * porque el SP declaró tipo='number'.  El valueFormat hereda
 * el mismo formato de la columna para consistencia visual.
 */
export interface SummaryItemDx {
  column          : string;
  summaryType     : 'sum';
  valueFormat     : ColumnFormatDx;
  displayFormat   : string;
  skipEmptyValues : boolean;
}

/** Resultado único del generador: columnas + summaries en un solo paso. */
export interface EstructuraGridDx {
  columnas  : ColumnaConfigDx[];
  summaries : SummaryItemDx[];
}

// ────────────────────────────────────────────────────────────
//  5.  FUNCIONES DE RESOLUCIÓN  (puras)
// ────────────────────────────────────────────────────────────

/**
 * Convierte TipoCampo → TipoDx para DevExtreme.
 * 'bool' → 'boolean'  (único cambio; el resto es 1:1).
 */
export function resolverTipoDx(tipo: TipoCampo): TipoDx {
  return tipo === 'bool' ? 'boolean' : tipo;
}

/**
 * Resuelve el formato DevExtreme desde los flags del SP.
 *
 * Prioridad (igual que el original):
 *   1. blEsMoneda     → currency, precision 2 ó 4
 *   2. blEsPorcentaje → percent,  precision 2
 *   3. tipo=number + blEsAltaPrecision → currency precision 4
 *   4. tipo=number (resto) → fixedPoint precision 2
 *   5. no es number   → null
 *   6. es blEsEntero → null (sin formato, aunque tipo=number, porque no tiene decimales)
 */
export function resolverFormatoDx(cfg: FormatoCampoDto): ColumnFormatDx |null {
  if (cfg.tipo !== 'number') return null;
  if (cfg.blEsEntero) return null;
  const precision = cfg.blEsAltaPrecision ? 4 : 2;

  if (cfg.blEsMoneda)     return { type: 'currency',   precision, currency: 'USD' };
  if (cfg.blEsPorcentaje) return { type: 'percent',    precision: 2 };
  if (cfg.blEsAltaPrecision) return { type: 'currency', precision: 4, currency: 'USD' };


  // número sin flag especial → fixedPoint estándar
  return { type: 'fixedPoint', precision: 2 };
}

/**
 * Cuando el campo no está en el mapa (sin config del SP),
 * infiere el tipo desde el valor en runtime como fallback.
 */
function inferirTipoDxFallback(value: unknown): TipoDx {
  if (typeof value === 'number')  return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (value instanceof Date)      return 'date';
  return 'string';
}

// ────────────────────────────────────────────────────────────
//  6.  CONSTRUCTOR DEL MAPA
// ────────────────────────────────────────────────────────────

/**
 * Construye el FormatoCampoMap desde el array devuelto por la API.
 * Filtra opcionalmente por endpoint.
 *
 * @example
 *   const map = construirFormatoCampoMap(response.Table, 'materia-prima');
 */
export function construirFormatoCampoMap(
  lst      : FormatoCampoDto[],
  endpoint?: string
): FormatoCampoMap {
  const src = endpoint
    ? lst.filter(f => f.nombreEndpoint === endpoint)
    : lst;

  return new Map(src.map(f => [f.nombre, f]));
}

// ────────────────────────────────────────────────────────────
//  7.  GENERADOR ÚNICO  –  columnas + summaries en un recorrido
// ────────────────────────────────────────────────────────────

/**
 * Reemplaza generarEstructuraColumnas() + generarSummaryItems().
 *
 * En un único recorrido del objeto de datos:
 *   • Construye la estructura de columnas para DxDataGrid.
 *   • Construye los summary items para DxDataGrid.
 *
 * El tipo del campo viene SIEMPRE de FormatoCampoDto.tipo (SP).
 * El summary se agrega automáticamente cuando:
 *   cfg.tipo === 'number'  &&  !cfg.blExcluidoSummary
 * Sin ninguna condición extra: si el SP dice que es number y no
 * está excluido, se suma.  Transparente.
 *
 * @param obj          Primera fila de datos (para inferir estructura)
 * @param cfgMap       Mapa del endpoint activo
 * @param keysToGroup  Campos que actúan como groupBy en el grid
 * @param parentKey    Ruta acumulada (uso interno en la recursión)
 */
export function generarEstructuraGrid(
  obj           : Record<string, unknown>,
  cfgMap        : FormatoCampoMap,
  keysToGroup   : string[] = [],
  parentKey     : string   = '',
  costosUni?    : CostosUnitarios   // ← nuevo: objeto de costos (Table3[0])
): EstructuraGridDx {

  const columnas : ColumnaConfigDx[] = [];
  const summaries: SummaryItemDx[]   = [];

  for (const key in obj) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key;
    const value   = obj[key];

    let caption = key.replace(/^(str|dc|int|dt)/, '');
    const costo = (costosUni as unknown as Record<string, number> | undefined)?.[caption];
    if (costo !== undefined && costo !== null) {
      caption = `${caption}\n $${costo.toFixed(4)}`;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const sub = generarEstructuraGrid(
        value as Record<string, unknown>,
        cfgMap,
        keysToGroup,
        //esColumnaFija,
        fullKey,
        costosUni                                    // ← propagar en recursión
      );      
      columnas.push({
        caption  : caption,
        alignment: 'center',
        columns  : sub.columnas,
      } satisfies ColumnaGrupoDx);
      summaries.push(...sub.summaries);
      continue;
    }

    const cfg    = cfgMap.get(key);
    const tipoDx = cfg ? resolverTipoDx(cfg.tipo) : inferirTipoDxFallback(value);
    const esNumero = tipoDx === 'number';
    const formato = cfg ? resolverFormatoDx(cfg) : null;
    const esFijo = cfg?.blEsFijo ?? false;   
    const groupIndex = keysToGroup.indexOf(fullKey);

    const col: ColumnaResueltaDx = {
      dataField: fullKey,
      caption,
      dataType : tipoDx,
      alignment: esNumero ? 'right' : 'left',
      ...(formato    ? { format: formato }       : {}),
      ...(groupIndex !== -1 ? { groupIndex }     : {}),
      ...(esFijo ? { fixed: true } : {}),
    };
    columnas.push(col);

    if (cfg && cfg.tipo === 'number' && !cfg.blExcluidoSummary) {
      summaries.push({
        column         : fullKey,
        summaryType    : 'sum',
        valueFormat    : formato ?? { type: 'fixedPoint', precision: 2 },
        displayFormat  : '{0}',
        skipEmptyValues: true,
      });
    }
  }

  return { columnas, summaries };
}
