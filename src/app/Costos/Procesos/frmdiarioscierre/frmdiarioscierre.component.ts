import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import * as XLSX from 'xlsx';

import { callApi } from 'src/app/config/Helpers';
import { varUser } from 'src/app/config/url.servicios';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import {
  ConfirmarDiariosCierreRequest,
  DiarioRetornoDTO,
  DiariosCierreDTO,
  ResultWS,
  TransferenciaGifDTO,
} from './diarios-cierre';
import { FrmdiarioscierreService } from './frmdiarioscierre.service';

interface CuadreVista {
  totalDebe: number;
  totalHaber: number;
  diferencia: number;
  cuadrado: boolean;
}

@Component({
  selector: 'app-frmdiarioscierre',
  templateUrl: './frmdiarioscierre.component.html',
  styleUrl: './frmdiarioscierre.component.scss',
})
export class FrmdiarioscierreComponent implements OnInit {

  @ViewChildren(DxDataGridComponent) grids?: QueryList<DxDataGridComponent>;

  loadingVisible = false;
  consultado = false;

  cmbAnio?: number;
  cmbMes?: number;
  listAnios: any[] = [];
  listMeses: any[] = [];

  tabs = [
    { id: 0, text: 'Retorno de Contenedores', icon: 'revert' },
    { id: 1, text: 'Transferencia G.I.F.', icon: 'money' },
  ];
  tabSeleccionado = 0;

  data: DiariosCierreDTO | null = null;

  // Validación exclusivamente visual en el front.
  // No modifica montos ni aplica reglas contables: solo compara Debe vs Haber.
  cuadresRetorno: Record<number, CuadreVista> = {};
  cuadresTransferencia: Record<number, CuadreVista> = {};

  constructor(private _srv: FrmdiarioscierreService) { }

  async ngOnInit(): Promise<void> {
    await this.cargarInfoCombos();
  }

  get todoCuadrado(): boolean {
    if (!this.data) return false;

    const retornos = this.data.retornos?.diarios ?? [];
    const transferencias = this.data.transferenciaGif?.diarios ?? [];

    const retornosCuadrados =
      retornos.length === 0 ||
      retornos.every(d => this.cuadresRetorno[d.id]?.cuadrado === true);

    const transferenciasCuadradas =
      transferencias.length === 0 ||
      transferencias.every(d =>
        this.cuadresTransferencia[d.id]?.cuadrado === true
      );

    const existeAlMenosUnDiario =
      retornos.length > 0 || transferencias.length > 0;

    return existeAlMenosUnDiario &&
      retornosCuadrados &&
      transferenciasCuadradas;
  }

  get puedeGuardar(): boolean {
    if (!this.consultado || !this.data || this.data.guardado) return false;
    return this.todoCuadrado;
  }

  async cargarInfoCombos(): Promise<void> {
    this.loadingVisible = true;

    const resp = await callApi<ResultWS<any>>(this._srv.getDataParametros());

    this.loadingVisible = false;

    if (!resp.ok || !resp.data?.Codigo) {
      await showAlert(
        '',
        resp.message || resp.data?.Description || 'No fue posible cargar los períodos.',
        'error'
      );
      return;
    }

    this.listAnios = resp.data.Dt?.Table ?? [];
    this.listMeses = resp.data.Dt?.Table1 ?? [];
  }

  async onClickConsultar(): Promise<void> {
    const faltantes: string[] = [];
    if (this.cmbAnio == null) faltantes.push('Año');
    if (this.cmbMes == null) faltantes.push('Mes');

    if (faltantes.length) {
      await showAlert(
        'Atención',
        `Por favor complete: ${faltantes.join(', ')}`,
        'warning'
      );
      return;
    }

    this.loadingVisible = true;
    this.consultado = false;
    this.data = null;

    const resp = await callApi<ResultWS<DiariosCierreDTO>>(
      this._srv.getDiariosCierre(this.cmbAnio!, this.cmbMes!)
    );

    this.loadingVisible = false;

    if (!resp.ok) {
      console.log('Error al consultar diarios de cierre:', resp);
      await showAlert('', resp.message, 'error');
      return;
    }

    if (!resp.data?.Codigo || !resp.data?.Dt) {
      await showAlert(
        'Atención',
        resp.data?.Description || 'El backend no devolvió información para el período.',
        'warning'
      );
      return;
    }
    console.log('Datos recibidos de diarios de cierre:', resp);

    this.data = resp.data.Dt;
    this.calcularCuadresFrontend();
    this.consultado = true;
    this.tabSeleccionado = 0;
    this.refrescarGrids();
  }

  onTabSelectionChanged(e: any): void {
    const id = e?.addedItems?.[0]?.id;
    if (id == null) return;

    this.tabSeleccionado = id;
    this.refrescarGrids();
  }

  async onGuardar(): Promise<void> {
    if (!this.consultado || !this.data) {
      await showAlert(
        'Atención',
        'Primero consulte un período antes de guardar.',
        'warning'
      );
      return;
    }

    if (this.data.guardado) {
      await showAlert(
        'Información',
        'El período consultado ya se encuentra confirmado.',
        'info'
      );
      return;
    }

    if (!this.todoCuadrado) {
      await showAlert(
        'Atención',
        'Existen uno o más diarios descuadrados. Revise los bloques marcados en rojo antes de guardar.',
        'warning'
      );
      return;
    }

    const request: ConfirmarDiariosCierreRequest = {
      idGeneracion: this.data.idGeneracion,
      anio: this.cmbAnio!,
      mes: this.cmbMes!,
      usuario: varUser,
    };

    this.loadingVisible = true;
    const resp = await callApi<ResultWS<any>>(
      this._srv.confirmarDiariosCierre(request)
    );
    this.loadingVisible = false;

    if (!resp.ok || !resp.data?.Codigo) {
      await showAlert(
        '',
        resp.message || resp.data?.Description || 'No fue posible guardar la confirmación.',
        'error'
      );
      return;
    }

    this.data = {
      ...this.data,
      guardado: true,
      estado: 'CONFIRMADO',
    };

    await showAlert(
      'Completado',
      resp.data.Description || 'Diarios confirmados correctamente.',
      'success'
    );
  }

  /**
   * Exportación exclusivamente de presentación.
   * Usa exactamente las líneas recibidas del backend. Los únicos cálculos
   * realizados en Angular son las sumas Debe/Haber para mostrar el cuadre.
   * Se utiliza el paquete xlsx ya disponible en el proyecto.
   */
  async onExportarExcel(): Promise<void> {

    if (
      !this.data ||
      this.cmbAnio == null ||
      this.cmbMes == null
    ) {
      await showAlert(
        'Atención',
        'Primero consulte un período.',
        'warning'
      );

      return;
    }

    const anio = this.cmbAnio;
    const mes = this.cmbMes;

    const ultimoDia =
      new Date(anio, mes, 0).getDate();

    const mesTexto =
      mes.toString().padStart(2, '0');

    const fechaInicio =
      `${anio}-${mesTexto}-01`;

    const fechaFin =
      `${anio}-${mesTexto}-${ultimoDia
        .toString()
        .padStart(2, '0')}`;

    const payload = {
      title: 'DIARIOS DE CIERRE DE COSTOS',
      title2: this.data.periodoTexto,

      columnas: null,

      // BANDERA
      sp: 'diarios-cierre',

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

    const resp = await callApi<any>(
      this._srv.callExcellFile(payload)
    );

    this.loadingVisible = false;

    if (!resp.ok) {

      await showAlert(
        'Error al generar Archivo',
        resp.message || 'Error desconocido',
        'error'
      );

      return;
    }

    const fileURL =
      URL.createObjectURL(resp.data);

    const a =
      document.createElement('a');

    a.href = fileURL;

    a.download =
      `Diarios_Cierre_${anio}_${mesTexto}.xlsx`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(fileURL);
  }

  private calcularCuadresFrontend(): void {
    const mapaRetornos: Record<number, CuadreVista> = {};
    const mapaTransferencias: Record<number, CuadreVista> = {};

    (this.data?.retornos?.diarios ?? []).forEach(diario => {
      mapaRetornos[diario.id] = this.calcularCuadre(diario.filas);
    });

    (this.data?.transferenciaGif?.diarios ?? []).forEach(diario => {
      mapaTransferencias[diario.id] = this.calcularCuadre(diario.filas);
    });

    this.cuadresRetorno = mapaRetornos;
    this.cuadresTransferencia = mapaTransferencias;
  }

  private calcularCuadre(
    filas: Array<{ debe?: number | null; haber?: number | null }>
  ): CuadreVista {
    const totalDebe = this.redondearMoneda(
      filas.reduce((total, fila) => total + Number(fila.debe ?? 0), 0)
    );
    const totalHaber = this.redondearMoneda(
      filas.reduce((total, fila) => total + Number(fila.haber ?? 0), 0)
    );
    const diferencia = this.redondearMoneda(totalDebe - totalHaber);

    return {
      totalDebe,
      totalHaber,
      diferencia,
      cuadrado: diferencia === 0,
    };
  }

  private redondearMoneda(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  private refrescarGrids(): void {
    setTimeout(() => {
      this.grids?.forEach(grid => {
        grid.instance.updateDimensions();
        grid.instance.repaint();
      });
    }, 50);
  }
}
