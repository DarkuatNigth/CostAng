import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular';
import { FrmenviadatosempagranService } from './frmenviadatosempagran.service';
import Swal from 'sweetalert2/src/sweetalert2.js';
import * as moment from 'moment';

@Component({
  selector: 'app-frmenviadatosempagran',
  templateUrl: './frmenviadatosempagran.component.html',
  styleUrl: './frmenviadatosempagran.component.scss'
})
export class FrmenviadatosempagranComponent implements OnInit {
  
  listaLotes: any[] = [];
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  fechaDesdeStr: string = '';
  fechaHastaStr: string = '';
  title = 'Enviar Lotes Empagran';
  loadingVisible: boolean = false;
  columnasTitulo = [];

  applyFilterTypes = [{
    key: 'auto',
    name: 'Immediately',
  }, {
    key: 'onClick',
    name: 'On Button Click',
  }];
  currentFilter = this.applyFilterTypes[0].key;

  @ViewChild('gridLotes', { static: false }) gridLotes: DxDataGridComponent;

  
  constructor(
      private _service: FrmenviadatosempagranService,
  ) { }


  ngOnInit(): void {
  }


  onInitializedGridLotes(grid: any) {
    this.gridLotes = grid;
  }


  async onClickConsultar() {    
    this.loadingVisible = true;
    this.gridLotes.instance.clearSelection();
    this.fechaDesdeStr = moment(this.fechaDesde).format('YYYY/MM/DD');
    this.fechaHastaStr = moment(this.fechaHasta).format('YYYY/MM/DD');
    try {
        const valor = await new Promise(async (resolve) => {
          await this._service.obtenerLotesEnvioApiEmpagran(this.fechaDesdeStr, this.fechaHastaStr).subscribe(async(data) => {
          if (data.Codigo){
            this.listaLotes = data.Dt.Table;
            if (this.listaLotes.length) {
              let Columns = [];
              for ( let x = 0; x < Object.entries(this.listaLotes[0]).length; x += 1 ) {
                Columns.push(
                  Object.entries(this.listaLotes[0])[ x ][0].toString()
                );
              }
              this.columnasTitulo = JSON.parse(JSON.stringify(Columns));
            }
            return resolve(true);
          }
          else {
            await this.showAlert('','Error al consultar lotes: ' + data.Description,'error');
            return resolve(false);
          }
        })});
    }
    catch (error) {
      await this.showAlert('','Error al consultar lotes: ' + error.message,'error');
    }
    this.loadingVisible = false;
  };


  async onClickEnviar() {
    this.loadingVisible = true;
    const selectedRows = this.gridLotes.instance.getSelectedRowsData();
    if (selectedRows.length === 0) {
      this.showAlert('','Debe seleccionar al menos un lote para enviar.','warning');
      return;
    }
    const selectedLotes = selectedRows.map(row => row.lote);
    let lotesOk = 0;
    // Ejecutar el servicio para cada lote
    for (const lote of selectedLotes) {
      try {
        const valor = await new Promise(async (resolve) => {
          await this._service.enviaDataApiEmpagran(lote.toString()).subscribe(async(response) => {
          if (response.Codigo) {
            lotesOk++;
            return resolve(true);
          }
          else {
            await this.showAlert('','Error al enviar el lote ' + lote + ': ' + response.Description,'error');
            return resolve(false);
          }
        })});
      } catch (error) {
        this.showAlert('','Error al enviar el lote ' + lote + ': ' + error.message,'error');
      }
    }
    if (lotesOk > 0) {
      this.showAlert('','Lotes procesados correctamente.','success');
      this.gridLotes.instance.clearSelection();
      await this.onClickConsultar();
    }
    this.loadingVisible = false;

  };


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
  };

}
