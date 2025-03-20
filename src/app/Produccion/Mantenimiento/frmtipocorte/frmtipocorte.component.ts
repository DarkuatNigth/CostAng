import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { FrmtipocorteService } from './frmtipocorte.service';
import { NotificationService } from 'src/app/shared/notify.service';
import { varUser } from 'src/app/config/url.servicios';


declare var $: any;
declare var window;


interface Catalogo {
  codigo: any;
  descripcion: string;
}

interface Tallas_TiemposCortes {
  tipo: string;
  codigo: string;
  descripcion: string;
  valor: number;
  valorAutomatico: number;
  idValorCorte: number;
}

@Component({
  selector: 'app-frmtipocorte',
  templateUrl: './frmtipocorte.component.html',
  styleUrl: './frmtipocorte.component.scss'
})
export class FrmtipocorteComponent implements OnInit {
  title = 'Parametrización de Tiempos de Corte';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  cmbTipoCorte?: number;
  cmbTipo?: string;

  Tallas_TiemposCortes: Tallas_TiemposCortes[] = [];
  TiposCortes: Catalogo[] = []
  Tipos: Catalogo[] = [
    { codigo: 'SC', descripcion: 'Cola' },
    { codigo: 'CC', descripcion: 'Entero' }
  ]

  @ViewChild('GridTallas_TiemposCortes', { static: false }) GridTallas_TiemposCortes: DxDataGridComponent;

  
  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];

  currentFilter = this.applyFilterTypes[0].key;
  

  async ngOnInit() {
    this.onClickNuevo();
  }

  public constructor(
    private _service: FrmtipocorteService,
    private _notificationService: NotificationService,
  ) {
    this.loadingVisible = true;
    this._service.getTiposCortes().subscribe((data) => {
      this.TiposCortes = data.Dt.Table;
      this.Tallas_TiemposCortes = data.Dt.Table1.map((x: any) => {
        return {
          tipo: x.tipo,
          codigo: x.codigo,
          descripcion: x.descripcion,
          valor: null,
          valorAutomatico: null,
          idValorCorte: null
        }
      });
      this.loadingVisible = false;
    });
  }

  onClickNuevo() {
    this.cmbTipoCorte = null;
    this.cmbTipo = 'SC';
    this.Tallas_TiemposCortes.forEach(x => {x.valor = null; x.valorAutomatico = null; x.idValorCorte = null});
  }

  async onClickGuardar() {
    this.loadingVisible = true;
    if (!this.validarDatos()) {
      this.loadingVisible = false;
      return;
    }

    // obtener el detalle solo con los valores que tienen valor o valorAutomatico
    const detalle = this.Tallas_TiemposCortes.filter(x => x.valor || x.valorAutomatico).map(x => {
      return {
        codigoCorte: this.cmbTipoCorte,
        descriCorte: this.TiposCortes.find(y => y.codigo == this.cmbTipoCorte).descripcion,
        codigoTalla: x.codigo,
        descriTalla: x.descripcion,
        valor: x.valor || 0,
        valorAutomatico: x.valorAutomatico || 0,
        idValorCorte: x.idValorCorte
      }
    });

    const data = {
      detalle: detalle,
      userAud: localStorage.getItem(varUser)
    }
    await this._service.guardarValoresTipoCorte(data).subscribe((data) => {
      this.loadingVisible = false;
      if (data.Codigo) {
        this._notificationService.sucess( `Registro guardado correctamente` );
        this.onClickNuevo();
      } else {
        this._notificationService.error( `Error al guardar el registro` + data.Description );
      }
    });
    this.loadingVisible = false;
  }

  validarDatos(): boolean {
    if (!this.cmbTipoCorte) {
      this._notificationService.error('Debe seleccionar un tipo de corte');
      return false;
    }
    const Tallas_TiemposCortes = this.Tallas_TiemposCortes.filter(x => x.valor || x.valorAutomatico);
    if (Tallas_TiemposCortes.length == 0) {
      this._notificationService.error('Debe ingresar al menos un valor de tiempo de corte para una talla');
      return false;
    }
    return true;
  }
  async onItemPrintClick() {
  }

  
  onInitializedTipoFacturas(grid: any) {
    this.GridTallas_TiemposCortes = grid;
  }

  
  async onChangeValorCorte(value: number, data: any) {
    const { codigo } = data.data;
    const index = this.Tallas_TiemposCortes.findIndex(x => x.codigo === codigo);
    this.Tallas_TiemposCortes[index].valor = value;
  }

  async onChangeValorAutCorte(value: number, data: any) {
    const { codigo } = data.data;
    const index = this.Tallas_TiemposCortes.findIndex(x => x.codigo === codigo);
    this.Tallas_TiemposCortes[index].valorAutomatico = value;
  }

  async onTipoCorteChange(idTipoCorte: number) {
    this.cmbTipoCorte = idTipoCorte;
    this.Tallas_TiemposCortes.forEach(x => {x.valor = null; x.valorAutomatico = null; x.idValorCorte = null});
    await this._service.getValoresTiposCortes(idTipoCorte).subscribe((data) => {
      var response: any[] = data.Dt.Table;
      if (response.length > 0) {
        response.forEach(x => {
          const index = this.Tallas_TiemposCortes.findIndex(y => y.codigo == x.pcd_codigoTalla);
          if (index >= 0) {
            this.Tallas_TiemposCortes[index].valor = x.pcd_valor;
            this.Tallas_TiemposCortes[index].valorAutomatico = x.pcd_valorAutomatico;
            this.Tallas_TiemposCortes[index].idValorCorte = x.pcd_id;
          }
        });
      }
    });
  }

  async onTipoChange(idTipo: string) {
    this.cmbTipo = idTipo;
  }

}

