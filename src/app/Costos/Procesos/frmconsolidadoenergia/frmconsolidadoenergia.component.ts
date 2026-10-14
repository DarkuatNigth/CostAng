import { Component, OnInit } from '@angular/core';
import { FrmconsolidadoenergiaService } from './frmconsolidadoenergia.service';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import {
  ConsolidadoDTO,
  FilaPivote,
  MESES,
  MESES_CORTO,
  toPivote,
  filaTotal,
  pivoteRatio,
  FilaCombinada,
  toCombinada, 
} from './consolidado-energia';
import { callApi } from 'src/app/config/Helpers';

interface PuntoSerie {
  mes: string;
  'SONGA 1': number;
  'SONGA 2': number;
  'COMIN': number;
  TOTAL: number;
}

@Component({
  selector: 'app-frmconsolidadoenergia',
  templateUrl: './frmconsolidadoenergia.component.html',
  styleUrl: './frmconsolidadoenergia.component.scss',
})
export class FrmconsolidadoenergiaComponent implements OnInit {
  loadingVisible = false;

  cmbAnio!: number;
  listAnios: any[] = [];

  meses = MESES;
  mesesCorto = MESES_CORTO;

  // Tablas pivote
  tablaUsd: FilaPivote[] = [];
  tablaKwh: FilaPivote[] = [];
  tablaRatio: FilaPivote[] = [];
  tablaAlumbrado: FilaPivote[] = [];
  tablaCombinada: FilaCombinada[] = [];

  // Datos para dx-chart (un punto por mes, series por planta)
  serieKwh: PuntoSerie[] = [];
  serieUsd: PuntoSerie[] = [];

  plantas = ['SONGA 1', 'SONGA 2', 'COMIN'];

  consultado = false;

  constructor(private _srv: FrmconsolidadoenergiaService) {}

  async ngOnInit() {
    this.cmbAnio = new Date().getFullYear();
    this.loadingVisible = true;
    await this.cargarAnios();
    // Carga automática del año actual al abrir la página
    await this.cargarConsolidado();
    this.loadingVisible = false;
  }

  async cargarAnios() {
    
    const resp = await callApi<any>(
      this._srv.getAnios()
    );
    if (resp.ok) {
      this.listAnios = resp.data.Dt.Table;
    }
    else {
      await showAlert('', resp.message, 'error');
    }
  }

  async onClickConsultar() {
    if (this.cmbAnio == null) {
      await showAlert('Atención', 'Seleccione un año.', 'warning');
      return;
    }
    this.loadingVisible = true;
    await this.cargarConsolidado();
    this.loadingVisible = false;
  }

  async cargarConsolidado() {

    const resp = await callApi<any>(
      this._srv.getConsolidado(this.cmbAnio)
    );

    if (resp.ok) {
      console.log(resp.data);
      this.armarTablas(resp.data.Dt.Table[0] as ConsolidadoDTO);
      this.consultado = true;
      this.loadingVisible = false;
    }
    else {
      this.loadingVisible = false;
      await showAlert('', resp.message, 'error');
    }
  }

  private armarTablas(dto: ConsolidadoDTO) {
    // Tablas base
    this.tablaCombinada = toCombinada(dto.usd, dto.kwh);
    this.tablaUsd = toPivote(dto.usd);
    this.tablaKwh = toPivote(dto.kwh);
    this.tablaAlumbrado = toPivote(dto.alumbrado);
    this.tablaRatio = pivoteRatio(this.tablaUsd, this.tablaKwh);

    // Fila TOTAL a USD y Kwh
    this.tablaUsd = [...this.tablaUsd, filaTotal(this.tablaUsd)];
    this.tablaKwh = [...this.tablaKwh, filaTotal(this.tablaKwh)];
    this.tablaAlumbrado = [...this.tablaAlumbrado, filaTotal(this.tablaAlumbrado)];

    // Aplanar meses a campos m0..m11 (evita funciones en el template = evita loop de render)
    this.tablaUsd = this.tablaUsd.map((f) => this.aplanar(f));
    this.tablaKwh = this.tablaKwh.map((f) => this.aplanar(f));
    this.tablaAlumbrado = this.tablaAlumbrado.map((f) => this.aplanar(f));

    // Series para gráficos (un objeto por mes)
    this.serieKwh = this.construirSerie(dto.kwh);
    this.serieUsd = this.construirSerie(dto.usd);
  }

  /** Copia meses[] a campos planos m0..m11 para que el grid use dataField, no funciones. */
  private aplanar(f: FilaPivote): any {
    const o: any = { ...f };
    for (let i = 0; i < 12; i++) o['m' + i] = f.meses ? f.meses[i] : null;
    return o;
  }

  private construirSerie(data: Record<string, number[]>): PuntoSerie[] {
    return this.mesesCorto.map((m, i) => {
      const s1 = data['SONGA 1']?.[i] || 0;
      const s2 = data['SONGA 2']?.[i] || 0;
      const co = data['COMIN']?.[i] || 0;
      return {
        mes: m,
        'SONGA 1': s1,
        'SONGA 2': s2,
        'COMIN': co,
        TOTAL: +(s1 + s2 + co).toFixed(2),
      };
    });
  }

  // Helpers para el template: valor de un mes concreto (columna dinámica)
  mesIndex(i: number): number { return i; }
}