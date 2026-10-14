// distribucion-luz.config.ts
// Dos asientos contables:
//   SONGA  -> cuentas LUZ al DEBE (% por cuenta). El total combinado se divide
//             62%/38% (split fijo de BD) entre bolsa SONGA 1 y bolsa SONGA 2;
//             cada cuenta pertenece a una bolsa y su DEBE = % * bolsa.
//             Debajo, 1 fila HABER (20122010014) por el total combinado.
//   COMIN  -> 1 cuenta al DEBE (100%) + 1 fila HABER (20122010014).
// El usuario ingresa: Total $ y Watts de SONGA, y Total $ y Watts de COMIN.

export type TipoAsiento = 'SONGA' | 'COMIN';
export type Bolsa = 'SONGA1' | 'SONGA2' | 'COMIN';
export type Planta = 'SONGA1' | 'SONGA2' | 'COMIN';
export type Grupo = 'energia' | 'basura';
export interface TotalPlanta {
  id: number;
  dolares: number;
  watts: number;
  codigoMedidor: string;   // ← se llena desde el HABER que manda el backend
}

export type TotalesGrupo = Record<Planta, TotalPlanta>;

export const PLANTAS: Planta[] = ['SONGA1', 'SONGA2', 'COMIN'];

export function totalesVacios(): TotalesGrupo {
  return {
    SONGA1: { id: 0, dolares: 0, watts: 0, codigoMedidor: '' },
    SONGA2: { id: 0, dolares: 0, watts: 0, codigoMedidor: '' },
    COMIN:  { id: 0, dolares: 0, watts: 0, codigoMedidor: '' },
  };
}

/**
 * Arma el mapa de totales leyendo los HABER que vienen del backend.
 * El codigoMedidor y los montos salen del propio registro HABER.
 */
export function totalesDesdeHaber(drivers: DriverCuenta[], tipoDriver: string): TotalesGrupo {
  const totales = totalesVacios();

  PLANTAS.forEach((planta) => {
    const h = drivers.find(
      (d) => d.tipoCuenta === 'C' && d.tipoDriver === tipoDriver && d.bolsa === planta
    );
    if (!h) return;

    totales[planta] = {
      id: h.id ?? 0,
      dolares: h.montoDolares ?? 0,
      watts: h.montoKwh ?? 0,
      codigoMedidor: h.codigoMedidor ?? '',
    };
  });

  return totales;
}

// ---- Split: solo informativo para la UI ----
export interface SplitFijo {
  pctSonga1: number;
  pctSonga2: number;
}

export function calcularSplit(totales: TotalesGrupo): SplitFijo {
  const total = (totales.SONGA1.dolares || 0) + (totales.SONGA2.dolares || 0);
  if (total === 0) return { pctSonga1: 0, pctSonga2: 0 };
  return {
    pctSonga1: (totales.SONGA1.dolares / total) * 100,
    pctSonga2: (totales.SONGA2.dolares / total) * 100,
  };
}

// ============================================================================
// DTO / Clase
// ============================================================================

export interface CuentaDriverDTO {
  ID: number;
  ASIENTO: TipoAsiento;
  BOLSA: Bolsa;
  CUENTA: string;
  CLAVE?: string | null;
  DESCRIPCION: string;
  CENTRO_COSTO?: string;
  PORCENTAJE?: number;
  EDITABLE?: boolean;
  TIPODRIVER?: string;
  TIPOCUENTA?: string;
  fechaCorte?: string;
  ANIO?: number;
  MES?: number;
  MONTO?: number;
  VALORKW?: number;
  codigoMedidor: string;
  paCodigo?: number;
  Usuario?: string;
}

export class DriverCuenta {
  id: number;
  asiento: TipoAsiento;
  bolsa: Bolsa;
  cuenta: string;
  clave: string;
  descripcion: string;
  centroCosto: string;
  porcentaje: number;
  editable: boolean;
  tipoDriver?: string;
  tipoCuenta?: string;
  montoDolares?: number;
  montoKwh?: number;
  anio?: number;
  mes?: number;
  fechaCorte?: string;
  codigoMedidor: string;
  paCodigo?: number;

  constructor(dto: CuentaDriverDTO) {
    this.id = dto.ID;
    this.asiento = dto.ASIENTO;
    this.bolsa = dto.BOLSA;
    this.cuenta = dto.CUENTA;
    this.clave = dto.CLAVE ?? '';
    this.descripcion = dto.DESCRIPCION ?? 'LUZ';
    this.centroCosto = dto.CENTRO_COSTO ?? '';
    const p = dto.PORCENTAJE ?? 0;
    this.porcentaje = p <= 1 ? +(p * 100).toFixed(4) : +p.toFixed(4);
    this.editable = dto.EDITABLE ?? (dto.ASIENTO === 'SONGA');
    this.tipoCuenta = dto.TIPOCUENTA ?? undefined;
    this.tipoDriver = dto.TIPODRIVER ?? undefined;
    this.montoDolares = dto.MONTO ?? undefined;
    this.montoKwh = dto.VALORKW ?? undefined;
    this.anio = dto.ANIO ?? undefined;
    this.mes = dto.MES ?? undefined;
    this.fechaCorte = dto.fechaCorte ?? undefined;
    this.codigoMedidor = (dto.codigoMedidor ?? '').trim();
    this.paCodigo = dto.paCodigo ?? undefined;
  }

  get fraccion(): number {
    return (this.porcentaje || 0) / 100;
  }

  toCuentaDriverDTO(varUser: string): CuentaDriverDTO {
    return {
      ID: this.id,
      ASIENTO: this.asiento,
      BOLSA: this.bolsa,
      CUENTA: this.cuenta,
      CLAVE: this.clave,
      DESCRIPCION: this.descripcion,
      CENTRO_COSTO: this.centroCosto,
      PORCENTAJE: this.porcentaje / 100,
      EDITABLE: this.editable,
      TIPODRIVER: this.tipoDriver,
      TIPOCUENTA: this.tipoCuenta,
      MONTO: this.montoDolares,
      VALORKW: this.montoKwh,
      ANIO: this.anio,
      MES: this.mes,
      fechaCorte: this.fechaCorte,
      codigoMedidor: this.codigoMedidor,
      paCodigo: this.paCodigo,
      Usuario: varUser,
    };
  }

  static mapList(rows: CuentaDriverDTO[] = []): DriverCuenta[] {
    return rows.map((r) => new DriverCuenta(r));
  }
}

export interface DistribucionCuenta {
  id: number;
  asiento: TipoAsiento;
  asientoLabel: string;
  bolsa: Bolsa;
  cuenta: string;
  clave: string;
  descripcion: string;
  centroCosto: string;
  porcentaje: number;
  debe: number;
  haber: number;
  debeWatts: number;
  haberWatts: number;
  esHaber: boolean;
  codigoMedidor: string;
}

export interface ResumenAsiento {
  asiento: TipoAsiento;
  label: string;
  totalDolares: number;
  totalDebe: number;
  totalHaber: number;
  diferencia: number;
  totalWatts: number;
  totalWattsRepartido: number;
}

const ASIENTO_LABEL: Record<TipoAsiento, string> = {
  SONGA: 'SONGA 1 / SONGA 2',
  COMIN: 'COMIN',
};

const round = (n: number, dec = 4): number => {
  const f = Math.pow(10, dec);
  return Math.round((n + Number.EPSILON) * f) / f;
};

// ============================================================================
// calcularDistribucion — filtra por codigoMedidor del backend
// ============================================================================

export function calcularDistribucion(
  drivers: DriverCuenta[],
  totales: TotalesGrupo
): { filas: DistribucionCuenta[]; resumenes: ResumenAsiento[] } {
  const filas: DistribucionCuenta[] = [];
  const resumenes: ResumenAsiento[] = [];

  const tieneDebeValido = drivers.some((d) => d.tipoCuenta !== 'C' && d.porcentaje > 0);
  const tieneTotales = PLANTAS.some((p) => (totales[p]?.dolares || 0) > 0);
  const enCero = !tieneDebeValido || !tieneTotales;

  const procesarPlanta = (planta: Planta, asiento: TipoAsiento) => {
    const tp = totales[planta];
    const medidor = (tp?.codigoMedidor ?? '').trim();

    const dolares = enCero ? 0 : round(tp?.dolares || 0);
    const watts = enCero ? 0 : round(tp?.watts || 0);

    // ← FILTRO POR MEDIDOR (el backend ya lo manda en cada fila)
    const cuentasDebe = drivers.filter(
      (d) => d.tipoCuenta !== 'C' && d.asiento === asiento && d.codigoMedidor === medidor
    );

    let sumaDebe = 0;
    let sumaWatts = 0;

    cuentasDebe.forEach((c) => {
      const frac = asiento === 'COMIN' ? (c.fraccion || 1) : c.fraccion;
      const debe = enCero ? 0 : round(frac * dolares);
      const w = enCero ? 0 : round(frac * watts);
      sumaDebe += debe;
      sumaWatts += w;

      filas.push({
        id: c.id,
        asiento,
        asientoLabel: ASIENTO_LABEL[asiento],
        bolsa: c.bolsa,
        cuenta: c.cuenta,
        clave: c.clave,
        descripcion: c.descripcion,
        centroCosto: c.centroCosto,
        porcentaje: c.porcentaje,
        debe,
        haber: 0,
        debeWatts: w,
        haberWatts: 0,
        esHaber: false,
        codigoMedidor: c.codigoMedidor,
      });
    });

    // ← HABER de esta planta, ubicado por su medidor
    const haber = drivers.find((d) => d.tipoCuenta === 'C' && d.codigoMedidor === medidor);

    filas.push({
      id: haber?.id ?? -(PLANTAS.indexOf(planta) + 1),
      asiento,
      asientoLabel: ASIENTO_LABEL[asiento],
      bolsa: planta as Bolsa,
      cuenta: haber?.cuenta ?? '',
      clave: haber?.clave ?? '',
      descripcion: haber?.descripcion ?? 'LUZ',
      centroCosto: haber?.centroCosto ?? '',
      porcentaje: 100,
      debe: 0,
      haber: dolares,
      debeWatts: 0,
      haberWatts: watts,
      esHaber: true,
      codigoMedidor: medidor,
    });

    return { debe: round(sumaDebe), wattsRep: round(sumaWatts), dolares, watts };
  };

  // ---------- SONGA 1 y SONGA 2, cada una con su medidor y su HABER ----------
  if (drivers.some((d) => d.asiento === 'SONGA' && d.tipoCuenta !== 'C')) {
    const r1 = procesarPlanta('SONGA1', 'SONGA');
    const r2 = procesarPlanta('SONGA2', 'SONGA');

    const totalDolares = round(r1.dolares + r2.dolares);
    const totalDebe = round(r1.debe + r2.debe);

    resumenes.push({
      asiento: 'SONGA',
      label: ASIENTO_LABEL['SONGA'],
      totalDolares,
      totalDebe,
      totalHaber: totalDolares,
      diferencia: round(totalDolares - totalDebe),
      totalWatts: round(r1.watts + r2.watts),
      totalWattsRepartido: round(r1.wattsRep + r2.wattsRep),
    });
  }

  // ---------- COMIN ----------
  if (drivers.some((d) => d.asiento === 'COMIN' && d.tipoCuenta !== 'C')) {
    const rc = procesarPlanta('COMIN', 'COMIN');

    resumenes.push({
      asiento: 'COMIN',
      label: ASIENTO_LABEL['COMIN'],
      totalDolares: rc.dolares,
      totalDebe: rc.debe,
      totalHaber: rc.dolares,
      diferencia: round(rc.dolares - rc.debe),
      totalWatts: rc.watts,
      totalWattsRepartido: rc.wattsRep,
    });
  }

  return { filas, resumenes };
}