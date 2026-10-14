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

export const PARTICION_MAP: Record<string, string> = {
  EN: 'Entero', EV: 'Entero Valor Agregado', SH: 'Cola', SV: 'Cola Valor Agregado',
};
export const PARTICION_ORDEN: Record<string, number> = { EN: 1, EV: 2, SH: 3, SV: 4 };

// Mapea el origen del front (FRS/RPC) al del back (PFR/RPC)
export const ORIGEN_BACK: Record<string, string> = { FRS: 'PFR', RPC: 'RPC' };

// Fila que llega en Table3
export interface LibrasParticion {
  strProceso: string;
  strOrigen: string;      // PFR / RPC
  strParticionCod: string; // EN/SH/EV/SV
  strParticion: string;
  dcLibras: number;
}

// ─── Hoja del grid agrupado (nivel 3) ────────────────────────────────────────
export interface ProcesoParticion {
  Codigo: number;
  Descripcion: string;      // proceso
  grupo: string;
  grupoOrden: number;
  particionCod: string;
  particion: string;
  particionOrden: number;
  origen: string;           // FRS/RPC/PG
  Valor: number;            // dólares de la partición (derivado)
  Libras_Proceso: number;   // libras de la partición
  Costo_Unitario: number;   // = ValorTotal/LibrasTotal
  editable?: boolean;          // ← NUEVO
}

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

/**
 * costos: filas por proceso con Valor TOTAL (ProcesoAgrupado o ProcesoGeneral)
 * libras: filas de Table3 (LibrasParticion)
 * origenFront: 'FRS' | 'RPC' | 'PG'
 */
export function construirParticiones(
  costos: { Codigo: number; Descripcion: string; grupo: string; Valor: number; editable?: boolean  }[],
  libras: LibrasParticion[],
  origenFront: string
): ProcesoParticion[] {
  const resultado: ProcesoParticion[] = [];
  const origenesBack = origenFront === 'PG' ? ['PFR', 'RPC'] : [ORIGEN_BACK[origenFront]];
  let seq = 0;                              // ← NUEVO: contador para key única

  costos.forEach((c) => {
    const filasProc = libras.filter(
      l => l.strProceso.trim() === c.Descripcion.trim() && origenesBack.includes(l.strOrigen)
    );

    if (filasProc.length === 0) {
      resultado.push({
        Codigo: 500000 + seq++,            // ← única (antes: c.Codigo)
        Descripcion: c.Descripcion,
        grupo: c.grupo, grupoOrden: GRUPO_ORDEN[c.grupo] ?? 99,
        particionCod: '—', particion: 'General', particionOrden: 0,
        origen: origenFront, Valor: c.Valor, Libras_Proceso: 0, Costo_Unitario: 0,
        editable: (c as any).editable ?? false,   
      });
      return;
    }

    const porParticion = new Map<string, number>();
    filasProc.forEach(f =>
      porParticion.set(f.strParticionCod, (porParticion.get(f.strParticionCod) ?? 0) + f.dcLibras));

    const librasTotal = [...porParticion.values()].reduce((s, v) => s + v, 0);
    const costoUnit = librasTotal > 0 ? c.Valor / librasTotal : 0;

    porParticion.forEach((lbs, cod) => {
      if (!lbs || lbs <= 0) return; 
      resultado.push({
        Codigo: 500000 + seq++,            // ← única (antes: c.Codigo)
        Descripcion: c.Descripcion,
        grupo: c.grupo, grupoOrden: GRUPO_ORDEN[c.grupo] ?? 99,
        particionCod: cod, particion: PARTICION_MAP[cod] ?? cod,
        particionOrden: PARTICION_ORDEN[cod] ?? 99,
        origen: origenFront,
        Valor: costoUnit * lbs,
        Libras_Proceso: lbs,
        Costo_Unitario: costoUnit,
        editable: (c as any).editable ?? false,  
      });
    });
  });

  return resultado.sort((a, b) =>
    a.grupoOrden - b.grupoOrden || a.particionOrden - b.particionOrden || a.Codigo - b.Codigo);
}

export function construirTotalesParticion(particiones: ProcesoParticion[]): any[] {
  const map = new Map<string, {
    grupo: string; grupoOrden: number;
    particionCod: string; particion: string; particionOrden: number;
    valor: number; librasPrimera: number; librasSuma: number;
  }>();

  particiones.forEach(p => {
    if (p.particionCod === '—') return; // ignora los "General" (sin split)
    const key = p.grupo + '|' + p.particionCod;
    let e = map.get(key);
    if (!e) {
      e = {
        grupo: p.grupo, grupoOrden: p.grupoOrden,
        particionCod: p.particionCod, particion: p.particion, particionOrden: p.particionOrden,
        valor: 0, librasPrimera: p.Libras_Proceso, librasSuma: 0,
      };
      map.set(key, e);
    }
    e.valor += p.Valor;
    e.librasSuma += p.Libras_Proceso;
  });

  const rows: any[] = [];
  let idx = 0;
  map.forEach(e => {
    // libras compartidas (Proceso Primario, Costos Dir/Ind) → tomar una; si no, sumar
    const compartidas = GRUPOS_LIBRAS_UNICAS.includes(e.grupo);
    const libras = compartidas ? e.librasPrimera : e.librasSuma;
    rows.push({
      Codigo: 7000 + idx++,
      grupo: e.grupo,
      grupoOrden: e.grupoOrden,
      Descripcion: e.particion,        // la fila ES la partición
      particion: e.particion,
      particionCod: e.particionCod,
      particionOrden: e.particionOrden,
      Valor: e.valor,
      Libras_Proceso: libras,
      Costo_Unitario: libras > 0 ? e.valor / libras : 0,
    });
  });

  return rows.sort((a, b) => a.grupoOrden - b.grupoOrden || a.particionOrden - b.particionOrden);
}