import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { FrmplanificacionvagService } from '../frmplanificacionvag/frmplanificacionvag.service';
import { DxDataGridModule, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { NotificationService } from 'src/app/shared/notify.service';
import { formatDate } from '@angular/common';
import { UtilService } from 'src/app/shared/util.service';
import * as moment from 'moment';
import { varUser } from 'src/app/config/url.servicios';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { ActivatedRoute, Router } from '@angular/router';
import { parseNumber } from 'devextreme/localization';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FrmplanificacionembarqueService } from './frmplanificacionembarque.service';
import { FrmplanificacionhorarioComponent } from './frmplanificacionhorario/frmplanificacionhorario.component';

declare var $: any;
declare var window;


interface PedidosPorPais {
  id: number;
  pais: string;
  vendido: number;
  stock: number;
  bloqueado: number;
}
  
interface PedidosPaisDetail {
  id: number;
  paisCodigo: number;
  pais: string;
  destino: string;
  cliente: string;
  codCliente: number;
  pedido: string;
  // codProducto: string;
  // producto: string;
  // codTalla: number;
  // talla: string;
  fecPedido: Date;
  pedFechaEstimado: Date;
  mastersOriginal: number;
  mastersPedido: number;
  xEmbarcar: number;
  xFabricar: number;
  libras: number;
  saldoSonga: number;
  saldoSonga2: number;
  SaldoComin: number;
  SaldoOtros: number;
  StockEnProceso: number;
  bloqueado: number;
  porcentaje: number;
  checkPlanificar?: boolean;
  agrupacionCodigo: number;
  agrupacionDescri: string;
  fechaPlanificacion?: Date;
  plantaEmbarque?: string;
  observacion?: string;
}

interface DetalleStockBloqueado {
  lote: string;
  codpro: string;
  producto: string;
  codTalla: number;
  talla: string;
  master: number;
  proveedor: string;
  fecha: Date;
  fechaCuar: Date;
  fechaLib: Date;
  secuencial: number;
  observa: string;
  ccuMotivo: string;
  descripcion: string;
}


@Component({
  selector: 'app-frmplanificacionembarque',
  templateUrl: './frmplanificacionembarque.component.html',
  styleUrl: './frmplanificacionembarque.component.scss'
})
export class FrmplanificacionembarqueComponent implements OnInit {
  title = 'Planificación de Embarque';
  loadingVisible: boolean = false;

  pedidosPorPais: PedidosPorPais[] = [];
  pedidosPaisDetail: PedidosPaisDetail[] = [];
  pedidosPaisDetailByProduct: any[] = [];
  plantasEmbarque: any[] = [];

  pedidoSelectedForPlanificar: PedidosPaisDetail = null;
  minFechaPlanificacion: Date = new Date(); 
  maxFechaPlanificacion: Date = moment().add(3, 'month').endOf('month').toDate();

  totalMastersBloq: number = 0;  
  cabeceraStockBloqueado: {
    producto: '',
    talla: '',
  }
  detalleStockBloqueado: DetalleStockBloqueado[] = [];
  
  
  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;
  currentFilter2 = this.applyFilterTypes[0].key;
  modalReferenceItem: any;

  
  @ViewChild('GridPedidosPorPais', { static: false }) GridPedidosPorPais: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetail', { static: false }) GridPedidosPaisDetail: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetailByProduct', { static: false }) GridPedidosPaisDetailByProduct: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetailByProduct2', { static: false }) GridPedidosPaisDetailByProduct2: DxDataGridComponent;
  @ViewChild('GridStockBloqueado', { static: false }) GridStockBloqueado: DxDataGridComponent;
  
  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;
  @ViewChild('modalStockBloqueado') modalStockBloqueado: any;
  @ViewChild('modalPlanificarEmbarque') modalPlanificarEmbarque: any;
  
  @ViewChild(FrmplanificacionhorarioComponent, { static: false }) horarioComponent!: FrmplanificacionhorarioComponent;


  
  constructor(
    private _service: FrmplanificacionembarqueService,
    private _notificationService: NotificationService,
    public _utilService: UtilService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
  ) {

    
  }
  
  
  async ngOnInit() {
    this.onClickNuevo();
  }
  
  
  async onClickNuevo() {
    this.loadingVisible = true;
    this._service.getCatalogosPlanificacionEmbarque().subscribe((data) => {
      if (data.Codigo && data.Dt.Table.length > 0) {
        this.plantasEmbarque = data.Dt.Table.map((item: any) => {
          return {
            codigo: item.codigo,
            descripcion: item.nombre,
          };
        });
      }
    });
    this._service.getPedidosPlanificacionEmbarque().subscribe({
      next: (data) => {
        if (!data.Codigo) {
          throw new Error(data.Description);
        }
        this.pedidosPorPais = data.Dt.Table.map((item: any) => {
          return {
            id: item.CODIGO,
            pais: item.PAIS,
            vendido: item.VENDIDO,
            stock: item.STOCK,
            bloqueado: item.BLOQUEADO,
          };
        });

        let idSec = 0;
        this.pedidosPaisDetail = data.Dt.Table1.map((item: any) => {
          return {
            id: idSec++,
            paisCodigo: item.pai_codigo,
            pais: item.pai_descri?.trim() || '',
            destino: item.Destino?.trim() || '',
            cliente: item.CLIENTE?.trim() || '',
            codCliente: item.cli_codigo,
            // codProducto: item.cod_produc,
            // producto: item.PRODUCTO,
            // codTalla: item.cod_talla,
            // talla: item.TALLA?.trim() || '',
            pedido: item.PEDIDO || '',
            fecPedido: item.fecpedido,
            pedFechaEstimado: item.ped_fechaestimada,
            mastersOriginal: item.MORIGINAL,
            mastersPedido: item.MPEDIDO,
            xEmbarcar: item.XEMBARCAR,
            xFabricar: item.XFABRICAR,
            libras: item.LIBRAS,
            saldoSonga: item.SaldoSonga,
            saldoSonga2: item.SaldoSonga2,
            SaldoComin: item.SaldoComin,
            SaldoOtros: item.SaldoOtros,
            StockEnProceso: item.StockEnProceso,
            bloqueado: item.Bloqueado,
            porcentaje: parseFloat(item.Porcentaje),
            agrupacionCodigo: item.OrdenAgrupacion,
            agrupacionDescri: item.Agrupacion,
          };
        });

        let idSec2 = 0;
        this.pedidosPaisDetailByProduct = data.Dt.Table2.map((item: any) => {
          return {
            id: idSec2++,
            paisCodigo: item.pai_codigo,
            pais: item.pai_descri?.trim() || '',
            destino: item.Destino?.trim() || '',
            cliente: item.CLIENTE?.trim() || '',
            codCliente: item.cli_codigo,
            codProducto: item.cod_produc,
            producto: item.PRODUCTO,
            codTalla: item.cod_talla,
            talla: item.TALLA?.trim() || '',
            pedido: item.PEDIDO || '',
            fecPedido: item.fecpedido,
            pedFechaEstimado: item.ped_fechaestimada,
            mastersOriginal: item.MORIGINAL,
            mastersPedido: item.MPEDIDO,
            xEmbarcar: item.XEMBARCAR,
            xFabricar: item.XFABRICAR,
            libras: item.LIBRAS,
            saldoSonga: item.SaldoSonga,
            saldoSonga2: item.SaldoSonga2,
            SaldoComin: item.SaldoComin,
            SaldoOtros: item.SaldoOtros,
            StockEnProceso: item.StockEnProceso,
            bloqueado: item.Bloqueado,
            porcentaje: parseFloat(item.Porcentaje),
            agrupacionCodigo: item.OrdenAgrupacion,
            agrupacionDescri: item.Agrupacion,
          };
        });

        console.log(this.pedidosPaisDetail);
        console.log(this.pedidosPaisDetailByProduct);
      }, 
      error: (error) => {
        this.showAlert('','Error al cargar los datos: ' + error, 'error');
      },
      complete: () => {
        this.loadingVisible = false;
      }
    });

  }

  onInitializedPedidosPorPais(grid: any) {
    this.GridPedidosPorPais = grid;
  }
  
  onInitializedPedidosPaisDetail(grid: any) {
    this.GridPedidosPaisDetail = grid;
  }

  onInitializedPedidosPaisDetailByProduct(grid: any) {
    this.GridPedidosPaisDetailByProduct = grid;
  }

  onInitializedPedidosPaisDetailByProduct2(grid: any) {
    this.GridPedidosPaisDetailByProduct2 = grid;
  }

  onInitializedStockBloqueado(grid: any) {
    this.GridStockBloqueado = grid;
  }
  
  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }


  limpiarDetalleStockBloqueado () {
    this.cabeceraStockBloqueado = {
      producto: '',
      talla: '',
    }
    this.detalleStockBloqueado = [];
    this.totalMastersBloq = 0;
    if (this.GridStockBloqueado) {
      this.GridStockBloqueado.instance.refresh();
    }
  }


  async onClickBloqueado(rowData: any) {
    this.loadingVisible = true;
    this.limpiarDetalleStockBloqueado();
    this.modalReferenceItem = await this.modalService.open(this.modalStockBloqueado, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalStockBloqueado',
    });
    
    this._service.getDetalleStockBloqueado(rowData.codProducto, rowData.codTalla).subscribe({
      next: (data) => {
        if (data.Codigo) {
          let datosDet: any = data.Dt.Table;
          if (datosDet.length > 0) {
            this.cabeceraStockBloqueado = {
              producto: rowData.producto,
              talla: rowData.talla,
            };
            this.detalleStockBloqueado = datosDet.map((item: any) => {
              return {
                lote: item.Lote,
                codpro: item.Codpro,
                producto: item.Producto,
                codTalla: item.CodTalla,
                talla: item.Talla,
                master: item.Master,
                proveedor: item.Proveedor,
                fecha: item.Fecha,
                fechaCuar: item.FechaCuar,
                fechaLib: item.FechaLib,
                secuencial: item.Secuencial,
                observa: item.Observa,
                ccuMotivo: item.ccu_motivo,
                descripcion: item.Descripcion
              };
            });
            // obtener el total de masters bloqueados solo sumar si son de diferentes lotes 
            const uniqueLotes = new Set(this.detalleStockBloqueado.map(item => item.lote));
            this.totalMastersBloq = Array.from(uniqueLotes).reduce((acc, lote) => {
              const totalLote = this.detalleStockBloqueado.find(item => item.lote === lote)?.master || 0;
              return acc + totalLote;
            }, 0);
            
            if (this.GridStockBloqueado){
              this.GridStockBloqueado.instance.refresh();
            }

          }
        } 
        else {
          throw new Error(data.Description);
        }
      },
      error: (error) => {
        this.showAlert('','Error al cargar los datos: ' + error, 'error');
      },
      complete: () => {
        this.loadingVisible = false;
      }      
    });
    
  }

  
  limpiarPedidoSelected() {
    this.pedidoSelectedForPlanificar = null;
  }

  async onChangeGridCheckPlanificar(value: any, data: any) {
    this.pedidosPaisDetail.find((x) => x.id == data.data.id).checkPlanificar = value;
    if (value) {
      this.pedidosPaisDetail.forEach(async (item) => {
        // se debe permitir chequear mas de un registro solo si coincide (pedido, producto, clase, talla, dia)
        // if ((item.pedNumero !== data.data.pedNumero || item.prodCodcor !== data.data.prodCodcor || item.proClase !== data.data.proClase || item.talCodigo !== data.data.talCodigo || item.Dia !== data.data.Dia)
        //   && (item.numeroReqTerminado === null && item.numeroReqFresco === null)) {
        //   item.checkReqMp = false;
        //   item.checkReqDes = false;
        // }
        if (item.id !== data.data.id) {
          item.checkPlanificar = false;
        }
      });
      this.limpiarPedidoSelected();
      this.pedidoSelectedForPlanificar = data.data;
      this.pedidoSelectedForPlanificar.checkPlanificar = true;
      this.pedidoSelectedForPlanificar.fechaPlanificacion = this.minFechaPlanificacion;
  
      this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalPlanificarEmbarque',
      });
      console.log(this.pedidoSelectedForPlanificar);
    }
    this.GridPedidosPaisDetail.instance.refresh();
  }
  

  
  async validarDatos() {
    if (this.pedidoSelectedForPlanificar === null) {
      this.showAlert('','Seleccione un pedido para planificar.','warning');
      return false;
    }
    if (this.pedidoSelectedForPlanificar.plantaEmbarque === null || this.pedidoSelectedForPlanificar.plantaEmbarque === undefined) {
      this.showAlert('','Seleccione una planta de embarque.','warning');
      return false;
    }
    if (this.pedidoSelectedForPlanificar.fechaPlanificacion === null || this.pedidoSelectedForPlanificar.fechaPlanificacion === undefined) {
      this.showAlert('','Seleccione una fecha de planificación.','warning');
      return false;
    }
    if (this.pedidoSelectedForPlanificar.fechaPlanificacion < this.minFechaPlanificacion) {
      this.showAlert('','La fecha de planificación no puede ser menor a la fecha actual.','warning');
      return false;
    }
    if (this.pedidoSelectedForPlanificar.fechaPlanificacion > this.maxFechaPlanificacion) {
      this.showAlert('','La fecha de planificación no puede ser mayor a un mes.','warning');
      return false;
    }
    // if (this.pedidoSelectedForPlanificar.fechaPlanificacion < this.pedidoSelectedForPlanificar.fecPedido) {
    //   this.showAlert('','La fecha de planificación no puede ser menor a la fecha del pedido.','warning');
    //   return false;
    // }
    // if (this.pedidoSelectedForPlanificar.fechaPlanificacion < this.pedidoSelectedForPlanificar.pedFechaEstimado) {
    //   this.showAlert('','La fecha de planificación no puede ser menor a la fecha estimada del pedido.','warning');
    //   return false;
    // }
    // if (this.pedidoSelectedForPlanificar.fechaPlanificacion > this.pedidoSelectedForPlanificar.fecPedido) {
    //   this.showAlert('','La fecha de planificación no puede ser mayor a la fecha del pedido.','warning');
    //   return false;
    // }
    // if (this.pedidoSelectedForPlanificar.fechaPlanificacion > this.pedidoSelectedForPlanificar.pedFechaEstimado) {
    //   this.showAlert('','La fecha de planificación no puede ser mayor a la fecha estimada del pedido.','warning');
    //   return false;
    // }
  }

  async onClickGuardarPlaEmbarque() {
    this.loadingVisible = true;
    if (!this.validarDatos()) {
      this.loadingVisible = false;
      return;
    }
//    console.log(this.pedidoSelectedForPlanificar);
    const data = {
      fecPedido: new Date(this.pedidoSelectedForPlanificar.fecPedido),
      pedido: this.pedidoSelectedForPlanificar.pedido,
      codCliente: this.pedidoSelectedForPlanificar.codCliente,
      observacion: this.pedidoSelectedForPlanificar.observacion,
      plantaEmbarque: this.pedidoSelectedForPlanificar.plantaEmbarque,
      fechaPlanificacion: this.pedidoSelectedForPlanificar.fechaPlanificacion,
      pedFechaEstimado: new Date(this.pedidoSelectedForPlanificar.pedFechaEstimado),
      userAud: localStorage.getItem(varUser),
    };
    console.log(data);
    await this._service.postPlanificacionEmbarque(data).subscribe((data) => {
      this.loadingVisible = false;
      if (data.Codigo) {
        this.showAlert('','Registro guardado correctamente.','success');
        // ejecutar el metodo updateSelectedMonthYear que está en el componente hijo FrmplanificacionhorarioComponent
        if (this.horarioComponent) {
          this.horarioComponent.updateSelectedMonthYear();
        }
        // this.limpiarPedidoSelected();
        this.modalReferenceItem.close();
      } else {
        this.showAlert('','Error al guardar el registro:' + data.Description ,'error');
      }
    });
  }



  async showAlert(title, mensaje, tipo, event = null) {
    this.loadingVisible = false;

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
