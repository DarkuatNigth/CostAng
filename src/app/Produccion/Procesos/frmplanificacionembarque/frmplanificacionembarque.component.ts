import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxPopoverComponent, DxTabPanelComponent } from 'devextreme-angular';
import { FrmplanificacionvagService } from '../frmplanificacionvag/frmplanificacionvag.service';
import { DxDataGridModule, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { NotificationService } from 'src/app/shared/notify.service';
import { formatDate } from '@angular/common';
import { UtilService } from 'src/app/shared/util.service';
import * as moment from 'moment';
import { URL_SOCKET, varUser } from 'src/app/config/url.servicios';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { ActivatedRoute, Router } from '@angular/router';
import { parseNumber } from 'devextreme/localization';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FrmplanificacionembarqueService } from './frmplanificacionembarque.service';
import { FrmplanificacionhorarioComponent } from './frmplanificacionhorario/frmplanificacionhorario.component';
import * as io from "socket.io-client";
import notify from 'devextreme/ui/notify';

declare var $: any;
declare var window;


interface PedidosPorPais {
  id: number;
  pais: string;
  vendido: number;
  stock: number;
  bloqueado: number;
}
  
export interface PedidosPaisDetail {
  id: number;
  paisCodigo: number;
  pais: string;
  destino: string;
  cliente: string;
  codCliente: number;
  codPuertoDestino: number;
  pedNumero: number;
  pedido: string;
  fecPedido: Date;
  pedFechaEstimado: Date;
  mastersPedido: number;
  saldoPedido: number;
  xFabricar: number;
  stockSonga: number;
  stockComin: number;
  stockOtrasBodegas: number;
  stockRefristore: number;
  stockArtiko: number;
  stockCongelado: number;
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
  codTallaMP: number;
  tallaMP: string;
  master: number;
  proveedor: string;
  fecha: Date;
  fechaCuar: Date;
  fechaLib: Date;
  secuencial: number;
  observa: string;
  ccuMotivo: string;
  descripcion: string;
  disponiblePlanifica: string;
}

interface Catalogo {
  codigo: any;
  descripcion: string;
}


@Component({
  selector: 'app-frmplanificacionembarque',
  templateUrl: './frmplanificacionembarque.component.html',
  styleUrl: './frmplanificacionembarque.component.scss'
})
export class FrmplanificacionembarqueComponent implements OnInit {
  title = 'Pre - Planificación de Embarque';
  loadingVisible: boolean = false;
  disabledGenerarMix: boolean = true;
  disabledGenerarChina: boolean = true;
  planificacionMix = false;
  planificacionChina = false;

  pedidosPorPais: PedidosPorPais[] = [];
  pedidosPaisDetail: any[] = [];
  pedidosPaisDetailByProduct: any[] = [];
  plantasEmbarque: any[] = [];

  pedidoSelectedForPlanificar: any = null;
  pedidoSelectedForPlanificarDetalle: any[] = [];
  minFechaPlanificacion: Date = new Date(); 
  maxFechaPlanificacion: Date = moment().add(3, 'month').endOf('month').toDate();
  totalPedidoPlanificar: number = 0;
  totalStockPlanificar: number = 0;
  totalPalletsPlanificar: number = 0;
  cmbDestino: string = null;
  Destinos: Catalogo[] = [];


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
  modalReferenceItem: NgbModalRef | undefined;
  referenciaMix = '';
  DataPedidosMix:any[] = [];
  dataReqEspecialPedido: any[] = [];

  popupInfoVisible:boolean = false;
  popupInfoRefVisible:boolean = false;
  popupInfoReqEspVisible:boolean = false;

  toggleInformacion(){
    this.popupInfoVisible = !this.popupInfoVisible;
  }
  toggleInformacionRef(){
    this.popupInfoRefVisible = !this.popupInfoRefVisible;
  }
  toggleInformacionReqEsp(){
    this.popupInfoReqEspVisible = !this.popupInfoReqEspVisible;
  }

  pedidoPopoverData: any = null;
  showPopoverPedido(data: any, event: any) {
    this.pedidoPopoverData = data;
    this.popoverPedido.instance.show(event.target);
  }

  @ViewChild('GridPedidosPorPais', { static: false }) GridPedidosPorPais: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetail', { static: false }) GridPedidosPaisDetail: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetailByProduct', { static: false }) GridPedidosPaisDetailByProduct: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetailByProduct2', { static: false }) GridPedidosPaisDetailByProduct2: DxDataGridComponent;
  @ViewChild('GridStockBloqueado', { static: false }) GridStockBloqueado: DxDataGridComponent;
  @ViewChild('GridReqEspecialPedido', { static: false }) GridReqEspecialPedido: DxDataGridComponent;

  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;
  @ViewChild('modalStockBloqueado') modalStockBloqueado: any;
  @ViewChild('modalPlanificarEmbarque') modalPlanificarEmbarque: any;
  
  @ViewChild(FrmplanificacionhorarioComponent, { static: false }) horarioComponent!: FrmplanificacionhorarioComponent;

  @ViewChild('popoverPedido', { static: false }) popoverPedido: DxPopoverComponent;

  public socket = io.io(URL_SOCKET, {
    // transports: ['websocket'], 
    autoConnect: true, 
    path: '/AppSockets/socket/'
  });
  
  constructor(
    private _service: FrmplanificacionembarqueService,
    private _notificationService: NotificationService,
    public _utilService: UtilService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
  ) {

    
  }
  
  
  async ngOnInit() {
    this.limpiarNuevo();
    this.onClickNuevo();
    this.socketsConnect();
    this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalPlanificarEmbarque',
    });
    this.modalReferenceItem.close();
  }
  
  socketsConnect(){
    this.socket.on('connect', () => {
      console.log('Conectado al socket');
    });
    this.socket.on('new-planificacion-vag', async (data: any) => {
      let msg = data.message || 'Nueva planificación de Valor Agregado';
      // notify(msg, "info", 3500);
      let resp = await this.showAlertConfirm('Advertencia',`${msg}. Desea actualizar los datos?`,'warning');
      if (resp) {
        if (this.horarioComponent) {
          this.horarioComponent.updateSelectedMonth();
        }
        this.getPedidosPlanificacionEmbarque();
      }
    });
    this.socket.on('new-breakdown', (data: any) => {
      let msg = data.message || 'new-breakdown';
      let referencias = data.payload || [];
      console.log('new-breakdown', data);
      notify({
        message: msg,
        type: 'info',
        displayTime: 3500,
        position: { my: 'top center', at: 'top center' }
      });
      if (this.horarioComponent) {
        this.horarioComponent.updateReferenciasBreakdown(referencias);
      }
    });
  }
  
  async onClickNuevo() {
    this._service.getCatalogosPlanificacionEmbarque().subscribe((data) => {
      if (data.Codigo && data.Dt.Table.length > 0) {
        this.plantasEmbarque = data.Dt.Table.map((item: any) => {
          return {
            codigo: item.codigo,
            descripcion: item.descripcion,
          };
        });
      }
      if (data.Dt.Table2.length > 0) {
        this.Destinos = data.Dt.Table2.map((item: any) => {
          return {
            codigo: item.codigo,
            descripcion: item.descripcion,
          };
        });
      }
    });
    let responseSub = await this.getPedidosPlanificacionEmbarque();
  }



  async getPedidosPlanificacionEmbarque(): Promise<boolean> {
    this.loadingVisible = true;
    let response: Promise<boolean> = new Promise(async (resolve) => {
      await this._service.getPedidosPlanificacionEmbarque().subscribe({
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
              paisCodigo: item.paisCodigo,
              pais: item.paisDescripcion?.trim() || '',
              codPuertoDestino: item.puertoCodigo,
              destino: item.destino?.trim() || '',
              cliente: item.cliente?.trim() || '',
              codCliente: item.cliCodigo,
              pedNumero: item.pedNumero,
              pedido: item.pedido,
              fecPedido: item.fecpedido,
              pedFechaEstimado: item.ped_fechaestimada,
              mastersPedido: item.mastersPedidoOriginal,
              saldoPedido: item.saldoPedido,
              xFabricar: item.XFABRICAR,
              stockSonga: item.stockS1 + item.stockS2,
              stockSonga2: item.stockS2,
              stockComin: item.stockComin,
              stockOtrasBodegas: item.stockOtrasBodegas,
              stockArtiko: item.stockArtiko,
              stockRefristore: item.stockRefristore,
              stockCongelado: item.stockCongelado,
              bloqueado: item.cuarentenaBloqueado,
  
              etiquetadoChina: item.etiquetadoChina,
              mastersProgramados: parseInt(item.mastersProgramados) || parseInt(item.mastersPlanificado) || 0,
              cuarentenaSulfito: item.cuarentenaSulfito,
              cuarentena: item.cuarentena,
              cuarentenaBloqueado: item.cuarentenaBloqueado,
              libPositiva: item.libPositiva,
              analisisVB: item.analisisVB,
              esperaResult: item.esperaResult,
              bloqueadoUV: item.bloqueadoUV,
              reetiquetadoChina: item.reetiquetadoChina,
              reprocesoDescab: item.reprocesoDescab,
              bloqueadoLT: item.bloqueadoLT,
              stockTotal: item.stockTotal,
              saldo: item.saldo,
  
              porcentaje: parseFloat(item.Porcentaje),
              agrupacionCodigo: item.OrdenAgrupacion,
              agrupacionDescri: item.Agrupacion,
              tallas: item.tallas,
              productos: item.productos,
              referenciaPlanificada: item.referenciaPlanificada,
              permiteElegirDestino: item.permiteElegirDestino,
            };
          });
  
          let idSec2 = 0;
          this.pedidosPaisDetailByProduct = data.Dt.Table2.map((item: any) => {
            return {
              id: idSec2++,
              paisCodigo: item.paisCodigo,
              pais: item.paisDescripcion?.trim() || '',
              codPuertoDestino: item.puertoCodigo,
              destino: item.destino?.trim() || '',
              cliente: item.cliente?.trim() || '',
              codCliente: item.cliCodigo,
              pedNumero: item.pedNumero,
              pedido: item.pedido,
              dpe_sectab: item.dpe_sectab,
              codProducto: item.codProd,
              producto: item.producto,
              codTalla: item.codTalla,
              talla: item.talla?.trim() || '',
              codTallaMP: item.codTallaMP,
              tallaMP: item.tallaMP?.trim() || '',
              numPallet: item.numPallet,
              pesoVta: item.pesoVta,
              ctsXPallet: item.ctsXPallet,
              ctsXPallet2: item.ctsXPallet,
              fecPedido: item.fecpedido,
              pedFechaEstimado: item.ped_fechaestimada,
              mastersPedido: item.mastersPedidoOriginal,
              saldoPedido: item.saldoPedido,
              xFabricar: item.XFABRICAR,
              stockSonga: item.stockS1 + item.stockS2,
              stockSonga2: item.stockS2,
              stockComin: item.stockComin,
              stockOtrasBodegas: item.stockOtrasBodegas,
              stockRefristore: item.stockRefristore,
              stockArtiko: item.stockArtiko,
              stockCongelado: item.stockCongelado,
              bloqueado: item.cuarentenaBloqueado,
              
              etiquetadoChina: item.etiquetadoChina,
              mastersProgramados: parseInt(item.mastersProgramados) || parseInt(item.mastersPlanificado) || 0,
              cuarentenaSulfito: item.cuarentenaSulfito,
              cuarentena: item.cuarentena,
              cuarentenaBloqueado: item.cuarentenaBloqueado,
              libPositiva: item.libPositiva,
              analisisVB: item.analisisVB,
              esperaResult: item.esperaResult,
              bloqueadoUV: item.bloqueadoUV,
              reetiquetadoChina: item.reetiquetadoChina,
              reprocesoDescab: item.reprocesoDescab,
              bloqueadoLT: item.bloqueadoLT,
              stockTotal: item.stockTotal,
              saldo: item.saldo,
  
              palletsG1: item.palletsG1,
              palletsG1tmp: item.palletsG1,
              palletsG2: item.palletsG2,
              palletsG2tmp: item.palletsG2,
              palletsG3: item.palletsG3,
              palletsG3tmp: item.palletsG3,
              palletsG4: item.palletsG4,
              palletsG4tmp: item.palletsG4,
              palletsTotMix: item.palletsG1 + item.palletsG2 + item.palletsG3 + item.palletsG4,
              palletsTotMix2: 0,
              // palletsTotMix: item.palletsCompletos,
              palletsCompletos: item.palletsCompletos,
              palletsParciales: item.palletsParciales,
              porcentaje: parseFloat(item.Porcentaje),
              agrupacionCodigo: item.OrdenAgrupacion,
              agrupacionDescri: item.Agrupacion,
              paletsMaxSulfito: item.paletsMaxSulfito,
              paletsMinAusenciaVibrios: item.paletsMinAusenciaVibrios,
              pedObservOrd: item.pedObservOrd,
              validaLoteRepresentativo: item.validaLoteRepresentativo,
              loteRepresent: item.loteRepresent,
              loteRepresentPallets: item.loteRepresentPallets,
              checkPlanificar: false,
              itemPlanificado: item.itemPlanificado,
              permiteElegirDestino: item.permiteElegirDestino,

            };
          });
  
        }, 
        error: (error) => {
          this.showAlert('','Error al cargar los datos: ' + error, 'error');
          this.loadingVisible = false;
          return resolve(false);
        },
        complete: () => {
          this.loadingVisible = false;
          return resolve(true);
        }
      });

    });
    return response;
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


  onInitializedReqEspecialPedido(grid: any) {
    this.GridReqEspecialPedido = grid;
  }
  


  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }



  limpiarNuevo() {
    this.pedidosPorPais = [];
    this.pedidosPaisDetail = [];
    this.pedidosPaisDetailByProduct = [];
    // this.plantasEmbarque = [];
    // this.limpiarPedidoSelected();
    this.limpiarDetalleStockBloqueado();
    if (this.GridPedidosPorPais) {
      this.GridPedidosPorPais.instance.refresh();
    }
    if (this.GridPedidosPaisDetail) {
      this.GridPedidosPaisDetail.instance.refresh();
    }
    if (this.GridPedidosPaisDetailByProduct) {
      this.GridPedidosPaisDetailByProduct.instance.refresh();
    }
    if (this.GridPedidosPaisDetailByProduct2) {
      this.GridPedidosPaisDetailByProduct2.instance.refresh();
    }
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



  tipoBloqueoModal = '';
  tipoBloqueogroupIndex = '0';
  async onClickBloqueado(rowData: any, tipoBloqueo: string) {
    this.tipoBloqueoModal = tipoBloqueo;
    this.tipoBloqueogroupIndex = tipoBloqueo === 'bloqueado' ? '0' : null;
    this.loadingVisible = true;
    this.limpiarDetalleStockBloqueado();
    this.modalReferenceItem = await this.modalService.open(this.modalStockBloqueado, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalStockBloqueado',
    });
    
    this._service.getDetalleStockBloqueado(rowData.codProducto, rowData.codTalla, tipoBloqueo).subscribe({
      next: (data) => {
        if (data.Codigo) {
          if (data.Dt.Table && data.Dt.Table.length > 0) {
            let datosDet: any = data.Dt.Table;
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
                descripcion: item.Descripcion,
                disponiblePlanifica: item.disponiblePlanifica === 'D' || tipoBloqueo == 'analisisVB' ? 'Disponible' : 'No Disponible',
              };
            });
            // obtener el total de masters bloqueados solo sumar si son de diferentes lotes y disponiblePlanifica = 'Disponible'
            const uniqueLotes = new Set(this.detalleStockBloqueado.map(item => item.lote));
            this.totalMastersBloq = Array.from(uniqueLotes).reduce((acc, lote) => {
              const totalLote = this.detalleStockBloqueado.find(item => item.lote === lote && item.disponiblePlanifica == 'Disponible')?.master || 0;
              return acc + totalLote;
            }, 0);
            
            if (this.GridStockBloqueado){
              this.GridStockBloqueado.instance.refresh();
            }

          } else {
            throw new Error('No se encontraron datos para el producto y talla seleccionados.');
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
    this.pedidoSelectedForPlanificarDetalle = [];
    this.totalPedidoPlanificar = 0;
    this.totalStockPlanificar = 0;
    this.totalPalletsPlanificar = 0;
    this.cmbDestino = null;
    this.dataReqEspecialPedido = [];

  }



  async onChangeGridCheckPlanificar(value: any, data: any) {
    this.loadingVisible = true;
    this.cdr.detectChanges();
    this.planificacionMix = false;
    this.planificacionChina = false;
    this.pedidosPaisDetail.find((x) => x.id == data.data.id).checkPlanificar = value;
    this.disabledGenerarChina =  !this.pedidosPaisDetail.some((item) => item.checkPlanificar && item.agrupacionDescri === 'CHINA');
    if (value && data.data.agrupacionDescri !== 'CHINA') {
      // this.pedidosPaisDetail.forEach(async (item) => {
      //   if (item.id !== data.data.id) {
      //     item.checkPlanificar = false;
      //   }
      // });
      // TODO: el metodo foreach se demora mucho
      this.limpiarPedidoSelected();
      this.pedidoSelectedForPlanificar = data.data;
      this.pedidoSelectedForPlanificar.tipoEmbarque = 'I';
      this.pedidoSelectedForPlanificar.fechaPlanificacion = this.minFechaPlanificacion;
      this.pedidoSelectedForPlanificar.plantaEmbarque = 1; // planta de embarque por defecto es 1 (Songa)
      this.pedidoSelectedForPlanificarDetalle = this.pedidosPaisDetailByProduct.filter((x) => (x.pedido === this.pedidoSelectedForPlanificar.pedido));
      this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
        this.totalPedidoPlanificar += item.saldoPedido;
        this.totalStockPlanificar += item.stockTotal;
        this.totalPalletsPlanificar += item.palletsCompletos;
      })
      this.pedidoSelectedForPlanificar.paletsMinAusenciaVibrios = this.pedidoSelectedForPlanificarDetalle[0].paletsMinAusenciaVibrios;
      this.pedidoSelectedForPlanificar.paletsMaxSulfito = this.pedidoSelectedForPlanificarDetalle[0].paletsMaxSulfito;
      this.pedidoSelectedForPlanificar.pedObservOrd = this.pedidoSelectedForPlanificarDetalle[0].pedObservOrd;
      this.pedidoSelectedForPlanificar.numPallet = this.pedidoSelectedForPlanificarDetalle[0].numPallet;
      this.pedidoSelectedForPlanificar.validaLoteRepresentativo = this.pedidoSelectedForPlanificarDetalle[0].validaLoteRepresentativo;
      this.pedidoSelectedForPlanificar.loteRepresent = this.pedidoSelectedForPlanificarDetalle[0].loteRepresent;
      this.pedidoSelectedForPlanificar.loteRepresentPallets = this.pedidoSelectedForPlanificarDetalle[0].loteRepresentPallets;
      if (this.pedidoSelectedForPlanificar.permiteElegirDestino) {
        this.cmbDestino = this.pedidoSelectedForPlanificar.codPuertoDestino;
      }
      this._service.getReqEspecialPedido(this.pedidoSelectedForPlanificar.pedNumero).subscribe({
        next: (data) => {
          if (!data.Codigo) {
            throw new Error(data.Description);
          }
          if (data.Dt.Table.length > 0) {
            this.dataReqEspecialPedido = data.Dt.Table;
          } 
        },
        error: (error) => {
          console.log('Error al cargar los datos de requerimiento especial: ', error);
        }
      });
      // Reutilizar el modal precargado si existe
      if (this.modalReferenceItem && this.modalReferenceItem.hasOwnProperty('componentInstance')) {
        try {
          this.modalReferenceItem.close();
        } catch (e) {}
        this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
          ariaLabelledBy: 'modal-basic-title',
          windowClass: 'cssModalPlanificarEmbarque',
        });
      } else {
        this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
          ariaLabelledBy: 'modal-basic-title',
          windowClass: 'cssModalPlanificarEmbarque',
        });
      }
    }
    if (this.GridPedidosPaisDetail) {
      await this.GridPedidosPaisDetail.instance.refresh();
    }
    this.loadingVisible = false;
  }
  

  async onChangeGridCheckPlanificarMix(value: any, data: any) {
    this.pedidosPaisDetailByProduct.find((x) => x.id == data.data.id).checkPlanificar = value;
    if (value) {
      // verificar si existen otros pedidos seleccionados con el mismo cliente (codCliente)
      this.pedidosPaisDetailByProduct.forEach(async (item) => {
        if (item.id !== data.data.id && item.codCliente !== data.data.codCliente) {
          item.checkPlanificar = false;
        }
      });      
    }
    this.disabledGenerarMix = !this.pedidosPaisDetailByProduct.some((item) => item.checkPlanificar);
    await this.GridPedidosPaisDetailByProduct.instance.refresh();
  }
  

  
  async onChangeGridCheckPlanificarMix2(value: any, data: any) {
    this.loadingVisible = true;
    this.pedidosPaisDetailByProduct.find((x) => x.id == data.data.id).checkPlanificar = value;
    this.GridPedidosPaisDetailByProduct.instance.refresh();
    const pedidosSeleccionadosMix: any[] = this.pedidosPaisDetailByProduct.filter((x) => x.checkPlanificar);
    this.pedidoSelectedForPlanificarDetalle = [...pedidosSeleccionadosMix];
    this.totalPalletsPlanificar = 0;
    this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
      this.totalPalletsPlanificar += item.palletsTotMix;
    });
    this.loadingVisible = false;
  }



  OnChangecmbPedidosMix(e){
    const selectedValue = e;
    if (selectedValue) {
      const pedidoMix = this.DataPedidosMix.find((item) => item.codigo === selectedValue);
      this.referenciaMix = pedidoMix.descripcion;
      if (pedidoMix) {
        this.pedidoSelectedForPlanificar.pedObservOrd = pedidoMix.pedObservOrd;
      }
    } else {
      this.referenciaMix = '';
    }
  }



  async onClickGenerarMix() {
    this.loadingVisible = true;
    this.planificacionChina = false;
    this.planificacionMix = true;
    this.cdr.detectChanges();
    const pedidosSeleccionadosMix: any[] = this.pedidosPaisDetailByProduct.filter((x) => x.checkPlanificar);
    if (pedidosSeleccionadosMix.length === 0) {
      this.showAlert('','Seleccione al menos un pedido para generar el mix.','warning');
      this.loadingVisible = false;
      return;
    }
    this.limpiarPedidoSelected();
    this.pedidoSelectedForPlanificar = pedidosSeleccionadosMix[0];
    this.pedidoSelectedForPlanificar.tipoEmbarque = 'M';
    this.pedidoSelectedForPlanificar.fechaPlanificacion = this.minFechaPlanificacion;
    this.pedidoSelectedForPlanificar.plantaEmbarque = 1; // planta de embarque por defecto es 1 (Songa)
    this.pedidoSelectedForPlanificarDetalle = pedidosSeleccionadosMix;
    this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
      this.totalPedidoPlanificar += item.saldoPedido;
      this.totalStockPlanificar += item.stockTotal;
      this.totalPalletsPlanificar += item.palletsTotMix;
    });

    // si cliente es Gambastar
    if (this.pedidoSelectedForPlanificar.codCliente == 104) {
      const todosPeso1kg = this.pedidoSelectedForPlanificarDetalle.every((item) => item.pesoVta == 1);
      const todosPeso2kg = this.pedidoSelectedForPlanificarDetalle.every((item) => item.pesoVta == 2);
      if (todosPeso1kg) {
        this.pedidoSelectedForPlanificar.numPallet = 23;
      } else if (todosPeso2kg) {
        this.pedidoSelectedForPlanificar.numPallet = 27;
      } else {
        this.pedidoSelectedForPlanificar.numPallet = 23;
      }
    }

    if (this.pedidoSelectedForPlanificar.permiteElegirDestino) {
      this.cmbDestino = this.pedidoSelectedForPlanificar.codPuertoDestino;
    }
    
    this._service.getReqEspecialPedido(this.pedidoSelectedForPlanificar.pedNumero).subscribe({
      next: (data) => {
        if (!data.Codigo) {
          throw new Error(data.Description);
        }
        if (data.Dt.Table.length > 0) {
          this.dataReqEspecialPedido = data.Dt.Table;
        } 
      },
      error: (error) => {
        console.log('Error al cargar los datos de requerimiento especial: ', error);
      }
    });

    // Obtener referencias únicas de los pedidos seleccionados
    this.pedidoSelectedForPlanificar.referenciasMix = Array.from(
      new Set(this.pedidoSelectedForPlanificarDetalle.map((item) => item.pedido))
    ).join(';');


    // si solo se selecciona una referencia, entonces no se debe de generar el mix. se generará una planificacion normal.
    let nRef = this.pedidoSelectedForPlanificar.referenciasMix.split(';').length;
    if (nRef === 1) {
      this.planificacionMix = false;
      this.pedidoSelectedForPlanificar.tipoEmbarque = 'I'; // tipo de embarque Individual
      this.pedidoSelectedForPlanificar.referenciasMix = '';
      this.loadingVisible = false;
    } else {
      // para obtener la referencia del mix, debo de darle prioridad a la referencia con mayor saldoPedido.
      let referenciasPrioridad: any[] = [];
      this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
        if (referenciasPrioridad.length === 0) {
          referenciasPrioridad.push({pedido: item.pedido, saldoPedido: (item.saldoPedido || item.mastersProgramados)});
        } else {
          const index = referenciasPrioridad.findIndex((x) => x.pedido === item.pedido);
          if (index === -1) {
            referenciasPrioridad.push({pedido: item.pedido, saldoPedido: (item.saldoPedido || item.mastersProgramados)});
          } else {
            referenciasPrioridad[index].saldoPedido += (item.saldoPedido || item.mastersProgramados);
          }
        }
      });
      referenciasPrioridad.sort((a, b) => b.saldoPedido - a.saldoPedido);

      // CONSULTAR EN LA BASE QUE REFERENCIA USAR PARA EL MIX
      this._service.getReferenciaMix(referenciasPrioridad, this.pedidoSelectedForPlanificar.codCliente).subscribe({
        next: (data) => {
          if (!data.Codigo) {
            throw new Error(data.Description);
          }
          if (data.Dt.Table.length > 0) {
            let dt: any = data.Dt.Table;
            this.DataPedidosMix = data.Dt.Table1;
            this.referenciaMix = dt[0].referencia;
            const pedidoMix = this.DataPedidosMix.find((item) => item.descripcion === this.referenciaMix);
            if (pedidoMix) {
              this.pedidoSelectedForPlanificar.pedObservOrd = pedidoMix.pedObservOrd;
            }
          } else {
            this.showAlert('','Las referencias de los pedidos seleccionados ya se encuentran en uso.', 'warning');
          }
        },
        error: (error) => {
          this.showAlert('','Error al cargar las referencias del mix: ' + error, 'error');
        },
        complete: () => {
          this.loadingVisible = false;
        }
      });
    }

    this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalPlanificarEmbarque',
    });
  }

  pedidosSeleccionadosChina: any[] = [];

  async onClickGenerarChina() {
    this.loadingVisible = true;
    this.planificacionMix = false;
    this.planificacionChina = true;
    this.cdr.detectChanges();
    this.pedidosSeleccionadosChina = this.pedidosPaisDetail.filter((x) => x.checkPlanificar && x.agrupacionDescri === 'CHINA');
    const pedidosSeleccionadosChinaDetalle: any[] = [];
    if (this.pedidosSeleccionadosChina.length === 0) {
      this.showAlert('','Seleccione al menos un pedido para generar la planificación.','warning');
      this.loadingVisible = false;
      return;
    } 
    this.pedidosSeleccionadosChina.forEach((pedido) => {
      const detalles = this.pedidosPaisDetailByProduct.filter((x) => x.pedido === pedido.pedido);
      pedidosSeleccionadosChinaDetalle.push(...detalles);
    });
    this.limpiarPedidoSelected();
    this.pedidoSelectedForPlanificar = this.pedidosSeleccionadosChina[0];
    this.pedidoSelectedForPlanificar.tipoEmbarque = 'I';
    this.pedidoSelectedForPlanificar.fechaPlanificacion = this.minFechaPlanificacion;
    this.pedidoSelectedForPlanificar.plantaEmbarque = 1; // planta de embarque por defecto es 1 (Songa)
    this.pedidoSelectedForPlanificarDetalle = pedidosSeleccionadosChinaDetalle;
    this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
      this.totalPedidoPlanificar += item.saldoPedido;
      this.totalStockPlanificar += item.stockTotal;
      this.totalPalletsPlanificar += item.palletsCompletos;
    });
    this.pedidoSelectedForPlanificar.paletsMinAusenciaVibrios = this.pedidoSelectedForPlanificarDetalle[0].paletsMinAusenciaVibrios;
    this.pedidoSelectedForPlanificar.paletsMaxSulfito = this.pedidoSelectedForPlanificarDetalle[0].paletsMaxSulfito;
    this.pedidoSelectedForPlanificar.pedObservOrd = this.pedidoSelectedForPlanificarDetalle[0].pedObservOrd;
    this.pedidoSelectedForPlanificar.numPallet = this.pedidoSelectedForPlanificarDetalle[0].numPallet;
    this.pedidoSelectedForPlanificar.validaLoteRepresentativo = this.pedidoSelectedForPlanificarDetalle[0].validaLoteRepresentativo;
    this.pedidoSelectedForPlanificar.loteRepresent = this.pedidoSelectedForPlanificarDetalle[0].loteRepresent;
    this.pedidoSelectedForPlanificar.loteRepresentPallets = this.pedidoSelectedForPlanificarDetalle[0].loteRepresentPallets;

    if (this.pedidoSelectedForPlanificar.permiteElegirDestino) {
      this.cmbDestino = this.pedidoSelectedForPlanificar.codPuertoDestino;
    }
    // Obtener referencias únicas de los pedidos seleccionados
    let referenciasSeleccionadas = Array.from(
      new Set(this.pedidoSelectedForPlanificarDetalle.map((item) => item.pedido))
    ).join(';');

    // si solo se selecciona una referencia, entonces se generará una planificacion normal.
    let nRef = referenciasSeleccionadas.split(';').length;
    if (nRef === 1) {
      this.planificacionChina = false;
      this.pedidosSeleccionadosChina = [];
    } 
    
    this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
      ariaLabelledBy: 'modal-basic-title',
      windowClass: 'cssModalPlanificarEmbarque',
    });
    this.loadingVisible = false;
  }

  async onChangePalletsG1(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    if (value > this.pedidoSelectedForPlanificarDetalle[indexR].palletsG1 || value < 0 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 0 y ' + this.pedidoSelectedForPlanificarDetalle[indexR].palletsG1 + '.','warning');
      value = this.pedidoSelectedForPlanificarDetalle[indexR].palletsG1;
    }
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsG1tmp = value;
    this.refreshGridPedidosPaisDetailByProduct(indexR);
  }



  async onChangePalletsG2(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    if (value > this.pedidoSelectedForPlanificarDetalle[indexR].palletsG2 || value < 0 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 0 y ' + this.pedidoSelectedForPlanificarDetalle[indexR].palletsG2 + '.','warning');
      value = this.pedidoSelectedForPlanificarDetalle[indexR].palletsG2;
    }
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsG2tmp = value;
    this.refreshGridPedidosPaisDetailByProduct(indexR);
  }



  async onChangePalletsG3(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    if (value > this.pedidoSelectedForPlanificarDetalle[indexR].palletsG3 || value < 0 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 0 y ' + this.pedidoSelectedForPlanificarDetalle[indexR].palletsG3 + '.','warning');
      value = this.pedidoSelectedForPlanificarDetalle[indexR].palletsG3;
    }
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsG3tmp = value;
    this.refreshGridPedidosPaisDetailByProduct(indexR);
  }



  async onChangePalletsG4(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    if (value > this.pedidoSelectedForPlanificarDetalle[indexR].palletsG4 || value < 0 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 0 y ' + this.pedidoSelectedForPlanificarDetalle[indexR].palletsG4 + '.','warning');
      value = this.pedidoSelectedForPlanificarDetalle[indexR].palletsG4;
    }
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsG4tmp = value;
    this.refreshGridPedidosPaisDetailByProduct(indexR);
  }



  async onChangePalletsG5(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    let ctsXPallet = this.pedidoSelectedForPlanificarDetalle[indexR].ctsXPallet;
    let saldoPedido = this.pedidoSelectedForPlanificarDetalle[indexR].saldoPedido;
    if (value > Math.floor(saldoPedido / ctsXPallet) || value < 1 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 1 y ' + Math.floor(saldoPedido / ctsXPallet) + '.','warning');
    } else {
      this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix = value;
    }
    this.refreshGridPedidosPaisDetailByProduct(indexR, false);
  }



  async onChangeCtsXPallet(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    this.pedidoSelectedForPlanificarDetalle[indexR].ctsXPallet = value;
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix = Math.floor(this.pedidoSelectedForPlanificarDetalle[indexR].saldoPedido / value);
    if (this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix2 > 0) {
      this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix2 = 0;
    } 
    this.refreshGridPedidosPaisDetailByProduct(indexR, false);
  }



  async onChangeCtsXPallet2(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    this.pedidoSelectedForPlanificarDetalle[indexR].ctsXPallet2 = value;
    let saldoPedido = this.pedidoSelectedForPlanificarDetalle[indexR].saldoPedido - (this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix * this.pedidoSelectedForPlanificarDetalle[indexR].ctsXPallet);
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix2 = Math.floor(saldoPedido / value);
    this.refreshGridPedidosPaisDetailByProduct(indexR, false);
  }

  
  async onChangeTotPaletizado2(value: any, rowData: any) {
    const { id } = rowData;
    value = this._utilService.validateNumberInt(value);
    const indexR = this.pedidoSelectedForPlanificarDetalle.findIndex(x => x.id === id);
    let ctsXPallet = this.pedidoSelectedForPlanificarDetalle[indexR].ctsXPallet2;
    let saldoPedido = this.pedidoSelectedForPlanificarDetalle[indexR].saldoPedido - (this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix * this.pedidoSelectedForPlanificarDetalle[indexR].ctsXPallet);
    if (value > Math.floor(saldoPedido / ctsXPallet) || value < 1 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 1 y ' + Math.floor(saldoPedido / ctsXPallet) + '.','warning');
    } else {
      this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix2 = value;
    }
    this.refreshGridPedidosPaisDetailByProduct(indexR, false);
  }


  refreshGridPedidosPaisDetailByProduct (indexR: number, reclacularpalletsTotMix: boolean = true) {
    if (reclacularpalletsTotMix) {
      this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix = this.pedidoSelectedForPlanificarDetalle[indexR].palletsG1tmp + 
        this.pedidoSelectedForPlanificarDetalle[indexR].palletsG2tmp +
        this.pedidoSelectedForPlanificarDetalle[indexR].palletsG3tmp +
        this.pedidoSelectedForPlanificarDetalle[indexR].palletsG4tmp;
    }
    this.pedidoSelectedForPlanificarDetalle = [...this.pedidoSelectedForPlanificarDetalle];
    this.totalPalletsPlanificar = 0;
    this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
      this.totalPalletsPlanificar += item.palletsTotMix + (item.palletsTotMix2 || 0);
    });
  }
  


  async validarDatosPlaEmbarque(pedidoAPlanificar: any, pedidoAPlanificarDetalle: any[]): Promise<boolean> {
    if (pedidoAPlanificar === null) {
      this.showAlert('','Seleccione un pedido para planificar.','warning');
      return false;
    }
    if (pedidoAPlanificarDetalle.length === 0) {
      this.showAlert('','No existen pedidos seleccionados para planificar.','warning');
      return false;
    }
    if (pedidoAPlanificar.fechaPlanificacion === null || pedidoAPlanificar.fechaPlanificacion === undefined) {
      this.showAlert('','Seleccione una fecha de planificación.','warning');
      return false;
    }
    if (pedidoAPlanificar.fechaPlanificacion < this.minFechaPlanificacion) {
      this.showAlert('','La fecha de planificación no puede ser menor a la fecha actual.','warning');
      return false;
    }
    if (!pedidoAPlanificar.plantaEmbarque) {
      this.showAlert('','Seleccione una planta de embarque.','warning');
      return false;
    } else {
      // si la planta de embarque es 8 (Bodega Comin) ó 18 (Bodega Refristore) se valida que el pedido tenga stock en esas bodegas 
      if (pedidoAPlanificar.plantaEmbarque == 1) {
        const tieneStockSonga = pedidoAPlanificarDetalle.some((item) => item.stockSonga > 0);
        if (!tieneStockSonga) {
          let resp = await this.showAlertConfirm('Advertencia',`El pedido ${pedidoAPlanificar.pedido} no tiene stock en la planta de embarque seleccionada. ¿Está seguro de continuar?`,'warning');
          if (!resp) {
            return false;
          }
        }
      }
      if (pedidoAPlanificar.plantaEmbarque == 8) {
        const tieneStockComin = pedidoAPlanificarDetalle.some((item) => item.stockComin > 0);
        if (!tieneStockComin) {
          let resp = await this.showAlertConfirm('Advertencia',`El pedido ${pedidoAPlanificar.pedido} no tiene stock en la planta de embarque seleccionada. ¿Está seguro de continuar?`,'warning');
          if (!resp) {
            return false;
          }
        }
      }
      if (pedidoAPlanificar.plantaEmbarque == 18) {
        const tieneStockOtrasBodegas = pedidoAPlanificarDetalle.some((item) => item.stockOtrasBodegas > 0);
        if (!tieneStockOtrasBodegas) {
          let resp = await this.showAlertConfirm('Advertencia',`El pedido ${pedidoAPlanificar.pedido} no tiene stock en la planta de embarque seleccionada. ¿Está seguro de continuar?`,'warning');
          if (!resp) {
            return false;
          }
        }
      }
    }

    if (pedidoAPlanificar.permiteElegirDestino && !this.cmbDestino) {
      this.showAlert('','Seleccione un puerto de destino.','warning');
      return false;
    }

    // validar lote representativo si validaLoteRepresentativo = 1
    if (pedidoAPlanificar.validaLoteRepresentativo === 1) {
      if (!pedidoAPlanificar.loteRepresent) {
        this.showAlert('',`El pedido ${pedidoAPlanificar.pedido} no tiene asignado lote representativo, por favor verifique.`,'warning');
        return false;
      }
    }

    if (pedidoAPlanificar.tipoEmbarque === 'M') {
      if (!this.referenciaMix){
        this.showAlert('','Seleccione una referencia para el mix.','warning');
        return false;
      }
      // validar que todos los pedidos seleccionados tengan pallets disponibles (palletsTotMix) 
      if (pedidoAPlanificarDetalle.some((item) => item.palletsTotMix <= 0)) {
        this.showAlert('','Existen items que no cuentan con pallets disponibles, por favor verifique.','warning');
        return false;
      }
      // validar que el total de pallets no sea mayor al saldo pedido (item.ctsXPallet * item.palletsTotMix) > item.saldoPedido
      for (let item of pedidoAPlanificarDetalle) {
        let saldoPlanificado = (item.ctsXPallet * item.palletsTotMix) + ((item.ctsXPallet2 * item.palletsTotMix2) || 0);
        if (saldoPlanificado > item.saldoPedido) {
          this.showAlert('Advertencia',`El total de pallets planificados para el producto (${item.codProducto}) es mayor al saldo pedido, por favor verifique.`,'warning');
          return false;
        }
      }


      // Para Mix solo debe dejarme programar si está completo el saldo pedido. con los pallets que esten disponibles.
      if (this.totalPalletsPlanificar != pedidoAPlanificar.numPallet) {
        let resp = await this.showAlertConfirm('Advertencia',`El total de pallets planificados es ${this.totalPalletsPlanificar > pedidoAPlanificar.numPallet ? 'mayor' : 'menor'} al número de pallets que debe de tener el mix. ¿Está seguro de continuar?`,'warning');
        if (!resp) {
          return false;
        }
      }
    }
    
    if (pedidoAPlanificar.paletsMaxSulfito > 0 || pedidoAPlanificar.paletsMinAusenciaVibrios > 0) {
      let totalPalletsG1 = 0;
      let totalPalletsG2 = 0;
      pedidoAPlanificarDetalle.forEach((item) => {
        totalPalletsG1 += item.palletsG1;
        totalPalletsG2 += item.palletsG2;
      });
      if (pedidoAPlanificar.paletsMinAusenciaVibrios > 0 && totalPalletsG1 < pedidoAPlanificar.paletsMinAusenciaVibrios) {
        let resp = await this.showAlertConfirm('Advertencia',`El cliente tiene parametrizado un mínimo de (${pedidoAPlanificar.paletsMinAusenciaVibrios}) pallets con ausencia de vibrios. ¿Está seguro de continuar?.`,'warning');
        if (!resp) {
          return false;
        }
      }
      if (pedidoAPlanificar.paletsMaxSulfito > 0 && totalPalletsG2 > pedidoAPlanificar.paletsMaxSulfito) {
        let resp = await this.showAlertConfirm('Advertencia',`El cliente tiene parametrizado un máximo de (${pedidoAPlanificar.paletsMaxSulfito}) pallets con sulfito. ¿Está seguro de continuar?.`,'warning');
        if (!resp) {
          return false;
        }
      }
    }

    // validar que el pedido no tenga requerimientos especiales que no esten aprobados
    if (this.dataReqEspecialPedido && this.dataReqEspecialPedido.length > 0) {
      let requerimientosNoAprobados = this.dataReqEspecialPedido.filter(req => req.requiereAprobacion	 === 'SI' && req.aprobado === 0);
      if (requerimientosNoAprobados.length > 0) {
        let resp = await this.showAlertConfirm('Advertencia',`Existen requerimientos especiales del pedido que no están aprobados. ¿Está seguro de continuar?.`,'warning');
        if (!resp) {
          return false;
        }
      }
    }

    return true;
  }

  async onClickGuardarPlaEmbarqueChina() {
    this.loadingVisible = true;
    this.cdr.detectChanges();
    let fechaPlanificacion = this.pedidoSelectedForPlanificar.fechaPlanificacion;
    let plantaEmbarque = this.pedidoSelectedForPlanificar.plantaEmbarque;
    let observacion = this.pedidoSelectedForPlanificar.observacion;
    
    var validacion = false;
    for (let pedido of this.pedidosSeleccionadosChina) {
      // debugger;
      let pedidoDetalle: any[] = this.pedidoSelectedForPlanificarDetalle.filter((x) => x.pedido === pedido.pedido);
      pedido.tipoEmbarque = 'I';
      pedido.fechaPlanificacion = fechaPlanificacion;
      pedido.plantaEmbarque = plantaEmbarque;
      pedido.observacion = observacion;
      pedido.paletsMinAusenciaVibrios = pedidoDetalle[0].paletsMinAusenciaVibrios;
      pedido.paletsMaxSulfito = pedidoDetalle[0].paletsMaxSulfito;
      pedido.pedObservOrd = pedidoDetalle[0].pedObservOrd;
      pedido.numPallet = pedidoDetalle[0].numPallet;
      pedido.validaLoteRepresentativo = pedidoDetalle[0].validaLoteRepresentativo;
      pedido.loteRepresent = pedidoDetalle[0].loteRepresent;
      pedido.loteRepresentPallets = pedidoDetalle[0].loteRepresentPallets;
      pedido.detalle = pedidoDetalle;

      validacion = await this.validarDatosPlaEmbarque(pedido, pedidoDetalle);
      if (!validacion) {
        this.loadingVisible = false;
        return;
      }
      // await this.onClickGuardarPlaEmbarque();
    }

    // guardar pedido por pedido una vez pasado la validación
    if (validacion) {
      var todosOk = true;
      for (let i = 0; i < this.pedidosSeleccionadosChina.length; i++) {
        let pedido = this.pedidosSeleccionadosChina[i];
        let estado = 'PL'; // (Planificado)
        // si todo el pedido está en 100% se cambia a 'PC' (Planificado Completado), y libPositiva = 0
        if (pedido.detalle.every((item) => (item.porcentaje === 100 && item.libPositiva === 0))) {
          estado = 'PC'; // (Planificado Completado)
        }
        let codPuertoDestino = pedido.codPuertoDestino;
        if (this.cmbDestino) {
          codPuertoDestino = this.cmbDestino;
        }
        const data = {      
          pedido: pedido.pedido,
          codCliente: pedido.codCliente,
          codPuertoDestino: codPuertoDestino,
          tipo: pedido.tipoEmbarque, // (Individual / Mix)
          plantaEmbarque: pedido.plantaEmbarque,
          fechaPlanificacion: pedido.fechaPlanificacion,
          pedFechaEstimado: new Date(pedido.pedFechaEstimado),
          estado: estado,
          observacion: pedido.observacion,
          referenciasMix: pedido.referenciasMix || null,
          detalle: pedido.detalle.map((item: any) => {
            return {
              pedido: item.pedido,
              dpeSectab: item.dpe_sectab,
              codprod: item.codProducto,
              codtalla: item.codTalla,
              mPedido: item.saldoPedido,
            };
          }),
          userAud: localStorage.getItem(varUser),
        }; 
        await this._service.postPlanificacionEmbarque(data).subscribe({
          next: async (resp) => {
            if (!resp.Codigo) {
              throw new Error(resp.Description);
            }            
            // sincronizar con planificacion de exportaciones
            let dataSync = [{
              Codigo: pedido.pedNumero,
              fechaestimada: formatDate(pedido.fechaPlanificacion, 'yyyy-MM-dd', 'en-US'),
            }];
            await this._service.postSincronizarPlanificacionExportaciones(dataSync, localStorage.getItem(varUser)).subscribe(data => {
              if (data.Codigo) {
                this.socket.emit('save-planificacion', { action: 'new', message: `Se creó una programación de embarque para la referencia: ${pedido.pedido}` });
              } else {
                throw new Error('Existió un error en la sincronización con la planificación de Exportaciones. \n' + data.Description);
              }
            });
          },
          error: (error) => {
            todosOk = false;
            this.showAlert('','Error al guardar el registro: ' + error ,'error');
          },
          complete: () => {
            this.loadingVisible = false;
          }
        });
      }

      if (todosOk) {
        this.showAlert('','Registros guardados correctamente.','success');
        // ejecutar el metodo updateSelectedMonth que está en el componente hijo FrmplanificacionhorarioComponent
        if (this.horarioComponent) {
          this.horarioComponent.updateSelectedMonth();
        }
        // this.limpiarNuevo();
        this.getPedidosPlanificacionEmbarque();
        this.modalReferenceItem.close();
      }
    }
    this.loadingVisible = false;
  }


  async onClickGuardarPlaEmbarque() {
    debugger;
    this.loadingVisible = true;
    this.cdr.detectChanges();
    let validacion = await this.validarDatosPlaEmbarque(this.pedidoSelectedForPlanificar, this.pedidoSelectedForPlanificarDetalle);
    if (!validacion) {
      this.loadingVisible = false;
      return;
    }
    let estado = 'PL'; // (Planificado)
    // si todo el pedido está en 100% se cambia a 'PC' (Planificado Completado), y libPositiva = 0
    if (this.pedidoSelectedForPlanificarDetalle.every((item) => (item.porcentaje === 100 && item.libPositiva === 0))) {
      estado = 'PC'; // (Planificado Completado)
    }
    let codPuertoDestino = this.pedidoSelectedForPlanificar.codPuertoDestino;
    if (this.cmbDestino) {
      codPuertoDestino = this.cmbDestino;
    } 
    const data = {      
      pedido: this.planificacionMix ? this.referenciaMix : this.pedidoSelectedForPlanificar.pedido,
      codCliente: this.pedidoSelectedForPlanificar.codCliente,
      codPuertoDestino: codPuertoDestino,
      tipo: this.pedidoSelectedForPlanificar.tipoEmbarque, // (Individual / Mix)
      plantaEmbarque: this.pedidoSelectedForPlanificar.plantaEmbarque,
      fechaPlanificacion: this.pedidoSelectedForPlanificar.fechaPlanificacion,
      pedFechaEstimado: new Date(this.pedidoSelectedForPlanificar.pedFechaEstimado),
      estado: estado,
      observacion: this.pedidoSelectedForPlanificar.observacion,
      referenciasMix: this.pedidoSelectedForPlanificar.referenciasMix || null,
      detalle: this.pedidoSelectedForPlanificarDetalle.map((item: any) => {
        return {
          pedido: item.pedido,
          dpeSectab: item.dpe_sectab,
          codprod: item.codProducto,
          codtalla: item.codTalla,
          mPedido: this.pedidoSelectedForPlanificar.tipoEmbarque === 'M' ? 
            (item.ctsXPallet * item.palletsTotMix) + (item.ctsXPallet2 * item.palletsTotMix2 || 0)
            : item.saldoPedido,
        };
      }),
      userAud: localStorage.getItem(varUser),
    };
    await this._service.postPlanificacionEmbarque(data).subscribe({
      next: async (resp) => {
        if (!resp.Codigo) {
          throw new Error(resp.Description);
        }
        if (this.pedidoSelectedForPlanificar.tipoEmbarque === 'M') {
          // si es un mix, se sincroniza haciendo el breakdown de los pedidos seleccionados
          let pedNumero = this.DataPedidosMix.find((item) => item.descripcion === this.referenciaMix)?.codigo;
          let dataSync = {
            pedido: pedNumero,
            observBreakDown: this.pedidoSelectedForPlanificar.pedObservOrd,
            plantaEmb: this.pedidoSelectedForPlanificar.plantaEmbarque,
            dataJson: this.pedidoSelectedForPlanificarDetalle.map((item: any) => {
              return {
                dpe_pedido: item.pedNumero,
                dpe_sectab: item.dpe_sectab,
                dpe_codprod: item.codProducto,
                dpe_talla: item.codTalla,
                dpe_masters: (item.ctsXPallet * item.palletsTotMix),
              };
            })
          }
          // TODO: No se generará el breakdown 
          // await this._service.postSincronizarPlanificacionBreakDown(dataSync, localStorage.getItem(varUser)).subscribe(data => {
          //   if (data.Codigo) {
          //     console.log('Sincronización con planificación de Exportaciones exitosa.(Breakdown Mix)');
          //   } else {
          //     throw new Error('Existió un error en la sincronización con la planificación de Exportaciones. \n' + data.Description);
          //   }
          // });
        }
        else {
          // sincronizar con planificacion de exportaciones
          let dataSync = [{
            Codigo: this.pedidoSelectedForPlanificar.pedNumero,
            fechaestimada: formatDate(this.pedidoSelectedForPlanificar.fechaPlanificacion, 'yyyy-MM-dd', 'en-US'),
          }];
          await this._service.postSincronizarPlanificacionExportaciones(dataSync, localStorage.getItem(varUser)).subscribe(data => {
            if (data.Codigo) {
              this.socket.emit('save-planificacion', { action: 'new', message: `Se creó una programación de embarque para la referencia: ${this.pedidoSelectedForPlanificar.pedido}` });
            } else {
              throw new Error('Existió un error en la sincronización con la planificación de Exportaciones. \n' + data.Description);
            }
          });
        }

        this.showAlert('','Registro guardado correctamente.','success');
        // ejecutar el metodo updateSelectedMonth que está en el componente hijo FrmplanificacionhorarioComponent
        if (this.horarioComponent) {
          this.horarioComponent.updateSelectedMonth();
        }
        // this.limpiarNuevo();
        this.getPedidosPlanificacionEmbarque();
        this.modalReferenceItem.close();
      },
      error: (error) => {
        this.showAlert('','Error al guardar el registro: ' + error ,'error');
      },
      complete: () => {
        this.loadingVisible = false;
      }
    });
  }


  async onClickCerrarModalPlaEmbarque() {
    for (let i = 0; i < this.pedidosPaisDetail.length; i++) {
      if (this.pedidosPaisDetail[i].checkPlanificar) {
        this.pedidosPaisDetail[i].checkPlanificar = false;
      }
    }
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
  

  async showAlertConfirm(title, mensaje, tipo) {
    this.loadingVisible = false;

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
