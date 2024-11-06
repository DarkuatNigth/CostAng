import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';


declare var $: any;
declare var window;

@Component({
  selector: 'app-frmplanificacionparametrizacion',
  templateUrl: './frmplanificacionparametrizacion.component.html',
  styleUrl: './frmplanificacionparametrizacion.component.scss'
})
export class FrmplanificacionparametrizacionComponent implements OnInit {
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;

  listaParametros = [
    { co_tipoFactura: 1, tc_descripcion: 'Capacidad IQF', co_valorParametros: '' },
    { co_tipoFactura: 2, tc_descripcion: 'Máximo Día', co_valorParametros: '' },
    { co_tipoFactura: 3, tc_descripcion: 'Máximo Noche', co_valorParametros: '' },
  ]

  @ViewChild('GridParametros', { static: false }) GridParametros: DxDataGridComponent;


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

  
  onInitializedParametros(grid: any) {
    this.GridParametros = grid;
  }

  
  async onChangeValorParametros(descripcion: string, data: any) {
    const { co_tipoParametros } = data.data;
  }


}






