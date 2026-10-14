import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { FrmdistribucionluzService } from './frmdistribucionluz.service';
import { showAlert } from 'src/app/utilities/sweetAlert.util';
import { varUser } from 'src/app/config/url.servicios';
import {
  DriverCuenta,
  DistribucionCuenta,
  ResumenAsiento,
  SplitFijo,
  calcularDistribucion,
  Planta,              // ← agregar
  PLANTAS,             // ← agregar
  TotalesGrupo,        // ← agregar
  totalesVacios,       // ← agregar
  totalesDesdeHaber,   // ← agregar
  calcularSplit,       // ← agregar
  CuentaDriverDTO,
  Grupo,
} from './distribucion-luz';
import { callApi } from 'src/app/config/Helpers';

@Component({
  selector: 'app-frmdistribucionluz',
  templateUrl: './frmdistribucionluz.component.html',
  styleUrl: './frmdistribucionluz.component.scss',
})
export class FrmdistribucionluzComponent implements OnInit {
  @ViewChild('gridSonga') gridSonga?: DxDataGridComponent;
  @ViewChild('gridComun') gridComun?: DxDataGridComponent;
  @ViewChild('gridBasuraSonga') gridBasuraSonga?: DxDataGridComponent;
  @ViewChild('gridBasuraComun') gridBasuraComun?: DxDataGridComponent;

  loadingVisible = false;

  cmbAnio?: number;
  cmbMes?: number;
  cmbMesCopiar?: number;
  listAnios: any[] = [];
  listMeses: any[] = [];

  // ============================================================
  // ÚNICO objeto de totales. Reemplaza a las 12 variables sueltas.
  //   totales.energia.SONGA1.dolares / .watts / .codigoMedidor
  //   totales.basura.SONGA2.dolares  / .watts / .codigoMedidor
  // ============================================================
  totales: Record<Grupo, TotalesGrupo> = {
    energia: totalesVacios(),
    basura: totalesVacios(),
  };

  // Splits ahora AMBOS dinámicos (ya no existen SPLIT_ENERGIA / SPLIT_BASURA fijos)
  split: SplitFijo | null = null;
  splitBasura: SplitFijo | null = null;
  // ---- Tabs ----
  tabs = [
    { id: 0, text: 'Drivers Energía', icon: 'percent' },
    { id: 1, text: 'Distribución Energía', icon: 'money' },
    { id: 2, text: 'Drivers Basura', icon: 'percent' },
    { id: 3, text: 'Distribución Basura', icon: 'money' },
  ];
  tabSeleccionado = 0;

  // ---- Datos ----
  drivers: DriverCuenta[] = [];
  distribucion: DistribucionCuenta[] = [];
  resumenes: ResumenAsiento[] = [];

  // Arrays por asiento (precalculados, NO métodos en el template)
  filasSonga: DistribucionCuenta[] = [];
  filasComun: DistribucionCuenta[] = [];

  // ---- Resúmenes por asiento ----
  resumenSonga: ResumenAsiento | null = null;
  resumenComin: ResumenAsiento | null = null;
  driversBasura: DriverCuenta[] = [];
  filasBasuraSonga: DistribucionCuenta[] = [];
  filasBasuraComun: DistribucionCuenta[] = [];
  resumenBasuraSonga: ResumenAsiento | null = null;
  resumenBasuraComin: ResumenAsiento | null = null;

  consultado = false;

  constructor(private _srv: FrmdistribucionluzService) { }

  async ngOnInit() {
    this.loadingVisible = true;
    await this.cargarInfoCombos();
  }

  // ============ Combos ============
  async cargarInfoCombos() {
    await new Promise<boolean>((resolve) => {
      this._srv.getDataParametros().subscribe({
        next: async (resp) => {
          if (resp.Codigo) {
            this.listAnios = resp.Dt.Table;
            this.listMeses = resp.Dt.Table1;
            return resolve(true);
          }
          await showAlert('', resp.Description, 'error');
          return resolve(false);
        },
        error: async (err) => {
          console.error('Error técnico al cargar combos:', err);
          await showAlert('Error de Red', 'No se pudo conectar con el servidor. Intente más tarde.', 'error');
          resolve(false);
        },
        complete: () => { this.loadingVisible = false; },
      });
    });
  }

  // ============ Consultar ============
  async onClickConsultar() {
    const faltantes: string[] = [];
    if (this.cmbAnio == null) faltantes.push('Año');
    if (this.cmbMes == null) faltantes.push('Mes');
    if (faltantes.length) {
      await showAlert('Atención', `Por favor complete: ${faltantes.join(', ')}`, 'warning');
      return;
    }
    this.loadingVisible = true;
    await this.cargarCuentasDriver();
  }

  async cargarCuentasDriver() {
    this.limpiarCajas();
    const parametros = { strAnio: this.cmbAnio!, strMes: this.cmbMes! };
    const resp = await callApi<any>(this._srv.getCuentasDriver(parametros));

    if (resp.ok) {
      this.drivers = DriverCuenta.mapList(resp.data.Dt.Table);
      this.driversBasura = DriverCuenta.mapList(resp.data.Dt.Table1);
      this.consultado = true;
      this.tabSeleccionado = 0;

      this.cargarValoresDelHaber();   // llena totales + splits
      this.recalcular();
      this.recalcularBasura();
      this.loadingVisible = false;
    } else {
      this.loadingVisible = false;
      await showAlert('', resp.message, 'error');
    }
  }

  // ============================================================
  // UN SOLO handler para las 12 cajas (6 energía + 6 basura)
  // ============================================================
  onTotalChanged(grupo: Grupo, planta: Planta, campo: 'dolares' | 'watts', valor: number) {
    this.totales[grupo][planta][campo] = valor || 0;

    if (campo === 'dolares') {
      const s = calcularSplit(this.totales[grupo]);
      if (grupo === 'energia') this.split = s;
      else this.splitBasura = s;
    }

    if (grupo === 'energia') this.recalcular();
    else this.recalcularBasura();
  }

  // ============ Recalcular ============
  recalcular() {
    if (!this.drivers.length) return;
    const { filas, resumenes } = calcularDistribucion(this.drivers, this.totales.energia);
    this.distribucion = filas;
    this.resumenes = resumenes;
    const ordenar = (a: DistribucionCuenta, b: DistribucionCuenta) =>
    Number(a.esHaber) - Number(b.esHaber);
    this.filasSonga = filas.filter((f) => f.asiento === 'SONGA').sort(ordenar);
    this.filasComun = filas.filter((f) => f.asiento === 'COMIN').sort(ordenar);
    this.resumenSonga = resumenes.find((r) => r.asiento === 'SONGA') ?? null;
    this.resumenComin = resumenes.find((r) => r.asiento === 'COMIN') ?? null;
  }

  recalcularBasura() {
    if (!this.driversBasura.length) return;
    const { filas, resumenes } = calcularDistribucion(this.driversBasura, this.totales.basura);
    this.filasBasuraSonga = filas.filter((f) => f.asiento === 'SONGA');
    this.filasBasuraComun = filas.filter((f) => f.asiento === 'COMIN');
    this.resumenBasuraSonga = resumenes.find((r) => r.asiento === 'SONGA') ?? null;
    this.resumenBasuraComin = resumenes.find((r) => r.asiento === 'COMIN') ?? null;
  }

  // ============ Copiar % de otro mes ============
  async onCopiarMes() {
    if (this.cmbMesCopiar == null) {
      await showAlert('Atención', 'Seleccione el mes del que desea copiar los porcentajes.', 'warning');
      return;
    }
    if (!this.consultado) {
      await showAlert('Atención', 'Primero consulte para cargar las cuentas contables.', 'warning');
      return;
    }

    this.loadingVisible = true;
    const resp = await callApi<any>(this._srv.copiarPorcentajesMes(this.cmbAnio!, this.cmbMesCopiar!));

    if (resp.ok) {
      const copiadasEnergia = this.copiarPorcentajes(this.drivers, resp.data.Dt.Table, 'ENERGIA');
      const copiadasBasura  = this.copiarPorcentajes(this.driversBasura, resp.data.Dt.Table1, 'BASURA');

      this.drivers = [...this.drivers];
      this.driversBasura = [...this.driversBasura];
      this.recalcular();
      this.recalcularBasura();
      this.loadingVisible = false;

      await showAlert('Listo', `Energía: ${copiadasEnergia} | Basura: ${copiadasBasura} drivers actualizados.`, 'success');
    } else {
      this.loadingVisible = false;
      await showAlert('', resp.message, 'error');
    }
  }

  /** Copia % origen→destino. Clave incluye codigoMedidor y soporta cuentas repetidas. */
private copiarPorcentajes(
  destino: DriverCuenta[],
  origenRaw: CuentaDriverDTO[],
  etiqueta: string = ''   // ← para distinguir ENERGIA de BASURA en la consola
): number {

  // console.log(`\n========== [${etiqueta}] INICIO copiarPorcentajes ==========`);

  // // ---------- BANDERA 1: entrada cruda ----------
  // console.log('[1] origenRaw:', {
  //   esNull: origenRaw === null,
  //   esUndefined: origenRaw === undefined,
  //   esArray: Array.isArray(origenRaw),
  //   length: origenRaw?.length,
  // });
  // console.log('[1b] primer registro crudo:', origenRaw?.[0]);

  if (!Array.isArray(origenRaw)) {
    // console.error(`[${etiqueta}] ❌ origenRaw NO es array. Se aborta.`);
    return 0;
  }

  const clave = (d: DriverCuenta) =>
    `${d.codigoMedidor}_${d.bolsa}_${d.cuenta}_${d.tipoDriver}_${d.tipoCuenta}`;

  // ---------- BANDERA 2: mapeo y filtro ----------
  const origenTodos = DriverCuenta.mapList(origenRaw);
  const origen = origenTodos.filter((o) => o.tipoCuenta !== 'C');

  // console.log('[2] mapeo:', {
  //   totalMapeados: origenTodos.length,
  //   soloDEBE: origen.length,
  //   haberDescartados: origenTodos.length - origen.length,
  // });

  // console.log('[2b] tipoDriver presentes en origen:', [...new Set(origenTodos.map(o => o.tipoDriver))]);
  // console.log('[2c] tipoCuenta presentes en origen:', [...new Set(origenTodos.map(o => o.tipoCuenta))]);
  // console.log('[2d] bolsas presentes en origen:', [...new Set(origen.map(o => o.bolsa))]);
  // console.log('[2e] medidores presentes en origen:', [...new Set(origen.map(o => o.codigoMedidor))]);

  if (origen.length === 0) {
    // console.warn(`[${etiqueta}] ⚠️ No hay registros DEBE en el origen. Nada que copiar.`);
    return 0;
  }

  // ---------- BANDERA 3: destino ----------
  const destinoEditable = destino.filter((d) => d.tipoCuenta !== 'C' && d.editable);
  // console.log('[3] destino:', {
  //   total: destino.length,
  //   editablesDEBE: destinoEditable.length,
  //   noEditables: destino.filter(d => !d.editable).length,
  //   haber: destino.filter(d => d.tipoCuenta === 'C').length,
  // });
  // console.log('[3b] bolsas presentes en destino:', [...new Set(destinoEditable.map(d => d.bolsa))]);
  // console.log('[3c] medidores presentes en destino:', [...new Set(destinoEditable.map(d => d.codigoMedidor))]);

  if (destinoEditable.length === 0) {
    // console.warn(`[${etiqueta}] ⚠️ No hay destinos editables. Nada que copiar.`);
    return 0;
  }

  // ---------- BANDERA 4: construcción del índice ----------
  const indices = new Map<string, number[]>();
  origen.forEach((o, idx) => {
    const k = clave(o);
    if (!indices.has(k)) indices.set(k, []);
    indices.get(k)!.push(idx);
  });

  // console.log('[4] índice construido:', {
  //   clavesUnicas: indices.size,
  //   registrosOrigen: origen.length,
  //   clavesConDuplicados: [...indices.values()].filter(v => v.length > 1).length,
  // });
  // console.log('[4b] primeras 5 claves ORIGEN:', [...indices.keys()].slice(0, 5));
  // console.log('[4c] primeras 5 claves DESTINO:', destinoEditable.slice(0, 5).map(clave));

  // ---------- BANDERA 5: copia ----------
  const usados = new Map<string, number>();
  let copiadas = 0;
  const noEncontradas: string[] = [];
  const agotadas: string[] = [];

  destino.forEach((d) => {
    if (d.tipoCuenta === 'C' || !d.editable) return;

    const k = clave(d);
    const lista = indices.get(k);

    if (!lista?.length) {
      noEncontradas.push(k);
      return;
    }

    const n = usados.get(k) ?? 0;
    if (n < lista.length) {
      const anterior = d.porcentaje;
      d.porcentaje = origen[lista[n]].porcentaje;
      usados.set(k, n + 1);
      copiadas++;

      if (copiadas <= 5) {
        // console.log(`[5] ✔ ${k} [${n + 1}/${lista.length}]: ${anterior} → ${d.porcentaje}`);
      }
    } else {
      agotadas.push(k);
    }
  });

  // ---------- BANDERA 6: resultado ----------
  // console.log('[6] RESULTADO:', {
  //   copiadas,
  //   noEncontradas: noEncontradas.length,
  //   agotadas: agotadas.length,
  //   destinoEditable: destinoEditable.length,
  // });

  // if (noEncontradas.length) {
  //   console.warn('[6b] claves de DESTINO sin match en ORIGEN (primeras 10):', noEncontradas.slice(0, 10));
  // }
  // if (agotadas.length) {
  //   console.warn('[6c] claves con más ocurrencias en destino que en origen:', agotadas.slice(0, 10));
  // }

  // ---------- BANDERA 7: suma por bolsa tras copiar ----------
  const sumaPorBolsa: Record<string, number> = {};
  destino
    .filter(d => d.tipoCuenta !== 'C')
    .forEach(d => {
      sumaPorBolsa[d.bolsa] = (sumaPorBolsa[d.bolsa] ?? 0) + (d.porcentaje || 0);
    });
  // console.log('[7] suma % por bolsa tras copiar:', sumaPorBolsa);

  // console.log(`========== [${etiqueta}] FIN copiarPorcentajes ==========\n`);

  return copiadas;
}

  onRowUpdatedDrivers() { this.recalcular(); }

  onTabSelectionChanged(e: any) {
    const idx = e?.addedItems?.[0]?.id;
    if (idx == null) return;
    this.tabSeleccionado = idx;
    if (idx === 1) {
      this.recalcular();
      setTimeout(() => {
        this.gridSonga?.instance?.updateDimensions(); this.gridSonga?.instance?.repaint();
        this.gridComun?.instance?.updateDimensions(); this.gridComun?.instance?.repaint();
      }, 60);
    }
    if (idx === 3) {
      this.recalcularBasura();
      setTimeout(() => {
        this.gridBasuraSonga?.instance?.updateDimensions(); this.gridBasuraSonga?.instance?.repaint();
        this.gridBasuraComun?.instance?.updateDimensions(); this.gridBasuraComun?.instance?.repaint();
      }, 60);
    }
  }

  onEditingStart(e: any) {
    if (e?.data && e.data.editable === false) e.cancel = true;
  }

  resumenPorAsiento(asiento: string): ResumenAsiento | undefined {
    return this.resumenes.find((r) => r.asiento === asiento);
  }

  filasPorAsiento(asiento: string): DistribucionCuenta[] {
    return this.distribucion.filter((f) => f.asiento === asiento);
  }

  // ============ Guardar ============
  async onGuardar() {
    if (!this.consultado || !this.drivers.length) {
      await showAlert('Atención', 'No hay datos para guardar. Realice una consulta primero.', 'warning');
      return;
    }

    const faltante = PLANTAS.find(
      (p) => (this.totales.energia[p].dolares ?? 0) <= 0 // || (this.totales.energia[p].watts ?? 0) <= 0
    );
    if (faltante) {
      await showAlert('Atención', `Ingrese dólares y watts de ${faltante}.`, 'warning');
      return;
    }

    this.loadingVisible = true;

    const energiaParaGuardar = this.mapearFilasADtos(this.distribucion, this.drivers);
    const basuraParaGuardar = this.mapearFilasADtos(
      this.filasBasuraSonga.concat(this.filasBasuraComun),
      this.driversBasura
    );

    const parametros = [...energiaParaGuardar, ...basuraParaGuardar];
    const resp = await callApi<any>(this._srv.postDistribucion(parametros));

    this.loadingVisible = false;
    if (resp.ok) {
      await showAlert('Completado', resp.data.Description || 'Datos guardados correctamente', 'success');
    } else {
      await showAlert('', resp.message, 'error');
    }
  }

  private mapearFilasADtos(filas: DistribucionCuenta[], drivers: DriverCuenta[]): CuentaDriverDTO[] {
    filas.forEach((fila) => {
      const driver = drivers.find((d) => d.id === fila.id);
      if (!driver) return;
      const esHaber = driver.tipoCuenta === 'C';
      driver.montoDolares = esHaber ? fila.haber : fila.debe;
      driver.montoKwh = esHaber ? fila.haberWatts : fila.debeWatts;
    });
    return drivers.map((d) => d.toCuentaDriverDTO(varUser));
  }

  private limpiarCajas(): void {
    this.totales = { energia: totalesVacios(), basura: totalesVacios() };
    this.split = null;
    this.splitBasura = null;
    this.cmbMesCopiar = undefined;

    this.drivers = [];
    this.distribucion = [];
    this.resumenes = [];
    this.filasSonga = [];
    this.filasComun = [];
    this.resumenSonga = null;
    this.resumenComin = null;

    this.driversBasura = [];
    this.filasBasuraSonga = [];
    this.filasBasuraComun = [];
    this.resumenBasuraSonga = null;
    this.resumenBasuraComin = null;
  }

  // ============================================================
  // cargarValoresDelHaber — un solo loop. Toma el medidor del HABER real.
  // ============================================================
  private cargarValoresDelHaber(): void {
    const asignar = (grupo: Grupo, lista: DriverCuenta[], tipoDriver: string) => {
      PLANTAS.forEach((planta) => {
        const h = lista.find(
          (d) => d.tipoCuenta === 'C' && d.tipoDriver === tipoDriver && d.bolsa === planta
        );

        this.totales[grupo][planta] = {
          id: h?.id ?? 0,
          dolares: h?.montoDolares ?? 0,
          watts: h?.montoKwh ?? 0,
          // ← el medidor del HABER manda; si no vino, conserva el default
          codigoMedidor: h?.codigoMedidor || this.totales[grupo][planta].codigoMedidor,
        };
      });
    };

    asignar('energia', this.drivers, 'ENLEC');
    asignar('basura', this.driversBasura, 'REBAS');

    this.split = calcularSplit(this.totales.energia);
    this.splitBasura = calcularSplit(this.totales.basura);
  }
}