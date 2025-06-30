import { AfterViewInit, Component, EventEmitter, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { FrmplanificacionhorarioService, IUpdatePlanificacionEmbarque } from './frmplanificacionhorario.service';
import * as moment from 'moment';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { ClickEvent } from 'devextreme/ui/button';
import { PedidosPaisDetail } from '../frmplanificacionembarque.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { varUser } from 'src/app/config/url.servicios';
import { FrmplanificacionembarqueService } from '../frmplanificacionembarque.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { state } from '@angular/animations';
import { saveAs } from 'file-saver';


declare var window;
declare var $: any;


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
  dayMap: Map<string, any> = new Map(); // Crea un mapa para acceder rápidamente a los días
  itemsMenuContext: any[] = [];

  currentDate: moment.Moment = moment(); // Fecha actual
  selectedDate: moment.Moment = moment(); // Fecha seleccionada
  selectedMonth: string = ''; 
  desde: string = '';
  hasta: string = '';
  txtSearch:string = "";

  listFilterState: any[] = [
    { text: 'Completo', icon: 'square', state: 'PC' },
    { text: 'Planificado', icon: 'square', state: 'PL' },
    { text: 'Valor Agregado', icon: 'square', state: 'VAG' },
    { text: 'BreakDown', icon: 'square', state: 'BD' },
    { text: 'Todos', icon: 'square', state: '' },
    // { text: 'Exportar Excel', icon: 'exportxlsx', state: 'EXCEL' },
  ];


  isPrevMonthEnabled: boolean = true;
  isNextMonthEnabled: boolean = true;
  
  numCoincidenciasSearch = 0;
  numIndiceSearch = 0;
  dataSearch: any[] = [];
  disabledNextSearch = true; 
  disabledPrevSearch = true;

  plantasEmbarque: any[] = [];
  planificacionEmbViewDetail: any = {
    cab: null, 
    det: [],
  };
  planificacionEmbSelected: any = null;
  minFechaPlanificacion: Date = new Date(); 
  maxFechaPlanificacion: Date = moment().add(3, 'month').endOf('month').toDate();
  mensajePlanificacionNoCumplidas: boolean = false; //true;

  modalReferenceItem: any;
  draggedItem: any = null; // Elemento que se está arrastrando

  @ViewChild('contextMenu') contextMenu;
  @ViewChild('content') content;
  @ViewChild('modalReplanificarEmbarque') modalReplanificarEmbarque: any;
  @ViewChild('modalPlanificacionEmbarque') modalPlanificacionEmbarque: any;
  @ViewChild('GridPlanificacionEmbarqueDetail', { static: false }) GridPlanificacionEmbarqueDetail: DxDataGridComponent;

  // para emitir el evento de actualización de la planificación al componente padre
  @Output() planificacionActualizada: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    private _service: FrmplanificacionhorarioService,
    private _planificacionembarqueService: FrmplanificacionembarqueService,
    private modalService: NgbModal,
    // private renderer: Renderer2,
  ) { 
  }



  ngOnInit(): void {
    this.loadingVisible2 = true;
    this.itemsMenuContext = this._service.getItemsMenuContext();
    this.updateSelectedMonth();
    this._planificacionembarqueService.getCatalogosPlanificacionEmbarque().subscribe((data) => {
      if (data.Codigo && data.Dt.Table.length > 0) {
        this.plantasEmbarque = data.Dt.Table.map((item: any) => {
          return {
            codigo: item.codigo,
            descripcion: item.descripcion,
          };
        });
      }
    });
    this.loadingVisible2 = false;

    // como recargar los estilos css

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
  

  async onRightClick(event: MouseEvent, item) { 
    if (item == undefined) { // this.openModalDiv !== "" || !this.habilitaOpcionUser || 
      this.planificacionEmbSelected = null;
      this.contextMenu.visible = false;
      event.stopPropagation();
      return false;
    }
    this.Marcar(event);
    this.itemsMenuContext.forEach((item) => {
      item.disabled = false;
      if (item.action === 'confirmVA' || item.action === 'breakDown') {
        item.disabled = true;
      }
    });
    // si la fecha de embarque es menor a la fecha actual desactivar la opción de quitar de planificación
    if (moment(item.Fecha).isBefore(moment(), 'day')) {
      this.itemsMenuContext[0].disabled = true; 
    }
    // si la fecha de embarque es menor a la fecha actual - 1 día desactivar la opción de replanificar
    if (moment(item.Fecha).isBefore(moment().subtract(1, 'day'), 'day')) {
      this.itemsMenuContext[1].disabled = true; 
    }
    // si origen es VAG y confirmacionVA es false activar la opción de confirmación de valor agregado
    if (item.origen === 'VAG' && !item.confirmacionVA) {
      this.itemsMenuContext[3].disabled = false; 
    }
    if (item.EstadoVisualizacion === 'PC' || item.EstadoVisualizacion === 'PL') {
      this.itemsMenuContext[4].disabled = false; // Activar la opción de BreakDown
    }

    this.planificacionEmbSelected = item;
    this.contextMenu.visible = true;
    event.preventDefault(); 
    return true;
  } 


  async itemMenuClick(e) {
    const selectedAction = e.itemData.action; // e.itemData.text
    switch (selectedAction) {
      case 'edit':
        this.modalReferenceItem = await this.modalService.open(this.modalReplanificarEmbarque, {
          ariaLabelledBy: 'modal-basic-title',
          windowClass: 'cssModalReplanificarEmbarque',
        });
        break;
      case 'delete':
        let resp = await this.showAlertConfirm('Eliminar', '¿Está seguro de eliminar la planificación de embarque?', 'warning');
        if (resp) {
          let dataUpdate: IUpdatePlanificacionEmbarque = {
            numeroEmbarque: this.planificacionEmbSelected.numeroEmbarque,
            tipoUpdate: 'anular',
            userAud: localStorage.getItem(varUser),
          };
          this.updatePlanificacionEmbarque(dataUpdate);
        }
        break;
      case 'details':
        this.getDetallePlanificacionEmbarque(this.planificacionEmbSelected.numeroEmbarque);
        break;
      case 'confirmVA':
        let resp2 = await this.showAlertConfirm('Confirmar Planificación', '¿Está seguro de confirmar la planificación que se generó automaticamente en VAG?', 'info');
        if (resp2) {
          let dataUpdate: IUpdatePlanificacionEmbarque = {
            numeroEmbarque: this.planificacionEmbSelected.numeroEmbarque,
            tipoUpdate: 'confirmVA',
            userAud: localStorage.getItem(varUser),
          };
          this.updatePlanificacionEmbarque(dataUpdate);
        }
        break;
      case 'breakDown':
        let resp3 = await this.showAlertConfirm('BreakDown', `¿Está seguro de generar breakDown de la referencia: ${this.planificacionEmbSelected.Referencia} ?`, 'warning');
        if (resp3) {
          this.onClickGuardarBreakDown();
        }
        break;
      default:
        break;
    }
  }


  // Evento que se dispara al iniciar el arrastre
  onDragStart(event: DragEvent, item: any): void {
    this.draggedItem = item; // Guarda el elemento que se está arrastrando
    // event.dataTransfer?.setData('text/plain', JSON.stringify(item)); // Opcional: guarda datos en el evento
  }

  
  // Evento que permite que el elemento sea soltado
  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Necesario para permitir el drop
  }
  
  
  // Evento que se dispara al soltar el elemento
  onDrop(event: DragEvent): void {
    event.preventDefault();
    const target = event.target as HTMLElement;
    const targetDay = target.getAttribute('data-day');
    if (this.draggedItem && targetDay) {
      const day = this.dayMap.get(targetDay);
      // console.log('onDrop', this.draggedItem, targetDay, day);
      if (moment(day.day).isBefore(moment(), 'day') || (day.day == this.draggedItem.Fecha || day.disabled)) {
        console.log('El elemento no se puede mover a esta fecha');
        return;
      }
      // this.moveItemToDay(this.draggedItem, day);
      let dataUpdate: IUpdatePlanificacionEmbarque = {
        numeroEmbarque: this.draggedItem.numeroEmbarque,
        fechaEmbarque: day.day,
        tipoUpdate: 'replanificar',
        userAud: localStorage.getItem(varUser),
      };
      this.updatePlanificacionEmbarque(dataUpdate, this.draggedItem.Referencia);
      this.draggedItem = null; // Limpia el elemento arrastrado
    } 
  }


  // // Lógica para mover el elemento al nuevo día
  // moveItemToDay(item: any, targetDay: any): void {
  //   // Elimina el elemento del día original
  //   this.dataByWeek.forEach((week) => {
  //     week.forEach((day) => {
  //       if (day.dataPedidos && day.day === item.Fecha) {
  //         day.dataPedidos = day.dataPedidos.filter((pedido: any) => pedido.ped_numero !== item.ped_numero);
  //         return;
  //       }
  //     });
  //   });
  //   // Agrega el elemento al nuevo día
  //   targetDay.dataPedidos = targetDay.dataPedidos || [];
  //   targetDay.dataPedidos.push(item);
  //   console.log('Item moved:', item, 'to day:', targetDay);
  // }

  
  // Reducir el Re-renderizado. Si Angular está re-renderizando toda la tabla después de cada cambio, esto puede causar demoras. Usa el atributo trackBy en *ngFor para optimizar el re-renderizado.
  trackByDay(index: number, day: any): string {
    return day.day; // Usa un identificador único para cada día
  }

  onPrevMonth(): void {
    this.isPrevMonthEnabled = true;
    this.isNextMonthEnabled = true;    
    const yearsAgo = moment().subtract(1, 'years').startOf('month');
    if (this.selectedDate.isAfter(yearsAgo)) {
      this.selectedDate.subtract(1, 'month');
      this.updateSelectedMonth();
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
      this.updateSelectedMonth();
    } 
    if (!this.selectedDate.isBefore(monthMax)) {
      this.isNextMonthEnabled = false;
    }
  }

  
  onChangeSearchFilter(e, value): void{
    this.txtSearch = value;
    if(value.length < 3){
      this.limpiarSearch();
      return;
    }

    // si presiona enter y hay coincidencias ir al proximo elemento
    if(e.keyCode === 13 && this.numCoincidenciasSearch > 0){
      this.onClickNextSearch();
      return;
    }

    this.dataSearch = this.dataPedidos.filter((item) => {
      return item.Referencia.toLowerCase().includes(value.toLowerCase()) || 
             item.Cliente.toLowerCase().includes(value.toLowerCase()) || 
             item.observacion?.toLowerCase().includes(value.toLowerCase()) || 
             item.puertoDescripcion.toLowerCase().includes(value.toLowerCase()) ||
             item.referenciasMix?.toLowerCase().includes(value.toLowerCase());
    }).map((item) => { return { Referencia: item.Referencia } });
    // ordenar por fecha de embarque
    this.dataSearch.sort((a, b) => {
      const fechaA = this.dataPedidos.find(item => item.Referencia === a.Referencia)?.fechaEmbarque;
      const fechaB = this.dataPedidos.find(item => item.Referencia === b.Referencia)?.fechaEmbarque;
      return moment(fechaA).diff(moment(fechaB));
    });

    if(this.dataSearch.length > 0){
      this.numCoincidenciasSearch = this.dataSearch.length;
      this.numIndiceSearch = 0;
      this.disabledNextSearch = false;
      if (this.dataSearch.length == 1) {
        this.numIndiceSearch = 1;
        this.scrollToElement(this.dataSearch[this.numIndiceSearch - 1].Referencia);
        this.disabledNextSearch = true;
        this.disabledPrevSearch = true;
      }
    } else {
      this.limpiarSearch();
    }

  }

  
  onClickNextSearch(): void{
    this.numIndiceSearch++;
    if(this.numIndiceSearch > this.numCoincidenciasSearch){
      this.numIndiceSearch = 1;
    }
    this.scrollToElement(this.dataSearch[this.numIndiceSearch - 1].Referencia);
    this.disabledNextSearch = this.numIndiceSearch === this.numCoincidenciasSearch;
    this.disabledPrevSearch = this.numIndiceSearch === 1;
  }


  onClickPrevSearch(): void{
    this.numIndiceSearch--;
    if(this.numIndiceSearch < 1){
      this.numIndiceSearch = this.numCoincidenciasSearch;
    }
    this.scrollToElement(this.dataSearch[this.numIndiceSearch - 1].Referencia);
    this.disabledNextSearch = this.numIndiceSearch === this.numCoincidenciasSearch;
    this.disabledPrevSearch = this.numIndiceSearch === 1;
  }


  async onItemClickFiltrar(e){
    let estado = e.itemData.state;
    let pedidosBck = this.dataPedidos.slice(); // Copia de seguridad de los pedidos originales
    switch (estado) {
      case 'PC':
        e.itemData.icon = 'check';
        pedidosBck = pedidosBck.filter((item) => item.EstadoVisualizacion === estado);
        break;
      case 'PL':
        e.itemData.icon = 'check';
        pedidosBck = pedidosBck.filter((item) => item.EstadoVisualizacion === estado);
        break;
      case 'VAG':
        e.itemData.icon = 'check';
        pedidosBck = pedidosBck.filter((item) => item.EstadoVisualizacion === estado);
        break;
      case 'BD':
        e.itemData.icon = 'check';
        pedidosBck = pedidosBck.filter((item) => item.EstadoVisualizacion === estado);
        break;
      default:
        // e.itemData.icon = 'check';
        break;
    }
    if (estado === 'EXCEL') {
      // this.exportExcel();
      return;
    } else {
      this.armarCalendario(pedidosBck, this.desde, this.hasta, this.selectedDate.format("MM"));
      this.listFilterState.forEach((item) => {
        if (item.state !== estado && item.icon !== 'exportxlsx') {
          item.icon = 'square';
        }
      });
    }

  }
  

  /* exportExcel() {
    this._service.callApiReportePlanificacionEmbarque(moment(this.desde).format("yyyy/MM/DD"), moment(this.hasta).format("yyyy/MM/DD")).subscribe(async (rr) => {
      let resp = JSON.parse(JSON.parse(JSON.stringify(rr)));
      if (resp.Codigo) {
          var byteCharacters = atob(resp.doc);
          var byteNumbers = new Array(byteCharacters.length);
          for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          var byteArray = new Uint8Array(byteNumbers);
          saveAs(new Blob([byteArray], { type: 'application/octet-stream' }), 'PlanificacionEmb.xlsx');
          this.loadingVisible2 = false;
      } else {
        await this.showAlert('', resp.Description, 'error');
      }
    });
  } */


  onClickGuardarReplanificacionEmbarque() {
    if (!this.planificacionEmbSelected) {
      this.showAlert('', 'No se ha seleccionado ninguna planificación', 'warning');
      return;
    }
    let dataUpdate: IUpdatePlanificacionEmbarque = {
      numeroEmbarque: this.planificacionEmbSelected.numeroEmbarque,
      fechaEmbarque: this.planificacionEmbSelected.fechaEmbarque,
      tipoUpdate: 'replanificar',
      userAud: localStorage.getItem(varUser),
    };
    
    this.updatePlanificacionEmbarque(dataUpdate, this.planificacionEmbSelected.Referencia );
  }
  

  updatePlanificacionEmbarque(dataUpdate: IUpdatePlanificacionEmbarque, referencia = null) {
    this.loadingVisible2 = true;
    this._service.updatePlanificacionEmbarque(dataUpdate).subscribe({
      next: (resp) => {
        if (resp.Codigo) {
          this.showAlert('', 
            dataUpdate.tipoUpdate == 'replanificar' ? 'Se replanificó correctamente' : 
            dataUpdate.tipoUpdate == 'anular' ? 'Se eliminó correctamente' :
            'Se actualizó correctamente', 
            'success'
          );
          this.updateSelectedMonth();
          if (dataUpdate.tipoUpdate == 'anular') {
            // Emitir el evento al componente padre
            this.planificacionActualizada.emit();
          }
          if (referencia) {
            setTimeout(() => { this.scrollToElement(referencia); }, 1000);
          }
          if (this.modalReferenceItem) {
            this.modalReferenceItem.close();
          }          
        } else {
          throw new Error(resp.Description);
        }
      },
      error: (error) => {
        this.showAlert('', 'Error al guardar la replanificación: ' + error, 'error');
      },
      complete: () => {
        this.loadingVisible2 = false;
      }
    });
  }

  // TODO: Implementar lógica para generar BreakDown
  async onClickGuardarBreakDown(){
    if (!this.planificacionEmbSelected) {
      await this.showAlert('', 'No se ha seleccionado ningún pedido para generar BreakDown', 'warning');
      return;
    }
    let fechaActual: Date = new Date();
    let fechaEmbarque: Date = new Date(this.planificacionEmbSelected.fechaEmbarque);
    if ((new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate())).getTime() 
        > (new Date(fechaEmbarque.getFullYear(), fechaEmbarque.getMonth(), fechaEmbarque.getDate())).getTime()
      ) {
      await this.showAlert('', 'La fecha de embarque es menor a la fecha actual. Por favor verifique.', 'error');
      return;
    }


    // if(!this.planificacionEmbSelected.pto_descripcion){
    //   await this.showAlert('', 'El pedido no tiene puerto asignado. Por favor verifique.', 'error');
    //   return;
    // }
    // if(!this.planificacionEmbSelected.naviera){
    //   await this.showAlert('', 'El pedido no tiene naviera asignada. Por favor verifique.', 'error');
    //   return;
    // }
    // if (!this.planificacionEmbSelected.nave){
    //   await this.showAlert('', 'El pedido no tiene nave asignada. Por favor verifique.', 'error');
    //   return;
    // }
    // if (this.planificacionEmbSelected.Estado === 'Parcial Embarcado'){
    //   await this.showAlert('', 'El pedido se encuentra parcialmente embarcado. Imposible continuar.', 'error');
    //   return;
    // }
    // if (this.planificacionEmbSelected.ModiBCE === '1' && (this.planificacionEmbSelected.SerieBCE === '' || this.planificacionEmbSelected.FacturaBCE === '')) {
    //   await this.showAlert('', 'El pedido no tiene un número de factura o serie BCE. Imposible continuar.', 'error');
    //   return;
    // }
    // if (this.planificacionEmbSelected.ModiBCE === '1' && !this.planificacionEmbSelected.SerieBCE.match(/^\d{3}-\d{3}$/)) {
    //   await this.showAlert('', 'El pedido no tiene un número de serie BCE válido. Imposible continuar.', 'error');
    //   return;
    // }
    // if (this.planificacionEmbSelected.ModiBCE === '1' && !this.planificacionEmbSelected.FacturaBCE.match(/^\d{9}$/)) {
    //   await this.showAlert('', 'El pedido no tiene un número de factura BCE válido. Imposible continuar.', 'error');
    //   return;
    // }

    this.loadingVisible2 = true;

    await this._service.getPlanificacionById(this.planificacionEmbSelected.numeroEmbarque).subscribe({
      next: (resp) => {
        if (resp.Codigo) {
          let cab: any = resp.Dt.Table || [];
          let det: any = resp.Dt.Table1 || [];
          if (cab && cab.length > 0) {
            this.planificacionEmbViewDetail.cab = cab[0];
            this.planificacionEmbViewDetail.det = det;

            console.log('planificacionEmbViewDetail', this.planificacionEmbViewDetail);

            let dataSync = {
              pedido: this.planificacionEmbSelected.pedNumero,
              observBreakDown: this.planificacionEmbSelected.observacion,
              plantaEmb: this.planificacionEmbSelected.plantaEmbarque,
              dataJson: this.planificacionEmbViewDetail.det.map((item: any) => {
                return {
                  dpe_pedido: item.dpe_pedido,
                  dpe_sectab: item.dpe_sectab,
                  dpe_codprod: item.pdet_codprod,
                  dpe_talla: item.pdet_codtalla,
                  dpe_masters: item.pdet_mpedido,
                };
              })
            }
            this._planificacionembarqueService.postSincronizarPlanificacionBreakDown(dataSync, localStorage.getItem(varUser)).subscribe(data => {
              if (data.Codigo) {
                this.showAlert('', 'Generacion de BreakDown exitosa.', 'success');
                // Emitir el evento al componente padre
                this.planificacionActualizada.emit();
                this.updateSelectedMonth();
              } else {
                throw new Error(`Existió un error al generar el BreakDown de la referencia ${this.planificacionEmbSelected.Referencia} \n` + data.Description);
              }
            });
            
          }
        } else {
          throw new Error(resp.Description);
        }
      },
      error: (error) => {
        this.showAlert('', 'Error al obtener los datos: ' + error, 'error');
      },
      complete: () => {
        this.loadingVisible2 = false;
      }
    });

    //TODO envio correo breakdown
    // if(this.permiteSendBreakDown){
    //   let msgErrorMail = await this.SendBreakDown();
    //   errores = errores + (msgErrorMail !== "" ? "Error al enviar mail BreakDown <br>" + msgErrorMail : "");
    // }
    
  }


  getDetallePlanificacionEmbarque(numeroEmbarque) {

    this._service.getPlanificacionById(numeroEmbarque).subscribe({
      next: (resp) => {
        if (resp.Codigo) {
          let cab: any = resp.Dt.Table || [];
          let det: any = resp.Dt.Table1 || [];
          if (cab && cab.length > 0) {
            this.planificacionEmbViewDetail.cab = cab[0];
            this.planificacionEmbViewDetail.det = det;
            this.modalReferenceItem = this.modalService.open(this.modalPlanificacionEmbarque, {
              ariaLabelledBy: 'modal-basic-title',
              windowClass: 'cssModalPlanificacionEmbarque',
            });
            // this.modalReferenceItem.componentInstance.data = this.planificacionEmbViewDetail;
          }
        } else {
          throw new Error(resp.Description);
        }
      },
      error: (error) => {
        this.showAlert('', 'Error al obtener los datos: ' + error, 'error');
      }, 
      complete: () => {
        this.loadingVisible2 = false;
      }
    });

    
  }


  onInitializedPlanificacionEmbarqueDetail(grid: any) {
    this.GridPlanificacionEmbarqueDetail = grid;
  }


  async limpiarSearch(){
    this.numCoincidenciasSearch = 0;
    this.numIndiceSearch = 0;
    this.dataSearch = [];
    this.disabledNextSearch = true; 
    this.disabledPrevSearch = true;
  }


  async scrollToElement(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.click();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }


  async updateSelectedMonth() {
    this.selectedMonth = this.selectedDate.format('MMMM YYYY'); // Ejemplo: "Abril 2025"
    this.desde = this.selectedDate.clone().startOf('month').format("yyyy/MM/DD");
    this.hasta = this.selectedDate.clone().endOf('month').format("yyyy/MM/DD");
    this.getDataxMes();
  }


  async getDataxMes() {
    this.loadingVisible2 = true;
    this.dataPedidos = [];
    this.dataByWeek = [];
    this.limpiarSearch();
    return new Promise(async (resolve) => {
      let data = {
        fecIni: this.desde,
        fecFin: this.hasta
      }
      this._service.getDataByMes(data).subscribe({
        next: (resp) => {
          if (resp.Codigo) {
            if (Object.keys(resp.Dt).length > 0) {
              this.dataPedidos = resp.Dt.Table || [];
              // si hay seleccionado un filtro de estado, aplicar el filtro
              let estadoSeleccionado = this.listFilterState.find(item => item.icon === 'check');
              if (estadoSeleccionado) {
                this.onItemClickFiltrar({ itemData: estadoSeleccionado });
              } else {
                this.armarCalendario(this.dataPedidos, this.desde, this.hasta, this.selectedDate.format("MM"));
              }
              let planificacionesNoCumplidas = resp.Dt.Table1 || [];
              if (planificacionesNoCumplidas.length > 0 && this.mensajePlanificacionNoCumplidas) {
                this.mensajePlanificacionNoCumplidas = false;
                this.showAlert('Planificaciones No Cumplidas', 'Existen planificaciones que no se han cumplido, por favor verificar', 'warning');
              }
            }
            return resolve(true);
          } else {
            throw new Error(resp.Description);
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
    this.dataByWeek.forEach((week) => {
      week.forEach((day) => {
        this.dayMap.set(day.day, day);
      });
    });
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
  Marcar(v) {
    if (this.controlAnterior === undefined) {
      this.controlAnterior = v.currentTarget;
    } else {
      this.controlAnterior.style.borderColor = "";
      this.controlAnterior.style.borderWidth = "";
      // this.controlAnterior.id = "";
      this.controlAnterior = v.currentTarget;
    }
    v.currentTarget.style.borderColor = "black";
    v.currentTarget.style.borderWidth = "2px";
    // v.currentTarget.id = "idDetalle";
  }


  getClassEstado(data) {
    var clase = "";
    switch (data.EstadoVisualizacion) {
      case "PC":
        clase = "pedido PedCompleto";
        break;
      case "PL":
        clase = "pedido Planificado";
        break;
      case "VAG":
        clase = "pedido PedPendiente";
        break;
      case "BD":
        clase = "pedido PedBreakdown";
        break;
    }
    return clase;
  }


  setearHeightDiv(){
    let hgDiv = window.innerHeight - 50 + "px";
    return hgDiv;
  }


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


  async showAlertConfirm(title, mensaje, tipo) {
    this.loadingVisible2 = false;

    return new Promise(async (resolve) => {
      const confirm = await
        Swal.fire({
          title: title,
          //text: mensaje,
          html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
          icon: tipo,
          showCancelButton: true,
          confirmButtonColor: '#2196F3',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            return resolve(true);
          } else {
            return resolve(false);
          }
        });
    });
  }




}
