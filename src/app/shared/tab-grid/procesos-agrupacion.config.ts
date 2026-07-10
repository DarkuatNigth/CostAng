export const GRUPO_MAP: Record<string, string> = {
  // Costos Directos
  'C.D.Fijos':           'Costos Directos',
  'C.D.Variables':       'Costos Directos',

  // Costos Indirectos
  'C.I.Fijos':           'Costos Indirectos',
  'C.I.Variables':       'Costos Indirectos',

  // Proceso Primario
  'Recepcion':           'Proceso Primario',
  'Clasificacion':       'Proceso Primario',
  'Cajas':               'Proceso Primario',
  'Codificacion':        'Proceso Primario',

  // Proceso Secundario
  'Descabezado':         'Proceso Secundario',
  'Pelado':              'Proceso Secundario',
  'Hidratacion':         'Proceso Secundario',
  'Cocido':              'Proceso Secundario',

  // Proceso Presentación
  'Decorado':            'Proceso Presentacion',
  'Retractilado':        'Proceso Presentacion',

  // Proceso Congelación
  'Brine':               'Proceso Congelacion',
  'IQF':                 'Proceso Congelacion',
  'Tunel':               'Proceso Congelacion',

  // Material Empaque
  'Material Empaque':    'Material Empaque',  
};

// Orden de visualización de grupos
export const GRUPO_ORDEN: Record<string, number> = {
  'Totales':              0,              
  'Costos Directos':      5,
  'Costos Indirectos':    6,
  'Proceso Primario':     1,
  'Proceso Secundario':   2,
  'Proceso Presentacion': 3,
  'Proceso Congelacion':  4,
  'Otros':                99,
};

// Metadatos visuales por grupo (icono y clase CSS)
export const GRUPO_META: Record<string, { icon: string; css: string }> = {
  'Totales':              { icon: 'chart',       css: 'tot' },
  'Costos Directos':      { icon: 'money',       css: 'cd'  },
  'Costos Indirectos':    { icon: 'money',       css: 'ci'  },
  'Proceso Primario':     { icon: 'activefolder', css: 'pp'  },
  'Proceso Secundario':   { icon: 'activefolder', css: 'ps'  },
  'Proceso Presentacion': { icon: 'product',      css: 'pre' },
  'Proceso Congelacion':  { icon: 'product',      css: 'pcg' },
  'Otros':                { icon: 'info',         css: 'ot'  },
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE EXTENDIDA
// ─────────────────────────────────────────────────────────────────────────────
// ... (Tus constantes GRUPO_MAP, GRUPO_ORDEN, etc. se quedan igual)

export class ProcesoAgrupado {
  Codigo: number;
  codTip: string | null;
  editable: boolean;
  TipLote: string;
  Descripcion: string;
  Valor: number;
  Libras_Proceso: number;
  Costo_Unitario: number;
  grupo: string;
  grupoOrden: number;
  origen: string;

  constructor(data: any, origen: string) {
    const desc = data.Descripcion ? data.Descripcion.trim() : '';
    const nombreGrupo = GRUPO_MAP[desc] || 'Otros';

    this.Codigo = data.Codigo;
    this.codTip = data.codTip;
    this.editable = data.editable;
    this.TipLote = data.TipLote;
    this.Descripcion = desc;
    this.Valor = data.Valor || 0;
    this.Libras_Proceso = data.Libras_Proceso || 0;
    this.Costo_Unitario = data.Costo_Unitario || 0;
    
    // Propiedades calculadas (Mapper)
    this.origen = origen;
    this.grupo = nombreGrupo;
    this.grupoOrden = GRUPO_ORDEN[nombreGrupo] || 99;
  }

  // Método estático opcional para mapear listas fácilmente
  static mapList(items: any[], origen: string): ProcesoAgrupado[] {
    return (items || []).map(item => new ProcesoAgrupado(item, origen));
  }
}

// ─── NUEVA CONSTANTE ────────────────────────────────────────────────────────
export const GRUPOS_GENERALES: string[] = [
  'Proceso Primario',
  'Proceso Secundario',
  'Proceso Presentacion',
  'Proceso Congelacion',
  'Costos Directos',
  'Costos Indirectos',
  'Material Empaque',
  'Otros'
];

export const GRUPOS_SIN_SUBTAB: string[] = [
  'Costos Directos',
  'Costos Indirectos',
  'Material Empaque',
];

// Grupos donde las libras son compartidas → tomar solo la primera fila
export const GRUPOS_LIBRAS_UNICAS: string[] = [
  'Proceso Primario',
  'Costos Directos',
  'Costos Indirectos'
];

// ─── NUEVA CLASE ─────────────────────────────────────────────────────────────
export class ProcesoGeneral {
  Codigo: number;
  Descripcion: string;
  Valor: number;
  Libras_Proceso: number; // FRS_libras + RPC_libras
  Costo_Unitario: number; // Valor / Libras_Proceso
  grupo: string; 
  constructor(codigo: number, descripcion: string, valor: number, libras: number, grupo: string) {
    this.Codigo         = codigo;
    this.Descripcion    = descripcion;
    this.Valor          = valor;
    this.Libras_Proceso = libras;
    this.Costo_Unitario = libras > 0 ? valor / libras : 0;
    this.grupo = grupo;          // ← AGREGA esta propiedad
  }
}
