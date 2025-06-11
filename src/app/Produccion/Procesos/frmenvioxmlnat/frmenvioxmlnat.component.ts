import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxDataGridComponent, DxDataGridTypes } from 'devextreme-angular/ui/data-grid';
import { NotificationService } from 'src/app/shared/notify.service';
import { FrmenvioxmlnatService } from './frmenvioxmlnat.service';
import { formatDate } from '@angular/common';


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
    this._service.getLotesEnvioNaturisaByFecha(this.fechaDesdeStr, this.fechaHastaStr).subscribe((data) => {
      console.log(this.fechaDesdeStr);
      this.listaLotes = data.Dt.Table;
    });
  } 


  onInitializedGridLotes(grid: any) {
    this.gridLotes = grid;
  }

  async onClickConsultar() {    

    //unchecked all rows in the grid
    this.gridLotes.instance.clearSelection();

    this.fechaDesdeStr = formatDate(this.fechaDesde, 'yyyy/MM/dd', 'en-US');
    this.fechaHastaStr = formatDate(this.fechaHasta, 'yyyy/MM/dd', 'en-US');
    this._service.getLotesEnvioNaturisaByFecha(this.fechaDesdeStr, this.fechaHastaStr).subscribe((data) => {
      console.log(this.fechaDesdeStr);
      this.listaLotes = data.Dt.Table;
    });

  };

  async onChangeFechaDesde(event: any) {
    this.fechaDesde = event.value;
    console.log('Fecha Desde:', this.fechaDesde.toDateString());
  };

  async onChangeFechaHasta(event: any) {
    this.fechaHasta = event.value;
    console.log('Fecha Hasta:', this.fechaHasta.toDateString());
  };

}
