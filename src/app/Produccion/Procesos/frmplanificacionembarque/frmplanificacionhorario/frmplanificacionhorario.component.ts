import { AfterViewInit, Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FrmplanificacionhorarioService } from './frmplanificacionhorario.service';
import * as moment from 'moment';
import Swal from 'sweetalert2/src/sweetalert2.js';


declare var window;
declare var $: any;


declare interface dataDayPlanificacion {
  data: string;
  ISF: string;
  FLETEFIN: string;
  Estado: string;
  Factura: string;
  numero: string;
  Fecha: string;
  emb_Documentacion: string;
  emb_DocCaducado: string;
}


@Component({
  selector: 'app-frmplanificacionhorario',
  templateUrl: './frmplanificacionhorario.component.html',
  styleUrl: './frmplanificacionhorario.component.scss'
})
export class FrmplanificacionhorarioComponent implements OnInit, AfterViewInit {
  loadingVisible2: boolean = false;

  dtpFecIni:Date = new Date(moment().format("yyyy") + "/" + moment().format("MM") + "/01");
  dtpFecFin:Date = new Date(moment().endOf('month').format("yyyy/MM/DD"));
  
  dataPedidos: any[] = [];
  dataByWeek: any[] = [];
  itemsMenuContext: any[] = [];

  currentDate: moment.Moment = moment(); // Fecha actual
  selectedDate: moment.Moment = moment(); // Fecha seleccionada
  selectedMonthYear: string = ''; 

  isPrevMonthEnabled: boolean = true;
  isNextMonthEnabled: boolean = true;


  @ViewChild('contextMenu') contextMenu;
  @ViewChild('content') content;


  constructor(
    private _service: FrmplanificacionhorarioService,
    // private renderer: Renderer2,
  ) { 
  }


  ngOnInit(): void {
    this.loadingVisible2 = true;
    this.itemsMenuContext = this._service.getItemsMenuContext();
    this.updateSelectedMonthYear();
    this.loadingVisible2 = false;
  }

  // fijar los encabezados de los días de la semana mientras se desplaza
  ngAfterViewInit() {
    const container = this.content.nativeElement;
    const rows = container.querySelectorAll('.dayOfWeek');
    container.addEventListener('scroll', () => {
      let lastStickyRow: HTMLElement | null = null;
      rows.forEach((row: HTMLElement) => {
        const rect = row.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top <= containerRect.top && rect.bottom > containerRect.top) {
          // Si el `row` está en la parte superior del contenedor
          row.style.position = 'sticky';
          row.style.top = '25px'; // Ajusta la posición superior según sea necesario
          row.style.zIndex = '1';
          lastStickyRow = row;
        } else {
          // Si el `row` no está en la parte superior
          row.style.position = '';
          row.style.top = '';
          row.style.zIndex = '';
        }
      });
      // Asegúrate de que solo el último sticky row tenga prioridad
      if (lastStickyRow) {
        lastStickyRow.style.zIndex = '2';
      }
    });
  }


  onPrevMonth(): void {
    this.isPrevMonthEnabled = true;
    this.isNextMonthEnabled = true;    
    const yearsAgo = moment().subtract(1, 'years').startOf('month');
    if (this.selectedDate.isAfter(yearsAgo)) {
      this.selectedDate.subtract(1, 'month');
      this.updateSelectedMonthYear();
    } 
    if (!this.selectedDate.isAfter(yearsAgo)) {
      this.isPrevMonthEnabled = false;
    }
  }


  onNextMonth(): void {
    this.isPrevMonthEnabled = true;
    this.isNextMonthEnabled = true;
    const monthMax = moment().add(3, 'month').startOf('month');
    if (this.selectedDate.isBefore(monthMax)) {
      this.selectedDate.add(1, 'month');
      this.updateSelectedMonthYear();
    } 
    if (!this.selectedDate.isBefore(monthMax)) {
      this.isNextMonthEnabled = false;
    }
  }

  
  async itemMenuClick(e) {
    if(e.itemData.text === "Quitar de Planificación"){
    }
  }

  
  updateSelectedMonthYear(): void {
    this.selectedMonthYear = this.selectedDate.format('MMMM YYYY'); // Ejemplo: "Abril 2025"
    var desde = this.selectedDate.clone().startOf('month').format("yyyy/MM/DD");
    var hasta = this.selectedDate.clone().endOf('month').format("yyyy/MM/DD");
    this.getDataxMes(desde, hasta, this.selectedDate.format("MM"));
  }


  async getDataxMes(Desde, Hasta, mes) {
    this.loadingVisible2 = true;
    return new Promise(async (resolve) => {
      let data = {
        fecIni: Desde,
        fecFin: Hasta,
        estado: "('F','A','P','C','E')",
        cliente: "T",
        pedidos: "S",
        pais: "T",
        continente: "T"
      }

      this._service.getDataByMes(data).subscribe({
        next: (resp) => {
          if (resp.Codigo) {
            if (Object.keys(resp.Dt).length > 0) {
              this.dataPedidos = resp.Dt.Table || [];
              this.armarCalendario(this.dataPedidos, Desde, Hasta, mes);
            }
            return resolve(true);
          } else {
            this.showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        },
        error: (error) => {
          this.showAlert('', 'Error al obtener los datos: ' + error, 'error');
          return resolve(false);
        }, 
        complete: () => {
          this.loadingVisible2 = false;
        }
      });

    });
  }

  
  async armarCalendario(dt, desde, hasta, mes) {
    if (moment(desde).format("dddd") !== "Monday" && moment(desde).format("dddd") !== "Lunes") {
      if (moment(desde).weekday() === 0) {
        desde = moment(desde).add((-6), 'days').format("yyyy/MM/DD");
      } else {
        desde = moment(desde).add((1 - moment(desde).weekday()), 'days').format("yyyy/MM/DD");
      }
    }
    if (moment(hasta).format("dddd") !== "Sunday" && moment(hasta).format("dddd") !== "Domingo") {
      hasta = moment(hasta).add((7 - moment(hasta).weekday()), 'days').format("yyyy/MM/DD");
    }
    let days = moment(desde).diff(moment(hasta), 'days');
    let nDaysOfMonth = Math.abs(days) + 1;
    let dataByDaysOfMonth = Array.from({ length: nDaysOfMonth }, (_, i) => {
      let day = moment(desde).add(i, 'days').format("yyyy/MM/DD");
      return {
        day: day,
        dataPedidos: dt.filter((item) => item.Fecha === day),
        disabled: moment(day).format("MM") !== mes,
      }
    });
    this.dataByWeek = [];
    for (let i = 0; i < nDaysOfMonth; i += 7) {
      let week = dataByDaysOfMonth.slice(i, i + 7);
      let maxRows = this.getDayWithMaxRows(week);
      week = week.map((day) => { return { ...day, maxRows: maxRows } });
      this.dataByWeek.push(week);
    }
    console.log('this.dataByWeek', this.dataByWeek);
  }


  getDayWithMaxRows(week){
    let max = 1;
    for (let i = 0; i < week.length; i++) {
      if (week[i].dataPedidos.length > max) {
        max = week[i].dataPedidos.length;
      }
    }
    return max;
  }

  

  MarcarCursor(e){
    let currentParent = e.target.parentElement;
    let ar_td: any[];
    let Position;
    let ar_tdPosition
    if (e.keyCode === 37)//left
    {
      // ar_td = currentParent.getElementsByTagName("td");
      ar_td = Array.from(currentParent.children).filter((child: HTMLElement) => child.tagName == "TD");
      for (let i = 0; i < ar_td.length; i++) {
        if (ar_td[i] == e.target){
          if(i-1 < 0){
            break;
          }
          ar_td[i-1].click();
          ar_td[i-1].focus();
          currentParent.parentElement.scrollTop = ar_td[i].offsetTop + 160;
          break;
        }
      }
    }

    if (e.keyCode === 39)//right
    {
      // ar_td = currentParent.getElementsByTagName("td");
      ar_td = Array.from(currentParent.children).filter((child: HTMLElement) => child.tagName == "TD");
      for (let i = 0; i < ar_td.length; i++) {
        if (ar_td[i] == e.target){
          if(i+1 >= ar_td.length){
            break;
          }
          ar_td[i+1].click();
          ar_td[i+1].focus();
          currentParent.parentElement.scrollTop = ar_td[i+1].offsetTop + 160;
          break;
        }
      }
    }

    if (e.keyCode === 38)//up
    {
      Position = null;
      //ar_tdPosition = currentParent.getElementsByTagName("td");
      ar_tdPosition = Array.from(currentParent.children).filter((child: HTMLElement) => child.tagName == "TD");
      for (let i = 0; i < ar_tdPosition.length; i++) {
        if (ar_tdPosition[i] == e.target){
          Position = i;
          break;
        }
      }
      if(Position !== null && currentParent.previousElementSibling !== null){
        //ar_td = currentParent.previousElementSibling.getElementsByTagName("td");
        ar_td = Array.from(currentParent.previousElementSibling.children).filter((child: HTMLElement) => child.tagName == "TD");
        if(ar_td[Position]){
          ar_td[Position].click();
          ar_td[Position].focus();
          currentParent.parentElement.scrollTop = ar_td[Position].offsetTop + 160;
        }
      }
    }

    if (e.keyCode === 40)//down
    {
      Position = null;
      // ar_tdPosition = currentParent.getElementsByTagName("td");
      ar_tdPosition = Array.from(currentParent.children).filter((child: HTMLElement) => child.tagName == "TD");
      for (let i = 0; i < ar_tdPosition.length; i++) {
        if (ar_tdPosition[i] == e.target){
          Position = i;
          break;
        }
      }
      if(Position !== null && currentParent.nextElementSibling !== null){
        //ar_td = currentParent.nextElementSibling.getElementsByTagName("td");
        ar_td = Array.from(currentParent.nextElementSibling.children).filter((child: HTMLElement) => child.tagName == "TD");
        if(ar_td[Position]){
          ar_td[Position].click();
          ar_td[Position].focus();
          currentParent.parentElement.scrollTop = ar_td[Position].offsetTop + 160;
        }
      }
    }
  }


  controlAnterior;
  Marcar(v, idDetalle) {
    if (this.controlAnterior === undefined) {
      this.controlAnterior = v.currentTarget;
    } else {
      this.controlAnterior.style.borderColor = "";
      this.controlAnterior.style.borderWidth = "";
      this.controlAnterior.id = "";
      this.controlAnterior = v.currentTarget;
    }
    v.currentTarget.style.borderColor = "black";
    v.currentTarget.style.borderWidth = "1.5px";
    v.currentTarget.id = idDetalle; // "idDetalle";
  }


  getClassEstado(estado, documentacion, DocCaducado) {
    var clase = "";
    switch (estado) {
      case "(PED COMP)":
        clase = "PedCompleto";
        break;
      case "(PED)":
        clase = "PedPendiente";
        break;
      case "(FACT)":
        if ((documentacion === "N" || documentacion === "") && DocCaducado === "S") {
          clase = "FacturadoSD";
        } else {
          clase = "Facturado";
        }
        break;
      case "(PLNF)":
        clase = "Planificado";
        break;
      case "(EMB)":
        clase = "Embarcado";
        break;
    }
    return clase;
  }


  setearHeightDiv(){
    let hgDiv = window.innerHeight - 50 + "px";
    return hgDiv;
  }



  // async onRightClick(event: MouseEvent, item) { 

  //   if(this.openModalDiv !== ""){
      
  //     this.contextMenu.visible = false;
  //     event.stopPropagation(); 
      
  //     return false;
  //   }

  //   this.Marcar(event);
    
  //   this.lblRef = item.factura;
  //   this.lblnumero = item.numero;
  //   this.lblfecha = item.fecha;

  //   if(!this.habilitaOpcionUser){
      
  //     this.contextMenu.visible = false;
  //     event.stopPropagation(); 
      
  //     return false;
  //   }

  //   this.items[0].disabled = true; //Quitar de Planificación
  //   this.items[1].disabled = false; //Actualizar Fecha
  //   this.items[2].disabled = false; //Agregar Fecha Límite
  //   this.items[3].disabled = false; //Agregar Fecha Zarpe
  //   this.items[4].disabled = false; //Observación
  //   this.items[5].disabled = false; //Naviera/Nave
  //   this.items[6].disabled = false; //Pedido/Embarque
  //   this.items[7].disabled = false; //Masivo
  //   this.items[8].disabled = false; //Actualizar Fechas Zarpe por Nave
  //   this.items[9].disabled = false; //Actualizar Fechas Límite por Naviera/Nave
  //   this.items[10].disabled = false; //Aprobar Flete

  //   if(item.estado === "(EMB)"){
  //     this.items[0].disabled = true; //Quitar de Planificación
  //     this.items[1].disabled = true; //Actualizar Fecha
  //     this.items[2].disabled = false; //Agregar Fecha Límite
  //     this.items[3].disabled = false; //Agregar Fecha Zarpe
  //     this.items[4].disabled = false; //Observación
  //     this.items[5].disabled = false; //Naviera/Nave
  //     this.items[6].disabled = true; //Pedido/Embarque
  //     this.items[7].disabled = false; //Masivo
  //     this.items[8].disabled = false; //Actualizar Fechas Zarpe por Nave
  //     this.items[9].disabled = false; //Actualizar Fechas Límite por Naviera/Nave
  //     this.items[10].disabled = false; //Aprobar Flete
  //   }

  //   if(item.estado === "(FACT)"){
  //       this.items[0].disabled = true; //Quitar de Planificación
  //       this.items[1].disabled = true; //Actualizar Fecha
  //       this.items[2].disabled = true; //Agregar Fecha Límite
  //       this.items[3].disabled = true; //Agregar Fecha Zarpe
  //       this.items[4].disabled = false; //Observación
  //       this.items[5].disabled = true; //Naviera/Nave
  //       this.items[6].disabled = true; //Pedido/Embarque
  //       this.items[7].disabled = false; //Masivo
  //       this.items[8].disabled = true; //Actualizar Fechas Zarpe por Nave
  //       this.items[9].disabled = true; //Actualizar Fechas Límite por Naviera/Nave
  //       this.items[10].disabled = true; //Aprobar Flete
  //   }

  //   if(item.estado === "(PED COMP)" || item.estado === "(PED)"){
  //     this.items[0].disabled = false; //Quitar de Planificación
  //     this.items[10].disabled = true; //Aprobar Flete
  //   }
      
  //   this.contextMenu.visible = true;
  //   event.preventDefault(); 
  //   return true;
    
  // } 



  async showAlert(title, mensaje, tipo, event = null) {
    this.loadingVisible2 = false;
    return new Promise(async (resolve) => {
      await Swal.fire({
        title: title,
        html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
        icon: tipo,
        showCancelButton: false,
        confirmButtonColor: (tipo === 'error' ? '#d33' : tipo === 'warning' ? '#ff9800' :
          tipo === 'success' ? '#4CAF50' : tipo === 'info' ? '#2196F3' : ''),
        confirmButtonText: 'Aceptar'
      }).then((result) => {
          if(event !== null){
           eval(event);
          }
          return resolve(true);
      });
    });
  }





}
