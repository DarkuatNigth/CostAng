import { CuentaCostoMantenimiento, EtapaCostoMantenimiento, FilaMatrizCosteo, ProcesoCostoMantenimiento, TipoLoteMantenimiento, TipoProcesoMantenimiento } from './frmcostprodconfig.models';

// contrato puro independiente de ExcelJS y del componente.
export interface DatosExportacionConfiguracion {
  etapas: readonly EtapaCostoMantenimiento[];
  procesos: readonly ProcesoCostoMantenimiento[];
  procesosMatriz: readonly ProcesoCostoMantenimiento[];
  tiposProceso: readonly TipoProcesoMantenimiento[];
  tiposLote: readonly TipoLoteMantenimiento[];
  filasMatriz: readonly FilaMatrizCosteo[];
  cuentas: readonly CuentaCostoMantenimiento[];
  tiposDirty: ReadonlySet<string>;
  matrizDirty: ReadonlySet<string>;
  cuentasDirty: ReadonlySet<string>;
  // Claves normalizadas: proceso:<codigo> o param:<id>, también para altas locales.
  procesosDirty: ReadonlySet<string>;
}

export interface HojaConfiguracionExcel {
  nombre: string;
  columnas: string[];
  filas: (string | number)[][];
}

export function construirHojasConfiguracion(datos: DatosExportacionConfiguracion): HojaConfiguracionExcel[] {
  const siNo = (valor: boolean) => valor ? 'Sí' : 'No';
  const etapa = (codigo: string, nombre: string) => datos.etapas.find(e => e.codigo === codigo)?.nombre || nombre || codigo;
  const regla = (valor: string | undefined) => {
    const codigo = String(valor ?? 'NA').trim().toUpperCase() || 'NA';
    return codigo === 'SI' ? 'Sí' : codigo === 'NO' ? 'No' : codigo;
  };
  return [
    {
      nombre: 'Matriz de Costeo',
      columnas: ['Código', 'TIPOLIQ', 'Tipo', 'Nivel', ...datos.procesosMatriz.map(p => `${p.nombre} (${p.codigo})`), 'Pendiente de guardar'],
      filas: datos.filasMatriz.map(t => [t.codigo, t.nombre, t.tipoLoteCodigo, t.nivel,
        ...datos.procesosMatriz.map(p => regla(t.reglas[p.codigo])),
        siNo(datos.tiposDirty.has(t.codigo) || Array.from(datos.matrizDirty).some(k => k.startsWith(`${t.codigo.trim().toUpperCase()}|`)))])
    },
    {
      nombre: 'Tipos / Niveles',
      columnas: ['Código', 'Nombre', 'Código tipo lote', 'Tipo de lote', 'Nivel', 'Activo', 'Pendiente de guardar'],
      filas: datos.tiposProceso.map(t => [t.codigo, t.nombre, t.tipoLoteCodigo,
        datos.tiposLote.find(l => l.codigo === t.tipoLoteCodigo)?.nombre || t.tipoLote || t.tipoLoteCodigo,
        t.nivel, siNo(t.activo), siNo(datos.tiposDirty.has(t.codigo))])
    },
    {
      nombre: 'Cuentas Contables',
      columnas: ['ID', 'Empresa', 'Código etapa', 'Etapa', 'Proceso resuelto', 'Nombre proceso', 'Centro', 'Nombre centro', 'Subcentro', 'Nombre subcentro', 'Cuenta', 'Nombre cuenta', 'Auxiliar', 'Nombre auxiliar', 'Modo de monto', 'Driver', 'Requiere crédito de retiro', 'Activo', 'Pendiente de guardar'],
      filas: datos.cuentas.map(c => {
        const codigo = c.procesoCodigo || c.procesoResuelto || '';
        return [c.id, c.empresa, c.etapaCodigo, etapa(c.etapaCodigo, c.etapa), codigo,
          datos.procesos.find(p => p.codigo === codigo)?.nombre || c.procesoNombre || '',
          c.centroCodigo, c.centroNombre || '', c.subcentroCodigo, c.subcentroNombre || '',
          c.cuenta, c.cuentaNombre || '', c.auxiliarCodigo || '', c.auxiliarNombre || '',
          c.modoMonto, c.driverResuelto, siNo(c.requiereCreditoRetiro), siNo(c.activo), siNo(datos.cuentasDirty.has(String(c.id)))];
      })
    },
    {
      nombre: 'Procesos',
      columnas: ['Código', 'Nombre', 'Código etapa', 'Etapa', 'Uso', 'Orden', 'Modo de valor', 'Código tipo proceso', 'Tipo de proceso', 'Cantidad de cuentas', 'Activo', 'Pendiente de guardar'],
      filas: datos.procesos.map(p => [p.codigo, p.nombre, p.etapaCodigo, etapa(p.etapaCodigo, p.etapa),
        p.esDiario || p.uso === 'Diario' || p.uso === 'DIARIO' || p.etapaCodigo === 'DM' || datos.etapas.some(e => e.codigo === p.etapaCodigo && e.esDiario) ? 'Diario' : 'Productivo',
        p.orden, p.modoValor || '', p.tipoProcesoCodigo || '', p.tipoProceso || p.tipoProcesoCodigo || '',
        p.cantidadCuentas ?? datos.cuentas.filter(c => c.activo && (c.procesoCodigo || c.procesoResuelto) === p.codigo).length,
        siNo(p.activo), siNo(datos.procesosDirty.has(p.sinProceso ? `param:${p.paramId}` : `proceso:${p.codigo}`))])
    }
  ];
}
