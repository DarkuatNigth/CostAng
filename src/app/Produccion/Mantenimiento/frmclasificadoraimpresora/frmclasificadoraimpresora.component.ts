import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { NotificationService } from 'src/app/shared/notify.service';
import { varUser } from 'src/app/config/url.servicios';
import { FrmclasificadoraimpresoraService } from './frmclasificadoraimpresora.service';


declare var $: any;
declare var window;

interface Catalogo {
  codigo: any;
  descripcion: string;
}

@Component({
  selector: 'app-frmclasificadoraimpresora',
  templateUrl: './frmclasificadoraimpresora.component.html',
  styleUrl: './frmclasificadoraimpresora.component.scss'
})
export class FrmclasificadoraimpresoraComponent {
  title = 'Parametrización de Clasificadoras - Impresoras';
  loadingVisible: boolean = false;
  disabledBtnGuardar: boolean = false;
  cmbPlantas?: string;

  ClasificadoraImpresora: any[] = [];
  Plantas: Catalogo[] = [];

  @ViewChild('GridClasificadoraImpresora', { static: false }) GridClasificadoraImpresora: DxDataGridComponent;

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
      private _service: FrmclasificadoraimpresoraService,
      private _notificationService: NotificationService,
    ) {
      this.loadingVisible = true;
      this._service.getClasificadoraImpresora().subscribe((data) => {
        this.ClasificadoraImpresora = data.Dt.Table;
        console.log(this.ClasificadoraImpresora, 'ClasificadoraImpresora');
        this.Plantas = [];
        // obtener las plantas únicas del resultado (codPlanta, planta) y agregarlas al combo
        data.Dt.Table.forEach((item: any) => {
          if (!this.Plantas.find(x => x.codigo === item.codPlanta)) {
            this.Plantas.push({ codigo: item.codPlanta, descripcion: item.planta });
          }
        });
        this.loadingVisible = false;
      });
    }

  onClickNuevo() {
    this.cmbPlantas = null;
    //this.ClasificadoraImpresora = [];
  }

  async onClickGuardar() {
    this.loadingVisible = true;
    if (!this.validarDatos()) {
      this.loadingVisible = false;
      return;
    }

    // obtener el detalle solo con los valores que tienen valor o valorAutomatico
    const detalle = this.ClasificadoraImpresora.filter(x => x.Ip).map(x => {
      return {
        claCodigo: x.claCodigo, 
        Ip: x.Ip, 
        Id: x.Id
      }
    });

    const data = {
      accion: 'I',
      detalle: detalle,
      userAud: localStorage.getItem(varUser)
    }
    await this._service.postClasificadoraImpresora(data).subscribe((data) => {
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
    if (!this.cmbPlantas) {
      this._notificationService.error('Debe seleccionar una planta');
      return false;
    }
    const ClasificadoraImpresora = this.ClasificadoraImpresora.filter(x => x.Ip);
    if (ClasificadoraImpresora.length == 0) {
      this._notificationService.error('Debe ingresar al menos un valor de Ip para una clasificadora');
      return false;
    }
    return true;
  }

  onInitializedClasificadoraImpresora(grid: any) {
    this.GridClasificadoraImpresora = grid;
  }

  async onChangeValorIpImpresora(value: number, data: any) {
    const { claCodigo } = data.data;
    const index = this.ClasificadoraImpresora.findIndex(x => x.claCodigo === claCodigo);
    this.ClasificadoraImpresora[index].Ip = value;
  }

  async onPlantaChange(idPlanta: string) {
    this.cmbPlantas = idPlanta;
  }

}
