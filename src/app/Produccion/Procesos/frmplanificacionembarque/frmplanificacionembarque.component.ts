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

declare var $: any;
declare var window;


interface Pedidos {
  id: string;
  index?: number;
  orderAux?: number;
  prioridad?: number;
  codigoTipo: string;
  descriTipo: string;
  cliCodigo: number;
  descriCliente: string;
  pedNumero: string;
  prodCodcor: string;
  descriProducto: string;
  descriTalla: string;
  talCodigo: string;
  proClase: string;	
  proModali: number;
  proCongela: number; 
  descriCongela: string;
  mastersPedido: number;
  saldoPedido: number;
  saldoPedidoMed: number;
  fechaEstimadaEmbarque: Date;
  factor: number;
  factorAut: number;
  Selected: boolean;
  manualAutomatico: string;
  numModulos?: any;
}

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
  pedido: string;
  producto: string;
  talla: string;
  fecPedido: Date;
  pedFechaEstimado: Date;
  mastersOriginal: number;
  mastersPedido: number;
  xEmbarcar: number;
  xFabricar: number;
  libras: number;
  saldoSonga: number;
  bloqueado: number;
  porcentaje: number;
  checkPlanificar?: boolean;
}


@Component({
  selector: 'app-frmplanificacionembarque',
  templateUrl: './frmplanificacionembarque.component.html',
  styleUrl: './frmplanificacionembarque.component.scss'
})
export class FrmplanificacionembarqueComponent implements OnInit {
  title = 'Planificación de Embarque';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  
  pedidosPorPais: PedidosPorPais[] = [];
  pedidosPaisDetail: PedidosPaisDetail[] = [];
  facturas: Pedidos[] = [];
  facturasSelected: Pedidos[] = [];
  
  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;
  currentFilter2 = this.applyFilterTypes[0].key;
  
  @ViewChild('GridFacturas', { static: false }) GridFacturas: DxDataGridComponent;
  @ViewChild('GridPedidosPorPais', { static: false }) GridPedidosPorPais: DxDataGridComponent;
  @ViewChild('GridPedidosPaisDetail', { static: false }) GridPedidosPaisDetail: DxDataGridComponent;
  @ViewChild('GridFacturasSelected', { static: false }) GridFacturasSelected: DxDataGridComponent;
  @ViewChild('tabPanel') tabPanel: DxTabPanelComponent;

  
  constructor(
    private _service: FrmplanificacionembarqueService,
    private _serviceConsulta: FrmplanificacionvagService,
    private _notificationService: NotificationService,
    public _utilService: UtilService,
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
  ) {

    this.onClickNuevo();

  }

  
  async ngOnInit() {
    this.loadingVisible = true;
    this._serviceConsulta.getPedidosParaPlanificacion().subscribe((data) => {
      this.loadingVisible = false;

      this.facturas = data.Dt.Table.map((item: any) => {
        return {
          id: `${item.pedNumero}_${item.prodCodcor}_${item.talCodigo}`, 
          codigoTipo: item.codigoTipo,
          descriTipo: item.descriTipo,
          cliCodigo: item.cliCodigo,
          descriCliente: item.descriCliente,
          pedNumero: item.pedNumero,
          prodCodcor: item.prodCodcor,
          descriProducto: item.descriProducto,
          talCodigo: item.talCodigo,
          descriTalla: item.descriTalla,
          proClase: item.proClase,
          proModali: item.proModali,
          proCongela: item.proCongela,
          descriCongela: item.descriCongela,
          mastersPedido: item.mastersPedido,
          saldoPedido: item.saldoPedidoMed,
          saldoPedidoMed: item.saldoPedidoMed,
          fechaEstimadaEmbarque: item.fechaEstimadaEmbarque,
          factor: item.factor,
          factorAut: item.factorAut,
          Selected: false,
          manualAutomatico: 'M',
        };
      });
      
    });
    this.loadingVisible = false;

  }

  
  onClickNuevo() {
    this.facturas = [];
    this.facturasSelected = [];
    
    this._serviceConsulta.getPedidosParaPlanificacion().subscribe((data) => {
      this.loadingVisible = false;

      this.facturas = data.Dt.Table.map((item: any) => {
        return {
          id: `${item.pedNumero}_${item.prodCodcor}_${item.talCodigo}`, 
          codigoTipo: item.codigoTipo,
          descriTipo: item.descriTipo,
          cliCodigo: item.cliCodigo,
          descriCliente: item.descriCliente,
          pedNumero: item.pedNumero,
          prodCodcor: item.prodCodcor,
          descriProducto: item.descriProducto,
          talCodigo: item.talCodigo,
          descriTalla: item.descriTalla,
          proClase: item.proClase,
          proModali: item.proModali,
          proCongela: item.proCongela,
          descriCongela: item.descriCongela,
          mastersPedido: item.mastersPedido,
          saldoPedido: item.saldoPedidoMed,
          saldoPedidoMed: item.saldoPedidoMed,
          fechaEstimadaEmbarque: item.fechaEstimadaEmbarque,
          factor: item.factor,
          factorAut: item.factorAut,
          Selected: false,
          manualAutomatico: 'M',
        };
      });
    });

    this._service.getPedidosPlanificacionEmbarque().subscribe((data) => {
      this.pedidosPorPais = data.Dt.Table.map((item: any) => {
        return {
          id: item.pai_codigo,
          pais: item.pai_descri?.trim() || '',
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
          producto: item.PRODUCTO,
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
          bloqueado: item.Bloqueado,
          porcentaje: parseFloat(item.Porcentaje),
        };
      });
    });
    
    if (this.GridFacturas) {
      this.GridFacturas.instance.refresh();
    }
    if (this.GridFacturasSelected) {
      this.GridFacturasSelected.instance.refresh();
    }
    if (this.tabPanel) {
      this.tabPanel.instance.option('selectedIndex', 0);
    }
  }

  async onClickGuardar() {
    
  }

  
  onInitializedFacturas(grid: any) {
    this.GridFacturas = grid;
  }
  
  onInitializedPedidosPorPais(grid: any) {
    this.GridPedidosPorPais = grid;
  }
  
  onInitializedPedidosPaisDetail(grid: any) {
    this.GridPedidosPaisDetail = grid;
  }

  onInitializedFacturasSelected(grid: any) {
    this.GridFacturasSelected = grid;
  }

  
  focusedColumn: string = '';
  onFocus(column: string) {
    this.focusedColumn = column;
  }

  onBlur() {
    this.focusedColumn = '';
  }

  onChangePrioridad(value: string, rowData: any) {
    let prioridad = parseInt(value, 10);
    rowData.prioridad = prioridad;
    if (!isNaN(prioridad)) {
      const {id} = rowData;
      let index = this.facturas.findIndex((item) => item.id === id);
      this.facturas[index].prioridad = prioridad;
      this.facturasSelected.push(this.facturas[index]);
      // la agrego a la lista de facturas seleccionadas, y ordeno por: 1. prioridad ascendente 2. fecha estimada de embarque ascendente 3. id ascendente      
      this.facturasSelected.sort((a, b) => {
        if (a.prioridad !== b.prioridad) {
          return a.prioridad - b.prioridad;
        }
        if (new Date(a.fechaEstimadaEmbarque) < new Date(b.fechaEstimadaEmbarque)) {
          return -1;
        }
        if (new Date(a.fechaEstimadaEmbarque) > new Date(b.fechaEstimadaEmbarque)) {
          return 1;
        }
        return a.id.localeCompare(b.id);
      });
      this.updateFacturasSelected();      
      let selected = true;
      this.facturas = this.facturas.map((item) => { 
        return (item.id == id) ? { ...item, Selected: selected, prioridad: prioridad } : item; 
      });
      this.GridFacturas.instance.refresh();
    }
  }

  updateFacturasSelected() {
    this.facturasSelected = this.facturasSelected.map((item, index) => {
      item.index = index + 1;
      item.orderAux = item.index;
      return item;
    });
  }

  onAdd = (e: Parameters<DxDataGridTypes.RowDragging['onAdd']>[0]) => {
    const {id} = e.itemData;
    let prioridad = null;
    if (e.toData) {
      prioridad = this.facturasSelected[e.toIndex - 1]?.prioridad || 1;
    }
    this.facturas = this.facturas.map((item) => { 
      return (item.id == id) ? { ...item, Selected: e.toData, prioridad: prioridad } : item; 
    });
    if (e.toData) {
      this.facturasSelected.splice(e.toIndex, 0, this.facturas.find((item) => (item.id == id)));
    } else {
      this.facturasSelected = this.facturasSelected.filter((item) => (item.id !== id));
    }
    
    this.updateFacturasSelected();
  };

  onReorder = (e: DxDataGridTypes.RowDraggingReorderEvent) => {
    const visibleRows = e.component.getVisibleRows();
    let prioridad = visibleRows[e.toIndex].data.prioridad;
    let toIndex = this.facturasSelected.findIndex(
      (item) => item.index === visibleRows[e.toIndex].data.index
    );
    let fromIndex = this.facturasSelected.findIndex(
      (item) => item.index === e.itemData.index
    );
    this.facturasSelected.splice(fromIndex, 1);
    this.facturasSelected.splice(toIndex, 0, {...e.itemData, prioridad});
    this.updateFacturasSelected();
  };


  deleteRecord(rowData: any) {
    let {index, id} = rowData;
    this.facturasSelected = this.facturasSelected.filter(item => item.index !== index);
    this.facturas = this.facturas.map((item) => {
      return (item.id === id) ? { ...item, Selected: false, index: null, prioridad: null } : item;
    });
    this.updateFacturasSelected();
  }

  dateFormatter(value: Date): string {
    return formatDate(value, 'yyyy/MM/dd', 'en-US');
  }

  async onClickBloqueado(rowData: any) {
    // this.limpiarRequerimientoProducto();
    
    // this.modalReferenceItem = await this.modalService.open(this.modalRequerimientoProducto, {
    //   ariaLabelledBy: 'modal-basic-title',
    //   windowClass: 'cssModalGenerarRequerimiento',
    // });
  }

}
