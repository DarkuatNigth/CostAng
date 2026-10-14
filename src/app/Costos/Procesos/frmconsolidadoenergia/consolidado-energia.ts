// consolidado-energia.config.ts
// Modelo y datos de ejemplo para el Consolidado de Energía Eléctrica.
// Réplica de las hojas "Consolidado con Kwh" y "Recoleccion Basura".
// Plantas: SONGA 1, SONGA 2, COMIN. Meses: Enero..Diciembre.

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const MESES_CORTO = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export type Planta = 'SONGA 1' | 'SONGA 2' | 'COMIN';

export const CODIGOS: Record<Planta, string> = {
  'SONGA 1': '349559-0',
  'SONGA 2': '278276-0',
  'COMIN': '408117-K',
};

/** Un registro mensual por planta. */
export interface RegistroMes {
  planta: Planta;
  codigo: string;
  usd: number;
  kwh: number;
  ratio: number; // USD/Kwh
}

/** Fila de la tabla pivote (planta en fila, meses en columnas). */
export interface FilaPivote {
  planta: string;
  codigo: string;
  // valores por mes (índice 0 = Enero .. 11 = Diciembre)
  meses: number[];
  total: number;
}

/** DTO que devolvería el SP: por planta, arrays de 12 meses. */
export interface ConsolidadoDTO {
  anio: number;
  usd: Record<Planta, number[]>;   // 12 meses
  kwh: Record<Planta, number[]>;   // 12 meses
  alumbrado: Record<Planta, number[]>; // 12 meses (recolección/alumbrado)
}

const PLANTAS: Planta[] = ['SONGA 1', 'SONGA 2', 'COMIN'];

const round = (n: number, d = 2): number => {
  const f = Math.pow(10, d);
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Construye filas pivote (planta + 12 meses + total) desde un Record. */
export function toPivote(data: Record<Planta, number[]>): FilaPivote[] {
  return PLANTAS.map((p) => {
    const meses = (data[p] || []).slice(0, 12).map((v) => round(v));
    const total = round(meses.reduce((a, b) => a + b, 0));
    return { planta: p, codigo: CODIGOS[p], meses, total };
  });
}

/** Fila TOTAL (suma de todas las plantas por mes). */
export function filaTotal(filas: FilaPivote[]): FilaPivote {
  const meses = Array.from({ length: 12 }, (_, i) =>
    round(filas.reduce((a, f) => a + (f.meses[i] || 0), 0))
  );
  return {
    planta: 'TOTAL',
    codigo: '',
    meses,
    total: round(meses.reduce((a, b) => a + b, 0)),
  };
}

/** Ratio USD/Kwh por planta y mes. */
export function pivoteRatio(usd: FilaPivote[], kwh: FilaPivote[]): FilaPivote[] {
  return usd.map((fu, idx) => {
    const fk = kwh[idx];
    const meses = fu.meses.map((u, i) => {
      const k = fk?.meses[i] || 0;
      return k > 0 ? round(u / k, 4) : 0;
    });
    return { planta: fu.planta, codigo: fu.codigo, meses, total: 0 };
  });
}

// // ---- DATOS DE EJEMPLO (basados en valores reales de años anteriores) ----

// // Base real tomada del Excel (Ene..Dic; los meses futuros quedan en 0).
// const BASE_USD: Record<Planta, number[]> = {
//   'SONGA 1': [388384.51, 385254.11, 274597.39, 329316.20, 282945.05, 289099.31, 375953.19, 300822.91, 334211.30, 0, 0, 0],
//   'SONGA 2': [0, 57943.56, 157702.66, 174123.61, 175887.96, 178285.11, 225339.46, 177195.91, 208257.31, 0, 0, 0],
//   'COMIN':   [17667.05, 19197.98, 18074.54, 18945.17, 19053.31, 18979.17, 27026.09, 26800.39, 28707.97, 0, 0, 0],
// };

// const BASE_KWH: Record<Planta, number[]> = {
//   'SONGA 1': [6687805.32, 6501035.12, 4780233.45, 5601894.85, 4822051.38, 4927233.41, 4688433.42, 2722093.41, 3442898.66, 0, 0, 0],
//   'SONGA 2': [0, 822433.78, 1890354.12, 2887819.28, 2961562.95, 2810993.25, 2702492.27, 1582669.49, 2140180.86, 0, 0, 0],
//   'COMIN':   [293680.07, 320987.11, 300001.12, 318873.01, 320266.03, 307673.03, 308394.19, 233487.18, 251015.27, 0, 0, 0],
// };

// const BASE_ALUMBRADO: Record<Planta, number[]> = {
//   'SONGA 1': [48548.06, 48156.76, 34324.67, 41164.53, 35368.13, 36137.41, 46994.15, 37602.86, 41776.41, 0, 0, 0],
//   'SONGA 2': [0, 7242.94, 19712.83, 21765.45, 21985.99, 22285.64, 28167.43, 22149.49, 26032.16, 0, 0, 0],
//   'COMIN':   [2208.38, 2399.75, 2259.32, 2368.15, 2381.66, 2372.40, 3378.26, 3350.05, 3588.50, 0, 0, 0],
// };

// /** Aplica una variación determinística por año para simular datos distintos. */
// function variar(base: Record<Planta, number[]>, anio: number): Record<Planta, number[]> {
//   const factor = 1 + ((anio % 5) - 2) * 0.04; // ±8% según el año
//   const out = {} as Record<Planta, number[]>;
//   for (const p of PLANTAS) {
//     out[p] = base[p].map((v) => (v > 0 ? round(v * factor) : 0));
//   }
//   return out;
// }

// /** Datos de ejemplo del consolidado para un año. */
// export function mockConsolidado(anio: number): ConsolidadoDTO {
//   return {
//     anio,
//     usd: variar(BASE_USD, anio),
//     kwh: variar(BASE_KWH, anio),
//     alumbrado: variar(BASE_ALUMBRADO, anio),
//   };
// }

export interface FilaCombinada {
  planta: string; codigo: string; [key: string]: any;
  totUsd: number; totKwh: number; totRatio: number;
}
export function toCombinada(usd: Record<Planta, number[]>, kwh: Record<Planta, number[]>): FilaCombinada[] {
  const filas: FilaCombinada[] = PLANTAS.map((p) => {
    const u = usd[p] || []; const k = kwh[p] || [];
    const fila: FilaCombinada = { planta: p, codigo: CODIGOS[p], totUsd: 0, totKwh: 0, totRatio: 0 };
    let su = 0, sk = 0;
    for (let i = 0; i < 12; i++) {
      const uu = round(u[i] || 0); const kk = round(k[i] || 0);
      fila['usd'+i]=uu; fila['kwh'+i]=kk; fila['ratio'+i]= kk>0?round(uu/kk,4):0;
      su+=uu; sk+=kk;
    }
    fila.totUsd=round(su); fila.totKwh=round(sk); fila.totRatio= sk>0?round(su/sk,4):0;
    return fila;
  });
  const tot: FilaCombinada = { planta:'TOTAL', codigo:'', totUsd:0, totKwh:0, totRatio:0 };
  let gu=0, gk=0;
  for (let i=0;i<12;i++){
    const su=round(filas.reduce((a,f)=>a+(f['usd'+i]||0),0));
    const sk=round(filas.reduce((a,f)=>a+(f['kwh'+i]||0),0));
    tot['usd'+i]=su; tot['kwh'+i]=sk; tot['ratio'+i]= sk>0?round(su/sk,4):0;
    gu+=su; gk+=sk;
  }
  tot.totUsd=round(gu); tot.totKwh=round(gk); tot.totRatio= gk>0?round(gu/gk,4):0;
  return [...filas, tot];
}