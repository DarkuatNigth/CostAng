
import { Component, OnInit } from '@angular/core';
import { FrmdiasparadaplantaService } from './frmdiasparadaplanta.service';
import { varUser } from 'src/app/config/url.servicios';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { int } from '@zxing/library/esm/customTypings';
import * as moment from 'moment';


@Component({
  selector: 'app-frmdiasparadaplanta',
  templateUrl: './frmdiasparadaplanta.component.html',
  styleUrl: './frmdiasparadaplanta.component.scss'
})
export class FrmdiasparadaplantaComponent implements OnInit {

  constructor(private _service: FrmdiasparadaplantaService) {}

  loadingVisible: boolean = false;
  pp_fecha: Date = new Date();
  pa_codigo: int = 0;
  pp_tipo: string = '';
  pp_libras: number = 0;
  listaPlanta = [];
  listaTipoProceso = [];
  listaDiasParaPlanta = [];
  prevFecha: Date = null;
  listaTurno = [];
  pp_turno: string = '';

  async ngOnInit() {
    await this.PlantasLoad();
    if (this.listaPlanta.length > 0) {
      this.pa_codigo = this.listaPlanta[0].pa_codigo;
    }

    await this.CatalogosTipoProcesoLoad();
    if (this.listaTipoProceso.length > 0) {
      this.pp_tipo = this.listaTipoProceso[0].det_codigo;
    }

    await this.CatalogoTurnoLoad();
    if (this.listaTurno.length > 0) {
      this.listaTurno.unshift({ det_codigo: '', det_descripcion: 'Todos' });
      this.pp_turno = this.listaTurno[0].det_codigo;
    }

    await this.DiasParaPlantaConsultar();

    this.loadingVisible = false;
  }

  async PlantasLoad() {
    return new Promise<void>((resolve) => {
      this._service.getPlantas('frmdiasparadaplanta').subscribe({
        next: (data) => {
          if (data.Codigo && data.Dt.Table.length > 0) {
            this.listaPlanta = data.Dt.Table;
          } else {
            this.listaPlanta = data.Dt.Table;
          }
          resolve();
        },
        error: async (error) => {
          await this.showAlert('Error', 'Error al cargar plantas', 'error');
          resolve();
        }
      });
    });
  }

  async CatalogosTipoProcesoLoad() {
    return new Promise<void>((resolve) => {
      this._service.getCatalogosTipoProceso('1').subscribe({
        next: (data) => {
          if (data.Codigo && data.Dt.Table.length > 0) {
            this.listaTipoProceso = data.Dt.Table;
          } else {
            this.listaTipoProceso = data.Dt.Table;
          }
          resolve();
        },
        error: async (error) => {
          await this.showAlert('Error', 'Error al cargar los tipos de proceso', 'error');
          resolve();
        }
      });
    });
  }

  async CatalogoTurnoLoad() {
    return new Promise<void>((resolve) => {
      this._service.getCatalogoTurno('TURNO').subscribe({
        next: (data) => {
          if (data.Codigo && data.Dt.Table.length > 0) {
            this.listaTurno = data.Dt.Table;
          } else {
            this.listaTurno = data.Dt.Table;
          }
          resolve();
        },
        error: async (error) => {
          await this.showAlert('Error', 'Error al cargar turnos', 'error');
          resolve();
        }
      });
    });
  }

  async DiasParaPlantaConsultar() {
    this.loadingVisible = true;
    return new Promise<void>((resolve) => {
      this._service.diasParaPlantaConsultar(this.pa_codigo.toString(), this.pp_tipo, moment(this.pp_fecha).format('YYYY/MM/DD')).subscribe({
        next: (data) => {
          this.loadingVisible = false;
          if (data.Codigo && data.Dt.Table.length > 0) {
            this.listaDiasParaPlanta = data.Dt.Table;
          } else {
            this.listaDiasParaPlanta = data.Dt.Table;
          }
          resolve();
        },
        error: async (error) => {
          this.loadingVisible = false;
          await this.showAlert('Error', 'Error al cargar los días para la planta', 'error');
          resolve();
        }
      });
    });
  }



async onClickAddDias() {

    //validate libras are valid
    if (this.pp_tipo === 'PA' && (this.pp_libras === null || this.pp_libras === undefined || isNaN(this.pp_libras) || this.pp_libras <= 0)) {
      await this.showAlert('Alerta', 'Ingrese un valor válido para libras.', 'warning');
      return;
    }

    //validate planta and fecha does not exist in listaDiasParaPlanta
    if (this.listaDiasParaPlanta.some(dia => dia.pp_paCodigo === this.pa_codigo && dia.pp_fecha === moment(this.pp_fecha).format('YYYY/MM/DD'))) {
      
      const existingRow = this.listaDiasParaPlanta.find(dia => dia.pp_paCodigo === this.pa_codigo && dia.pp_fecha === moment(this.pp_fecha).format('YYYY/MM/DD'));

      const jsonData = {
        pp_id: existingRow.pp_id,
        pp_paCodigo: existingRow.pp_paCodigo,
        pp_fecha: existingRow.pp_fecha,
        pp_tipo: existingRow.pp_tipo,
        pp_libras: this.pp_libras,
        pp_usuario: existingRow.pp_usuario,
        pp_turno: existingRow.pp_turno === '' ? null : existingRow.pp_turno,
      };
      await this.diasParaPlantaGuardar(localStorage.getItem(varUser), JSON.stringify(jsonData));
    }
    else {

      this.listaDiasParaPlanta.push({
        pp_id: 0,
        pp_paCodigo: this.pa_codigo,
        pp_fecha: moment(this.pp_fecha).format('YYYY/MM/DD'),
        pp_tipo: this.pp_tipo,
        pp_libras: this.pp_libras,
        pp_usuario: await localStorage.getItem(varUser),
        pp_turno: this.pp_turno
      });
      const jsonData = this.listaDiasParaPlanta.map(r => ({
        pp_id: r.pp_id,
        pp_paCodigo: r.pp_paCodigo,
        pp_fecha: r.pp_fecha,
        pp_tipo: r.pp_tipo,
        pp_libras: r.pp_libras,
        pp_usuario: r.pp_usuario,
        pp_turno: r.pp_turno === '' ? null : r.pp_turno,
      }));
      await this.diasParaPlantaGuardar(localStorage.getItem(varUser), JSON.stringify(jsonData));
    }
    await this.DiasParaPlantaConsultar();
  }

  async diasParaPlantaGuardar(usuario: string, jsonData: string) {

    this.loadingVisible = true;
    
    await new Promise(async (resolve) => {
        await this._service
        .diasParaPlantaGuardar(usuario, jsonData)
        .subscribe(async (res) => {
          if (res.Codigo) {
            await this.showAlert('', 'Los datos han sido guardados.', 'success');
            resolve(true);
          } else {
            this.loadingVisible = false;
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

    this.loadingVisible = false;
  }

  async diasParaPlantaEliminar(pp_id: string, usuario: string) {

    this.loadingVisible = true;
    
    await new Promise(async (resolve) => {
        await this._service
        .diasParaPlantaEliminar(pp_id, usuario)
        .subscribe(async (res) => {
          if (res.Codigo) {
            await this.showAlert('', 'Los datos han sido eliminados.', 'success');
            resolve(true);
          } else {
            this.loadingVisible = false;
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

    this.loadingVisible = false;
  }

  async onChangePlanta($event: any) {
    await this.DiasParaPlantaConsultar();
  }

  async onChangeTipoProceso($event: any) {
    await this.DiasParaPlantaConsultar();
    //this.inputLibrasShowHide();
    this.selectTurnoShowHide();
    this.formatLibrasN2();
  }

  onChangeFecha(e: any) {
    if (e && e.value) {
      const oldDate = this.prevFecha ? moment(this.prevFecha) : moment(this.pp_fecha);
      const newDate = moment(e.value);
      if (newDate.month() !== oldDate.month() || newDate.year() !== oldDate.year()) {
        this.pp_fecha = e.value;
        this.prevFecha = e.value;
        this.DiasParaPlantaConsultar();
      } else {
        this.pp_fecha = e.value;
        this.prevFecha = e.value;
      }
    }
  }

  inputLibrasShowHide() {

    const label = document.getElementById('libras-label');
    const input = document.getElementById('input-libras');
    if (this.pp_tipo === 'PA') {
      if (label) label.style.visibility = 'visible';
      if (input) input.style.visibility = 'visible';
    } else {
      if (label) label.style.visibility = 'hidden';
      if (input) input.style.visibility = 'hidden';
    }

  };

  selectTurnoShowHide() {
    const label = document.getElementById('turno-label');
    const select = document.getElementById('ng-select-turno');  

    if (this.pp_tipo === 'PA') {
      if (label) label.style.visibility = 'visible';
      if (select) select.style.visibility = 'visible';
      this.pp_turno = this.listaTurno[0].det_codigo;
    } else {
      if (label) label.style.visibility = 'hidden';
      if (select) select.style.visibility = 'hidden';
    }
  }

  async onRemoveDiaParaPlanta(event: any) {
    await this.diasParaPlantaEliminar(event.data.pp_id.toString(), localStorage.getItem(varUser));
    await this.DiasParaPlantaConsultar();
  }

  formatLibrasN2(): void {
    if (this.pp_libras !== null && this.pp_libras !== undefined) {
      const num = Number(this.pp_libras);
      if (!isNaN(num)) {
        this.pp_libras = parseFloat(num.toFixed(2));
      } else {
        this.pp_libras = 0;
      }
    }
  }

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
  }

}
