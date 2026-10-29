import {
  ProcesoCatalogoApi,
  CostoApiRow,
  CuentaContableMock,
  GrupoCuentaContableVista,
  DetalleEtapaApi,
  DetalleEtapaPivot,
  FilaActualizacion,
  FilaCostoVista,
  LibrasApiRow,
  ResumenLibrasProcesadasApi,
  ResultadoActualizacion,
  TripletaCostos,
  DatosFaltantesActualizacion,
  MetricasActualizacion,
  CeldaParticionVista,
  CostoProductivoDetalleModalApi,
  WarrenBaseProcesoSnapshot
} from './param-proc.models';

const CODIGO_PREMIO = 'PMIO';

export interface PremioDetalleApi { Origen: string; Certificado: string; Lote: number; Producto: number; Descripcion: string; Talla: string; Libras: number; Premio: number }

/**
 * Mapper general de frmparametrizacionproceso.
 *
 * Contiene en un único archivo:
 * - construcción de la hoja ACTUALIZACION;
 * - cálculo Warren;
 * - lectura Table4/Table5;
 * - consolidación de libras para la tabla principal;
 * - pivote del detalle para los modales DevExtreme.
 */
/**
 * Traduce el payload actual del endpoint ProcesoParametro/param-proc a la
 * estructura de la hoja ACTUALIZACION de Resumen Costos - 2026-01.xlsx.
 *
 * Contrato esperado:
 *   Table  -> PFR
 *   Table1 -> RPC
 *   Table2 -> Tarifas (se conserva, ACTUALIZACION no tiene bloque visible)
 *   Table3 -> Libras por proceso/origen/partición (EN/SH/EV/SV)
 */
// unica fuente del catalogo dinamico; backend excluye tarifas y diarios.
function idsProcesosDinamicos(dtOriginal: any): { id: string; pcCodigo: string; nombre: string; etapaCodigo: string }[] {
  const lstCatalogo: ProcesoCatalogoApi[] = Array.isArray(dtOriginal?.Table10)
    ? dtOriginal?.Table10 : [];
  return lstCatalogo.filter(x => x && x.conocido === false).map(x => ({
    id: x.pcCodigo.toLowerCase(), pcCodigo: x.pcCodigo,
    nombre: x.nombre, etapaCodigo: x.etapaCodigo
  }));
}

// misma base física para la vista consolidada y el snapshot solo PFR.
function librasProcesoDinamico(dt: any, proceso: { pcCodigo: string; nombre: string }, origen?: string): TripletaCostos {
  const normalizar = (valor: any) => String(valor ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
  const numero = (valor: any) => Number.isFinite(Number(valor)) ? Number(valor) : 0;
  const lstTable3 = (Array.isArray(dt?.Table3) ? dt.Table3 : []).filter((x: any) =>
    normalizar(x.strProceso) === normalizar(proceso.nombre) &&
    ['PFR', 'RPC'].includes(normalizar(x.strOrigen)));
  const tripleta = { entero: 0, cola: 0, valorAgregado: 0 };
  if (lstTable3.length > 0) {
    for (const fila of lstTable3.filter((x: any) => !origen || normalizar(x.strOrigen) === origen)) {
      const particion = normalizar(fila.strParticionCod);
      if (particion === 'EN') tripleta.entero += numero(fila.dcLibras);
      if (['SH', 'CO'].includes(particion)) tripleta.cola += numero(fila.dcLibras);
      if (['EV', 'SV', 'VA'].includes(particion)) tripleta.valorAgregado += numero(fila.dcLibras);
    }
    return tripleta;
  }
  for (const fila of (Array.isArray(dt?.Table9) ? dt.Table9 : [])) {
    const strOrigen = normalizar(fila.strOrigen ?? fila.Origen);
    if (normalizar(fila.strPcCodigo ?? fila.PcCodigo ?? fila.ProcesoCodigo) !== normalizar(proceso.pcCodigo) ||
      !['PFR', 'RPC'].includes(strOrigen) || (origen && strOrigen !== origen)) continue;
    tripleta.entero += numero(fila.dcLibrasEntero ?? fila.LibrasEntero);
    tripleta.cola += numero(fila.dcLibrasCola ?? fila.LibrasCola);
    tripleta.valorAgregado += numero(fila.dcLibrasValorAgregado ?? fila.LibrasValorAgregado);
  }
  return tripleta;
}

class ActualizacionCostosMapperInternal {
  private tablePfr: CostoApiRow[] = [];
  private tableRpc: CostoApiRow[] = [];
  private tableTar: CostoApiRow[] = [];
  private tableLibras: LibrasApiRow[] = [];
  private dtOriginal: any = {};

  construir(dt: any, warrenObjetivo = 0.83): ResultadoActualizacion {
    this.dtOriginal = dt ?? {};
    this.tablePfr = this.toCostoRows(this.dtOriginal.Table);
    this.tableRpc = this.toCostoRows(this.dtOriginal.Table1);
    this.tableTar = this.toCostoRows(this.dtOriginal.Table2);
    this.tableLibras = this.toLibrasRows(this.dtOriginal.Table3);

    const filas: FilaActualizacion[] = [];

    // ────────────────────────────────────────────────────────────────────────
    // FILAS 6-14: BASE PRODUCTIVA
    // ────────────────────────────────────────────────────────────────────────
    const camaron = this.obtenerTripletaAuxiliar(['camaron'], false) ?? {
      entero: this.libras('PFR', 'Recepcion', ['EN']) || this.libras('PFR', 'Clasificacion', ['EN']),
      cola: this.libras('PFR', 'Recepcion', ['SH']) || this.libras('PFR', 'Clasificacion', ['SH']),
      valorAgregado: 0
    };

    // El payload compartido no incluye un dataset específico "Camarón Reproceso".
    // Se usa Material Empaque RPC como la base más completa EN/SH disponible y se
    // permite que el back la reemplace automáticamente con un dataset auxiliar.
    const camaronRpc = this.obtenerTripletaAuxiliar(['camaron reproceso'], false) ?? {
      entero: this.libras('RPC', 'Material Empaque', ['EN']),
      cola: this.libras('RPC', 'Material Empaque', ['SH']),
      valorAgregado: 0
    };

    const camaronLiquidadoAux = this.obtenerTripletaAuxiliar(['camaron liquidado'], true);
    const camaronLiquidado = camaronLiquidadoAux ?? this.obtenerCamaronLiquidadoEscalar();

    const camaronVag = this.obtenerTripletaAuxiliar(['camaron vag', 'camaron valor agregado'], false) ?? {
      entero: 0,
      cola: 0,
      valorAgregado: this.libras('RPC', 'Material Empaque', ['EV', 'SV'])
    };

    filas.push(this.row(6, 'camaron', 'Camarón', camaron));
    filas.push(this.spacer(7, 'sp-top-1'));
    filas.push(this.row(8, 'camaron-rpc', 'Camarón Reproceso', camaronRpc));
    filas.push(this.spacer(9, 'sp-top-2'));
    filas.push(this.row(10, 'camaron-liquidado', 'Camaron Liquidado', camaronLiquidado ?? this.zeroTripleta()));
    filas.push(this.spacer(11, 'sp-top-3'));
    filas.push(this.row(12, 'camaron-vag', 'Camarón VAG', camaronVag));
    filas.push(this.spacer(13, 'sp-top-4'));

    // Paridad Excel: C14 = C6+C8, D14 = D6+D8, E14 = E6:E12.
    // La fila Camaron Liquidado NO forma parte de C14/D14 en el archivo fuente.
    const totalLibras: TripletaCostos = {
      entero: camaron.entero + camaronRpc.entero,
      cola: camaron.cola + camaronRpc.cola,
      valorAgregado: camaron.valorAgregado + camaronRpc.valorAgregado + camaronVag.valorAgregado
    };
    filas.push(this.rowTotal(14, 'total-libras', 'Total', totalLibras));
    filas.push(this.section(15, 'sec-material-empaque', 'Costo Material de Empaque'));

    // ────────────────────────────────────────────────────────────────────────
    // BLOQUE CONTABLE AGRUPADO
    // A partir de esta versión no existen filas visuales separadas "Reproceso".
    // PFR + RPC se consolidan en la misma etapa. La única excepción es el
    // cuadro superior de Resumen de Libras Procesadas, que conserva las filas
    // Camarón Libras liquidadas / Camarón Reproceso / Camarón VAG.
    //
    // IMPORTANTE: las libras RPC que explican estas etapas deben corresponder
    // únicamente a producto PROCESADO (Agrupacion = "2. PROCESADO"). El front
    // consume Table5 bajo esa regla y el backend debe mantenerla al construirlo.
    // ────────────────────────────────────────────────────────────────────────

    // MATERIAL DE EMPAQUE:
    // El backend ya lo entrega como MP / MPE y su valor NO se distribuye por libras.
    // Se toma directamente de Table6 respetando la partición contable:
    //   50301 -> Entero
    //   50302 -> Cola
    //   50303 -> Valor Agregado
    //
    // El fallback anterior se conserva únicamente si Table6 todavía no trae MPE,
    // para no romper períodos/ambientes que aún no tengan desplegado el cambio.
    const materialEmpaqueDetalle =
      this.materialEmpaqueDesdeDetalleContable(this.dtOriginal.Table6);

    const materialEmpaque = materialEmpaqueDetalle.encontrado
      ? materialEmpaqueDetalle.tripleta
      : this.sumTripletas([
          this.distribuirPool('PFR', 'Material Empaque'),
          this.distribuirPool('RPC', 'Material Empaque')
        ]);

    const f16 = this.row(16, 'material-empaque', 'Material de Empaque', materialEmpaque);
    f16.monedaEntero = true;
    f16.monedaCola = true;
    f16.monedaValorAgregado = true;
    filas.push(f16);
    filas.push(this.spacer(17, 'sp-me-1'));

    let totalMe = { ...materialEmpaque };
    const lstCatalogo: ProcesoCatalogoApi[] = Array.isArray(this.dtOriginal.Table10) ? this.dtOriginal.Table10 : [];
    const objProceso = lstCatalogo.find(x => x.pcCodigo === CODIGO_PREMIO);
    if (objProceso) {
      const premio = this.tripletaTable6(CODIGO_PREMIO);
      const fila = this.rowWarren(18, 'premio', objProceso.nombre, premio);
      fila.monedaEntero = fila.monedaCola = fila.monedaValorAgregado = true;
      filas.push(fila);
      totalMe = this.sumTripletas([materialEmpaque, premio]);
    }
    const f20 = this.rowTotal(20, 'total-me', 'Total', totalMe);
    f20.monedaEntero = true;
    f20.monedaCola = true;
    f20.monedaValorAgregado = true;
    filas.push(f20);
    filas.push(this.spacer(21, 'sp-me-3'));
    filas.push(this.section(22, 'sec-produccion', 'Resumen Costo Producción'));

    // ────────────────────────────────────────────────────────────────────────
    // PROCESOS PRODUCTIVOS
    // ────────────────────────────────────────────────────────────────────────
    const procesos: FilaActualizacion[] = [];

    // =======================================================================
    // FUENTE MONETARIA ÚNICA
    //
    // Table6 ya es el asiento contable distribuido por Proceso + Partición.
    // El front NO vuelve a prorratear dólares con Table/Table1 ni con libras.
    // Table5/Table3 siguen siendo la fuente física de libras.
    // =======================================================================

    const logistica = this.rowWarren(
      23,
      'logistica',
      'Logística',
      this.tripletaTable6('LOG')
    );
    logistica.monedaEntero = logistica.monedaCola = logistica.monedaValorAgregado = true;
    procesos.push(logistica, this.spacerWarren(24, 'sp-p-log'));

    const recepcion = this.rowWarren(
      25,
      'recepcion',
      'Recepción',
      this.tripletaTable6('REC')
    );
    recepcion.monedaEntero = recepcion.monedaCola = recepcion.monedaValorAgregado = true;
    procesos.push(recepcion, this.spacerWarren(26, 'sp-p-01'));

    const clasificacion = this.rowWarren(
      27,
      'clasificacion',
      'Clasificación',
      this.tripletaTable6('CLA')
    );
    clasificacion.monedaEntero = clasificacion.monedaCola = clasificacion.monedaValorAgregado = true;
    procesos.push(clasificacion, this.spacerWarren(28, 'sp-p-02'));

    const cajas = this.rowWarren(
      29,
      'cajas',
      'Cajas',
      this.tripletaTable6('CAJ')
    );
    cajas.monedaEntero = cajas.monedaCola = cajas.monedaValorAgregado = true;
    procesos.push(cajas, this.spacerWarren(30, 'sp-p-03'));

    const tunel = this.rowWarren(
      31,
      'tunel',
      'Tunel',
      this.tripletaTable6('TUN')
    );
    tunel.monedaEntero = tunel.monedaCola = tunel.monedaValorAgregado = true;
    procesos.push(tunel, this.spacerWarren(32, 'sp-p-04'));

    const brine = this.rowWarren(
      33,
      'brine',
      'Brine',
      this.tripletaTable6('BRI')
    );
    brine.monedaEntero = brine.monedaCola = brine.monedaValorAgregado = true;
    procesos.push(brine, this.spacerWarren(34, 'sp-p-06'));

    const filaIqf = this.rowWarren(
      35,
      'iqf',
      'IQF',
      this.tripletaTable6('IQF')
    );
    filaIqf.monedaEntero = filaIqf.monedaCola = filaIqf.monedaValorAgregado = true;
    procesos.push(filaIqf, this.spacerWarren(36, 'sp-p-07'));

    const filaDesc = this.rowWarren(
      37,
      'descabezado',
      'Descabezado',
      this.tripletaTable6('DES')
    );
    filaDesc.monedaEntero = filaDesc.monedaCola = filaDesc.monedaValorAgregado = true;
    filaDesc.resaltarCola = true;
    procesos.push(filaDesc, this.spacerWarren(38, 'sp-p-08'));

    const filaDescongelado = this.row(
      39,
      'descongelado',
      'Descongelado',
      this.tripletaTable6('DSC')
    );
    filaDescongelado.monedaEntero =
      filaDescongelado.monedaCola =
      filaDescongelado.monedaValorAgregado = true;
    procesos.push(filaDescongelado, this.spacerWarren(40, 'sp-p-09'));

    // Mientras químicos no tengan una fila contable persistible propia,
    // la pantalla monetaria muestra exactamente el componente contable de Table6.
    const filaHidratacion = this.rowWarren(
      41,
      'hidratacion',
      'Hidratación',
      this.tripletaTable6('HID')
    );
    filaHidratacion.monedaEntero =
      filaHidratacion.monedaCola =
      filaHidratacion.monedaValorAgregado = true;
    procesos.push(filaHidratacion, this.spacerWarren(42, 'sp-p-10'));

    const filaCocido = this.rowWarren(
      43,
      'cocido',
      'Cocido',
      this.tripletaTable6('COC')
    );
    filaCocido.monedaEntero =
      filaCocido.monedaCola =
      filaCocido.monedaValorAgregado = true;
    procesos.push(filaCocido, this.spacerWarren(44, 'sp-p-11'));

    const filaPelado = this.rowWarren(
      45,
      'pelado',
      'Pelado',
      this.tripletaTable6('PEL')
    );
    filaPelado.monedaEntero =
      filaPelado.monedaCola =
      filaPelado.monedaValorAgregado = true;
    procesos.push(filaPelado, this.spacerWarren(46, 'sp-p-12'));

    const filaRetractilado = this.rowWarren(
      47,
      'retractilado',
      'Retractilado',
      this.tripletaTable6('RET')
    );
    filaRetractilado.monedaEntero =
      filaRetractilado.monedaCola =
      filaRetractilado.monedaValorAgregado = true;
    procesos.push(filaRetractilado, this.spacerWarren(48, 'sp-p-13'));

    const filaDecorado = this.rowWarren(
      49,
      'decorado',
      'Decorado',
      this.tripletaTable6('DEC')
    );
    filaDecorado.monedaEntero =
      filaDecorado.monedaCola =
      filaDecorado.monedaValorAgregado = true;
    procesos.push(filaDecorado, this.spacerWarren(50, 'sp-p-14'));

    let idDin = 400;
    const lstDirectosDinamicos: FilaActualizacion[] = [];
    const lstIndirectosDinamicos: FilaActualizacion[] = [];
    const dicUltimaFilaEtapa: Record<string, string> = { PP: 'logistica', PC: 'iqf', PS: 'pelado', PR: 'decorado' };
    for (const objProceso of idsProcesosDinamicos(this.dtOriginal)) {
      const fila = this.rowWarren(idDin, objProceso.pcCodigo.toLowerCase(),
        objProceso.nombre, this.tripletaTable6(objProceso.pcCodigo));
      fila.monedaEntero = fila.monedaCola = fila.monedaValorAgregado = true;
      const espacio = this.spacerWarren(idDin + 1, 'sp-din-' + objProceso.pcCodigo);
      const strEtapa = objProceso.etapaCodigo?.trim().toUpperCase();
      if (strEtapa === 'CD') lstDirectosDinamicos.push(fila, espacio);
      else if (strEtapa === 'CI') lstIndirectosDinamicos.push(fila, espacio);
      else {
        const intAncla = procesos.findIndex(x => x.id === dicUltimaFilaEtapa[strEtapa]);
        procesos.splice(intAncla < 0 ? procesos.length : intAncla + 1, 0, fila, espacio);
        dicUltimaFilaEtapa[strEtapa] = espacio.id;
      }
      idDin += 2;
    }

    const totalProcesosBase = this.sumTripletas(
      procesos.filter(x => x.tipo === 'normal').map(x => this.toTripleta(x))
    );
    filas.push(...procesos, this.rowTotal(53, 'total-procesos-base', 'Total', totalProcesosBase, true));
    filas.push(this.spacerWarren(54, 'sp-after-p'));

    // -----------------------------------------------------------------------
    // COSTOS DIRECTOS
    //
    // No existe "doble factor" en Angular. Los importes son la suma exacta
    // de las cuentas contables ya distribuidas por el backend.
    // -----------------------------------------------------------------------
    filas.push(this.section(55, 'sec-directos', 'Costos Directos'));
    filas.push(this.spacerWarren(56, 'sp-cd-0'));

    const cdVariables = this.tripletaTable6('CDV');
    const cdFijos = this.tripletaTable6('CDF');

    const directosRows: FilaActualizacion[] = [
      this.rowWarren(58, 'cd-var', 'Variables', cdVariables),
      this.spacerWarren(59, 'sp-cd-2'),
      this.rowWarren(62, 'cd-fijo', 'Fijos', cdFijos),
      this.spacerWarren(63, 'sp-cd-4')
    ];
    // incorporar CD antes del espacio final, conservando ids y orden fijo.
    directosRows.splice(directosRows.findIndex(x => x.id === 'cd-fijo') + 1, 0, ...lstDirectosDinamicos);
    directosRows.filter(x => x.tipo === 'normal').forEach(x => {
      x.monedaEntero = true;
      x.monedaCola = true;
      x.monedaValorAgregado = true;
    });
    filas.push(...directosRows);

    const totalDirectos = this.sumTripletas(
      directosRows.filter(x => x.tipo === 'normal').map(x => this.toTripleta(x))
    );
    filas.push(this.rowTotal(66, 'total-directos', 'Total', totalDirectos, true));
    filas.push(this.spacerWarren(67, 'sp-after-cd'));

    // -----------------------------------------------------------------------
    // COSTOS INDIRECTOS
    // -----------------------------------------------------------------------
    filas.push(this.section(68, 'sec-indirectos', 'Costos Indirectos'));
    filas.push(this.spacerWarren(69, 'sp-ci-0'));

    const ciVariables = this.tripletaTable6('CIV');
    const ciFijos = this.tripletaTable6('CIF');

    const indirectosRows: FilaActualizacion[] = [
      this.rowWarren(70, 'ci-var', 'Variables', ciVariables),
      this.spacerWarren(71, 'sp-ci-1'),
      this.rowWarren(74, 'ci-fijo', 'Fijos', ciFijos),
      this.spacerWarren(75, 'sp-ci-3')
    ];
    // incorporar CI en su bloque para evitar doble conteo en subtotales.
    indirectosRows.splice(indirectosRows.findIndex(x => x.id === 'ci-fijo') + 1, 0, ...lstIndirectosDinamicos);
    indirectosRows.filter(x => x.tipo === 'normal').forEach(x => {
      x.monedaEntero = true;
      x.monedaCola = true;
      x.monedaValorAgregado = true;
    });
    filas.push(...indirectosRows);

    const totalIndirectos = this.sumTripletas(
      indirectosRows.filter(x => x.tipo === 'normal').map(x => this.toTripleta(x))
    );
    filas.push(this.rowTotal(78, 'total-indirectos', 'Total', totalIndirectos, true));
    filas.push(this.spacerWarren(79, 'sp-after-ci-1'));
    filas.push(this.spacerWarren(80, 'sp-after-ci-2'));

    // -----------------------------------------------------------------------
    // OTROS
    // Copacking también conserva exactamente EN/CO/VA de Table6.
    // -----------------------------------------------------------------------
    filas.push(this.section(81, 'sec-otros', 'Otros'));
    filas.push(this.spacer(82, 'sp-ot-0'));

    const copacking = this.row(
      83,
      'copacking',
      'Copacking',
      this.tripletaTable6('COP')
    );
    copacking.aplicaWarren = false;
    copacking.mostrarProrrateo = false;
    copacking.monedaEntero =
      copacking.monedaCola =
      copacking.monedaValorAgregado = true;

    const otrosRows: FilaActualizacion[] = [
      copacking,
      this.spacer(84, 'sp-ot-1')
    ];
    filas.push(...otrosRows);

    const totalOtros = this.sumTripletas(
      otrosRows.filter(x => x.tipo === 'normal').map(x => this.toTripleta(x))
    );
    filas.push(this.rowTotal(87, 'total-otros', 'Total', totalOtros, true));
    filas.push(this.spacer(88, 'sp-before-total-proc'));

    // ────────────────────────────────────────────────────────────────────────
    // FILAS 89-92: TOTALES + WARREN
    // ────────────────────────────────────────────────────────────────────────
    const totalProcesos = this.sumTripletas([
      totalProcesosBase,
      totalDirectos,
      totalIndirectos,
      totalOtros
    ]);

    // Total Procesos debe representar la suma real de todas las etapas visibles:
    // procesos base + costos directos + costos indirectos + otros.
    // rowTotal() ya calcula correctamente Total $ = Entero + Cola + Valor Agregado.
    const totalProcRow = this.rowTotal(
      89,
      'total-procesos',
      'Total Procesos',
      totalProcesos,
      false
    );
    totalProcRow.tipo = 'totalProcesos';
    totalProcRow.resaltarTotales = true;
    filas.push(totalProcRow);

    filas.push(this.spacer(90, 'sp-after-total-procesos'));

    // Total General es monetario. No se pueden sumar las libras del resumen
    // de materia prima como si fueran dólares. Table4 ya entrega el costo
    // monetario de materia prima por partición (dcTotalDol / dbCostoTotal).
    const costoMateriaPrima = this.costoMateriaPrimaDesdeResumen(this.dtOriginal.Table4);

    const totalGeneral = this.sumTripletas([
      costoMateriaPrima,
      totalMe,
      totalProcesos
    ]);
    const totalGeneralRow = this.rowTotal(91, 'total-general', 'Total General', totalGeneral, false);
    totalGeneralRow.tipo = 'totalGeneral';
    filas.push(totalGeneralRow);

    filas.push(this.spacer(92, 'sp-after-total-general'));

    const referenciaTotalLibras = this.obtenerReferenciaTotalLibras();
    const totalLibrasRow = filas.find(x => x.id === 'total-libras');
    if (totalLibrasRow) {
      totalLibrasRow.referencia = referenciaTotalLibras;
      totalLibrasRow.diferenciaReferencia = referenciaTotalLibras == null
        ? null
        : (totalLibrasRow.total ?? 0) - referenciaTotalLibras;
    }

    // Warren se calcula únicamente con la porción PFR Entero/Cola.
    // Las filas visuales siguen consolidadas PFR + RPC, pero estas bases ocultas
    // impiden que RPC participe en % Absorción o en el ajuste Warren.
    this.inicializarBasesWarrenPfr(filas);

    const metricas: MetricasActualizacion = {
      materialEmpaqueColaXLibra: camaron.cola > 0 ? materialEmpaque.cola / camaron.cola : 0,
      baseProrrateo: 0,
      warrenDiferencia: 0,
      warrenActual: 0,
      warrenObjetivo: this.numeroSeguro(warrenObjetivo),
      ajusteWarrenTotal: 0
    };

    const resultado: ResultadoActualizacion = {
      filas,
      metricas,
      datosFaltantes: {
        camaronLiquidado: camaronLiquidado == null,
        referenciaTotalLibras: referenciaTotalLibras == null
      },
      tarifas: [...this.tableTar]
    };

    this.limpiarWarren(resultado, metricas.warrenObjetivo);
    return resultado;
  }

  /**
   * Deja la hoja cargada sin aplicar Warren. Se usa al consultar el período,
   * al cambiar el objetivo y al restablecer 0.83.
   */
  limpiarWarren(resultado: ResultadoActualizacion, nuevoObjetivo: number): ResultadoActualizacion {
    const filas = resultado.filas;
    const objetivo = this.numeroSeguro(nuevoObjetivo);
    const camaron = filas.find(x => x.id === 'camaron');
    const librasCola = camaron?.cola ?? 0;
    const costoColaPfr = this.totalProcesoPfrCola(filas);

    resultado.metricas = {
      ...resultado.metricas,
      warrenObjetivo: objetivo,
      warrenActual: librasCola > 0 ? costoColaPfr / librasCola : 0,
      warrenDiferencia: 0,
      ajusteWarrenTotal: 0,
      baseProrrateo: 0
    };

    filas.forEach(row => {
      row.prorrateo = null;
      row.ajusteWarren = null;
      row.enteroAjustado = null;
      row.colaAjustada = null;
      row.valorAgregadoAjustado = null;
      row.warrenUnitarioExtraidoEntero = 0;
      row.warrenUnitarioAgregadoCola = 0;
    });

    return resultado;
  }

  /**
   * Recalcula Warren EXCLUSIVAMENTE con PFR.
   *
   * Regla:
   * 1) solo los dólares PFR Entero forman la base de % Absorción;
   * 2) RPC nunca participa, aunque esté agrupado visualmente a la izquierda;
   * 3) el ajuste de cada etapa se convierte primero a valor UNITARIO a extraer
   *    de Entero y a valor UNITARIO a agregar a Cola;
   * 4) Valor Agregado no se modifica: la última columna es una copia del origen.
   */
  recalcularWarren(
    resultado: ResultadoActualizacion,
    nuevoObjetivo: number
  ): ResultadoActualizacion {
    const filas = resultado.filas;
    const objetivo = this.numeroSeguro(nuevoObjetivo);
    const camaron = filas.find(x => x.id === 'camaron');
    const totalProcesos = filas.find(x => x.id === 'total-procesos');

    // Warren tiene como denominador exclusivamente las libras PFR Cola.
    const librasColaPfr = this.numeroSeguro(camaron?.cola);

    // El costo normal visible debe incluir PFR + RPC y proviene del mismo
    // Table6 que alimenta la tabla principal.
    const dolaresColaActual = this.numeroSeguro(totalProcesos?.cola);
    const warrenActual = librasColaPfr > 0
      ? dolaresColaActual / librasColaPfr
      : 0;

    const dolaresObjetivo = objetivo * librasColaPfr;
    const ajusteTotal = Math.max(0, dolaresObjetivo - dolaresColaActual);
    const diferencia = ajusteTotal > 0
      ? objetivo - warrenActual
      : 0;

    // La absorción sí es exclusivamente PFR Entero.
    const baseProrrateo = filas
      .filter(x => x.tipo === 'normal' && x.aplicaWarren)
      .reduce(
        (acc, x) => acc + this.numeroSeguro(x.warrenPfrEntero),
        0
      );

    if (ajusteTotal > 0 && baseProrrateo <= 0) {
      throw new Error('No existe base PFR Entero para absorber Warren.');
    }

    resultado.metricas = {
      ...resultado.metricas,
      warrenObjetivo: objetivo,
      warrenActual,
      warrenDiferencia: diferencia,
      ajusteWarrenTotal: ajusteTotal,
      baseProrrateo
    };

    // Inicialmente Warren conserva exactamente el valor visible.
    filas.forEach(row => {
      row.prorrateo = null;
      row.ajusteWarren = null;
      row.warrenUnitarioExtraidoEntero = 0;
      row.warrenUnitarioAgregadoCola = 0;

      if (row.tipo === 'espacio' || row.tipo === 'seccion') {
        row.enteroAjustado = null;
        row.colaAjustada = null;
        row.valorAgregadoAjustado = null;
        return;
      }

      row.enteroAjustado = this.numeroSeguro(row.entero);
      row.colaAjustada = this.numeroSeguro(row.cola);
      row.valorAgregadoAjustado = this.numeroSeguro(row.valorAgregado);

      if (row.tipo !== 'normal') return;

      const pfrEntero = this.numeroSeguro(row.warrenPfrEntero);
      const lbsEntero = this.numeroSeguro(row.warrenPfrLibrasEntero);
      const lbsCola = this.numeroSeguro(row.warrenPfrLibrasCola);

      if (
        !row.aplicaWarren ||
        ajusteTotal <= 0 ||
        baseProrrateo <= 0 ||
        pfrEntero <= 0
      ) {
        return;
      }

      row.prorrateo = pfrEntero / baseProrrateo;
      row.ajusteWarren = row.prorrateo * ajusteTotal;

      row.warrenUnitarioExtraidoEntero = lbsEntero > 0
        ? row.ajusteWarren / lbsEntero
        : 0;

      const baseLbsCola = lbsCola > 0
        ? lbsCola
        : librasColaPfr;

      row.warrenUnitarioAgregadoCola = baseLbsCola > 0
        ? row.ajusteWarren / baseLbsCola
        : 0;

      // CLAVE: Table8/PFR solo define el DELTA.
      // El visible mantiene la parte RPC ya incluida en Table6.
      row.enteroAjustado =
        this.numeroSeguro(row.entero) -
        row.ajusteWarren;

      row.colaAjustada =
        this.numeroSeguro(row.cola) +
        row.ajusteWarren;
    });

    this.recalcularSubtotalWarren(filas, 'total-procesos-base', [
      'logistica', 'recepcion', 'clasificacion', 'cajas', 'tunel', 'brine',
      'iqf', 'descabezado', 'descongelado', 'hidratacion', 'cocido',
      'pelado', 'retractilado', 'decorado',
      ...idsProcesosDinamicos(this.dtOriginal).filter(x => !['CD', 'CI'].includes(x.etapaCodigo?.trim().toUpperCase())).map(x => x.id)
    ], baseProrrateo);

    this.recalcularSubtotalWarren(
      filas,
      'total-directos',
      ['cd-var', 'cd-fijo', ...idsProcesosDinamicos(this.dtOriginal)
        .filter(x => x.etapaCodigo?.trim().toUpperCase() === 'CD').map(x => x.id)],
      baseProrrateo
    );

    this.recalcularSubtotalWarren(
      filas,
      'total-indirectos',
      ['ci-var', 'ci-fijo', ...idsProcesosDinamicos(this.dtOriginal)
        .filter(x => x.etapaCodigo?.trim().toUpperCase() === 'CI').map(x => x.id)],
      baseProrrateo
    );

    this.recalcularSubtotalWarren(
      filas,
      'total-otros',
      ['copacking'],
      baseProrrateo
    );

    this.recalcularTotalProcesosWarren(filas);

    const totalGeneral = filas.find(x => x.id === 'total-general');
    if (totalGeneral) {
      totalGeneral.enteroAjustado =
        this.numeroSeguro(totalGeneral.entero) - ajusteTotal;
      totalGeneral.colaAjustada =
        this.numeroSeguro(totalGeneral.cola) + ajusteTotal;
      totalGeneral.valorAgregadoAjustado =
        this.numeroSeguro(totalGeneral.valorAgregado);
    }

    this.validarWarrenVisual(resultado, objetivo, ajusteTotal > 0);
    return resultado;
  }

  /**
   * Aplica el Warren persistido que el backend devuelve en Table7/Table8.
   * No recalcula importes individuales en el navegador: respeta el snapshot
   * canónico del backend y solamente recompone subtotales visuales.
   */
  aplicarWarrenGuardado(
    resultado: ResultadoActualizacion,
    resumenRaw: any,
    detalleRaw: any
  ): boolean {
    const resumen = Array.isArray(resumenRaw) ? resumenRaw : [];
    const detalle = Array.isArray(detalleRaw) ? detalleRaw : [];

    if (resumen.length === 0 || detalle.length === 0) {
      return false;
    }

    const cab = resumen[0] ?? {};
    const existe = (
      cab?.ExisteWarren ??
      cab?.existeWarren ??
      cab?.blExisteWarren ??
      true
    ) !== false;

    if (!existe) return false;

    const objetivo = this.numeroSeguro(
      cab?.ObjetivoWarren ??
      cab?.objetivoWarren ??
      cab?.dcObjetivoWarren
    );

    resultado.metricas = {
      ...resultado.metricas,
      warrenObjetivo: objetivo,
      warrenActual: this.numeroSeguro(
        cab?.CostoColaActual ??
        cab?.costoColaActual ??
        cab?.dcCostoColaActual
      ),
      warrenDiferencia: this.numeroSeguro(
        cab?.DiferenciaWarren ??
        cab?.diferenciaWarren ??
        cab?.dcDiferenciaWarren
      ),
      ajusteWarrenTotal: this.numeroSeguro(
        cab?.AjusteTotal ??
        cab?.ajusteTotal ??
        cab?.dcAjusteTotal
      ),
      baseProrrateo: this.numeroSeguro(
        cab?.BaseAbsorcionEntero ??
        cab?.baseAbsorcionEntero ??
        cab?.dcBaseAbsorcionEntero
      )
    };

    const porDescripcion: Record<string, string> = {
      logistica: 'logistica',
      recepcion: 'recepcion',
      clasificacion: 'clasificacion',
      cajas: 'cajas',
      tunel: 'tunel',
      descabezado: 'descabezado',
      retractilado: 'retractilado',
      'c.d.variables': 'cd-var',
      'c.d.fijos': 'cd-fijo',
      'c.i.variables': 'ci-var',
      'c.i.fijos': 'ci-fijo',
      'c.copacking': 'copacking',
      'excedente m.e.': 'excedente-me'
    };

    // extender el mapa fijo por el nombre canonico de Table8.
    idsProcesosDinamicos(this.dtOriginal).forEach(x => {
      porDescripcion[this.norm(x.nombre)] = x.id;
    });

    // El Warren guardado se aplica como DELTA sobre la tabla visible actual.
    // Esto conserva RPC, Descongelado, Hidratación, IQF, etc.
    resultado.filas.forEach(row => {
      row.prorrateo = null;
      row.ajusteWarren = null;

      if (row.tipo === 'espacio' || row.tipo === 'seccion') {
        row.enteroAjustado = null;
        row.colaAjustada = null;
        row.valorAgregadoAjustado = null;
        return;
      }

      row.enteroAjustado = this.numeroSeguro(row.entero);
      row.colaAjustada = this.numeroSeguro(row.cola);
      row.valorAgregadoAjustado = this.numeroSeguro(row.valorAgregado);
    });

    detalle.forEach((d: any) => {
      const descripcion = this.norm(
        d?.Descripcion ??
        d?.strDescripcion ??
        ''
      );

      const id = porDescripcion[descripcion];
      if (!id) return;

      const row = resultado.filas.find(x => x.id === id);
      if (!row) return;

      const montoEnteroOriginal = this.numeroSeguro(
        d?.MontoEnteroOriginal ??
        d?.dcMontoEnteroOriginal
      );
      const montoColaOriginal = this.numeroSeguro(
        d?.MontoColaOriginal ??
        d?.dcMontoColaOriginal
      );
      const montoEnteroWarren = this.numeroSeguro(
        d?.MontoEnteroWarren ??
        d?.dcMontoEnteroWarren
      );
      const montoColaWarren = this.numeroSeguro(
        d?.MontoColaWarren ??
        d?.dcMontoColaWarren
      );

      row.warrenPfrLibrasEntero = this.numeroSeguro(
        d?.LibrasEntero ?? d?.dcLibrasEntero
      );
      row.warrenPfrLibrasCola = this.numeroSeguro(
        d?.LibrasCola ?? d?.dcLibrasCola
      );
      row.warrenPfrEntero = montoEnteroOriginal;
      row.warrenPfrCola = montoColaOriginal;
      row.prorrateo = this.numeroSeguro(
        d?.PorcentajeAbsorcion ?? d?.dcPorcentajeAbsorcion
      );
      row.ajusteWarren = this.numeroSeguro(
        d?.AjusteWarren ?? d?.dcAjusteWarren
      );
      row.warrenUnitarioExtraidoEntero = this.numeroSeguro(
        d?.UnitarioExtraidoEntero ?? d?.dcUnitarioExtraidoEntero
      );
      row.warrenUnitarioAgregadoCola = this.numeroSeguro(
        d?.UnitarioAgregadoCola ?? d?.dcUnitarioAgregadoCola
      );

      const deltaEntero = montoEnteroWarren - montoEnteroOriginal;
      const deltaCola = montoColaWarren - montoColaOriginal;

      row.enteroAjustado =
        this.numeroSeguro(row.entero) +
        deltaEntero;

      row.colaAjustada =
        this.numeroSeguro(row.cola) +
        deltaCola;

      row.valorAgregadoAjustado =
        this.numeroSeguro(row.valorAgregado);
    });

    const base = resultado.metricas.baseProrrateo;

    this.recalcularSubtotalWarren(resultado.filas, 'total-procesos-base', [
      'logistica', 'recepcion', 'clasificacion', 'cajas', 'tunel', 'brine',
      'iqf', 'descabezado', 'descongelado', 'hidratacion', 'cocido',
      'pelado', 'retractilado', 'decorado',
      ...idsProcesosDinamicos(this.dtOriginal).filter(x => !['CD', 'CI'].includes(x.etapaCodigo?.trim().toUpperCase())).map(x => x.id)
    ], base);

    this.recalcularSubtotalWarren(
      resultado.filas,
      'total-directos',
      ['cd-var', 'cd-fijo', ...idsProcesosDinamicos(this.dtOriginal)
        .filter(x => x.etapaCodigo?.trim().toUpperCase() === 'CD').map(x => x.id)],
      base
    );

    this.recalcularSubtotalWarren(
      resultado.filas,
      'total-indirectos',
      ['ci-var', 'ci-fijo', ...idsProcesosDinamicos(this.dtOriginal)
        .filter(x => x.etapaCodigo?.trim().toUpperCase() === 'CI').map(x => x.id)],
      base
    );

    this.recalcularSubtotalWarren(
      resultado.filas,
      'total-otros',
      ['copacking'],
      base
    );

    this.recalcularTotalProcesosWarren(resultado.filas);

    const totalGeneral = resultado.filas.find(x => x.id === 'total-general');
    if (totalGeneral) {
      const ajuste = resultado.metricas.ajusteWarrenTotal;
      totalGeneral.enteroAjustado =
        this.numeroSeguro(totalGeneral.entero) - ajuste;
      totalGeneral.colaAjustada =
        this.numeroSeguro(totalGeneral.cola) + ajuste;
      totalGeneral.valorAgregadoAjustado =
        this.numeroSeguro(totalGeneral.valorAgregado);
    }

    this.validarWarrenVisual(
      resultado,
      resultado.metricas.warrenObjetivo,
      resultado.metricas.ajusteWarrenTotal > 0
    );

    return true;
  }

private inicializarBasesWarrenPfr(
  filas: FilaActualizacion[]
): void {

  const mapa: Record<
    string,
    {
      pcCodigo: string;
      absorbe: boolean;
    }
  > = {
    logistica: { pcCodigo: 'LOG', absorbe: true },
    recepcion: { pcCodigo: 'REC', absorbe: true },
    clasificacion: { pcCodigo: 'CLA', absorbe: true },
    cajas: { pcCodigo: 'CAJ', absorbe: true },
    descabezado: { pcCodigo: 'DES', absorbe: true },
    retractilado: { pcCodigo: 'RET', absorbe: true },
    tunel: { pcCodigo: 'TUN', absorbe: true },

    'cd-var': { pcCodigo: 'CDV', absorbe: true },
    'cd-fijo': { pcCodigo: 'CDF', absorbe: true },
    'ci-var': { pcCodigo: 'CIV', absorbe: true },
    'ci-fijo': { pcCodigo: 'CIF', absorbe: true },

    copacking: { pcCodigo: 'COP', absorbe: false }
  };

  // Table8 es la fuente de participacion; sin detalle rige la etapa.
  const lstDetalle = Array.isArray(this.dtOriginal.Table8) ? this.dtOriginal.Table8 : [];
  idsProcesosDinamicos(this.dtOriginal).forEach(x => {
    mapa[x.id] = {
      pcCodigo: x.pcCodigo,
      absorbe: lstDetalle.some((d: any) =>
        this.norm(d?.Descripcion ?? d?.strDescripcion ?? '') === this.norm(x.nombre)) ||
        ['PP', 'CD', 'CI'].includes(x.etapaCodigo?.trim().toUpperCase())
    };
  });

  filas.forEach(row => {
    row.warrenPfrEntero = 0;
    row.warrenPfrCola = 0;
    row.warrenPfrLibrasEntero = 0;
    row.warrenPfrLibrasCola = 0;
    row.warrenPfrCostoUnitario = 0;
    row.warrenUnitarioExtraidoEntero = 0;
    row.warrenUnitarioAgregadoCola = 0;

    if (row.tipo !== 'normal') {
      row.aplicaWarren = false;
      row.mostrarProrrateo = false;
      return;
    }

    const cfg = mapa[row.id];
    if (!cfg) {
      // RPC puro o proceso que no forma parte de la base Warren PFR.
      row.aplicaWarren = false;
      row.mostrarProrrateo = false;
      return;
    }

    // La separación PFR/RPC ya la resolvió el backend y vive en Table9.
    const pfr = this.resumenOrigenTable9(
      cfg.pcCodigo,
      'PFR'
    );
    // los dinámicos prefieren Table3 igual que la vista, sin incluir RPC en Warren.
    const objDinamico = idsProcesosDinamicos(this.dtOriginal).find(x => x.id === row.id);
    if (objDinamico) pfr.libras = librasProcesoDinamico(this.dtOriginal, objDinamico, 'PFR');

    row.warrenPfrEntero =
      pfr.dolares.entero;

    row.warrenPfrCola =
      pfr.dolares.cola;

    row.warrenPfrLibrasEntero =
      pfr.libras.entero;

    row.warrenPfrLibrasCola =
      pfr.libras.cola;

    const lbsTotal =
      pfr.libras.entero +
      pfr.libras.cola;

    row.warrenPfrCostoUnitario =
      lbsTotal > 0
        ? (
            pfr.dolares.entero +
            pfr.dolares.cola
          ) / lbsTotal
        : 0;

    row.aplicaWarren =
      cfg.absorbe &&
      Math.abs(row.warrenPfrEntero) > 0.000001;

    row.mostrarProrrateo =
      row.aplicaWarren;
  });
}

  private totalProcesoPfrCola(filas: FilaActualizacion[]): number {
    const visible = filas
      .filter(x => x.tipo === 'normal')
      .reduce((acc, x) => acc + this.numeroSeguro(x.warrenPfrCola), 0);

    // Excedente M.E. forma parte de dcCostTotalProc en backend, aunque no tenga
    // una fila visual propia en la hoja. No absorbe Warren, pero sí entra en el
    // costo actual de Cola si algún período llega con valor distinto de cero.
    const cuExcedente = this.costoUnitario('PFR', 'Excedente M.E.');
    const lbsCola = this.libras('PFR', 'Recepcion', ['SH']);
    return visible + (cuExcedente * lbsCola);
  }

  private recalcularSubtotalWarren(
    filas: FilaActualizacion[],
    totalId: string,
    idsDetalle: string[],
    baseProrrateo: number
  ): void {
    const total = filas.find(x => x.id === totalId);
    if (!total) return;

    const detalle = filas.filter(x => idsDetalle.includes(x.id));

    const absorcionBase = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.warrenPfrEntero),
      0
    );

    const porcentajeDetalle = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.prorrateo),
      0
    );

    const ajuste = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.ajusteWarren),
      0
    );

    /*
     * El subtotal debe mostrar la SUMA de los porcentajes de sus hijos.
     *
     * Ejemplo:
     *   C.D. Variables = 17.98%
     *   C.D. Fijos     =  2.03%
     *   Total Directos = 20.01%
     *
     * Se mantiene un fallback matemático con la base PFR por si el
     * detalle proviene de una respuesta anterior sin prorrateo individual.
     */
    total.prorrateo =
      porcentajeDetalle > 0.0000001
        ? porcentajeDetalle
        : (
            baseProrrateo > 0 && absorcionBase > 0
              ? absorcionBase / baseProrrateo
              : null
          );

    // Asegura que el HTML muestre el porcentaje también en filas Total.
    total.mostrarProrrateo = total.prorrateo !== null;

    total.ajusteWarren = Math.abs(ajuste) > 0.000001
      ? ajuste
      : null;

    // Subtotales visuales: se suman PFR + RPC ya ajustados.
    total.enteroAjustado = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.enteroAjustado),
      0
    );

    total.colaAjustada = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.colaAjustada),
      0
    );

    total.valorAgregadoAjustado = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.valorAgregadoAjustado),
      0
    );
  }

  /**
   * Obtiene el costo monetario de materia prima desde Table4.
   *
   * PFR utiliza LiquidacionResultado.dcTotalDol y RPC/VAG utilizan
   * MatPrimaReproceso.dbCostoTotal (solo 2. PROCESADO), valores que el
   * backend ya consolida en Dolares_Entero / Cola / Valor Agregado.
   */
  private costoMateriaPrimaDesdeResumen(value: any): TripletaCostos {
    const rows = Array.isArray(value) ? value : [];

    /*
     * Table4 contiene filas de conciliación que son informativas y no deben
     * volver a sumarse al costo de materia prima. Ejemplo: RLIQ.
     *
     * La composición visual "Camarón Liquidado Túnel / Fresco" se construye
     * después en ParamProcVistaMapperInternal y tampoco participa en el total.
     */
    return rows
      .filter((x: any) =>
        (
          x?.IncluirEnTotal ??
          x?.blIncluirEnTotal ??
          true
        ) !== false
      )
      .reduce<TripletaCostos>((acc, x: any) => ({
        entero: acc.entero + this.numeroSeguro(
          x?.Dolares_Entero ?? x?.dcDolaresEntero
        ),
        cola: acc.cola + this.numeroSeguro(
          x?.Dolares_Cola ?? x?.dcDolaresCola
        ),
        valorAgregado: acc.valorAgregado + this.numeroSeguro(
          x?.Dolares_Valor_Agregado ?? x?.dcDolaresValorAgregado
        )
      }), this.zeroTripleta());
  }

  /**
   * Material de Empaque no usa drivers de libras.
   *
   * Table6 ya contiene los dólares calculados por backend para MP / MPE.
   * Aquí solamente se pivotean por partición para construir la fila visual:
   *   EN -> Entero
   *   CO/SH -> Cola
   *   VA -> Valor Agregado
   */
  private materialEmpaqueDesdeDetalleContable(
    value: any
  ): { encontrado: boolean; tripleta: TripletaCostos } {
    const tripleta = this.zeroTripleta();
    const rows = Array.isArray(value) ? value : [];
    let encontrado = false;

    rows.forEach((x: any) => {
      const etapaCodigo = this.norm(
        x?.EtapaCodigo ??
        x?.etapaCodigo ??
        x?.strEtapaCodigo ??
        x?.EcCodigo ??
        x?.ecCodigo ??
        ''
      );

      const procesoCodigo = this.norm(
        x?.ProcesoCodigo ??
        x?.procesoCodigo ??
        x?.strProcesoCodigo ??
        x?.PcCodigo ??
        x?.pcCodigo ??
        ''
      );

      if ((etapaCodigo !== 'mp' && procesoCodigo !== 'mpe') || procesoCodigo === CODIGO_PREMIO.toLowerCase()) {
        return;
      }

      encontrado = true;

      const dolares = this.numeroSeguro(
        x?.Dolares ??
        x?.dolares ??
        x?.dcDolares
      );

      let particion = String(
        x?.ParticionCodigo ??
        x?.particionCodigo ??
        x?.strParticionCodigo ??
        ''
      )
        .trim()
        .toUpperCase();

      if (particion === 'SH') {
        particion = 'CO';
      }

      if (!particion) {
        const nombreParticion = this.norm(
          x?.Particion ??
          x?.particion ??
          x?.strParticion ??
          ''
        );

        if (nombreParticion === 'entero') {
          particion = 'EN';
        } else if (nombreParticion === 'cola') {
          particion = 'CO';
        } else if (
          nombreParticion === 'valor agregado' ||
          nombreParticion === 'valoragregado' ||
          nombreParticion === 'vag'
        ) {
          particion = 'VA';
        }
      }

      switch (particion) {
        case 'EN':
          tripleta.entero += dolares;
          break;

        case 'CO':
          tripleta.cola += dolares;
          break;

        case 'VA':
          tripleta.valorAgregado += dolares;
          break;
      }
    });

    return {
      encontrado,
      tripleta
    };
  }

  /**
   * Construye una tripleta desde Table6 para procesos cuyo valor ya fue
   * distribuido por el backend. Se usa para Descongelado (DSC), que no tiene
   * cuenta contable propia y llega como costo derivado.
   */
  private procesoDesdeDetalleContable(
    procesoCodigoBuscado: string
  ): { encontrado: boolean; tripleta: TripletaCostos } {
    const tripleta = this.zeroTripleta();
    const rows = Array.isArray(this.dtOriginal?.Table6)
      ? this.dtOriginal.Table6
      : [];

    let encontrado = false;

    rows.forEach((x: any) => {
      const procesoCodigo = this.norm(
        x?.ProcesoCodigo ??
        x?.procesoCodigo ??
        x?.strProcesoCodigo ??
        ''
      );

      if (procesoCodigo !== this.norm(procesoCodigoBuscado)) {
        return;
      }

      const dolares = this.numeroSeguro(
        x?.Dolares ??
        x?.dolares ??
        x?.dcDolares
      );

      let particion = String(
        x?.ParticionCodigo ??
        x?.particionCodigo ??
        x?.strParticionCodigo ??
        ''
      )
        .trim()
        .toUpperCase();

      if (particion === 'SH') {
        particion = 'CO';
      }

      if (!particion) {
        const nombreParticion = this.norm(
          x?.Particion ??
          x?.particion ??
          x?.strParticion ??
          ''
        );

        if (nombreParticion === 'entero') {
          particion = 'EN';
        } else if (nombreParticion === 'cola') {
          particion = 'CO';
        } else if (
          nombreParticion === 'valor agregado' ||
          nombreParticion === 'valoragregado' ||
          nombreParticion === 'vag'
        ) {
          particion = 'VA';
        }
      }

      switch (particion) {
        case 'EN':
          tripleta.entero += dolares;
          encontrado = true;
          break;

        case 'CO':
          tripleta.cola += dolares;
          encontrado = true;
          break;

        case 'VA':
          tripleta.valorAgregado += dolares;
          encontrado = true;
          break;
      }
    });

    return {
      encontrado,
      tripleta
    };
  }

  /**
   * Fuente monetaria visual única.
   * Table6 ya viene distribuida por Proceso + EN/CO/VA.
   */
  private tripletaTable6(
    procesoCodigo: string
  ): TripletaCostos {
    return this
      .procesoDesdeDetalleContable(
        procesoCodigo)
      .tripleta;
  }

  /**
   * Lee el resumen exacto proceso/origen calculado por backend en Table9.
   * Esta es la única fuente permitida para separar PFR de RPC en Warren.
   */
  private resumenOrigenTable9(
    pcCodigo: string,
    origen: 'PFR' | 'RPC'
  ): {
    dolares: TripletaCostos;
    libras: TripletaCostos;
  } {
    const rows = Array.isArray(this.dtOriginal?.Table9)
      ? this.dtOriginal.Table9
      : [];

    return rows
      .filter((x: any) =>
        this.norm(
          x?.strPcCodigo ??
          x?.PcCodigo ??
          x?.ProcesoCodigo ??
          ''
        ) === this.norm(pcCodigo) &&
        this.norm(
          x?.strOrigen ??
          x?.Origen ??
          ''
        ) === this.norm(origen)
      )
      .reduce(
        (
          acc: {
            dolares: TripletaCostos;
            libras: TripletaCostos;
          },
          x: any
        ) => {
          acc.dolares.entero += this.numeroSeguro(
            x?.dcDolaresEntero ??
            x?.DolaresEntero
          );

          acc.dolares.cola += this.numeroSeguro(
            x?.dcDolaresCola ??
            x?.DolaresCola
          );

          acc.dolares.valorAgregado += this.numeroSeguro(
            x?.dcDolaresValorAgregado ??
            x?.DolaresValorAgregado
          );

          acc.libras.entero += this.numeroSeguro(
            x?.dcLibrasEntero ??
            x?.LibrasEntero
          );

          acc.libras.cola += this.numeroSeguro(
            x?.dcLibrasCola ??
            x?.LibrasCola
          );

          acc.libras.valorAgregado += this.numeroSeguro(
            x?.dcLibrasValorAgregado ??
            x?.LibrasValorAgregado
          );

          return acc;
        },
        {
          dolares: this.zeroTripleta(),
          libras: this.zeroTripleta()
        }
      );
  }

  /**
   * Recompone la fila Total Procesos únicamente desde los procesos que
   * realmente pertenecen a ese bloque. No incluye Camarón ni Material Empaque.
   */
  private recalcularTotalProcesosWarren(
    filas: FilaActualizacion[]
  ): void {
    const ids = new Set([
      'logistica',
      'recepcion',
      'clasificacion',
      'cajas',
      'tunel',
      'brine',
      'iqf',
      'descabezado',
      'descongelado',
      'hidratacion',
      'cocido',
      'pelado',
      'retractilado',
      'decorado',
      'cd-var',
      'cd-fijo',
      'ci-var',
      'ci-fijo',
      'copacking',
      ...idsProcesosDinamicos(this.dtOriginal).map(x => x.id)
    ]);

    const detalle = filas.filter(x =>
      ids.has(x.id)
    );

    const total = filas.find(x =>
      x.id === 'total-procesos'
    );

    if (!total) return;

    total.ajusteWarren = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.ajusteWarren),
      0
    );

    total.enteroAjustado = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.enteroAjustado),
      0
    );

    total.colaAjustada = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.colaAjustada),
      0
    );

    total.valorAgregadoAjustado = detalle.reduce(
      (acc, x) => acc + this.numeroSeguro(x.valorAgregadoAjustado),
      0
    );
  }

  /**
   * El número mostrado como unitario Warren debe ser consecuencia de los
   * dólares/libras visibles; nunca se fuerza artificialmente a 0.83.
   */
  private validarWarrenVisual(
    resultado: ResultadoActualizacion,
    objetivo: number,
    huboAjuste: boolean
  ): void {
    const camaron = resultado.filas.find(x =>
      x.id === 'camaron'
    );

    const total = resultado.filas.find(x =>
      x.id === 'total-procesos'
    );

    const libras = this.numeroSeguro(camaron?.cola);
    if (libras <= 0 || !total) return;

    const unitario = this.numeroSeguro(
      total.colaAjustada
    ) / libras;

    const esperado = huboAjuste
      ? objetivo
      : resultado.metricas.warrenActual;

    if (Math.abs(unitario - esperado) > 0.0001) {
      throw new Error(
        `Warren visual no cuadra. ` +
        `Objetivo: ${esperado.toFixed(4)}; ` +
        `Resultado: ${unitario.toFixed(4)}.`
      );
    }
  }

  /**
   * Snapshot exacto que el POST manda a MotorWarrenSnapshot.
   * Los importes visibles incluyen PFR + RPC; las bases warrenPfr* son PFR.
   */
  construirWarrenBaseSnapshot(
    resultado: ResultadoActualizacion
  ): WarrenBaseProcesoSnapshot[] {
    const ids = new Set([
      'logistica',
      'recepcion',
      'clasificacion',
      'cajas',
      'tunel',
      'brine',
      'iqf',
      'descabezado',
      'descongelado',
      'hidratacion',
      'cocido',
      'pelado',
      'retractilado',
      'decorado',
      'cd-var',
      'cd-fijo',
      'ci-var',
      'ci-fijo',
      'copacking',
      ...idsProcesosDinamicos(this.dtOriginal).map(x => x.id)
    ]);

    const catalogo = new Map<string, number>();

    this.tablePfr.forEach(x => {
      catalogo.set(
        this.norm(x.Descripcion),
        Number(x.Codigo ?? 0)
      );
    });

    /*
     * row.concepto es texto visual. En C.D./C.I. dice solamente
     * "Variables" / "Fijos", mientras el catálogo PFR usa nombres
     * canónicos. Resolver por id evita intCodigo = 0 en el POST.
     */
    const descripcionPfrPorFila: Record<string, string> = {
      logistica: 'Logistica',
      recepcion: 'Recepcion',
      clasificacion: 'Clasificacion',
      cajas: 'Cajas',
      tunel: 'Tunel',
      descabezado: 'Descabezado',
      retractilado: 'Retractilado',

      'cd-var': 'C.D.Variables',
      'cd-fijo': 'C.D.Fijos',
      'ci-var': 'C.I.Variables',
      'ci-fijo': 'C.I.Fijos',

      copacking: 'C.Copacking'
    };

    // conservar el nombre del catalogo en el snapshot enviado al POST.
    idsProcesosDinamicos(this.dtOriginal).forEach(x => {
      descripcionPfrPorFila[x.id] = x.nombre;
    });

    return resultado.filas
      .filter(x =>
        x.tipo === 'normal' &&
        ids.has(x.id)
      )
      .map(row => {
        const descripcionPfr =
          descripcionPfrPorFila[row.id];

        const intCodigo =
          descripcionPfr
            ? (
                catalogo.get(
                  this.norm(descripcionPfr)
                ) ?? 0
              )
            : 0;

        if (
          row.aplicaWarren &&
          intCodigo <= 0
        ) {
          throw new Error(
            `No se encontró el código PFR para el proceso Warren ` +
            `${descripcionPfr ?? row.concepto} (${row.id}).`
          );
        }

        return {
          intCodigo,

          strDescripcion:
            descripcionPfr ??
            row.concepto,

          blAbsorbe:
            !!row.aplicaWarren,

          dcMontoEnteroVisible:
            this.numeroSeguro(
              row.entero),

          dcMontoColaVisible:
            this.numeroSeguro(
              row.cola),

          dcMontoPfrEntero:
            this.numeroSeguro(
              row.warrenPfrEntero),

          dcMontoPfrCola:
            this.numeroSeguro(
              row.warrenPfrCola),

          dcLibrasPfrEntero:
            this.numeroSeguro(
              row.warrenPfrLibrasEntero),

          dcLibrasPfrCola:
            this.numeroSeguro(
              row.warrenPfrLibrasCola)
        };
      });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // REGLAS DE DISTRIBUCIÓN
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Fallback PFR para Recepción/Clasificación cuando Table6 todavía no está
   * disponible. Logística normalmente quedará en cero hasta que LOG exista
   * en la distribución contable.
   */
  private tripletaPrimarioPfr(
    descripcion: string,
    camaronPfr: TripletaCostos
  ): TripletaCostos {
    const costoPfr = this.costoUnitario('PFR', descripcion);

    return {
      entero: costoPfr * camaronPfr.entero,
      cola: costoPfr * camaronPfr.cola,
      valorAgregado: 0
    };
  }

  private tripletaPrimarioActualizacion(descripcion: string): TripletaCostos {
    const costoPfr = this.costoUnitario('PFR', descripcion);
    const costoRpc = this.costoUnitario('RPC', descripcion);
    return {
      entero: costoPfr * this.libras('PFR', 'Tunel', ['EN']),
      cola: costoPfr * this.libras('PFR', 'Tunel', ['SH']),
      // En ACTUALIZACION los costos primarios RPC se reflejan en VAG usando
      // la base SH disponible en Table3 para esos procesos.
      valorAgregado: costoRpc * this.libras('RPC', descripcion, ['SH', 'SV'])
    };
  }

  /**
   * la fila principal debe cuadrar con el
   * modal consolidado, por lo que se suman las libras/dólares PFR + RPC dentro de
   * la misma partición. Para PFR en Recepción/Clasificación/Cajas, la base visible
   * corresponde a Camarón libras liquidadas; para RPC se usa únicamente PROCESADO.
   */
  private tripletaPrimarioConsolidada(descripcion: string, camaronPfr: TripletaCostos): TripletaCostos {
    const costoPfr = this.costoUnitario('PFR', descripcion);
    const costoRpc = this.costoUnitario('RPC', descripcion);
    return {
      entero:
        (costoPfr * camaronPfr.entero) +
        (costoRpc * this.libras('RPC', descripcion, ['EN'])),
      cola:
        (costoPfr * camaronPfr.cola) +
        (costoRpc * this.libras('RPC', descripcion, ['SH'])),
      valorAgregado:
        (costoPfr * camaronPfr.valorAgregado) +
        (costoRpc * this.libras('RPC', descripcion, ['EV', 'SV']))
    };
  }

  private tripletaCostoPfrConRpcVag(descripcion: string): TripletaCostos {
    const costoPfr = this.costoUnitario('PFR', descripcion);
    const costoRpc = this.costoUnitario('RPC', descripcion);
    return {
      entero: costoPfr * this.libras('PFR', 'Tunel', ['EN']),
      cola: costoPfr * this.libras('PFR', 'Tunel', ['SH']),
      // Factor 1: la base VAG usa la tasa entregada por el back.
      valorAgregado: costoRpc * this.libras('RPC', descripcion, ['EV', 'SV'])
    };
  }

  private tripletaRpcEnteroColaDobleFactor(descripcion: string): TripletaCostos {
    const valor = this.valorPool('RPC', descripcion);
    const en = this.libras('RPC', descripcion, ['EN']);
    const sh = this.libras('RPC', descripcion, ['SH']);
    const va = this.libras('RPC', descripcion, ['EV', 'SV']);
    const totalBase = en + sh + va;

    // Factor 2: el pool RPC se distribuye contra la base completa, pero la fila
    // "Reproceso" muestra únicamente EN/SH. No se vuelve a sumar VAG aquí.
    if (totalBase <= 0 || valor === 0) return this.zeroTripleta();
    return {
      entero: valor * en / totalBase,
      cola: valor * sh / totalBase,
      valorAgregado: 0
    };
  }

  private distribuirConCostoUnitario(
    origen: 'PFR' | 'RPC',
    descripcion: string,
    procesoBase: string
  ): TripletaCostos {
    const cu = this.costoUnitario(origen, descripcion);
    return {
      entero: cu * this.libras(origen, procesoBase, ['EN']),
      cola: cu * this.libras(origen, procesoBase, ['SH']),
      valorAgregado: cu * this.libras(origen, procesoBase, ['EV', 'SV'])
    };
  }

  private distribuirPool(origen: 'PFR' | 'RPC', descripcion: string): TripletaCostos {
    const valor = this.valorPool(origen, descripcion);
    const en = this.libras(origen, descripcion, ['EN']);
    const sh = this.libras(origen, descripcion, ['SH']);
    const va = this.libras(origen, descripcion, ['EV', 'SV']);
    const total = en + sh + va;

    if (total <= 0 || valor === 0) return this.zeroTripleta();
    return {
      entero: valor * en / total,
      cola: valor * sh / total,
      valorAgregado: valor * va / total
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FUENTES / FALLBACKS
  // ──────────────────────────────────────────────────────────────────────────

  private costoUnitario(origen: 'PFR' | 'RPC', descripcion: string): number {
    const row = this.buscarCosto(origen, descripcion);
    if (!row) return 0;
    const cu = this.numeroSeguro(row.Costo_Unitario);
    if (cu !== 0) return cu;
    const libras = this.numeroSeguro(row.Libras_Proceso);
    return libras > 0 ? this.numeroSeguro(row.Valor) / libras : 0;
  }

  private valorPool(origen: 'PFR' | 'RPC', descripcion: string): number {
    return this.numeroSeguro(this.buscarCosto(origen, descripcion)?.Valor);
  }

  private buscarCosto(origen: 'PFR' | 'RPC', descripcion: string): CostoApiRow | undefined {
    const lista = origen === 'PFR' ? this.tablePfr : this.tableRpc;
    const desc = this.norm(descripcion);
    return lista.find(x => this.norm(x.Descripcion) === desc);
  }

  private libras(origen: 'PFR' | 'RPC', proceso: string, particiones: string[]): number {
    const p = this.norm(proceso);
    const permitidas = new Set(particiones.map(x => x.toUpperCase()));
    return this.tableLibras
      .filter(x =>
        this.norm(x.strOrigen) === this.norm(origen) &&
        this.norm(x.strProceso) === p &&
        permitidas.has(String(x.strParticionCod ?? '').toUpperCase())
      )
      .reduce((acc, x) => acc + this.numeroSeguro(x.dcLibras), 0);
  }

  private obtenerCamaronLiquidadoEscalar(): TripletaCostos | null {
    const entero = this.buscarNumeroProfundo([
      'CamaronLiquidadoEntero', 'CamarónLiquidadoEntero', 'dcCamaronLiquidadoEntero', 'EnteroLiquidado'
    ]);
    const cola = this.buscarNumeroProfundo([
      'CamaronLiquidadoCola', 'CamarónLiquidadoCola', 'dcCamaronLiquidadoCola', 'ColaLiquidado'
    ]);
    const va = this.buscarNumeroProfundo([
      'CamaronLiquidadoValorAgregado', 'dcCamaronLiquidadoValorAgregado', 'ValorAgregadoLiquidado'
    ]);

    if (entero == null && cola == null && va == null) return null;
    return { entero: entero ?? 0, cola: cola ?? 0, valorAgregado: va ?? 0 };
  }

  private obtenerReferenciaTotalLibras(): number | null {
    return this.buscarNumeroProfundo([
      'ReferenciaTotalLibras',
      'TotalReferencia',
      'TotalLibrasReferencia',
      'ReferenciaLibras',
      'M14'
    ]);
  }

  private obtenerTripletaAuxiliar(candidatos: string[], excluirTables: boolean): TripletaCostos | null {
    const items = this.extraerObjetosProfundos(this.dtOriginal, excluirTables);
    for (const item of items) {
      const descripcion = this.norm(
        item?.Descripcion ?? item?.descripcion ?? item?.strDescripcion ?? item?.Concepto ?? item?.concepto ?? ''
      );
      if (!descripcion || !candidatos.some(c => descripcion.includes(this.norm(c)))) continue;

      const entero = this.primerNumero(item, ['Entero', 'entero', 'dcEntero', 'C', 'colEntero']);
      const cola = this.primerNumero(item, ['Cola', 'cola', 'dcCola', 'D', 'colCola']);
      const va = this.primerNumero(item, [
        'ValorAgregado', 'valorAgregado', 'dcValorAgregado', 'VAG', 'vag', 'E', 'colValorAgregado'
      ]);
      if (entero == null && cola == null && va == null) continue;
      return { entero: entero ?? 0, cola: cola ?? 0, valorAgregado: va ?? 0 };
    }
    return null;
  }

  private buscarNumeroProfundo(candidatos: string[]): number | null {
    const buscados = new Set(candidatos.map(x => this.norm(x)));
    const visitados = new Set<any>();

    const walk = (value: any): number | null => {
      if (value == null || typeof value !== 'object') return null;
      if (visitados.has(value)) return null;
      visitados.add(value);

      for (const [key, child] of Object.entries(value)) {
        if (buscados.has(this.norm(key))) {
          const n = Number(child);
          if (child !== null && child !== '' && Number.isFinite(n)) return n;
        }
      }

      for (const child of Object.values(value)) {
        if (child && typeof child === 'object') {
          const found = walk(child);
          if (found != null) return found;
        }
      }
      return null;
    };

    return walk(this.dtOriginal);
  }

  private extraerObjetosProfundos(value: any, excluirTables: boolean): any[] {
    const result: any[] = [];
    const visitados = new Set<any>();

    const walk = (obj: any, keyActual = ''): void => {
      if (obj == null || typeof obj !== 'object' || visitados.has(obj)) return;
      visitados.add(obj);

      if (excluirTables && ['Table', 'Table1', 'Table2', 'Table3'].includes(keyActual)) return;

      if (Array.isArray(obj)) {
        obj.forEach(x => {
          if (x && typeof x === 'object') result.push(x);
          walk(x);
        });
        return;
      }

      Object.entries(obj).forEach(([key, child]) => walk(child, key));
    };

    walk(value);
    return result;
  }

  private primerNumero(item: any, keys: string[]): number | null {
    for (const key of keys) {
      if (item == null || item[key] === null || item[key] === undefined || item[key] === '') continue;
      const n = Number(item[key]);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // FACTORÍA DE FILAS
  // ──────────────────────────────────────────────────────────────────────────

  private row(excelRow: number, id: string, concepto: string, t: TripletaCostos): FilaActualizacion {
    return {
      excelRow,
      id,
      concepto,
      tipo: 'normal',
      ...t,
      total: this.totalTripleta(t),
      prorrateo: null,
      ajusteWarren: null,
      enteroAjustado: null,
      colaAjustada: null,
      valorAgregadoAjustado: null
    };
  }

  private rowWarren(excelRow: number, id: string, concepto: string, t: TripletaCostos): FilaActualizacion {
    const row = this.row(excelRow, id, concepto, t);
    row.mostrarProrrateo = true;
    row.aplicaWarren = true;
    return row;
  }

  private rowSoloEntero(
    excelRow: number,
    id: string,
    concepto: string,
    valor: number,
    mostrarProrrateo: boolean
  ): FilaActualizacion {
    const row = this.row(excelRow, id, concepto, { entero: valor, cola: 0, valorAgregado: 0 });
    row.mostrarProrrateo = mostrarProrrateo;
    row.aplicaWarren = false;
    return row;
  }

  private rowTotal(
    excelRow: number,
    id: string,
    concepto: string,
    t: TripletaCostos,
    mostrarProrrateo = false
  ): FilaActualizacion {
    return {
      excelRow,
      id,
      concepto,
      tipo: 'total',
      ...t,
      total: this.totalTripleta(t),
      mostrarProrrateo,
      aplicaWarren: false,
      prorrateo: null,
      ajusteWarren: null,
      enteroAjustado: null,
      colaAjustada: null,
      valorAgregadoAjustado: null
    };
  }

  private section(excelRow: number, id: string, concepto: string): FilaActualizacion {
    return {
      excelRow,
      id,
      concepto,
      tipo: 'seccion',
      entero: 0,
      cola: 0,
      valorAgregado: 0,
      total: null,
      mostrarProrrateo: true,
      aplicaWarren: false,
      prorrateo: 0,
      ajusteWarren: null,
      enteroAjustado: 0,
      colaAjustada: 0,
      valorAgregadoAjustado: null
    };
  }

  private spacer(excelRow: number, id: string): FilaActualizacion {
    return {
      excelRow,
      id,
      concepto: '',
      tipo: 'espacio',
      entero: 0,
      cola: 0,
      valorAgregado: 0,
      total: null,
      prorrateo: null,
      ajusteWarren: null,
      enteroAjustado: null,
      colaAjustada: null,
      valorAgregadoAjustado: null
    };
  }

  private spacerWarren(excelRow: number, id: string): FilaActualizacion {
    const row = this.spacer(excelRow, id);
    row.mostrarProrrateo = true;
    return row;
  }

  private sumTripletas(items: TripletaCostos[]): TripletaCostos {
    return items.reduce<TripletaCostos>((acc, x) => ({
      entero: acc.entero + this.numeroSeguro(x.entero),
      cola: acc.cola + this.numeroSeguro(x.cola),
      valorAgregado: acc.valorAgregado + this.numeroSeguro(x.valorAgregado)
    }), this.zeroTripleta());
  }

  private toTripleta(row: FilaActualizacion): TripletaCostos {
    return { entero: row.entero, cola: row.cola, valorAgregado: row.valorAgregado };
  }

  private totalTripleta(t: TripletaCostos): number {
    return this.numeroSeguro(t.entero) + this.numeroSeguro(t.cola) + this.numeroSeguro(t.valorAgregado);
  }

  private zeroTripleta(): TripletaCostos {
    return { entero: 0, cola: 0, valorAgregado: 0 };
  }

  private toCostoRows(value: any): CostoApiRow[] {
    return (Array.isArray(value) ? value : []).map((x: any) => ({
      ...x,
      Codigo: this.numeroSeguro(x.Codigo),
      Descripcion: String(x.Descripcion ?? '').trim(),
      Valor: this.numeroSeguro(x.Valor),
      Libras_Proceso: this.numeroSeguro(x.Libras_Proceso),
      Costo_Unitario: this.numeroSeguro(x.Costo_Unitario)
    }));
  }

  private toLibrasRows(value: any): LibrasApiRow[] {
    return (Array.isArray(value) ? value : []).map((x: any) => ({
      ...x,
      strProceso: String(x.strProceso ?? '').trim(),
      strOrigen: String(x.strOrigen ?? '').trim(),
      strParticionCod: String(x.strParticionCod ?? '').trim(),
      strParticion: String(x.strParticion ?? '').trim(),
      dcLibras: this.numeroSeguro(x.dcLibras)
    }));
  }

  private numeroSeguro(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private norm(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }
}

type OrigenDetalle = 'PFR' | 'RPC' | null;
type ParticionUi = 'entero' | 'cola' | 'valorAgregado';

interface ReglaEtapa {
  etapa: string;
  origenEntero?: OrigenDetalle;
  origenCola?: OrigenDetalle;
  origenVa?: OrigenDetalle;
}

class ParamProcVistaMapperInternal {
  // payload para resolver codigos desde la misma fuente de catalogo.
  private dtOriginal: any = {};
  detallePremio(): PremioDetalleApi[] { return Array.isArray(this.dtOriginal.Table11) ? this.dtOriginal.Table11 : []; }
  private detalle: DetalleEtapaApi[] = [];
  private resumen: ResumenLibrasProcesadasApi[] = [];
  /**
   * NUEVO:
   * Table6 completo queda almacenado aquí.
   */
  private detalleContable:
    CostoProductivoDetalleModalApi[] = [];

  // Tarifa/costo unitario de Descongelado tomada de Table1 (RPC).
  // Permite reconstruir las libras por partición desde los dólares ya
  // distribuidos en Table6 sin inventar un nuevo driver en el front.
  private costoUnitarioDescongelado = 0;

  cargarPayload(dt: any): void {
    // conservar catalogo para los mapas de la vista.
    this.dtOriginal = dt ?? {};
    // Table5 ya viene desde backend con RPC filtrado exclusivamente a
    // 2. PROCESADO. No es necesario transportar Agrupacion al front.
    this.detalle = this.toDetalle(dt?.Table5);

    // El resumen conserva explícitamente Camarón Reproceso como una fila
    // independiente; esta es la única zona donde se mantiene esa separación.
    this.resumen = this.toResumen(dt?.Table4);

    this.detalleContable = this.toDetalleContable(dt?.Table6);

    const descongelado = (Array.isArray(dt?.Table1) ? dt.Table1 : [])
      .find((x: any) =>
        this.norm(x?.Descripcion ?? x?.strDescripcion ?? '') === 'DESCONGELADO'
      );

    const costoUnitario = this.num(
      descongelado?.Costo_Unitario ??
      descongelado?.dcCostUnitario
    );
    const librasProceso = this.num(
      descongelado?.Libras_Proceso ??
      descongelado?.dcLibras
    );
    const valorProceso = this.num(
      descongelado?.Valor ??
      descongelado?.dcValor
    );

    this.costoUnitarioDescongelado = costoUnitario !== 0
      ? costoUnitario
      : librasProceso > 0
        ? valorProceso / librasProceso
        : 0;
  }

  private toDetalleContable(value: any): CostoProductivoDetalleModalApi[] {
    if (!Array.isArray(value)) return [];

    return value
      .map((x: any): CostoProductivoDetalleModalApi => ({
        EtapaCodigo: String(
          x?.EtapaCodigo ??
          x?.etapaCodigo ??
          x?.strEtapaCodigo ??
          ''
        ).trim(),

        Etapa: String(
          x?.Etapa ??
          x?.etapa ??
          x?.strEtapa ??
          ''
        ).trim(),

        ProcesoCodigo: String(
          x?.ProcesoCodigo ??
          x?.procesoCodigo ??
          x?.strProcesoCodigo ??
          x?.PcCodigo ??
          x?.pcCodigo ??
          ''
        ).trim(),

        Proceso: String(
          x?.Proceso ??
          x?.proceso ??
          x?.strProceso ??
          ''
        ).trim(),

        Cuenta: String(
          x?.Cuenta ??
          x?.cuenta ??
          x?.strCuenta ??
          ''
        ).trim(),

        DescripcionCuenta: String(
          x?.DescripcionCuenta ??
          x?.descripcionCuenta ??
          x?.CuentaDescripcion ??
          x?.cuentaDescripcion ??
          x?.strDescripcionCuenta ??
          ''
        ).trim(),

        CentroCodigo: String(
          x?.CentroCodigo ??
          x?.centroCodigo ??
          x?.strCentroCodigo ??
          ''
        ).trim(),

        SubcentroCodigo: String(
          x?.SubcentroCodigo ??
          x?.subcentroCodigo ??
          x?.strSubcentroCodigo ??
          ''
        ).trim(),

        SubcentroNombre: String(x?.SubcentroNombre ?? '').trim(),
        CentroNombre: String(x?.CentroNombre ?? '').trim(),

        AgrupacionCentro: String(
          x?.AgrupacionCentro ??
          x?.agrupacionCentro ??
          x?.strAgrupacionCentro ??
          ''
        ).trim(),

        GrupoCentro: String(
          x?.GrupoCentro ??
          x?.grupoCentro ??
          x?.strGrupoCentro ??
          ''
        ).trim(),

        ParticionCodigo: String(
          x?.ParticionCodigo ??
          x?.particionCodigo ??
          x?.strParticionCodigo ??
          ''
        ).trim().toUpperCase(),

        Particion: String(
          x?.Particion ??
          x?.particion ??
          x?.strParticion ??
          ''
        ).trim(),

        Dolares: this.num(
          x?.Dolares ??
          x?.dolares ??
          x?.dcDolares
        )
      }))
      .filter(x =>
        !!x.ProcesoCodigo &&
        (
          !!x.Cuenta ||
          this.norm(x.ProcesoCodigo) === 'DSC'
        ) &&
        Math.abs(x.Dolares) > 0.000001
      );
  }

  construirResumen(resultado: ResultadoActualizacion): ResumenLibrasProcesadasApi[] {
    if (this.resumen.length) {
      return this.prepararResumenCompraCamaron(this.resumen);
    }

    // Fallback temporal mientras el backend no tenga Table4 desplegado.
    const find = (id: string) => resultado.filas.find(x => x.id === id);
    const pfr = find('camaron');
    const rpc = find('camaron-rpc');
    const vag = find('camaron-vag');

    return this.prepararResumenCompraCamaron([
      this.resumenFallback('PFR', 'Compra Camarón', pfr, 1),
      this.resumenFallback('RPC', 'Camarón Reproceso', rpc, 3),
      this.resumenFallback('VAG', 'Camarón VAG', vag, 4)
    ]);
  }

  /**
   * Adapta Table4 a la presentación.
   *
   * Estructura visual:
   *
   * Compra Camarón
   *   ├─ Camarón Liquidado Túnel
   *   └─ Camarón Liquidado Fresco
   * Camarón Reproceso
   * Camarón VAG
   *
   * REGLA TEMPORAL DE NEGOCIO:
   * RLIQ representa únicamente Fresco enviado a REPROCESO.
   * El backend lo obtiene desde 1. RECIBIDO + Proc Prod PP + los productos
   * definidos por negocio. Por esa razón RLIQ nunca reparte libras/dólares
   * a Valor Agregado.
   *
   * La fila Túnel es un cálculo de presentación:
   *
   * EN lbs = Compra EN - Fresco EN
   * EN $   = Compra EN - Fresco EN
   * CO lbs = Compra CO - Fresco CO
   * CO $   = Compra CO - Fresco CO
   * VA     = 0
   *
   * Fresco y Túnel son subniveles de Compra Camarón y NO vuelven a
   * participar en el total general.
   */
  private prepararResumenCompraCamaron(
    rows: ResumenLibrasProcesadasApi[]
  ): ResumenLibrasProcesadasApi[] {
    const src = [...rows]
      .map(x => ({ ...x }))
      .sort((a, b) => Number(a.Orden ?? 0) - Number(b.Orden ?? 0));

    const compra = src.find(x =>
      this.norm(x.Codigo) === 'PFR'
    );

    const fresco = src.find(x =>
      this.norm(x.Codigo) === 'RLIQ'
    );

    const otros = src.filter(x => {
      const codigo = this.norm(x.Codigo);
      return codigo !== 'PFR' && codigo !== 'RLIQ';
    });

    const salida: ResumenLibrasProcesadasApi[] = [];

    if (compra) {
      const compraVista: ResumenLibrasProcesadasApi = {
        ...compra,
        Descripcion: 'Compra Camarón',

        /*
         * Es la cabecera del grupo desplegable.
         * Solo se activa cuando existe RLIQ, porque en ese caso se generan
         * los subniveles Camarón Liquidado Túnel y Camarón Liquidado Fresco.
         */
        EsGrupoCompra: !!fresco,
        EsSubnivelCompra: false,

        IncluirEnTotal: compra.IncluirEnTotal !== false,
        Orden: 1
      };

      salida.push(compraVista);

      if (fresco) {
        /*
         * Compatibilidad defensiva:
         * el backend nuevo ya debe enviar RLIQ únicamente en Entero/Cola.
         * Mientras todos los ambientes se actualizan, el front fuerza VA = 0
         * para evitar que un payload anterior vuelva a llevar Fresco a VAG.
         */
        const frescoEnteroLibras =
          this.num(fresco.Libras_Entero);

        const frescoColaLibras =
          this.num(fresco.Libras_Cola);

        const frescoEnteroDolares =
          this.num(fresco.Dolares_Entero);

        const frescoColaDolares =
          this.num(fresco.Dolares_Cola);

        const frescoVista: ResumenLibrasProcesadasApi = {
          ...fresco,
          Descripcion: 'Camarón Liquidado Fresco',

          Libras_Entero:
            frescoEnteroLibras,

          Libras_Cola:
            frescoColaLibras,

          Libras_Valor_Agregado:
            0,

          Total:
            frescoEnteroLibras +
            frescoColaLibras,

          Dolares_Entero:
            frescoEnteroDolares,

          Dolares_Cola:
            frescoColaDolares,

          Dolares_Valor_Agregado:
            0,

          Dolares_Total:
            frescoEnteroDolares +
            frescoColaDolares,

          EsGrupoCompra: false,
          EsSubnivelCompra: true,
          IncluirEnTotal: false,
          Orden: 1.2
        };

        const tunelEnteroLibras =
          this.num(compraVista.Libras_Entero) -
          frescoEnteroLibras;

        const tunelColaLibras =
          this.num(compraVista.Libras_Cola) -
          frescoColaLibras;

        const tunelEnteroDolares =
          this.num(compraVista.Dolares_Entero) -
          frescoEnteroDolares;

        const tunelColaDolares =
          this.num(compraVista.Dolares_Cola) -
          frescoColaDolares;

        const tunel: ResumenLibrasProcesadasApi = {
          Codigo: 'PTUN',
          Descripcion: 'Camarón Liquidado Túnel',

          Libras_Entero: tunelEnteroLibras,
          Libras_Cola: tunelColaLibras,
          Libras_Valor_Agregado: 0,
          Total:
            tunelEnteroLibras +
            tunelColaLibras,

          Dolares_Entero: tunelEnteroDolares,
          Dolares_Cola: tunelColaDolares,
          Dolares_Valor_Agregado: 0,
          Dolares_Total:
            tunelEnteroDolares +
            tunelColaDolares,

          IncluirEnTotal: false,
          EsGrupoCompra: false,
          EsSubnivelCompra: true,
          Orden: 1.1
        };

        salida.push(
          tunel,
          frescoVista
        );
      }
    }

    /*
     * Si por compatibilidad no llegó PFR, no se pierden las filas originales.
     */
    if (!compra) {
      src
        .filter(x => this.norm(x.Codigo) !== 'RLIQ')
        .forEach(x => salida.push(x));
    }

    otros.forEach(x => {
      const codigo = this.norm(x.Codigo);

      salida.push({
        ...x,
        Descripcion:
          codigo === 'RPC'
            ? 'Camarón Reproceso'
            : codigo === 'VAG'
              ? 'Camarón VAG'
              : x.Descripcion,
        EsGrupoCompra: false,
        EsSubnivelCompra: false,
        Orden:
          codigo === 'RPC'
            ? 3
            : codigo === 'VAG'
              ? 4
              : Number(x.Orden ?? 99)
      });
    });

    return salida.sort(
      (a, b) =>
        Number(a.Orden ?? 0) -
        Number(b.Orden ?? 0)
    );
  }

  private resolverPcCodigoCosto(
    row: FilaActualizacion,
    regla: ReglaEtapa | null
  ): string {
    if (!row || row.tipo !== 'normal' || this.detalleContable.length === 0) {
      return '';
    }

    // Los costos estructurales se identifican por código, no por el texto
    // visual Variables/Fijos mostrado en la tabla.
    const porId: Record<string, string> = {
      'material-empaque': 'MPE',
      'premio': 'PMIO',
      'logistica': 'LOG',
      'recepcion': 'REC',
      'clasificacion': 'CLA',
      'descongelado': 'DSC',
      'cd-var': 'CDV',
      'cd-fijo': 'CDF',
      'ci-var': 'CIV',
      'ci-fijo': 'CIF'
    };

    // extender sin alterar los codigos estructurales existentes.
    idsProcesosDinamicos(this.dtOriginal).forEach(x => { porId[x.id] = x.pcCodigo; });
    const codigoDirecto = porId[row.id];
    if (codigoDirecto) {
      const item = this.detalleContable.find(x =>
        this.norm(x.ProcesoCodigo) === this.norm(codigoDirecto)
      );

      return item?.ProcesoCodigo?.trim() ?? '';
    }

    const candidatos = [
      regla?.etapa,
      row.concepto
    ]
      .map(x => this.norm(x))
      .filter(Boolean);

    if (candidatos.length === 0) return '';

    // 1) Coincidencia exacta por nombre de proceso.
    let item = this.detalleContable.find(x =>
      candidatos.includes(this.norm(x.Proceso))
    );

    // 2) Fallback por etapa contable.
    if (!item) {
      item = this.detalleContable.find(x =>
        candidatos.includes(this.norm(x.Etapa))
      );
    }

    // 3) Último fallback tolerante para pequeñas diferencias de nombre
    //    (por ejemplo C.Copacking / Copacking).
    if (!item) {
      item = this.detalleContable.find(x => {
        const proceso = this.norm(x.Proceso);
        const etapa = this.norm(x.Etapa);

        return candidatos.some(c =>
          (proceso && (proceso.includes(c) || c.includes(proceso))) ||
          (etapa && (etapa.includes(c) || c.includes(etapa)))
        );
      });
    }

    return item?.ProcesoCodigo?.trim() ?? '';
  }

  decorarFilas(resultado: ResultadoActualizacion): FilaCostoVista[] {
    // Camarón / Reproceso / VAG viven exclusivamente en el cuadro de resumen.
    // No se repiten dentro de la hoja contable inferior.
    const idsSoloResumen = new Set([
      'camaron', 'camaron-rpc', 'camaron-liquidado', 'camaron-vag',
      'total-libras',
      'sp-top-1', 'sp-top-2', 'sp-top-3', 'sp-top-4', 'sp-top-5'
    ]);

    return resultado.filas
      .filter(row => !idsSoloResumen.has(row.id))
      .map(row => {
        const regla = this.regla(row);
        const esDato = row.tipo === 'normal';

        const usaLibrasResumen =
          row.id === 'total-procesos' ||
          row.id === 'total-general';

        const resumenTotalizable = this.resumen.filter(
          x => x.IncluirEnTotal !== false
        );
        let librasResumenEntero = resumenTotalizable.reduce(
          (acc, x) => acc + this.num(x.Libras_Entero), 0);
        let librasResumenCola = resumenTotalizable.reduce(
          (acc, x) => acc + this.num(x.Libras_Cola), 0);
        let librasResumenVa = resumenTotalizable.reduce(
          (acc, x) => acc + this.num(x.Libras_Valor_Agregado), 0);
        // igual que los subtotales, mostrar la mayor base física sin duplicar libras.
        if (usaLibrasResumen) {
          idsProcesosDinamicos(this.dtOriginal).forEach(x => {
            const libras = librasProcesoDinamico(this.dtOriginal, x);
            librasResumenEntero = Math.max(librasResumenEntero, libras.entero);
            librasResumenCola = Math.max(librasResumenCola, libras.cola);
            librasResumenVa = Math.max(librasResumenVa, libras.valorAgregado);
          });
        }

        const enteroVista = usaLibrasResumen
          ? this.crearCeldaResumen(row.entero, librasResumenEntero)
          : esDato
            ? this.crearCelda(row, 'entero', regla)
            : this.crearCeldaTotalFila(row, 'entero', resultado.filas);

        const colaVista = usaLibrasResumen
          ? this.crearCeldaResumen(row.cola, librasResumenCola)
          : esDato
            ? this.crearCelda(row, 'cola', regla)
            : this.crearCeldaTotalFila(row, 'cola', resultado.filas);

        const valorAgregadoVista = usaLibrasResumen
          ? this.crearCeldaResumen(row.valorAgregado, librasResumenVa)
          : esDato
            ? this.crearCelda(row, 'valorAgregado', regla)
            : this.crearCeldaTotalFila(row, 'valorAgregado', resultado.filas);

        const librasFila = usaLibrasResumen
          ? librasResumenEntero + librasResumenCola + librasResumenVa
          : [enteroVista.libras, colaVista.libras, valorAgregadoVista.libras]
              .filter((x): x is number => x !== null && x > 0)
              .reduce((acc, x) => acc + x, 0);

        const origen = regla?.origenEntero === regla?.origenCola && regla?.origenCola === regla?.origenVa
          ? regla?.origenEntero : null;
        const totalVista = row.total == null
          ? { libras: null, dolares: null, unitario: null }
          : this.crearCeldaResumen(row.total, librasFila, row, undefined, origen);

        const enteroWarrenVista = this.crearCeldaWarren(
          row,
          'entero',
          enteroVista
        );
        const colaWarrenVista = this.crearCeldaWarren(
          row,
          'cola',
          colaVista
        );
        const valorAgregadoWarrenVista = this.crearCeldaWarren(
          row,
          'valorAgregado',
          valorAgregadoVista
        );

        const pcCodigoCosto = esDato
          ? this.resolverPcCodigoCosto(row, regla)
          : '';

        const tieneDetalleCuenta = !!pcCodigoCosto && this.detalleContable.some(x =>
          this.norm(x.ProcesoCodigo) === this.norm(pcCodigoCosto)
        );

        return {
          ...row,
          enteroVista,
          colaVista,
          valorAgregadoVista,
          totalVista,
          enteroWarrenVista,
          colaWarrenVista,
          valorAgregadoWarrenVista,
          tieneDetalleEtapa: (!!regla && this.detalleEtapa(row).length > 0) || (row.id === 'premio' && this.detallePremio().length > 0),
          etapaBackend: regla?.etapa,
          origenDetalle: null,
          pcCodigoCosto,
          tieneDetalleCuenta
        };
      });
  }

  detalleEtapa(row: FilaActualizacion): DetalleEtapaApi[] {
    const regla = this.regla(row);
    if (!regla) return [];

    return this.detalle.filter(x => this.norm(x.Etapa) === this.norm(regla.etapa));
  }

  pivotDetalleEtapa(row: FilaActualizacion): DetalleEtapaPivot[] {
    const src = this.detalleEtapa(row);
    const map = new Map<string, DetalleEtapaPivot>();

    src.forEach(x => {
      // TipoEmbalaje forma parte de la clave. Para Brine evita colapsar FONDO y PANERA
      // en una misma línea antes de que DevExtreme aplique el agrupamiento visual.
      const key = [
        x.Origen,
        x.CodigoProceso,
        x.ProcesoProductivo,
        x.TipoEmbalaje ?? ''
      ].join('|');
      let item = map.get(key);
      if (!item) {
        item = {
          proceso: x.ProcesoProductivo || x.CodigoProceso || '-',
          codigoProceso: x.CodigoProceso || '',
          origen: x.Origen || '',
          tipoEmbalaje: String(x.TipoEmbalaje ?? '').trim() || 'SIN CLASIFICAR',
          librasEntero: 0,
          librasCola: 0,
          librasValorAgregado: 0,
          total: 0
        };
        map.set(key, item);
      }

      const lbs = this.num(x.Libras);
      const cod = String(x.ParticionCod ?? '').toUpperCase();
      if (cod === 'EN') item.librasEntero += lbs;
      if (cod === 'SH') item.librasCola += lbs;
      if (cod === 'EV' || cod === 'SV') item.librasValorAgregado += lbs;
      item.total += lbs;
    });

    const total = Array.from(map.values()).reduce((acc, x) => acc + x.total, 0);
    // Validar la base original: toDetalle normaliza los datos ausentes a cero.
    const tieneLibras = (Array.isArray(this.dtOriginal?.Table5) ? this.dtOriginal.Table5 : [])
      .filter((x: any) => this.norm(x?.Etapa ?? x?.strEtapa) === this.norm(this.regla(row)?.etapa))
      .every((x: any) => typeof (x?.Libras ?? x?.dcLibras) === 'number' && Number.isFinite(x?.Libras ?? x?.dcLibras));
    return Array.from(map.values()).map(x => ({
      ...x,
      porcParticipacion: tieneLibras && total > 0 && Number.isFinite(total) ? x.total / total : undefined,
      dolaresAsignados: tieneLibras && total > 0 && Number.isFinite(total) && row.total != null && Number.isFinite(row.total)
        ? (x.total / total) * row.total : undefined
    })).sort((a, b) =>
      a.origen.localeCompare(b.origen) ||
      a.tipoEmbalaje.localeCompare(b.tipoEmbalaje) ||
      a.proceso.localeCompare(b.proceso)
    );
  }

  /**
   * Devuelve el detalle contable real de Table6 para una fila y partición.
   *
   * El front histórico usa SH para Cola, mientras el costo productivo guardado
   * utiliza CO. Aquí se normaliza esa diferencia sin hacer otra llamada HTTP.
   */
  detalleCuenta(
    row: FilaCostoVista | FilaActualizacion,
    particion: 'EN' | 'SH' | 'VA'
  ): CostoProductivoDetalleModalApi[] {
    if (!row || row.tipo !== 'normal') return [];

    const filaVista = row as FilaCostoVista;
    const regla = this.regla(row);
    const pcCodigoCosto =
      filaVista.pcCodigoCosto ||
      this.resolverPcCodigoCosto(row, regla);

    if (!pcCodigoCosto) return [];

    const particionCosto = particion === 'SH' ? 'CO' : particion;

    return this.detalleContable
      .filter(x =>
        this.norm(x.ProcesoCodigo) === this.norm(pcCodigoCosto) &&
        this.obtenerParticionCodigo(x) === particionCosto
      )
      .sort((a, b) =>
        a.CentroCodigo.localeCompare(b.CentroCodigo) ||
        a.SubcentroCodigo.localeCompare(b.SubcentroCodigo) ||
        a.AgrupacionCentro.localeCompare(b.AgrupacionCentro) ||
        a.GrupoCentro.localeCompare(b.GrupoCentro) ||
        a.Cuenta.localeCompare(b.Cuenta)
      );
  }

  /**
   * Compatibilidad con FrmparametrizacionprocesoComponent actual.
   *
   * Los datos salen de Table6 (el nombre cuentasMock se mantiene por compatibilidad con el componente).
   * El componente puede seguir haciendo:
   *
   *   this.mapper.cuentasMock(row)
   *     .filter(x => x.particion === nombreParticion);
   */
  cuentasMock(
    row: FilaActualizacion
  ): CuentaContableMock[] {

    const regla =
      this.regla(row);

    const pcCodigoCosto =
      this.resolverPcCodigoCosto(
        row,
        regla
      );

    if (!pcCodigoCosto) {
      return [];
    }

    return this.detalleContable
      .filter(x =>
        this.norm(
          x.ProcesoCodigo
        ) ===
        this.norm(
          pcCodigoCosto
        )
      )
      .map(x => ({
        particion:
          String(
            x.Particion ?? ''
          ).trim(),

        numeroCuenta:
          String(
            x.Cuenta ||
            (
              this.norm(x.ProcesoCodigo) === 'DSC'
                ? 'DERIVADO'
                : ''
            )
          ).trim(),

        // Table6 ya entrega DescripcionCuenta desde el backend.
        descripcionCuenta:
          String(
            x.DescripcionCuenta ?? ''
          ).trim(),

        etapaCodigo:
          String(
            x.EtapaCodigo ?? ''
          ).trim(),

        etapa:
          String(
            x.Etapa ?? ''
          ).trim(),

        procesoCodigo:
          String(
            x.ProcesoCodigo ?? ''
          ).trim(),

        proceso:
          String(
            x.Proceso ?? ''
          ).trim(),

        centroCodigo:
          String(
            x.CentroCodigo ?? ''
          ).trim(),

        subcentroCodigo:
          String(
            x.SubcentroCodigo ?? ''
          ).trim(),

        subcentroNombre: String(x.SubcentroNombre ?? '').trim() || String(x.AgrupacionCentro ?? '').trim(),
        centroNombre: String(x.CentroNombre ?? '').trim(),

        agrupacionCentro:
          String(
            x.AgrupacionCentro ?? ''
          ).trim(),

        grupoCentro:
          String(
            x.GrupoCentro ?? ''
          ).trim(),

        naturaleza:
          String(
            x.Naturaleza ?? ''
          ).trim(),

        dolares:
          this.num(
            x.Dolares
          )
      }))
      .filter(
        x =>
          Math.abs(
            x.dolares
          ) > 0.000001
      );
  }

  /**
   * Resumen del primer modal contable.
   *
   * La clave es únicamente GrupoCentro. De esta manera, si Table6 contiene
   * REMUNERACION en más de una AgrupacionCentro, el usuario ve una sola fila
   * REMUNERACION con el total de dólares y puede abrir el segundo modal para
   * revisar las cuentas que forman ese total.
   */
  agruparCuentasPorGrupo(
    cuentas: CuentaContableMock[]
  ): GrupoCuentaContableVista[] {
    const grupos = new Map<string, GrupoCuentaContableVista>();

    (cuentas ?? []).forEach(cuenta => {
      const grupoVisible =
        String(cuenta.grupoCentro ?? '').trim() ||
        'SIN CLASIFICAR';

      const key = this.norm(grupoVisible);
      let grupo = grupos.get(key);

      if (!grupo) {
        grupo = {
          grupoCentro: grupoVisible,
          cantidadCuentas: 0,
          dolares: 0,
          cuentas: []
        };
        grupos.set(key, grupo);
      }

      grupo.cuentas.push(cuenta);
      grupo.dolares += this.num(cuenta.dolares);
    });

    return Array.from(grupos.values())
      .map(grupo => ({
        ...grupo,
        cantidadCuentas: new Set(
          grupo.cuentas.map(x => this.norm(x.numeroCuenta))
        ).size,
        dolares: this.num(grupo.dolares),
        cuentas: [...grupo.cuentas].sort((a, b) =>
          a.numeroCuenta.localeCompare(b.numeroCuenta) ||
          a.descripcionCuenta.localeCompare(b.descripcionCuenta)
        )
      }))
      .sort((a, b) =>
        a.grupoCentro.localeCompare(b.grupoCentro)
      );
  }

  private obtenerParticionCodigo(item: CostoProductivoDetalleModalApi): string {
    const codigo = String(item.ParticionCodigo ?? '')
      .trim()
      .toUpperCase();

    if (codigo === 'SH') return 'CO';
    if (codigo === 'EN' || codigo === 'CO' || codigo === 'VA') return codigo;

    switch (this.norm(item.Particion)) {
      case 'ENTERO':
        return 'EN';
      case 'COLA':
        return 'CO';
      case 'VALOR AGREGADO':
      case 'VALORAGREGADO':
      case 'VAG':
        return 'VA';
      default:
        return '';
    }
  }

  private obtenerNombreParticionContable(
    item: CostoProductivoDetalleModalApi
  ): string {
    switch (this.obtenerParticionCodigo(item)) {
      case 'EN':
        return 'Entero';
      case 'CO':
        return 'Cola';
      case 'VA':
        return 'Valor Agregado';
      default:
        return String(item.Particion ?? '').trim();
    }
  }

  private crearCelda(row: FilaActualizacion, particion: ParticionUi, regla: ReglaEtapa | null): CeldaParticionVista {
    const dolares = this.num((row as any)[particion]);
    const origen = particion === 'entero' ? regla?.origenEntero : particion === 'cola' ? regla?.origenCola : regla?.origenVa;
    // conservar el constructor de celda y la división de las filas existentes.
    const objDinamico = idsProcesosDinamicos(this.dtOriginal).find(x => x.id === row.id);
    if (objDinamico) {
      const libras = librasProcesoDinamico(this.dtOriginal, objDinamico)[particion];
      const celda = this.crearCeldaResumen(dolares, libras, row, particion, origen);
      return { ...celda, libras };
    }

    // Premio usa las libras certificadas de Table9 (PMIO), igual que un proceso dinámico.
    if (row.id === 'premio') {
      const libras = librasProcesoDinamico(this.dtOriginal, { pcCodigo: CODIGO_PREMIO, nombre: row.concepto })[particion];
      return { ...this.crearCeldaResumen(dolares, libras, row, particion, origen), libras };
    }

    // Descongelado:
    // 1) si el backend ya incluyó el detalle real en Table5, se usan esas libras;
    // 2) como compatibilidad con períodos anteriores, si Table5 no las trae,
    //    se reconstruyen con Dólares / Costo Unitario (Table1).
    if (row.id === 'descongelado') {

      const librasBackend = regla
        ? this.libras(regla.etapa, particion, origen ?? 'RPC')
        : 0;

      if (librasBackend > 0) {
        return {
          ...this.crearCeldaResumen(dolares, librasBackend, row, particion, origen),
          libras: librasBackend,
          dolares,
          //   ?? (Math.abs(dolares) > 0.000001 ? dolares / librasBackend : this.costoUnitarioDescongelado || null)
        };
      }

      const cu = this.costoUnitarioDescongelado;
      const librasCalculadas = cu > 0 && Math.abs(dolares) > 0.000001
        ? Math.abs(dolares / cu)
        : 0;

      return {
        ...this.crearCeldaResumen(dolares, librasCalculadas, row, particion, origen),
        libras: librasCalculadas > 0 ? librasCalculadas : null,
        dolares,
        //   ?? (librasCalculadas > 0 ? cu : null)
      };
    }

    if (!regla) return this.crearCeldaResumen(dolares, null, row, particion);

    const libras =
      this.libras(
        regla.etapa,
        particion,
        origen ?? null
      );

    // La vista debe respetar únicamente las libras físicas de Table5.
    //
    // Antes, cuando una partición tenía dólares pero 0 libras, se usaba
    // librasTotal(etapa) como fallback. Eso provocaba duplicaciones como:
    //
    // Pelado:
    //   Entero = total Pelado
    //   Cola   = total Pelado
    //   V.A.   = total Pelado
    //
    // Retractilado presentaba el mismo problema en Cola.
    //
    // Si una partición no tiene libras físicas, se deja vacía. Los dólares
    // contables continúan visibles, pero no se inventa una base de libras.
    return this.crearCeldaResumen(dolares, libras, row, particion, origen);
  }

  private crearCeldaWarren(
    row: FilaActualizacion,
    particion: ParticionUi,
    original: CeldaParticionVista
  ): CeldaParticionVista {
    if (row.tipo === 'espacio' || row.tipo === 'seccion') {
      return { libras: null, dolares: null, unitario: null };
    }

    const dolares = particion === 'entero'
      ? row.enteroAjustado
      : particion === 'cola'
        ? row.colaAjustada
        : row.valorAgregadoAjustado;

    if (dolares == null) {
      return { libras: null, dolares: null, unitario: null };
    }

    let libras = 0;

    if (row.tipo === 'normal') {
      libras = particion === 'entero'
        ? this.num(row.warrenPfrLibrasEntero)
        : particion === 'cola'
          ? this.num(row.warrenPfrLibrasCola)
          : this.num(original.libras);
    } else if (
      row.id === 'total-procesos' ||
      row.id === 'total-procesos-base' ||
      row.id === 'total-directos' ||
      row.id === 'total-indirectos' ||
      row.id === 'total-otros'
    ) {
      // Warren trabaja exclusivamente con Fresco (PFR).
      // Los dólares se suman, pero las libras físicas PFR se muestran una sola vez.
      const resumenPfr = this.resumen.find(
        x => this.norm(x.Codigo) === 'PFR'
      );

      libras = particion === 'entero'
        ? this.num(resumenPfr?.Libras_Entero)
        : particion === 'cola'
          ? this.num(resumenPfr?.Libras_Cola)
          : this.num(original.libras);
    } else {
      libras = this.num(original.libras);
    }

    // Warren conserva su base PFR; V.A. mantiene el origen de la celda original.
    const origen = particion === 'valorAgregado' ? this.regla(row)?.origenVa : 'PFR';
    const celda = this.crearCeldaResumen(dolares, libras, row, particion, origen);
    return {
      ...celda,
      libras,
      dolares: this.num(dolares),
      // Table9 no contiene el CU ajustado por Warren; conservar el calculo de esta vista.
      unitario: celda.unitario
    };
  }

  private crearCeldaTotalFila(
    row: FilaActualizacion,
    particion: ParticionUi,
    filas: FilaActualizacion[]
  ): CeldaParticionVista {
    if (row.tipo === 'espacio' || row.tipo === 'seccion') {
      return { libras: null, dolares: null, unitario: null };
    }

    const grupos: Record<string, string[]> = {
      'total-me': ['material-empaque', 'premio'],
      'total-procesos-base': [
        'logistica', 'recepcion', 'clasificacion', 'cajas', 'tunel',
        'brine', 'iqf', 'descabezado', 'descongelado', 'hidratacion',
        'cocido', 'pelado', 'retractilado', 'decorado'
      ],
      'total-directos': ['cd-var', 'cd-fijo'],
      'total-indirectos': ['ci-var', 'ci-fijo'],
      'total-otros': ['copacking']
    };

    idsProcesosDinamicos(this.dtOriginal).forEach(x => {
      const strEtapa = x.etapaCodigo?.trim().toUpperCase();
      const strGrupo = strEtapa === 'CD' ? 'total-directos' : strEtapa === 'CI' ? 'total-indirectos' : 'total-procesos-base';
      grupos[strGrupo].push(x.id);
    });
    const ids = grupos[row.id] ?? [];
    if (ids.length === 0) {
      return this.crearCeldaTotal(
        this.num((row as any)[particion])
      );
    }

    const librasDetalle = filas
      .filter(x => ids.includes(x.id))
      .map(x => {
        const celda = this.crearCelda(
          x,
          particion,
          this.regla(x)
        );

        return this.num(celda.libras);
      })
      .filter(x => x > 0);

    // Los dólares de las filas hijas sí se suman; las libras físicas no.
    // Variables/Fijos/Indirectos pueden aplicar sobre la misma base de camarón.
    // En el subtotal se muestra una sola vez la mayor base física disponible.
    const libras = librasDetalle.length > 0
      ? Math.max(...librasDetalle)
      : 0;

    return this.crearCeldaResumen(
      this.num((row as any)[particion]),
      libras
    );
  }

  private crearCeldaResumen(
    dolares: number | null | undefined,
    libras: number | null | undefined,
    row?: FilaActualizacion,
    particion?: ParticionUi,
    origen?: OrigenDetalle
  ): CeldaParticionVista {
    const monto = this.num(dolares);
    const lbs = this.num(libras);
    const pcCodigoCosto = row?.tipo === 'normal'
      ? (row as FilaCostoVista).pcCodigoCosto || idsProcesosDinamicos(this.dtOriginal).find(x => x.id === row.id)?.pcCodigo
        || this.resolverPcCodigoCosto(row, this.regla(row))
        || (Array.isArray(this.dtOriginal?.Table9) ? this.dtOriginal.Table9.find((x: any) =>
          this.norm(x.strProceso) === this.norm(this.regla(row)?.etapa ?? row.concepto))?.strPcCodigo : '') || ''
      : '';
    const procesosOrigen: any[] = pcCodigoCosto && Array.isArray(this.dtOriginal?.Table9)
      ? this.dtOriginal.Table9.filter((x: any) => this.norm(x.strPcCodigo) === this.norm(pcCodigoCosto)
        && (origen ? this.norm(x.strOrigen) === origen : ['PFR', 'RPC'].includes(this.norm(x.strOrigen)))) : [];
    const campoLibras = particion === 'entero' ? 'dcLibrasEntero' : particion === 'cola' ? 'dcLibrasCola'
      : particion === 'valorAgregado' ? 'dcLibrasValorAgregado' : 'dcTotalLibras';
    // Respuestas antiguas y subtotales no aportan participacion. No reconstruirla en Angular.
    const tieneParticipacion = procesosOrigen.length > 0 && procesosOrigen.every(x =>
      typeof x[campoLibras] === 'number' && Number.isFinite(x[campoLibras])
      && typeof x.dcPorcParticipacionLibras === 'number' && Number.isFinite(x.dcPorcParticipacionLibras)
      && typeof x.blSinLibras === 'boolean');
    // Un consolidado solo tiene CU inequivoco si ambos origenes entregan el mismo valor.
    // El CU de Table9 corresponde al Total; cada particion conserva monto / lbs.
    const unitario = particion === undefined && procesosOrigen.length > 0 && procesosOrigen.every(x =>
      typeof x.dcCostoUnitario === 'number' && Number.isFinite(x.dcCostoUnitario)
      && x.dcCostoUnitario === procesosOrigen[0].dcCostoUnitario) ? procesosOrigen[0].dcCostoUnitario : undefined;
    return {
      libras: lbs > 0 ? lbs : null,
      dolares: dolares == null ? null : monto,
      unitario: dolares == null || (lbs > 0 && monto === 0) ? null : unitario ?? (lbs > 0 ? monto / lbs : null),
      librasParticipacion: tieneParticipacion ? procesosOrigen.reduce((acc, x) => acc + x[campoLibras], 0) : undefined,
      porcParticipacion: tieneParticipacion ? procesosOrigen.reduce((acc, x) => acc + x.dcPorcParticipacionLibras, 0) : undefined,
      sinLibras: tieneParticipacion ? procesosOrigen.some(x => x.blSinLibras) : undefined
    };
  }

  private crearCeldaTotal(dolares: number): CeldaParticionVista {
    return { libras: null, dolares: this.num(dolares), unitario: null };
  }

  private libras(etapa: string, particion: ParticionUi, origen: OrigenDetalle): number {
    const codigos = particion === 'entero' ? ['EN'] : particion === 'cola' ? ['SH'] : ['EV', 'SV'];
    return this.detalle
      .filter(x =>
        this.norm(x.Etapa) === this.norm(etapa) &&
        (!origen || this.norm(x.Origen) === this.norm(origen)) &&
        codigos.includes(String(x.ParticionCod ?? '').toUpperCase())
      )
      .reduce((acc, x) => acc + this.num(x.Libras), 0);
  }

  private librasTotal(etapa: string, origen: OrigenDetalle): number {
    return this.detalle
      .filter(x =>
        this.norm(x.Etapa) === this.norm(etapa) &&
        (!origen || this.norm(x.Origen) === this.norm(origen))
      )
      .reduce((acc, x) => acc + this.num(x.Libras), 0);
  }

  private regla(row: FilaActualizacion): ReglaEtapa | null {
    const map: Record<string, ReglaEtapa> = {
      // Filas consolidadas PFR + RPC. null = sumar ambos orígenes para libras.
      'tunel': { etapa: 'Tunel', origenEntero: null, origenCola: null, origenVa: null },
      'descabezado': { etapa: 'Descabezado', origenEntero: null, origenCola: null, origenVa: null },
      'descongelado': { etapa: 'Descongelado', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' },
      'retractilado': { etapa: 'Retractilado', origenEntero: null, origenCola: null, origenVa: null },
      'cd-var': { etapa: 'C.D.Variables', origenEntero: null, origenCola: null, origenVa: null },
      'cd-fijo': { etapa: 'C.D.Fijos', origenEntero: null, origenCola: null, origenVa: null },
      'ci-var': { etapa: 'C.I.Variables', origenEntero: null, origenCola: null, origenVa: null },
      'ci-fijo': { etapa: 'C.I.Fijos', origenEntero: null, origenCola: null, origenVa: null },
      'copacking': { etapa: 'C.Copacking', origenEntero: null, origenCola: null, origenVa: null },

      // LOG / REC / CLA: exclusivamente Liquidación Fresco.
      // Sus dólares vienen de Table6 distribuidos por backend con dcLbsReciXRend.
      'logistica': { etapa: 'Logistica', origenEntero: 'PFR', origenCola: 'PFR', origenVa: 'PFR' },
      'recepcion': { etapa: 'Recepcion', origenEntero: 'PFR', origenCola: 'PFR', origenVa: 'PFR' },
      'clasificacion': { etapa: 'Clasificacion', origenEntero: 'PFR', origenCola: 'PFR', origenVa: 'PFR' },

      // Cajas conserva la consolidación PFR + RPC existente.
      'cajas': { etapa: 'Cajas', origenEntero: null, origenCola: null, origenVa: null },

      // Etapas que solo existen en RPC dentro del modelo actual.
      'brine': { etapa: 'Brine', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' },
      'iqf': { etapa: 'IQF', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' },
      'hidratacion': { etapa: 'Hidratacion', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' },
      'cocido': { etapa: 'Cocido', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' },
      'pelado': { etapa: 'Pelado', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' },
      'decorado': { etapa: 'Decorado', origenEntero: 'RPC', origenCola: 'RPC', origenVa: 'RPC' }
    };
    if (map[row.id]) return map[row.id];
    // el nombre exacto del catálogo identifica la etapa dinámica en Table5.
    const objProceso = idsProcesosDinamicos(this.dtOriginal).find(x => x.id === row.id);
    return objProceso
      ? { etapa: objProceso.nombre, origenEntero: null, origenCola: null, origenVa: null }
      : null;
  }

  private origenPrincipal(_row: FilaActualizacion): OrigenDetalle {
    // La vista inferior trabaja por etapa consolidada; el origen se muestra dentro
    // del modal y no vuelve a dividir la fila principal en PFR/RPC.
    return null;
  }

  private resumenFallback(codigo: string, descripcion: string, row: FilaActualizacion | undefined, orden: number): ResumenLibrasProcesadasApi {
    return {
      Codigo: codigo,
      Descripcion: descripcion,
      Libras_Entero: this.num(row?.entero),
      Libras_Cola: this.num(row?.cola),
      Libras_Valor_Agregado: this.num(row?.valorAgregado),
      Total: this.num(row?.entero) + this.num(row?.cola) + this.num(row?.valorAgregado),
      Dolares_Entero: 0,
      Dolares_Cola: 0,
      Dolares_Valor_Agregado: 0,
      Dolares_Total: 0,
      Orden: orden
    };
  }

  private toDetalle(value: any): DetalleEtapaApi[] {
    if (!Array.isArray(value)) return [];
    return value.map(x => ({
      Etapa: String(x?.Etapa ?? x?.strEtapa ?? ''),
      Origen: String(x?.Origen ?? x?.strOrigen ?? ''),
      CodigoProceso: String(x?.CodigoProceso ?? x?.strProcesoCodigo ?? ''),
      ProcesoProductivo: String(x?.ProcesoProductivo ?? x?.strProcesoProductivo ?? ''),
      TipoEmbalaje: String(
        x?.TipoEmbalaje ??
        x?.strTipoEmbalaje ??
        x?.strTipEmbala ??
        x?.['TIPO EMBAL'] ??
        ''
      ),
      ParticionCod: String(x?.ParticionCod ?? x?.strParticionCod ?? ''),
      Particion: String(x?.Particion ?? x?.strParticion ?? ''),
      Libras: this.num(x?.Libras ?? x?.dcLibras),
      Orden: this.num(x?.Orden ?? x?.intOrden)
    }));
  }

  private toResumen(value: any): ResumenLibrasProcesadasApi[] {
    if (!Array.isArray(value)) return [];
    return value.map(x => ({
      Codigo: String(x?.Codigo ?? x?.strCodigo ?? ''),
      Descripcion: String(x?.Descripcion ?? x?.strDescripcion ?? ''),
      Libras_Entero: this.num(x?.Libras_Entero ?? x?.dcLibrasEntero),
      Libras_Cola: this.num(x?.Libras_Cola ?? x?.dcLibrasCola),
      Libras_Valor_Agregado: this.num(x?.Libras_Valor_Agregado ?? x?.dcLibrasValorAgregado),
      Total: this.num(x?.Total ?? x?.dcTotal),

      Dolares_Entero: this.num(
        x?.Dolares_Entero ??
        x?.dcDolaresEntero
      ),
      Dolares_Cola: this.num(
        x?.Dolares_Cola ??
        x?.dcDolaresCola
      ),
      Dolares_Valor_Agregado: this.num(
        x?.Dolares_Valor_Agregado ??
        x?.dcDolaresValorAgregado
      ),
      Dolares_Total: this.num(
        x?.Dolares_Total ??
        x?.dcDolaresTotal ??
        (
          this.num(x?.Dolares_Entero ?? x?.dcDolaresEntero) +
          this.num(x?.Dolares_Cola ?? x?.dcDolaresCola) +
          this.num(x?.Dolares_Valor_Agregado ?? x?.dcDolaresValorAgregado)
        )
      ),

      // Por defecto participa. Solo una respuesta explícita false lo excluye.
      IncluirEnTotal: (
        x?.IncluirEnTotal ??
        x?.blIncluirEnTotal ??
        true
      ) !== false,

      EsGrupoCompra: (
        x?.EsGrupoCompra ??
        x?.blEsGrupoCompra ??
        false
      ) === true,

      EsSubnivelCompra: (
        x?.EsSubnivelCompra ??
        x?.blEsSubnivelCompra ??
        false
      ) === true,

      Orden: this.num(x?.Orden ?? x?.intOrden)
    }));
  }

  private num(value: any): number {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }

  private norm(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }
}

/**
 * Único mapper público utilizado por el componente.
 */
export class ParamProcMapper {
  private readonly actualizacion = new ActualizacionCostosMapperInternal();
  private readonly vista = new ParamProcVistaMapperInternal();

  detallePremio(): PremioDetalleApi[] { return this.vista.detallePremio(); }

  cargarPayload(dt: any): void {
    this.vista.cargarPayload(dt);
  }

  construir(dt: any, warrenObjetivo = 0.83): ResultadoActualizacion {
    return this.actualizacion.construir(dt, warrenObjetivo);
  }

  limpiarWarren(resultado: ResultadoActualizacion, nuevoObjetivo: number): ResultadoActualizacion {
    return this.actualizacion.limpiarWarren(resultado, nuevoObjetivo);
  }

  recalcularWarren(resultado: ResultadoActualizacion, nuevoObjetivo: number): ResultadoActualizacion {
    return this.actualizacion.recalcularWarren(resultado, nuevoObjetivo);
  }

  aplicarWarrenGuardado(
    resultado: ResultadoActualizacion,
    table7: any,
    table8: any
  ): boolean {
    return this.actualizacion.aplicarWarrenGuardado(
      resultado,
      table7,
      table8
    );
  }

  construirWarrenBaseSnapshot(
    resultado: ResultadoActualizacion
  ): WarrenBaseProcesoSnapshot[] {
    return this.actualizacion
      .construirWarrenBaseSnapshot(
        resultado);
  }

  construirResumen(resultado: ResultadoActualizacion): ResumenLibrasProcesadasApi[] {
    return this.vista.construirResumen(resultado);
  }

  decorarFilas(resultado: ResultadoActualizacion): FilaCostoVista[] {
    return this.vista.decorarFilas(resultado);
  }

  pivotDetalleEtapa(row: FilaActualizacion): DetalleEtapaPivot[] {
    return this.vista.pivotDetalleEtapa(row);
  }

  detalleCuenta(
    row: FilaCostoVista | FilaActualizacion,
    particion: 'EN' | 'SH' | 'VA'
  ): CostoProductivoDetalleModalApi[] {
    return this.vista.detalleCuenta(row, particion);
  }

  /**
   * Se conserva por compatibilidad con el componente actual.
   * Internamente devuelve Table6 real, no datos simulados.
   */
  cuentasMock(row: FilaActualizacion): CuentaContableMock[] {
    return this.vista.cuentasMock(row);
  }

  agruparCuentasPorGrupo(
    cuentas: CuentaContableMock[]
  ): GrupoCuentaContableVista[] {
    return this.vista.agruparCuentasPorGrupo(cuentas);
  }
}
