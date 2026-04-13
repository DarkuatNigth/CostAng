import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { varUser } from 'src/app/config/url.servicios';
import Swal from 'sweetalert2';
import { int } from '@zxing/library/esm/customTypings';
import * as moment from 'moment';
import { FrmlotesespecialesService } from './frmlotesespeciales.service';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-frmlotesespeciales',
  // standalone: true,
  // imports: [CommonModule],
  templateUrl: './frmlotesespeciales.component.html',
  styleUrl: './frmlotesespeciales.component.scss'
})

export class FrmlotesespecialesComponent {

  loadingVisible: boolean = false;
  le_fecha : Date = new Date();
  le_numerolotes : number = 0;
  le_tipoSeleccionado = 'AMBAS';
  tbLotesEspeciales: any;
  usuario?: string;

constructor(private _service: FrmlotesespecialesService) {}

  async ngOnInit() {
    this.loadingVisible = true;
    this.usuario = localStorage.getItem(varUser) ?? undefined;
    this.loadingVisible = false;
  }

  async onClickGuardar() {
    //Validar
    if (this.le_numerolotes <= 0) {
      await this.showAlert('Validación', 'El número de lotes debe ser mayor a 0', 'warning');
      return;
    }

    if (!this.le_fecha) {
      await this.showAlert('Validación', 'Debe seleccionar una fecha', 'warning');
      return;
    }
    //validar radio btutton selected
    if (!this.le_tipoSeleccionado) {
      await this.showAlert('Validación', 'Debe seleccionar un tipo de lote', 'warning');
      return;
    }

    let tipoCCSC = '';
    switch (this.le_tipoSeleccionado) {
      case 'ENTERO':
        tipoCCSC = 'CC';
        break;
      case 'COLA':
        tipoCCSC = 'SC';
        break;
      case 'AMBAS':
        tipoCCSC = '';
        break;
      default:
        tipoCCSC = '';
    }

    let fechaFormateada = moment.default(this.le_fecha).format('YYYY/MM/DD');

    console.log('Lotes a crear:', this.le_numerolotes);
    console.log('Fecha seleccionada:', this.le_fecha);
    console.log('Fecha formateada:', fechaFormateada);
    console.log('Tipo seleccionado:', this.le_tipoSeleccionado);  
    console.log('Tipo CCSC:', tipoCCSC);


    await new Promise(async (resolve) => {
      const observable = await this._service.lotesEspecialesGrabar(this.le_numerolotes, fechaFormateada, tipoCCSC, this.usuario || '');

      console.log('Respuesta del servicio (observable):', observable);

      observable.subscribe(async(data) => {
        console.log('Respuesta del servicio:', data);
        if (data.Codigo) {
          this.tbLotesEspeciales = data.Dt.Table;
          await this.showAlert('', 'Lotes creados correctamente', 'success');
          resolve(true);
        }
        else {
          await this.showAlert('', data.Description, 'error');
          resolve(false);
        }
      });
    });
    
  }

  async onClickRptExcel() {

    //add sample data to tbLotesEspeciales
    if (!this.tbLotesEspeciales || this.tbLotesEspeciales.length === 0) {
      this.tbLotesEspeciales = [
        { Lote: 'Lote1', Proveedor: 'Proveedor1', Piscina: 'CC' },
        { Lote: 'Lote2', Proveedor: 'Proveedor2', Piscina: 'SC' },
        { Lote: 'Lote3', Proveedor: 'Proveedor3', Piscina: 'CC' }
      ];
    }

    // Export tbLotesEspeciales to Excel
    if (!this.tbLotesEspeciales || this.tbLotesEspeciales.length === 0) {
      await this.showAlert('', 'No hay datos para exportar', 'info');
      return;
    }

    // Format date for filename (YYYYMMDD)
    const fecha = this.le_fecha ? moment.default(this.le_fecha).format('YYYYMMDD') : moment.default().format('YYYYMMDD');
    const fileName = `MacroLotes_${fecha}.xlsx`;

    // Convert data to worksheet
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.tbLotesEspeciales);
    // Create workbook
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LotesEspeciales');
    // Write workbook to binary array
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    // Save file with date in filename
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);
    await this.showAlert('', 'Excel generado exitosamente.', 'success');
  }

  onChangeFecha(e: any) {

  }

  async showAlert(title, mensaje, tipo) {
      this.loadingVisible = false;
  
      return new Promise(async (resolve) => {
        await Swal.fire({
          title: title,
          html:
            "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" +
            mensaje.replace(/\n|\\n/g, '<br>') +
            '</div>',
          icon: tipo,
          showCancelButton: false,
          confirmButtonColor:
            tipo === 'error'
              ? '#d33'
              : tipo === 'warning'
              ? '#ff9800'
              : tipo === 'success'
              ? '#4CAF50'
              : tipo === 'info'
              ? '#2196F3'
              : '',
          confirmButtonText: 'Aceptar',
        }).then((result) => {
          return resolve(true);
        });
      });
  }

}
