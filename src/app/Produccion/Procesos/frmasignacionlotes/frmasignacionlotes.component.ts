import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';


declare var $: any;
declare var window;

@Component({
  selector: 'app-frmasignacionlotes',
  templateUrl: './frmasignacionlotes.component.html',
  styleUrl: './frmasignacionlotes.component.scss'
})
export class FrmasignacionlotesComponent implements OnInit {
  title = 'Asignación de Lotes a Facturas';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  txtObservacion: string = '';
  
  listaFacturas = [
    { numFactura: 'S 0001/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', Lote: '' },
    { numFactura: 'S 0002/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', Lote: '' },
    { numFactura: 'S 0003/2024', cliente: 'H SMITH FOOD', codProducto: '6304', Producto: 'PYD-T-OFF', Lote: '' },
    { numFactura: 'S 0004/2024', cliente: 'LIDL STIFOOD', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', Lote: '' },
    { numFactura: 'S 0005/2024', cliente: 'SEAFOOD TRADING COR', codProducto: '6304', Producto: 'PYD-OFF-BLOQUE', Lote: '' },
  ]

  @ViewChild('GridFacturas', { static: false }) GridFacturas: DxDataGridComponent;


  async ngOnInit() {
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

  
  onInitializedFacturas(grid: any) {
    this.GridFacturas = grid;
  }

  
  async onChangeValorFacturas(descripcion: string, data: any) {
    const { co_tipoFacturas } = data.data;
  }


}






