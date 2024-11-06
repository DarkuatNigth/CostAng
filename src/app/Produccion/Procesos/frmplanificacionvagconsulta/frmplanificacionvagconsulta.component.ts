import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';


declare var $: any;
declare var window;

@Component({
  selector: 'app-frmplanificacionvagconsulta',
  templateUrl: './frmplanificacionvagconsulta.component.html',
  styleUrl: './frmplanificacionvagconsulta.component.scss'
})
export class FrmplanificacionvagconsultaComponent implements OnInit {
  title = 'Consulta de Planificación';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  idPlanificacion: number = 1234;
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  fechaDesdeFormat: string = '';
  fechaHastaFormat: string = '';
  
  
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

  @ViewChild('GridPlanificacion', { static: false }) GridPlanificacion: DxDataGridComponent;


  async ngOnInit() {
    this.fechaDesdeFormat = this.formatDate(this.fechaDesde, 1);
    this.fechaHastaFormat = this.formatDate(this.fechaHasta, 1);
    // ordenar la lista por fecha ascendente, turno ascendente. Asignar el día de la semana en formato Jueves 01
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


  getDayColor(day: string): string {
    console.log(day);
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

  
  onChangeGridCheckReqMp(value: any, data: any) {
    const index = this.listaPlanificacion.findIndex(
      (x) => x.codPlanifica == data.data.codPlanifica
    );
    if (index != -1) {
      this.listaPlanificacion[index].checkReqMp = value;
    }
  }
  
  onChangeGridCheckReqDes(value: any, data: any) {
    const index = this.listaPlanificacion.findIndex(
      (x) => x.codPlanifica == data.data.codPlanifica
    );
    if (index != -1) {
      this.listaPlanificacion[index].checkReqDes = value;
    }
  }

}
