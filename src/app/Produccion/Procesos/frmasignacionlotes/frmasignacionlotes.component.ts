import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { FrmasignacionlotesService } from './frmasignacionlotes.service';
import { NotificationService } from 'src/app/shared/notify.service';
import { varUser } from 'src/app/config/url.servicios';


declare var $: any;
declare var window;

interface Pedidos {
  id: string;
  codigoTipo: string;
  descriTipo: string;
  cliCodigo: number;
  descriCliente: string;
  pedNumero: string;
  prodCodcor: string;
  descriProducto: string;
  descriTalla: string;
  talCodigo: string;
  mastersPedido: number;
  saldoPedido: number;
  saldoPedidoMed: number;
  fechaEstimadaEmbarque: Date;
  numLote: number;
  idAsignacion: number;
}

interface PedidosLotes {
  pedidoFactura: string;
  codigoCliente: number;
  codigoProducto: string;
  codigoTalla: string;
  descriTalla: string;
  numLote: number;
  idAsignacion: number;
}

@Component({
  selector: 'app-frmasignacionlotes',
  templateUrl: './frmasignacionlotes.component.html',
  styleUrl: './frmasignacionlotes.component.scss'
})
export class FrmasignacionlotesComponent implements OnInit {
  title = 'Asignación de Lotes a Facturas';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  listaFacturas: Pedidos[] = [];
  listaPedidosLotes: PedidosLotes[] = [];
  @ViewChild('GridFacturas', { static: false }) GridFacturas: DxDataGridComponent;
  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;


  async ngOnInit() {
  }

  public constructor(
    private _service: FrmasignacionlotesService,
    private _notificationService: NotificationService,
  ) {
    this.onClickConsultar();

  }

  async onClickConsultar() {
    this.listaPedidosLotes = [];
    this.listaFacturas = [];
    this.loadingVisible = true;
        
    this._service.getPedidos().subscribe((data) => {
      this.loadingVisible = false;
      var result = data.Dt.Table;
      this.listaFacturas = data.Dt.Table.map((item: any) => {
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
          mastersPedido: item.mastersPedido,
          saldoPedido: item.saldoPedido,
          saldoPedidoMed: item.saldoPedidoMed,
          fechaEstimadaEmbarque: item.fechaEstimadaEmbarque,
          numLote: item.numLote,
          idAsignacion: item.idAsignacion
        };
      });
    });
  }

  async onClickGuardar() {
    this.loadingVisible = true;
    const data = {
      detalle: this.listaPedidosLotes,
      userAud: localStorage.getItem(varUser)
    };
    await this._service.postAsignacionLotes(data).subscribe((data) => {
      this.loadingVisible = false;
      if (data.Codigo) {
        this._notificationService.sucess( `Registro guardado correctamente` );
        this.onClickConsultar();
      } else {
        this._notificationService.error( `Error al guardar el registro` + data.Description );
      }
    });
  }

  async onItemPrintClick() {
  }

  
  onInitializedFacturas(grid: any) {
    this.GridFacturas = grid;
  }

  
  async onChangeValorFacturas(value: string, data: any) {
    const { id, pedNumero, cliCodigo, descriCliente, prodCodcor, descriProducto, talCodigo, descriTalla, idAsignacion } = data.data;
    
    var numLote: number = value == '' ? null : parseInt(value);
    const index = this.listaFacturas.findIndex(item => item.id === id);
    if (index >= 0) {
      this.listaFacturas[index].numLote = numLote;
      const indexLotes = this.listaPedidosLotes.findIndex(item => item.pedidoFactura === pedNumero && item.codigoProducto === prodCodcor && item.codigoTalla === talCodigo);
      if (indexLotes >= 0) {
        if (numLote == null && data.data.idAsignacion == null) {
          // verifico si existe en la lista de pedidos lotes para eliminarlo
          this.listaPedidosLotes.splice(indexLotes, 1);
          return;
        } else if (numLote != null) {
          this.listaPedidosLotes[indexLotes].numLote = numLote;
        } 
      } else {
        this.listaPedidosLotes.push({
          pedidoFactura: pedNumero,
          codigoCliente: cliCodigo,
          codigoProducto: prodCodcor,
          codigoTalla: talCodigo,
          descriTalla,
          numLote,
          idAsignacion
        });
      }
    }
  }


}






