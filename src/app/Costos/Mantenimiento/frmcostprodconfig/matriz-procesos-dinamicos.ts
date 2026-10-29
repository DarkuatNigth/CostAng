import type { Column } from 'devextreme/ui/data_grid';
import { EtapaCostoMantenimiento, ProcesoCostoMantenimiento, TipoValorProceso } from './frmcostprodconfig.models';

// grupos, nombres y códigos se toman del catálogo, sin columnas de proceso fijas.
const hshComponentesExcluidos = new Set(['MPE', 'COP', 'TAR', 'EXC']);
const hshEtapasExcluidas = new Set(['MP', 'CP', 'DM']);

export function construirMatrizCatalogo(
  etapas: EtapaCostoMantenimiento[], procesos: ProcesoCostoMantenimiento[]
): { procesos: ProcesoCostoMantenimiento[]; columnas: Column[] } {
  const lstEtapas = etapas.filter(objEtapa => objEtapa.activo && !objEtapa.esDiario && !hshEtapasExcluidas.has(objEtapa.codigo))
    .sort((objA, objB) => objA.orden - objB.orden || objA.nombre.localeCompare(objB.nombre));
  const lstProcesos = procesos.filter(objProceso => objProceso.activo && !objProceso.sinProceso &&
    !objProceso.esDiario && objProceso.uso !== 'Diario' && objProceso.uso !== 'DIARIO' &&
    (objProceso.modoValor === TipoValorProceso.CALCULADO || objProceso.modoValor === TipoValorProceso.DOLARES_TOTALES) &&
    !objProceso.esTarifa && !objProceso.esFichaTecnica && !!objProceso.codigo?.trim() &&
    !hshComponentesExcluidos.has(objProceso.codigo.trim().toUpperCase()))
    .sort((objA, objB) => objA.orden - objB.orden || objA.nombre.localeCompare(objB.nombre));
  const lstResultado: ProcesoCostoMantenimiento[] = [];
  const lstColumnas: Column[] = [
    { dataField: 'nombre', caption: 'TIPOLIQ', width: 300, fixed: true, fixedPosition: 'left' },
    { dataField: 'tipoLoteCodigo', caption: 'Tipo', width: 70, alignment: 'center', fixed: true, fixedPosition: 'left' },
    { dataField: 'nivel', caption: 'Nivel', width: 72, alignment: 'center', fixed: true, fixedPosition: 'left', cellTemplate: 'nivelCell' }
  ];
  lstEtapas.forEach(objEtapa => {
    const lstEtapa = lstProcesos.filter(objProceso => objProceso.etapaCodigo === objEtapa.codigo);
    // no crear una columna vacía cuando la etapa no tenga procesos elegibles.
    if (!lstEtapa.length) return;
    lstResultado.push(...lstEtapa);
    lstColumnas.push({ caption: objEtapa.nombre, alignment: 'center', columns: lstEtapa.map(objProceso => ({
      name: objProceso.codigo, caption: objProceso.nombre, width: 100, cellTemplate: 'reglaCell'
    })) });
  });
  return { procesos: lstResultado, columnas: lstColumnas };
}
