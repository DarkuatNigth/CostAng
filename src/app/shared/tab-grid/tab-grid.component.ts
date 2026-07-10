import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTabPanelModule, DxDataGridModule, DxTemplateModule } from 'devextreme-angular';
import {
  GRUPO_META, GRUPO_ORDEN, GRUPOS_GENERALES,
  GRUPOS_SIN_SUBTAB, GRUPOS_LIBRAS_UNICAS,
  ProcesoAgrupado, ProcesoGeneral
} from './procesos-agrupacion.config';

@Component({
  selector: 'app-tab-grid',
  standalone: true,
  imports: [CommonModule, DxTabPanelModule, DxDataGridModule, DxTemplateModule],
  templateUrl: './tab-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabGridComponent {

  private _dataSource: ProcesoAgrupado[] = [];

  // Mapa de tooltips por descripción
  readonly tooltipMap: Record<string, string> = {
    'Hidratacion': 'Mano de obra + Materiales'
  };

  // Método que el template usará
  getTooltip(descripcion: string): string {
    return this.tooltipMap[descripcion] ?? '';
  }
  filteredData: { [key: string]: ProcesoAgrupado[] } = { FRS: [], RPC: [], TAR: [] };
  totalValor: number = 0;
  totalLibras: number = 0;
  subTabsGenerales: any[] = [];
  subTabsFresco: any[] = [];
  subTabsSecundario: any[] = [];
  dataTarifas: ProcesoAgrupado[] = [];
  summaryFnPG = this.getCustomSummaryFn('PG');
  summaryFnFRS = this.getCustomSummaryFn('FRS');
  summaryFnRPC = this.getCustomSummaryFn('RPC');
  summaryFnTAR = this.getCustomSummaryFn('TAR');

  // ── NUEVO ──────────────────────────────────────────────────────────────────
  dataGenerales: ProcesoGeneral[] = [];

  constructor(private objCdr: ChangeDetectorRef) { }

  // ─── TABS ─────────────────────────────────────────────────────────────────
  // "PG" va primero para que sea el tab por defecto visible
  tabs = [
    { id: 'PG', title: 'Procesos Generales', icon: 'globe' },
    { id: 'FRS', title: 'Proceso Fresco', icon: 'card' },
    { id: 'RPC', title: 'Proceso Secundario', icon: 'repeat' },
    { id: 'TAR', title: 'Procesos Adicionales', icon: 'money' }
  ];

  // ─── INPUT ────────────────────────────────────────────────────────────────
  @Input() set dataSource(value: ProcesoAgrupado[]) {
    if (value && value.length > 0) {
      this._dataSource = value;
      this.generarEstructuraTabs();
      this.refreshFilteredData();
      this.objCdr.detectChanges();
    }
  }
  get dataSource(): ProcesoAgrupado[] { return this._dataSource; }

  @Output() onDataChanged = new EventEmitter<ProcesoAgrupado[]>();

  // ─── GENERACIÓN DE ESTRUCTURA ─────────────────────────────────────────────
  private generarEstructuraTabs() {
    this.dataTarifas = this._dataSource.filter(i => i.origen === 'TAR');
    this.generarDataGenerales();
    this.subTabsGenerales = this.generarSubTabsConTotales_PG();
    this.subTabsFresco = this.generarSubTabsConTotales('FRS');
    this.subTabsSecundario = this.generarSubTabsConTotales('RPC');
  }

  private generarSubTabsConTotales_PG(): any[] {
    const subTabs = GRUPOS_GENERALES
      .filter(grupo => this.dataGenerales.some(i => i.grupo === grupo))
      .filter(grupo => !GRUPOS_SIN_SUBTAB.includes(grupo))  // ← única línea nueva
      .map(grupo => ({
        titulo: grupo,
        icon: GRUPO_META[grupo]?.icon || 'box',
        datos: this.dataGenerales.filter(i => i.grupo === grupo)
      }));

    return [this.generarSubTabTotales(this.dataGenerales), ...subTabs];
  }

  private generarSubTabsConTotales(origen: string): any[] {
    const filtrados = this._dataSource.filter(i => i.origen === origen);

    const subTabs = [...new Set(filtrados.map(i => i.grupo))]
      .map(nombre => ({
        titulo: nombre,
        datos: filtrados.filter(i => i.grupo === nombre),
        icon: GRUPO_META[nombre]?.icon || 'box'
      }))
      .sort((a, b) => (GRUPO_ORDEN[a.titulo] || 99) - (GRUPO_ORDEN[b.titulo] || 99));

    return [this.generarSubTabTotales(filtrados), ...subTabs];
  }

  private generarSubTabTotales(items: (ProcesoAgrupado | ProcesoGeneral)[]): any {
    const grupos = [...new Set(items.map(i => i.grupo))]
      .sort((a, b) => (GRUPO_ORDEN[a] || 99) - (GRUPO_ORDEN[b] || 99));

    const datos = grupos.map((grupo, idx) => {
      const delGrupo = items.filter(i => i.grupo === grupo);
      const valor = delGrupo.reduce((s, i) => s + (i.Valor || 0), 0);
      const libras = grupo === 'Proceso Primario' || grupo === 'Costos Directos' || grupo === 'Costos Indirectos'
        ? (delGrupo[0]?.Libras_Proceso || 0)
        : delGrupo.reduce((s, i) => s + (i.Libras_Proceso || 0), 0);
      return {
        Codigo: 8000 + idx,
        Descripcion: grupo,
        grupo: grupo,
        Valor: valor,
        Libras_Proceso: libras,
        Costo_Unitario: libras > 0 ? valor / libras : 0,
        editable: false
      };
    });

    return {
      titulo: 'Totales',
      icon: GRUPO_META['Totales']?.icon || 'chart',
      datos
    };
  }



  onEditorPreparing(event: any) {
    //console.log('onEditorPreparing', event);
    if (event.dataField !== 'Valor') return;
    if (!event.row || event.row.rowType !== 'data') return;

    const rowData = event.row.data as ProcesoAgrupado;
    event.editorOptions.disabled = !rowData.editable;
  }

  private generarDataGenerales() {
    this.dataGenerales = [];

    GRUPOS_GENERALES.forEach((grupo, grupoIdx) => {
      const frsItems = this._dataSource.filter(
        i => i.origen === 'FRS' && i.grupo === grupo
      );
      const rpcItems = this._dataSource.filter(
        i => i.origen === 'RPC' && i.grupo === grupo
      );

      const descripciones = [
        ...new Set([...frsItems, ...rpcItems].map(i => i.Descripcion))
      ];

      descripciones.forEach((desc, idx) => {
        const iFRS = frsItems.find(i => i.Descripcion === desc);
        const iRPC = rpcItems.find(i => i.Descripcion === desc);

        const librasFRS = iFRS?.Libras_Proceso ?? 0;
        const librasRPC = iRPC?.Libras_Proceso ?? 0;
        const librasTotal = librasFRS + librasRPC;
        const valorTotal = (iFRS?.Valor ?? 0) + (iRPC?.Valor ?? 0);

        this.dataGenerales.push(
          new ProcesoGeneral(9000 + grupoIdx * 100 + idx, desc, valorTotal, librasTotal, grupo)
        );
      });
    });
  }

  onValueChange(event: any, origen: string) {
    const rowData = event.data;

    if (origen === 'PG') {
      this.handlePGChange(rowData);
      return;
    }

    // Lógica original para FRS, RPC, TAR
    const item = this._dataSource.find(
      i => i.Codigo === rowData.Codigo && i.origen === origen
    );

    if (item) {
      item.Valor = rowData.Valor;

      if (item.Libras_Proceso > 0) {
        const calculo = (origen === 'TAR')
          ? item.Valor * item.Libras_Proceso
          : item.Valor / item.Libras_Proceso;
        item.Costo_Unitario = Number(calculo.toFixed(4));
      }

      this.generarEstructuraTabs();   // ← regenera Totales también
      this.refreshFilteredData();
      this.onDataChanged.emit([...this._dataSource]);
    }
  }

  private handlePGChange(rowData: any) {
    const desc = rowData.Descripcion as string;
    const newValor = rowData.Valor as number;

    const itemFRS = this._dataSource.find(i => i.origen === 'FRS' && i.Descripcion === desc);
    const itemRPC = this._dataSource.find(i => i.origen === 'RPC' && i.Descripcion === desc);

    const librasFRS = itemFRS?.Libras_Proceso ?? 0;
    const librasRPC = itemRPC?.Libras_Proceso ?? 0;
    const librasTotal = librasFRS + librasRPC;

    // Costo unitario general = total dólares / total libras (FRS + RPC)
    const costoUnitario = librasTotal > 0 ? newValor / librasTotal : 0;

    // Actualiza in-place el item en dataGenerales
    const genItem = this.dataGenerales.find(i => i.Descripcion === desc);
    if (genItem) {
      genItem.Valor = newValor;
      genItem.Libras_Proceso = librasTotal;
      genItem.Costo_Unitario = costoUnitario;
    }

    // FRS: Valor = costoUnitario * librasFRS  →  Costo_Unitario = Valor / librasFRS
    if (itemFRS) {
      if (librasFRS > 0) {
        // itemFRS.Valor = Number((costoUnitario * librasFRS).toFixed(4));
        // itemFRS.Costo_Unitario = Number((itemFRS.Valor / librasFRS).toFixed(4));
        itemFRS.Valor = (costoUnitario * librasFRS);
        itemFRS.Costo_Unitario = (itemFRS.Valor / librasFRS);
      } else {
        itemFRS.Valor = 0;
        itemFRS.Costo_Unitario = 0;
      }
    }

    // RPC: Valor = costoUnitario * librasRPC  →  Costo_Unitario = Valor / librasRPC
    if (itemRPC) {
      if (librasRPC > 0) {
        itemRPC.Valor = (costoUnitario * librasRPC);
        itemRPC.Costo_Unitario = (itemRPC.Valor / librasRPC);
      } else {
        itemRPC.Valor = 0;
        itemRPC.Costo_Unitario = 0;
      }
    }

    // Regenera sub-tabs de FRS y RPC para que reflejen los nuevos valores
    this.generarEstructuraTabs();

    this.refreshFilteredData();
    this.onDataChanged.emit([...this._dataSource]);
    this.objCdr.detectChanges();
  }
  // ─── HELPERS ──────────────────────────────────────────────────────────────
  getGridData(origen: string): ProcesoAgrupado[] {
    return this.filteredData[origen] || [];
  }

  private refreshFilteredData() {
    this.tabs.forEach(tab => {
      if (tab.id === 'PG') return; // PG tiene su propia estructura
      this.filteredData[tab.id] = this._dataSource
        .filter(item => item.origen === tab.id)
        .sort((a, b) => a.grupoOrden - b.grupoOrden || a.Codigo - b.Codigo);
    });
  }

  getCustomSummaryFn(proceso: string) {
    return (options: any) => {

      switch (options.summaryProcess) {
        case 'start':
          options.totalValue = 0;
          break;
        case 'finalize':
          const datos: any[] = options.component.option('dataSource') ?? [];
          if (options.name === 'LibrasTotal') {
            options.totalValue = this.calcularLibrasTotales(datos);
          } else {
            // 'CostoUnitarioTotal'
            options.totalValue = this.calcularPromedio(datos, proceso);
          }
          break;
      }
    };
  }

  // Devuelve las libras aplicando la misma regla que usamos para el C/Lb
  private calcularLibrasTotales(datos: any[]): number {
    if (!datos.length) return 0;

    // Cuadro Totales: todas las filas son nombres de grupos
    const esCuadroTotales = datos.every(r => GRUPOS_GENERALES.includes(r.Descripcion) 
      && !GRUPOS_SIN_SUBTAB.includes(r.Descripcion));
    const esGrupoSinSubtab = datos.every(r => GRUPOS_SIN_SUBTAB.includes(r.Descripcion));
    if (esCuadroTotales) {
      const filaPP = datos.find(r => r.Descripcion === 'Proceso Primario') ;
      return filaPP?.Libras_Proceso ?? 0;
    }


    // Sub-tab: grupo del primer elemento
    const grupoReal: string = datos[0]?.grupo ?? '';
    if (GRUPOS_LIBRAS_UNICAS.includes(grupoReal) || esGrupoSinSubtab) {
      return datos[0]?.Libras_Proceso ?? 0;
    }

    return datos.reduce((s: number, r: any) => s + (r.Libras_Proceso || 0), 0);
  }

  calcularPromedio(datos: any[], proceso: string): number {
    if (proceso === 'TAR') {
      const nbTotLibras = datos.reduce((s: number, r: any) => s + (r.Libras_Proceso || 0), 0);
      const nbTotDol = datos.reduce((s: number, r: any) => s + (r.Costo_Unitario || 0), 0);
      return nbTotLibras > 0 ? nbTotDol / nbTotLibras : 0;
    }

    const nbTotDol = datos.reduce((s: number, r: any) => s + (r.Valor || 0), 0);
    const libras = this.calcularLibrasTotales(datos);
    return libras > 0 ? nbTotDol / libras : 0;
  }

  get tabsFiltrados() {
    // Aquí decides cuáles mostrar. 
    // Si quieres esconder FRS y RPC, los filtramos:
    return this.tabs;
    //.filter(tab => tab.id !== 'FRS' && tab.id !== 'RPC');
  }
}