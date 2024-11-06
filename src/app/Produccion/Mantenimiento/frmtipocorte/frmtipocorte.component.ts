import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';


declare var $: any;
declare var window;

@Component({
  selector: 'app-frmtipocorte',
  templateUrl: './frmtipocorte.component.html',
  styleUrl: './frmtipocorte.component.scss'
})
export class FrmtipocorteComponent implements OnInit {
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  cmbTipoCorte?: string;
  txtObservacion?: string;

  listaTipoFacturas = [
    { co_tipoFactura: 1, tc_descripcion: 'Grande', co_valorTipoFacturas: '' },
    { co_tipoFactura: 2, tc_descripcion: 'Mediana', co_valorTipoFacturas: '' },
    { co_tipoFactura: 3, tc_descripcion: 'Pequena', co_valorTipoFacturas: '' },
  ]

  listaTipoCorte = [
    { tcorte_codigo: 1, tcorte_descri: 'PYD TON' },
  ]

  @ViewChild('GridTipoFacturas', { static: false }) GridTipoFacturas: DxDataGridComponent;


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

  
  onInitializedTipoFacturas(grid: any) {
    this.GridTipoFacturas = grid;
  }

  
  async onChangeValorTipoFacturas(descripcion: string, data: any) {
    const { co_tipoTipoFacturas } = data.data;
  }

  async onTipoCorteChange(idTipoCorte: string) {
  }

}
