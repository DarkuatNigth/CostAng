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
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
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


@Component({
  selector: 'app-frmplanificacionembarque',
  templateUrl: './frmplanificacionembarque.component.html',
  styleUrl: './frmplanificacionembarque.component.scss'
})
export class FrmplanificacionembarqueComponent implements OnInit {
  title = 'Planificación de Embarque';
  loadingVisible: boolean = false;
  disabledGenerarMix: boolean = true;
  planificacionMix = false;

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

  popupInfoVisible:boolean = false;
  popupInfoRefVisible:boolean = false;

  toggleInformacion(){
    this.popupInfoVisible = !this.popupInfoVisible;
  }
  toggleInformacionRef(){
    this.popupInfoRefVisible = !this.popupInfoRefVisible;
  }

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
    this.limpiarNuevo();
    this.onClickNuevo();
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
              stockCongelado: item.stockCongelado,
              bloqueado: item.cuarentenaBloqueado,
  
              etiquetadoChina: item.etiquetadoChina,
              mastersProgramados: item.mastersProgramados,
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
              referenciaPlanificada: item.referenciaPlanificada,
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
              numPallet: item.numPallet,
              pesoVta: item.pesoVta,
              ctsXPallet: item.ctsXPallet,
              fecPedido: item.fecpedido,
              pedFechaEstimado: item.ped_fechaestimada,
              mastersPedido: item.mastersPedidoOriginal,
              saldoPedido: item.saldoPedido,
              xFabricar: item.XFABRICAR,
              stockSonga: item.stockS1 + item.stockS2,
              stockSonga2: item.stockS2,
              stockComin: item.stockComin,
              stockOtrasBodegas: item.stockOtrasBodegas,
              stockCongelado: item.stockCongelado,
              bloqueado: item.cuarentenaBloqueado,
              
              etiquetadoChina: item.etiquetadoChina,
              mastersProgramados: item.mastersProgramados,
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
  }



  async onChangeGridCheckPlanificar(value: any, data: any) {
    this.loadingVisible = true;
    this.planificacionMix = false;
    this.pedidosPaisDetail.find((x) => x.id == data.data.id).checkPlanificar = value;
    if (value) {
      this.pedidosPaisDetail.forEach(async (item) => {
        if (item.id !== data.data.id) {
          item.checkPlanificar = false;
        }
      });
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

      this.modalReferenceItem = await this.modalService.open(this.modalPlanificarEmbarque, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalPlanificarEmbarque',
      });
    }
    await this.GridPedidosPaisDetail.instance.refresh();
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
    this.planificacionMix = true;
    const pedidosSeleccionadosMix: any[] = this.pedidosPaisDetailByProduct.filter((x) => x.checkPlanificar);
    if (pedidosSeleccionadosMix.length === 0) {
      this.showAlert('','Seleccione al menos un pedido para generar el mix.','warning');
      this.loadingVisible = false;
      return;
    }
    this.limpiarPedidoSelected();
    this.pedidoSelectedForPlanificarDetalle = pedidosSeleccionadosMix;
    this.pedidoSelectedForPlanificar = this.pedidoSelectedForPlanificarDetalle[0];
    this.pedidoSelectedForPlanificar.tipoEmbarque = 'M';
    this.pedidoSelectedForPlanificar.fechaPlanificacion = this.minFechaPlanificacion;
    this.pedidoSelectedForPlanificar.plantaEmbarque = 1; // planta de embarque por defecto es 1 (Songa)
    this.pedidoSelectedForPlanificar.numPallet = 20; // brasmar 20
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
    // Obtener referencias únicas de los pedidos seleccionados
    this.pedidoSelectedForPlanificar.referenciasMix = Array.from(
      new Set(this.pedidoSelectedForPlanificarDetalle.map((item) => item.pedido))
    ).join(';');
    this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
      this.totalPedidoPlanificar += item.saldoPedido;
      this.totalStockPlanificar += item.stockTotal;
      this.totalPalletsPlanificar += item.palletsTotMix;
    });

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
    if (value > this.pedidoSelectedForPlanificarDetalle[indexR].palletsCompletos || value < 0 || isNaN(value)) {
      this.showAlert('','El valor debe ser un número válido entre 0 y ' + this.pedidoSelectedForPlanificarDetalle[indexR].palletsCompletos + '.','warning');
    }
    this.pedidoSelectedForPlanificarDetalle[indexR].palletsTotMix = value;
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
      this.totalPalletsPlanificar += item.palletsTotMix;
    });
  }
  


  async validarDatosPlaEmbarque() {
    if (this.pedidoSelectedForPlanificar === null) {
      this.showAlert('','Seleccione un pedido para planificar.','warning');
      return false;
    }
    if (this.pedidoSelectedForPlanificarDetalle.length === 0) {
      this.showAlert('','No existen pedidos seleccionados para planificar.','warning');
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
    if (!this.pedidoSelectedForPlanificar.plantaEmbarque) {
      this.showAlert('','Seleccione una planta de embarque.','warning');
      return false;
    } else {
      // si la planta de embarque es 8 (Bodega Comin) ó 18 (Bodega Refristore) se valida que el pedido tenga stock en esas bodegas 
      if (this.pedidoSelectedForPlanificar.plantaEmbarque == 1) {
        const tieneStockSonga = this.pedidoSelectedForPlanificarDetalle.some((item) => item.stockSonga > 0);
        if (!tieneStockSonga) {
          let resp = await this.showAlertConfirm('Advertencia','El pedido no tiene stock en la planta de embarque seleccionada. ¿Está seguro de continuar?','warning');
          if (!resp) {
            return resp;
          }
        }
      }
      if (this.pedidoSelectedForPlanificar.plantaEmbarque == 8) {
        const tieneStockComin = this.pedidoSelectedForPlanificarDetalle.some((item) => item.stockComin > 0);
        if (!tieneStockComin) {
          let resp = await this.showAlertConfirm('Advertencia','El pedido no tiene stock en la planta de embarque seleccionada. ¿Está seguro de continuar?','warning');
          if (!resp) {
            return resp;
          }
        }
      }
      if (this.pedidoSelectedForPlanificar.plantaEmbarque == 18) {
        const tieneStockOtrasBodegas = this.pedidoSelectedForPlanificarDetalle.some((item) => item.stockOtrasBodegas > 0);
        if (!tieneStockOtrasBodegas) {
          let resp = await this.showAlertConfirm('Advertencia','El pedido no tiene stock en la planta de embarque seleccionada. ¿Está seguro de continuar?','warning');
          if (!resp) {
            return resp;
          }
        }
      }
    }

    // validar lote representativo si validaLoteRepresentativo = 1
    if (this.pedidoSelectedForPlanificar.validaLoteRepresentativo === 1) {
      if (!this.pedidoSelectedForPlanificar.loteRepresent) {
        this.showAlert('','El pedido no tiene asignado lote representativo, por favor verifique.','warning');
        return false;
      }
    }

    if (this.pedidoSelectedForPlanificar.tipoEmbarque === 'M') {
      if (!this.referenciaMix){
        this.showAlert('','Seleccione una referencia para el mix.','warning');
        return false;
      }
      // validar que todos los pedidos seleccionados tengan pallets disponibles (palletsTotMix) 
      if (this.pedidoSelectedForPlanificarDetalle.some((item) => item.palletsTotMix <= 0)) {
        this.showAlert('','Existen items que no cuentan con pallets disponibles, por favor verifique.','warning');
        return false;
      }
      // validar que el total de pallets no sea mayor al saldo pedido (item.ctsXPallet * item.palletsTotMix) > item.saldoPedido
      for (let item of this.pedidoSelectedForPlanificarDetalle) {
        if ((item.ctsXPallet * item.palletsTotMix) > item.saldoPedido) {
          this.showAlert('Advertencia',`El total de pallets planificados para el producto (${item.codProducto}) es mayor al saldo pedido, por favor verifique.`,'warning');
          return false;
        }
      }


      // Para Mix solo debe dejarme programar si está completo el saldo pedido. con los pallets que esten disponibles.
      if (this.totalPalletsPlanificar != this.pedidoSelectedForPlanificar.numPallet) {
        let resp = await this.showAlertConfirm('Advertencia',`El total de pallets planificados es ${this.totalPalletsPlanificar > this.pedidoSelectedForPlanificar.numPallet ? 'mayor' : 'menor'} al número de pallets que debe de tener el mix. ¿Está seguro de continuar?`,'warning');
        if (!resp) {
          return resp;
        }
      }
    }
    
    if (this.pedidoSelectedForPlanificar.paletsMaxSulfito > 0 || this.pedidoSelectedForPlanificar.paletsMinAusenciaVibrios > 0) {
      let totalPalletsG1 = 0;
      let totalPalletsG2 = 0;
      this.pedidoSelectedForPlanificarDetalle.forEach((item) => {
        totalPalletsG1 += item.palletsG1;
        totalPalletsG2 += item.palletsG2;
      });
      if (this.pedidoSelectedForPlanificar.paletsMinAusenciaVibrios > 0 && totalPalletsG1 < this.pedidoSelectedForPlanificar.paletsMinAusenciaVibrios) {
        let resp = await this.showAlertConfirm('Advertencia',`El cliente tiene parametrizado un mínimo de (${this.pedidoSelectedForPlanificar.paletsMinAusenciaVibrios}) pallets con ausencia de vibrios. ¿Está seguro de continuar?.`,'warning');
        if (!resp) {
          return resp;
        }
      }
      if (this.pedidoSelectedForPlanificar.paletsMaxSulfito > 0 && totalPalletsG2 > this.pedidoSelectedForPlanificar.paletsMaxSulfito) {
        let resp = await this.showAlertConfirm('Advertencia',`El cliente tiene parametrizado un máximo de (${this.pedidoSelectedForPlanificar.paletsMaxSulfito}) pallets con sulfito. ¿Está seguro de continuar?.`,'warning');
        if (!resp) {
          return resp;
        }
      }
    }
    
    return true;
  }



  async onClickGuardarPlaEmbarque() {
    this.loadingVisible = true;
    let validacion = await this.validarDatosPlaEmbarque();
    if (!validacion) {
      this.loadingVisible = false;
      return;
    }
    let estado = 'PL'; // (Planificado)
    // si todo el pedido está en 100% se cambia a 'PC' (Planificado Completado), y libPositiva = 0
    if (this.pedidoSelectedForPlanificarDetalle.every((item) => (item.porcentaje === 100 && item.libPositiva === 0))) {
      estado = 'PC'; // (Planificado Completado)
    }
    const data = {      
      pedido: this.planificacionMix ? this.referenciaMix : this.pedidoSelectedForPlanificar.pedido,
      codCliente: this.pedidoSelectedForPlanificar.codCliente,
      codPuertoDestino: this.pedidoSelectedForPlanificar.codPuertoDestino,
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
          codprod: item.codProducto,
          codtalla: item.codTalla,
          mPedido: this.pedidoSelectedForPlanificar.tipoEmbarque === 'M' ? (item.ctsXPallet * item.palletsTotMix) : item.saldoPedido,
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
              console.log('Sincronización con planificación de Exportaciones exitosa.');
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
        this.limpiarNuevo();
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


  onClickCerrarModalPlaEmbarque() {
    if (this.pedidoSelectedForPlanificar !== null) {
      this.pedidosPaisDetail.find((x) => x.id == this.pedidoSelectedForPlanificar.id).checkPlanificar = false;
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
