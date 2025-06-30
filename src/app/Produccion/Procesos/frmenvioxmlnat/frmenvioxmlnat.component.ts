import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { NotificationService } from 'src/app/shared/notify.service';
import { FrmenvioxmlnatService } from './frmenvioxmlnat.service';
import { formatDate } from '@angular/common';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { firstValueFrom } from 'rxjs';
import { int } from '@zxing/library/esm/customTypings';
import * as moment from 'moment';

@Component({
  selector: 'app-frmenvioxmlnat',
  templateUrl: './frmenvioxmlnat.component.html',
  styleUrl: './frmenvioxmlnat.component.scss'
})

export class FrmenvioxmlnatComponent implements OnInit {

  listaLotes: any[] = [];
  fechaDesde: Date = new Date();
  fechaHasta: Date = new Date();
  fechaDesdeStr: string = '';
  fechaHastaStr: string = '';
  title = 'Buscar Lotes Naturisa';
  loadingVisible: boolean = false;

  @ViewChild('gridLotes', { static: false }) gridLotes: DxDataGridComponent;

  async ngOnInit() {
  }
  
  public constructor(
    private _service: FrmenvioxmlnatService,
    private _notificationService: NotificationService,
  ) {
    // Initialization logic can go here if needed

    // this.fechaDesdeStr = moment(this.fechaDesde).format('YYYY/MM/DD');
    // this.fechaHastaStr = moment(this.fechaHasta).format('YYYY/MM/DD');
    
    // try {
    //     this._service.loteNaturisaParaEnvioConsultar(this.fechaDesdeStr, this.fechaHastaStr).subscribe((data) => {
    //       if (data.Codigo){
    //         this.listaLotes = data.Dt.Table;
    //       }
    //       else {
    //         await this.showAlert('','Error al consultar lotes: ' + data.Description,'error');
    //       }
    //     });
    // }
    // catch (error) {
    //   this.showAlert('','Error al consultar lotes: ' + error.message,'error');
    // }
  } 


  onInitializedGridLotes(grid: any) {
    this.gridLotes = grid;
  }

  async onClickConsultar() {    

    this.loadingVisible = true;

    //unchecked all rows in the grid
    this.gridLotes.instance.clearSelection();

    this.fechaDesdeStr = moment(this.fechaDesde).format('YYYY/MM/DD');
    this.fechaHastaStr = moment(this.fechaHasta).format('YYYY/MM/DD');
    
    try {
        const valor = await new Promise(async (resolve) => {
          await this._service.loteNaturisaParaEnvioConsultar(this.fechaDesdeStr, this.fechaHastaStr).subscribe(async(data) => {
          if (data.Codigo){
            this.listaLotes = data.Dt.Table;
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
    const selectedLotes = selectedRows.map(row => row.rlo_numero);

    let ejecutarJob: int = 0;
    let lotesOk = 0;

    // Ejecutar el servicio para cada lote
    for (const lote of selectedLotes) {

      try {
        const valor = await new Promise(async (resolve) => {
          await this._service.loteNaturisaEnviarXml(lote.toString(), ejecutarJob).subscribe(async(response) => {
          if (response.Codigo) {
            lotesOk++;
            return resolve(true);
          }
          else {
            await this.showAlert('','Error al enviar el lote ' + lote + ': ' + response.Description,'error');
            return resolve(false);
          }
        })});

        // const response = await firstValueFrom(this._service.loteNaturisaEnviarXml(lote.toString(), ejecutarJob));
        // if (response.Codigo){
        //   lotesOk++;
        //   console.log(`Lote ${lote} enviado correctamente.`);
        // }
        // else {
        //   this.showAlert('','Error al enviar el lote ' + lote + ': ' + response.Description,'error');
        // }

      } catch (error) {
        this.showAlert('','Error al enviar el lote ' + lote + ': ' + error.message,'error');
      }
    } // End of for loop

        //         //Identificar si es el ultimo lote de la cola
        // if (lote === selectedLotes[selectedLotes.length - 1]){
        //   ejecutarJob = 1;
        // }

    //Si se enviaron lotes correctamente, ejecutar el job Sql
    if (lotesOk > 0) {
      try {
        ejecutarJob = 1;
        
        // await firstValueFrom(this._service.loteNaturisaEnviarXml(null, ejecutarJob));

        const valor = await new Promise(async (resolve) => {
          await this._service.loteNaturisaEnviarXml(null, ejecutarJob).subscribe(async(response) => {
          if (response.Codigo) {
            this.gridLotes.instance.clearSelection();
            await this.showAlert('','Lotes procesados correctamente.','success');
            return resolve(true);
          }
          else {
            await this.showAlert('','Se ha generado un error al ejecutar tarea de envío de xml: ' + response.Description,'error');
            return resolve(false);
          }
        })});
      } catch (error) {
        this.showAlert('','Se ha generado un error al ejecutar tarea de envío de xml: ' + error.message,'error');
      }
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
