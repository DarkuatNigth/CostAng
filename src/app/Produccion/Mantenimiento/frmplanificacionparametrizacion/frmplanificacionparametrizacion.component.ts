import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { FrmplanificacionparametrizacionService } from './frmplanificacionparametrizacion.service';
import { NotificationService } from 'src/app/shared/notify.service';
import { DecimalPipe } from '@angular/common';
import { varUser } from 'src/app/config/url.servicios';


declare var $: any;
declare var window;

interface Parametro {
  pgv_codigo: string;
  pgv_descri: string;
  pgv_valor: number;
}


@Component({
  selector: 'app-frmplanificacionparametrizacion',
  templateUrl: './frmplanificacionparametrizacion.component.html',
  styleUrl: './frmplanificacionparametrizacion.component.scss'
})
export class FrmplanificacionparametrizacionComponent implements OnInit {
  title = 'Parametrizacion de Capacidades';
  loadingVisible: boolean = false;
  listaParametros: Parametro[] = [];

  @ViewChild('GridParametros', { static: false }) GridParametros: DxDataGridComponent;
  editorOptions: DxDataGridTypes.Column['editorOptions'];

  customizeText(options) {
    return options.valueText;
  }

  async ngOnInit() {
  }

  public constructor(
    private _service: FrmplanificacionparametrizacionService,
    private _notificationService: NotificationService,
    private decimalPipe: DecimalPipe,
  ) {
    this._service.getParametrizacionGeneral().subscribe((data) => {
      this.listaParametros = data.Dt.Table;
    });
    this.editorOptions = {
      format: 'currency',
    };
  }

  async onClickGuardar() {
    this.loadingVisible = true;
    const usuario = localStorage.getItem(varUser);
    if (!this.validarDatos()) {
      this.loadingVisible = false;
      return;
    }
    const data = {
      detalle: this.listaParametros,
      userAud: usuario
    };
    this._service.postGuardarParametrizacionGeneral(data).subscribe((data) => {
      if (data.Codigo) {
        this._notificationService.sucess('Datos guardados correctamente');
      } else {
        this._notificationService.error('Error al guardar los datos');
      }
      this.loadingVisible = false;
    });
  }

  validarDatos(): boolean {
    let isValid = true;
    this.listaParametros.forEach((x) => {
      if (!x.pgv_valor) {
        this._notificationService.error('Debe ingresar el valor del parametro ' + x.pgv_descri);
        isValid = false;
        return;
      }
    });
    return isValid;
  }
  
  onInitializedParametros(grid: any) {
    this.GridParametros = grid;
  }
  
  async onChangeValorParametros(value: string, cell: any) {
    const { pgv_codigo } = cell.data;
    const index = this.listaParametros.findIndex(x => x.pgv_codigo === pgv_codigo);
    this.listaParametros[index].pgv_valor = parseFloat(value.replace(/,/g, ''));
  }

  formatValue(cell: any) {
    if (cell.value !== null && cell.value !== undefined) {
      const cellValue = parseFloat(cell.value.toString().replace(/,/g, ''));
      cell.value = this.decimalPipe.transform(cellValue, '1.2-2');
    }
    // this.GridParametros.instance.refresh();
  }

}






