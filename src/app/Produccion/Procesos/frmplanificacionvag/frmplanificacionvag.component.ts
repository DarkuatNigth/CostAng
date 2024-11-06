import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';

import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';

declare var $: any;
declare var window;


export interface PeriodicElement {
  position: number;
  numFactura: string;
  cliente: string;
  codProducto: string;
  Producto: string;
  TallaProducto: string;
  Libras: number;
}

export const listaFacturas = [
  { position: 1, numFactura: 'S 0001/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', TallaProducto: '21/25', Libras: 1000 },
  { position: 2, numFactura: 'S 0002/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', TallaProducto: '21/25', Libras: 1000 },
  { position: 3, numFactura: 'S 0003/2024', cliente: 'H SMITH FOOD', codProducto: '6304', Producto: 'PYD-T-OFF', TallaProducto: '21/25', Libras: 1000 },
  { position: 4, numFactura: 'S 0004/2024', cliente: 'LIDL STIFOOD', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', TallaProducto: '21/25', Libras: 1000 },
  { position: 5, numFactura: 'S 0005/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', TallaProducto: '21/25', Libras: 1000 },
]


@Component({
  selector: 'app-frmplanificacionvag',
  templateUrl: './frmplanificacionvag.component.html',
  styleUrl: './frmplanificacionvag.component.scss',
})
export class FrmplanificacionvagComponent implements OnInit {
  title = 'Planificación de Facturas de Pelado';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  txtObservacion: string = '';
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  cmbPlanta?: string;
  numPersonas: number;
  
  listaPlanificacion = [
    { codPlanifica: 1, checkReqMp: true, checkReqDes: true, numFactura: 'S 0001/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-01', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 2, checkReqMp: true, checkReqDes: true, numFactura: 'S 0002/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-01', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
    { codPlanifica: 3, checkReqMp: true, checkReqDes: true, numFactura: 'S 0003/2024', cliente: 'H SMITH FOOD', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-T-OFF', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-02', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 4, checkReqMp: false, checkReqDes: false, numFactura: 'S 0004/2024', cliente: 'LIDL STIFOOD', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-02', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
    { codPlanifica: 5, checkReqMp: false, checkReqDes: false, numFactura: 'S 0005/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-03', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 6, checkReqMp: false, checkReqDes: false, numFactura: 'S 0001/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-03', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
    { codPlanifica: 7, checkReqMp: false, checkReqDes: false, numFactura: 'S 0002/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-04', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 8, checkReqMp: false, checkReqDes: false, numFactura: 'S 0003/2024', cliente: 'H SMITH FOOD', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-T-OFF', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-04', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
    { codPlanifica: 9, checkReqMp: false, checkReqDes: false, numFactura: 'S 0004/2024', cliente: 'LIDL STIFOOD', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-05', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 10, checkReqMp: false, checkReqDes: false, numFactura: 'S 0005/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-05', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
    { codPlanifica: 11, checkReqMp: false, checkReqDes: false, numFactura: 'S 0004/2024', cliente: 'LIDL STIFOOD', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-06', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 12, checkReqMp: false, checkReqDes: false, numFactura: 'S 0005/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-06', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
    { codPlanifica: 13, checkReqMp: false, checkReqDes: false, numFactura: 'S 0004/2024', cliente: 'LIDL STIFOOD', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-07', Dia: '', Turno: 'Día', TiempoCorte: 10 },
    { codPlanifica: 14, checkReqMp: false, checkReqDes: false, numFactura: 'S 0005/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', TallaProducto: '21/25', claseProducto: 'A', Producto: 'PYD-OFF-BLOQUE', Congelamiento: 'IQF', Libras: 1000, Fecha: '2024-11-07', Dia: '', Turno: 'Noche', TiempoCorte: 10 },
  ]

  listaPlanta = [
    { codigo: 1, descri: 'SONGA 1' },
    { codigo: 2, descri: 'SONGA 2' },
  ]

  @ViewChild('GridPlanificacion', { static: false }) GridPlanificacion: DxDataGridComponent;
  @ViewChild('table', {static: true}) table: MatTable<PeriodicElement>;
  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;

  displayedColumns: string[] = [ 'position', 'numFactura', 'cliente', 'codProducto', 'Producto', 'TallaProducto', 'Libras' ];
  dataSource = listaFacturas;

  drop(event: CdkDragDrop<string>) {
    const previousIndex = this.dataSource.findIndex(d => d === event.item.data);
    moveItemInArray(this.dataSource, previousIndex, event.currentIndex);
    this.table.renderRows();
  }

  async ngOnInit() {
    this.listaPlanificacion = this.listaPlanificacion.sort((a, b) => a.Fecha.localeCompare(b.Fecha) || a.Turno.localeCompare(b.Turno));
    this.listaPlanificacion = this.listaPlanificacion.map((item) => {
      item.Dia = this.formatDate(new Date(item.Fecha), 2);
      return item;
    });
  }
  
  formatDate(date, format) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const dayName = date.getDay();
    if (format === 1) 
      return `${dayNames[dayName]} ${day} ${monthNames[monthIndex]} ${year}`;
    return `${dayNames[dayName]} ${day}`;
  }
  
  onClickNuevo() {
    // this.limpiarNuevo();
  }

  async onClickConsultar() {
  }

  async onClickGuardar() {
  }

  async onItemPrintClick() {
  }

  
  onInitializedPlanificacion(grid: any) {
    this.GridPlanificacion = grid;
  }

  
  async onChangeValorFacturas(descripcion: string, data: any) {
    const { co_tipoFacturas } = data.data;
  }


  async onPlantaChange(idPlanta: string) {
  }

  getDayColor(day: string): string {
    switch (day) {
      case 'Lunes':
        return 'lightblue';
      case 'Martes':
        return 'aquamarine'; //'lightgreen';
      case 'Miércoles':
        return 'lightyellow';
      case 'Jueves':
        return 'lightcyan';
      case 'Viernes':
        return 'lavender'; //'lightpink';
      case 'Sábado':
        return 'antiquewhite'; //'lightsteelblue';
      case 'Domingo':
        return 'lightskyblue';
      default:
        return 'white';
    }
  }

  
  onRowPrepared(e) {
    if (e.data && e.data.Dia && e.data.Dia !== '') {
      e.rowElement.style.backgroundColor = this.getDayColor(e.data.Dia.split(' ')[0]);
    }
  }

}






