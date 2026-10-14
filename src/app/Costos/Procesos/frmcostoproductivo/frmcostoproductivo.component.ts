import { Component, OnInit } from '@angular/core';
import { Workbook } from 'exceljs';
// import { saveAs } from 'file-saver-es';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import {
  CostoProductivoCuenta,
  CostoProductivoResumen,
  DetalleProcesoAplicableCosto,
  GuardarCostoProductivoRequest
} from './costo-productivo.model';
import { FrmcostoproductivoService } from './frmcostoproductivo.service';

@Component({
  selector: 'app-frmcostoproductivo',
  templateUrl: './frmcostoproductivo.component.html',
  styleUrl: './frmcostoproductivo.component.scss'
})
export class FrmcostoproductivoComponent implements OnInit {
  loadingVisible = false;

  cmbAnio = new Date().getFullYear();
  cmbMes = new Date().getMonth() + 1;

  listAnios: number[] = [];
  listMeses = [
    { id: 1, nombre: 'Enero' },
    { id: 2, nombre: 'Febrero' },
    { id: 3, nombre: 'Marzo' },
    { id: 4, nombre: 'Abril' },
    { id: 5, nombre: 'Mayo' },
    { id: 6, nombre: 'Junio' },
    { id: 7, nombre: 'Julio' },
    { id: 8, nombre: 'Agosto' },
    { id: 9, nombre: 'Septiembre' },
    { id: 10, nombre: 'Octubre' },
    { id: 11, nombre: 'Noviembre' },
    { id: 12, nombre: 'Diciembre' }
  ];

  listadoTotal: CostoProductivoCuenta[] = [];
  resumen: CostoProductivoResumen | null = null;

  // Modal compacto para reemplazar la cadena enorme de procesos aplicables.
  popupProcesosVisible = false;
  filaProcesosSeleccionada: CostoProductivoCuenta | null = null;
  detalleProcesosAplicables: DetalleProcesoAplicableCosto[] = [];

  private readonly ordenEtapas: string[] = [
    'Logistica',
    'Recepcion',
    'Clasificacion',
    'Codificacion',
    'Cajas',
    'Descabezado',
    'Descongelado',
    'Pelado',
    'Hidratacion',
    'Cocido',
    'Decorado',
    'Retractilado',
    'Brine',
    'IQF',
    'Tunel',
    'C.D.Fijos',
    'C.D.Variables',
    'C.I.Fijos',
    'C.I.Variables',
    'C. Copacking'
  ];

  constructor(private readonly service: FrmcostoproductivoService) {}

  ngOnInit(): void {
    const actual = new Date().getFullYear();
    this.listAnios = [actual, actual - 1, actual - 2, actual - 3];
  }

  async onClickConsultar(): Promise<void> {
    if (!this.validarPeriodo()) return;

    this.loadingVisible = true;
    this.service.consultar(this.cmbAnio, this.cmbMes).subscribe({
      next: async resp => {
        if (!resp?.Codigo) {
          this.listadoTotal = [];
          this.loadingVisible = false;
          this.resumen = null;
          await showAlert('', resp?.Description || 'No se pudo consultar el costo productivo.', 'error');
          return;
        }
        this.loadingVisible = false;
        console.log('repsueta', resp);
        this.listadoTotal = (resp.Dt?.Table ?? []).map(x => ({ ...x }));
        this.resumen = resp.Dt?.Table1?.[0] ?? null;

        if (this.resumen && !this.resumen.cuadra) {
          await showAlert(
            'Validación',
            `La consulta no cuadra. Diferencia: ${this.formatoMonto(this.resumen.diferencia)}. ` +
            `Descongelado sin asignar: ${this.formatoMonto(this.resumen.descongeladoSinAsignar)}.`,
            'warning'
          );
        }
      },
      error: async err => {
        this.loadingVisible = false;
        console.error('Error al consultar costo productivo:', err);
        this.listadoTotal = [];
        this.resumen = null;
        await showAlert('Error', err?.error?.Description || 'No se pudo consultar el costo productivo.', 'error');
      },
      complete: () => this.loadingVisible = false
    });
  }

  async onGuardarClick(): Promise<void> {
    if (!this.validarPeriodo()) return;

    if (!this.listadoTotal.length) {
      await showAlert('Atención', 'Realice la consulta antes de guardar.', 'warning');
      return;
    }

    if (!this.resumen?.cuadra) {
      await showAlert(
        'Atención',
        'No se puede guardar mientras el cuadre general o Descongelado tengan diferencias.',
        'warning'
      );
      return;
    }

    const request: GuardarCostoProductivoRequest = {
      anio: this.cmbAnio.toString(),
      mes: this.cmbMes.toString(),
      usuario: varUser?.toString() || 'SYSTEM',

      // Se envía exactamente el snapshot recibido del backend.
      // No se usa formato visual ni Math.round sobre estos valores.
      registros: this.listadoTotal.map(x => ({
        ...x,
        detalleProcesosAplicables: [...(x.detalleProcesosAplicables ?? [])]
      })),
      resumen: { ...this.resumen }
    };
    console.log('Guardar request:', request);
    this.loadingVisible = true;
    this.service.guardar(request).subscribe({
      next: async resp => {
        if (!resp?.Codigo) {
          this.loadingVisible = false;
          await showAlert('', resp?.Description || 'No se pudo guardar el costo productivo.', 'error');
          return;
        }

        this.loadingVisible = false;
        this.listadoTotal = (resp.Dt?.Table ?? []).map(x => ({ ...x }));
        this.resumen = resp.Dt?.Table1?.[0] ?? null;
        await showAlert('Completado', resp.Description || 'Costo productivo guardado correctamente.', 'success');
      },
      error: async err => {
        this.loadingVisible = false;
        console.error('Error al guardar costo productivo:', err);
        await showAlert('Error', err?.error?.Description || 'No se pudo guardar el costo productivo.', 'error');
      },
      complete: () => this.loadingVisible = false
    });
  }

  // async exportarExcel(): Promise<void> {
  //   if (!this.listadoTotal.length) {
  //     await showAlert('Atención', 'No existen datos para exportar.', 'warning');
  //     return;
  //   }

  //   const wb = new Workbook();
  //   const ws = wb.addWorksheet('Costo Productivo');

  //   ws.columns = [
  //     { header: 'Etapa', key: 'etapaVista', width: 20 },
  //     { header: 'Etapa general', key: 'grupoEtapa', width: 22 },
  //     { header: 'Origen', key: 'origen', width: 12 },
  //     { header: 'Cuenta', key: 'cuenta', width: 15 },
  //     { header: 'Centro costo', key: 'centroCosto', width: 28 },
  //     { header: 'Subcentro costo', key: 'subcentroCosto', width: 30 },
  //     { header: 'Tipo', key: 'tipo', width: 18 },
  //     { header: 'Tipo costo', key: 'tipoCosto', width: 12 },
  //     { header: 'Agrupación', key: 'agrupacionCentro', width: 55 },
  //     { header: 'Grupo', key: 'grupoCentro', width: 30 },
  //     { header: 'Rubro', key: 'rubro', width: 30 },
  //     { header: 'Auxiliar', key: 'auxiliar', width: 30 },
  //     { header: 'Entero', key: 'entero', width: 15 },
  //     { header: 'Cola', key: 'cola', width: 15 },
  //     { header: 'Sub-total', key: 'subtotal', width: 15 },
  //     { header: 'Valor Agregado', key: 'valorAgregado', width: 17 },
  //     { header: 'C. Directo Fijo', key: 'costoDirectoFijo', width: 17 },
  //     { header: 'C. Directo Variable', key: 'costoDirectoVariable', width: 19 },
  //     { header: 'C. Indirecto Fijo', key: 'costoIndirectoFijo', width: 19 },
  //     { header: 'C. Indirecto Variable', key: 'costoIndirectoVariable', width: 21 },
  //     { header: 'Reclasif. Descongelado', key: 'reclasificadoDescongelado', width: 22 },
  //     { header: 'Total', key: 'total', width: 16 },
  //     { header: 'Monto cuenta', key: 'montoCuenta', width: 16 },
  //     { header: 'Factor cuenta', key: 'factorAsignacion', width: 14 },
  //     { header: 'Libras driver', key: 'librasDriver', width: 16 },
  //     { header: 'Peso driver', key: 'pesoDriver', width: 16 },
  //     { header: 'Origen distribución', key: 'origenDistribucion', width: 22 },
  //     { header: 'Procesos aplicables', key: 'destinosSiTexto', width: 50 },
  //     { header: 'Diferencia', key: 'diferencia', width: 15 },
  //     { header: 'Cuadra', key: 'cuadra', width: 10 }
  //   ];

  //   this.listadoTotal.forEach(x => ws.addRow(x));

  //   ws.getRow(1).font = { bold: true };
  //   ws.views = [{ state: 'frozen', ySplit: 1 }];
  //   ws.autoFilter = { from: 'A1', to: 'AA1' };

  //   const moneyKeys = [
  //     'entero', 'cola', 'subtotal', 'valorAgregado', 'costoDirectoFijo',
  //     'costoDirectoVariable', 'costoIndirectoFijo', 'costoIndirectoVariable',
  //     'reclasificadoDescongelado', 'total', 'montoCuenta', 'diferencia'
  //   ];

  //   ws.columns.forEach(col => {
  //     if (col.key && moneyKeys.includes(col.key.toString())) {
  //       col.numFmt = '$#,##0;[Red]-$#,##0';
  //     }
  //   });

  //   const buffer = await wb.xlsx.writeBuffer();
  //   const mes = this.listMeses.find(x => x.id === this.cmbMes)?.nombre ?? this.cmbMes.toString();
  //   // saveAs(
  //   //   new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  //   //   `CostoProductivo_${this.cmbAnio}_${mes}.xlsx`
  //   // );
  // }

  ordenarEtapas = (a: string, b: string): number => {
    const ia = this.ordenEtapas.findIndex(x => x.toUpperCase() === (a || '').toUpperCase());
    const ib = this.ordenEtapas.findIndex(x => x.toUpperCase() === (b || '').toUpperCase());
    const va = ia < 0 ? 999 : ia;
    const vb = ib < 0 ? 999 : ib;
    return va === vb ? (a || '').localeCompare(b || '') : va - vb;
  };

  customizeMonto = (cell: any): string => {
    const value = Number(cell?.value ?? 0);
    return this.formatoMonto(value);
  };

  customizeLibras = (cell: any): string => {
    const value = Number(cell?.value ?? 0);
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  abrirDetalleProcesos(row: CostoProductivoCuenta): void {
    if (!row) return;

    this.filaProcesosSeleccionada = row;
    this.detalleProcesosAplicables = (row.detalleProcesosAplicables ?? [])
      .filter(x => Math.abs(Number(x?.dolares ?? 0)) > 0.0000001)
      .map(x => ({ ...x }));

    this.popupProcesosVisible = true;
  }

  cerrarDetalleProcesos(): void {
    this.popupProcesosVisible = false;
    this.filaProcesosSeleccionada = null;
    this.detalleProcesosAplicables = [];
  }

  get totalDetalleProcesos(): number {
    return this.detalleProcesosAplicables.reduce(
      (total, item) => total + Number(item?.dolares ?? 0),
      0
    );
  }

  cantidadDetalleProcesos(row: CostoProductivoCuenta | null | undefined): number {
    return (row?.detalleProcesosAplicables ?? [])
      .filter(x => Math.abs(Number(x?.dolares ?? 0)) > 0.0000001)
      .length;
  }

  tieneDetalleProcesos(row: CostoProductivoCuenta | null | undefined): boolean {
    return this.cantidadDetalleProcesos(row) > 0;
  }

  onCellPrepared(e: any): void {
    if (e.rowType !== 'data' || !e.data) return;

    const data = e.data as CostoProductivoCuenta;

    if (data.origen === 'DERIVADO') {
      e.rowElement?.classList?.add('row-derivado');
    }

    if (!data.encontradaSong && data.origen !== 'DERIVADO') {
      e.rowElement?.classList?.add('row-sin-song');
    }

    if (!data.cuadra) {
      e.rowElement?.classList?.add('row-no-cuadra');
    }

    if (data.origenDistribucion === 'FALLBACK_CUENTA' || data.origenDistribucion === 'SIN_DRIVER') {
      e.rowElement?.classList?.add('row-driver-warning');
    }
  }

  get estadoCuadreTexto(): string {
    if (!this.resumen) return 'Sin consulta';
    return this.resumen.cuadra ? 'Cuadrado' : 'Con diferencias';
  }

  get mesSeleccionado(): string {
    return this.listMeses.find(x => x.id === this.cmbMes)?.nombre ?? '';
  }

  formatoMonedaEntera(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value ?? 0));
  }

  customizeMonedaEntera = (cell: any): string =>
    this.formatoMonedaEntera(Number(cell?.value ?? 0));

  formatoMonto(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value ?? 0));
  }

  private validarPeriodo(): boolean {
    if (!this.cmbAnio || !this.cmbMes) {
      showAlert('', 'Seleccione Año y Mes.', 'warning');
      return false;
    }
    return true;
  }

  async exportarExcel(): Promise<void> {
    if (!this.validarPeriodo()) {
      return;
    }

    const anio = Number(this.cmbAnio);
    const mes = Number(this.cmbMes);

    const mesTexto = mes.toString().padStart(2, '0');
    const ultimoDia =
      new Date(anio, mes, 0).getDate();

    const fechaInicio =
      `${anio}-${mesTexto}-01`;

    const fechaFin =
      `${anio}-${mesTexto}-${ultimoDia
        .toString()
        .padStart(2, '0')}`;

    const nombreArchivo =
      `CostoProductivo_${anio}_${mesTexto}`;

    /*
    * IMPORTANTE:
    *
    * ExportarLiquidacionesExcel actualmente toma:
    *
    * modelParam[1] = fecha inicio
    * modelParam[2] = fecha fin
    *
    * Por eso mantenemos i_empresa como elemento 0.
    */
    const request = {
      title: nombreArchivo,

      title2:
        `Costos y gastos por proceso productivo - ` +
        `${this.mesSeleccionado} ${anio}`,

      // El backend define las columnas del reporte.
      columnas: null,

      // Este valor selecciona nuestro nuevo case del ReportingController.
      sp: 'costo-productivo',

      modelParam: [
        {
          name: 'i_empresa',
          type: 'Int',
          value: 1
        },
        {
          name: 'dtFechaInicio',
          type: 'Date',
          value: fechaInicio
        },
        {
          name: 'dtFechaFin',
          type: 'Date',
          value: fechaFin
        }
      ]
    };

    this.loadingVisible = true;

    this.service.callExcellFile(request).subscribe({
      next: async (blob: Blob) => {
        this.loadingVisible = false;

        if (!blob || blob.size === 0) {
          await showAlert(
            'Atención',
            'El archivo generado está vacío.',
            'warning'
          );
          return;
        }

        this.descargarBlob(
          blob,
          `${nombreArchivo}.xlsx`
        );
      },

      error: async err => {
        this.loadingVisible = false;

        console.error(
          'Error al exportar costo productivo:',
          err
        );

        const mensaje =
          await this.obtenerMensajeErrorExcel(err);

        await showAlert(
          'Error',
          mensaje,
          'error'
        );
      },

      complete: () => {
        this.loadingVisible = false;
      }
    });
  }
  
  private descargarBlob(
  blob: Blob,
  nombreArchivo: string
): void {

  const url =
    window.URL.createObjectURL(blob);

  const enlace =
    document.createElement('a');

  enlace.href = url;
  enlace.download = nombreArchivo;

  document.body.appendChild(enlace);

  enlace.click();
  enlace.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}


private async obtenerMensajeErrorExcel(
  err: any
): Promise<string> {

  try {
    if (err?.error instanceof Blob) {

      const texto =
        await err.error.text();

      if (texto) {
        const respuesta =
          JSON.parse(texto);

        return (
          respuesta?.Description ||
          respuesta?.description ||
          respuesta?.message ||
          'No se pudo generar el archivo Excel.'
        );
      }
    }

    return (
      err?.error?.Description ||
      err?.message ||
      'No se pudo generar el archivo Excel.'
    );

  } catch {
    return 'No se pudo generar el archivo Excel.';
  }
}
}