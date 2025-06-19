import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridComponent, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { NotificationService } from 'src/app/shared/notify.service';
import { FrmenvioxmlnatService } from './frmenvioxmlnat.service';
import { formatDate } from '@angular/common';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { firstValueFrom } from 'rxjs';
import { int } from '@zxing/library/esm/customTypings';


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
    // format this.fechaDesde as yyyy/MM/dd as string
    
    //declare local string variable to hold formatted date
    this.fechaDesdeStr = formatDate(this.fechaDesde, 'yyyy/MM/dd', 'en-US');
    this.fechaHastaStr = formatDate(this.fechaHasta, 'yyyy/MM/dd', 'en-US');
    
    try {
        this._service.loteNaturisaParaEnvioConsultar(this.fechaDesdeStr, this.fechaHastaStr).subscribe((data) => {
          if (data.Codigo){
            this.listaLotes = data.Dt.Table;
          }
          else {
            throw new Error(data.Description);
          }
        });
    }
    catch (error) {
      console.error('Error al consultar lotes:', error);
    }
  } 


  onInitializedGridLotes(grid: any) {
    this.gridLotes = grid;
  }

  async onClickConsultar() {    

    //unchecked all rows in the grid
    this.gridLotes.instance.clearSelection();

    this.fechaDesdeStr = formatDate(this.fechaDesde, 'yyyy/MM/dd', 'en-US');
    this.fechaHastaStr = formatDate(this.fechaHasta, 'yyyy/MM/dd', 'en-US');
    
    try {
        this._service.loteNaturisaParaEnvioConsultar(this.fechaDesdeStr, this.fechaHastaStr).subscribe((data) => {
          if (data.Codigo){
            this.listaLotes = data.Dt.Table;
          }
          else {
            throw new Error(data.Description);
          }
        });
    }
    catch (error) {
      console.error('Error al consultar lotes:', error);
    }
  };

  async onClickEnviar() {
    
    this.loadingVisible = true;

    const selectedRows = this.gridLotes.instance.getSelectedRowsData();

    if (selectedRows.length === 0) {
      this.showAlert('','Debe seleccionar al menos un lote para enviar.','warning');
      return;
    }
    const selectedLotes = selectedRows.map(row => row.rlo_numero);
    console.log('Lotes seleccionados para enviar:', selectedLotes);

    let ejecutarJob: int = 0;
    let lotesOk = 0;

    // Ejecutar el servicio para cada lote
    for (const lote of selectedLotes) {

      try {
        //Identificar si es el ultimo lote de la cola
        if (lote === selectedLotes[selectedLotes.length - 1]){
          ejecutarJob = 1;
        }

        // forma 2
        // this._service.loteNaturisaEnviarXml(lote.toString(), ejecutarJob).subscribe((data) => {
        //   if (data.Codigo){
        //     lotesOk++;
        //     console.log(`Lote ${lote} enviado correctamente.`);
        //   }
        //   else {
        //     throw new Error(data.Description);
        //   }
        // });


        // forma 1
        // this._service.loteNaturisaEnviarXml(lote.toString(), ejecutarJob).subscribe({
        //   next: (response) => {
        //     console.log('Respuesta del servidor:', response);
        //     if (response.Codigo) {
        //       lotesOk++;
        //       console.log(`Lote ${lote} enviado correctamente.`);
        //     }
        //     else {
        //       throw new Error(response.Description);
        //     }
        //   },
        //   error: (error) => {
        //     console.error(`Error al enviar el lote ${lote}:`, error);
        //     this.showAlert('','Error al enviar el lote ' + lote + ': ' + error.message,'error');
        //   },
        //   complete: () => {
        //     console.log(`Proceso de envío del lote ${lote} completado.`);
        //   }
        // });

        const response = await firstValueFrom(this._service.loteNaturisaEnviarXml(lote.toString(), ejecutarJob));
        if (response.Codigo){
          lotesOk++;
          console.log(`Lote ${lote} enviado correctamente.`);
        }
        else {
          throw new Error(response.Description);
        }
      } catch (error) {
        this.showAlert('','Error al enviar el lote ' + lote + ': ' + error.message,'error');
      }
    } // End of for loop

    //Si se enviaron lotes correctamente, ejecutar el job Sql
    if (lotesOk > 0) {
      try {
        ejecutarJob = 1;
        await firstValueFrom(this._service.loteNaturisaEnviarXml(null, ejecutarJob));
        this.gridLotes.instance.clearSelection();
        this.showAlert('','Lotes procesados correctamente.','success');
      } catch (error) {
        this.showAlert('','Error al enviar el lote : ' + error.message,'error');
      }
    }

    this.loadingVisible = false;

  };

  async onChangeFechaDesde(event: any) {
    this.fechaDesde = event.value;
  };

  async onChangeFechaHasta(event: any) {
    this.fechaHasta = event.value;
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
