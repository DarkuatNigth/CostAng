import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxTabPanelModule, DxDataGridModule, DxTemplateModule } from 'devextreme-angular';
import {
  GRUPO_META, GRUPO_ORDEN, GRUPOS_GENERALES,
  GRUPOS_SIN_SUBTAB, GRUPOS_LIBRAS_UNICAS,
  ProcesoAgrupado, ProcesoGeneral,
  LibrasParticion,
  construirParticiones,
  ProcesoParticion,
  construirTotalesParticion,
  PARTICION_ORDEN
} from './procesos-agrupacion.config';

@Component({
  selector: 'app-tab-grid',
  standalone: true,
  imports: [CommonModule, DxTabPanelModule, DxDataGridModule, DxTemplateModule],
  templateUrl: './tab-grid.component.html',
  styleUrl: './tab-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabGridComponent {

  private _dataSource: ProcesoAgrupado[] = [];

  private _dataEstructura: LibrasParticion[] = [];
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
  librasParticion: LibrasParticion[] = [];
  dataPartFRS: ProcesoParticion[] = [];
  dataPartRPC: ProcesoParticion[] = [];
  dataPartPG:  ProcesoParticion[] = [];
  totalesPartFRS: any[] = [];
  totalesPartRPC: any[] = [];
  totalesPartPG:  any[] = [];
  ordenarGrupo = (a: any, b: any) => (GRUPO_ORDEN[a] ?? 99) - (GRUPO_ORDEN[b] ?? 99);
  ordenarParticion = (a: any, b: any) => (PARTICION_ORDEN[a] ?? 99) - (PARTICION_ORDEN[b] ?? 99);
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
      this.reconstruirParticiones();      // ← NUEVO
      this.objCdr.detectChanges();
    }
  }
  // ─── INPUT estructura (Table3) ──────────────────────────────
  @Input() set dataEstructura(value: LibrasParticion[] | null) {
    this._dataEstructura = value ?? [];
    this.reconstruirParticiones();
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

  private reconstruirParticiones() {
    // Espera a tener ambos: costos y estructura
    if (!this._dataSource?.length || !this._dataEstructura?.length) return;

    const costFRS = this._dataSource.filter(i => i.origen === 'FRS');
    const costRPC = this._dataSource.filter(i => i.origen === 'RPC');

    this.dataPartFRS = construirParticiones(costFRS, this._dataEstructura, 'FRS');
    this.dataPartRPC = construirParticiones(costRPC, this._dataEstructura, 'RPC');
    this.dataPartPG = construirParticiones(this.dataGenerales, this._dataEstructura, 'PG');

    this.totalesPartFRS = construirTotalesParticion(this.dataPartFRS);
    this.totalesPartRPC = construirTotalesParticion(this.dataPartRPC);
    this.totalesPartPG  = construirTotalesParticion(this.dataPartPG);

    this.objCdr.detectChanges();
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

     // ── NUEVO: edición por partición en FRS/RPC ──
    if ((origen === 'FRS' || origen === 'RPC') && rowData.particionCod) {
      this.handleParticionChange(rowData, origen);
      return;
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

  private handleParticionChange(rowData: any, origen: string) {
    const desc = rowData.Descripcion as string;
    const cod = rowData.particionCod as string;
    const src = origen === 'FRS' ? this.dataPartFRS : this.dataPartRPC;

    // 1. fija el valor editado en la hoja
    const leaf = src.find(x => x.Descripcion === desc && x.particionCod === cod);
    if (leaf) {
      leaf.Valor = rowData.Valor;
      leaf.Costo_Unitario = leaf.Libras_Proceso > 0 ? leaf.Valor / leaf.Libras_Proceso : 0;
    }

    // 2. total del proceso = suma de sus particiones
    const totalProc = src.filter(x => x.Descripcion === desc).reduce((s, x) => s + (x.Valor || 0), 0);

    // 3. actualiza el item real (ProcesoAgrupado) que se guarda
    const item = this._dataSource.find(i => i.origen === origen && i.Descripcion === desc);
    if (item) {
      item.Valor = totalProc;
      item.Costo_Unitario = item.Libras_Proceso > 0 ? totalProc / item.Libras_Proceso : 0;
    }

    // 4. recomputa SOLO el cuadro Totales del origen (no reconstruye particiones)
    if (origen === 'FRS') this.totalesPartFRS = construirTotalesParticion(this.dataPartFRS);
    else this.totalesPartRPC = construirTotalesParticion(this.dataPartRPC);

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

      // ── RESÚMENES POR GRUPO (fila "Grupo: ...") ──
      if (options.name === 'LibrasGrupo' || options.name === 'CU_Grupo') {
        switch (options.summaryProcess) {
          case 'start':
            options.__v = 0; options.__lSuma = 0; options.__lPrim = null;
            options.__grupo = null; options.__part = null; options.__mismaPart = true;
            break;
          case 'calculate': {
            const r = options.value;
            options.__grupo = r.grupo;
            options.__v += r.Valor || 0;
            if (options.__lPrim === null) options.__lPrim = r.Libras_Proceso || 0;
            options.__lSuma += r.Libras_Proceso || 0;
            if (options.__part === null) options.__part = r.particionCod;
            else if (options.__part !== r.particionCod) options.__mismaPart = false;
            break;
          }
          case 'finalize': {
            // libras compartidas SOLO cuando el grupo las comparte y todas las filas
            // son de la misma partición (detalle Proceso Primario). En Totales las
            // filas son distintas particiones → se suman.
            const compartidas = GRUPOS_LIBRAS_UNICAS.includes(options.__grupo) && options.__mismaPart;
            const libras = compartidas ? (options.__lPrim ?? 0) : options.__lSuma;
            options.totalValue = options.name === 'LibrasGrupo'
              ? libras
              : (libras > 0 ? options.__v / libras : 0);
            break;
          }
        }
        return;
      }

      // ── RESÚMENES DEL PIE (lo que ya tenías) ──
      switch (options.summaryProcess) {
        case 'start':
          options.totalValue = 0;
          break;
        case 'finalize':
          const datos: any[] = options.component.option('dataSource') ?? [];
          if (options.name === 'LibrasTotal') {
            options.totalValue = this.calcularLibrasTotales(datos);
          } else {
            options.totalValue = this.calcularPromedio(datos, proceso);
          }
          break;
      }
    };
  }

  // Devuelve las libras aplicando la misma regla que usamos para el C/Lb
  private calcularLibrasTotales(datos: any[]): number {
    if (!datos.length) return 0;

    const grupos = new Set(datos.map(r => r.grupo));

    // Cuadro Totales (varios grupos) → base = total de Proceso Primario (EN+SH+...)
    if (grupos.size > 1) {
      const pp = datos.filter(r => r.grupo === 'Proceso Primario');
      if (pp.length) return pp.reduce((s, r) => s + (r.Libras_Proceso || 0), 0);
    }

    // Sub-tab de detalle (un solo grupo)
    const grupoReal = datos[0]?.grupo ?? '';
    if (GRUPOS_LIBRAS_UNICAS.includes(grupoReal)) {
      // libras compartidas: una por partición, luego sumar particiones
      const porPart = new Map<string, number>();
      datos.forEach(r => {
        if (!porPart.has(r.particionCod)) porPart.set(r.particionCod, r.Libras_Proceso || 0);
      });
      return [...porPart.values()].reduce((s, v) => s + v, 0);
    }

    // grupo normal: suma todas las filas
    return datos.reduce((s, r) => s + (r.Libras_Proceso || 0), 0);
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
  getParticiones(origen: string, grupo: string): ProcesoParticion[] {
    const src = origen === 'FRS' ? this.dataPartFRS
              : origen === 'RPC' ? this.dataPartRPC
              : this.dataPartPG;
    return src.filter(x => x.grupo === grupo);
  }

  getTotales(origen: string): any[] {
  return origen === 'FRS' ? this.totalesPartFRS
       : origen === 'RPC' ? this.totalesPartRPC
       : this.totalesPartPG;
  }
}