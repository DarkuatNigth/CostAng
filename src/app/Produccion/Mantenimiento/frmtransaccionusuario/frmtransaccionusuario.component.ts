import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxTabPanelComponent } from 'devextreme-angular';
import { CommonModule } from '@angular/common';
import { FrmtransaccionusuarioService } from './frmtransaccionusuario.service';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { varEmpresa, varUser } from 'src/app/config/url.servicios';

@Component({
  selector: 'app-frmtransaccionusuario',
  templateUrl: './frmtransaccionusuario.component.html',
  styleUrl: './frmtransaccionusuario.component.scss'
})
export class FrmtransaccionusuarioComponent {
  

  title = 'Transacciones por Usuario';
  loadingVisible: boolean = true;
  disabledBtnGuardar: boolean = true;
  cmbUsuario: any;
  Transacciones: any;
  Usuarios: any;
  cmbTransaccion: any;
  transaccionUsuario: any;
  usuario?: string;

  constructor(private _service: FrmtransaccionusuarioService) {}

  async ngOnInit() {
    this.loadingVisible = true;
    this.usuario = localStorage.getItem(varUser);

    await new Promise(async (resolve) => {
      const observable = await this._service.usuariosGet();
      observable.subscribe(async(data) => {
        if (data.Codigo) {
          this.Usuarios = data.Dt.Table.sort((a: any, b: any) => {
          if (a.identifica < b.identifica) {
            return -1;
          }
          if (a.identifica > b.identifica) {
            return 1;
          }
          return 0;
          });
          resolve(true);
        }
        else {
          await this.showAlert('', data.Description, 'error');
          resolve(false);
        }
      });
    });

    await new Promise(async (resolve) => {
      const observable = await this._service.transaccionesGet();
      observable.subscribe(async(data) => {
        if (data.Codigo) {
          this.Transacciones = data.Dt.Table.sort((a: any, b: any) => {
            if (a.trs_descri < b.trs_descri) {
              return -1;
            }
            if (a.trs_descri > b.trs_descri) {
              return 1;
            }
            return 0;
          });
          resolve(true);
        }
        else {
          await this.showAlert('', data.Description, 'error');
          resolve(false);
        }
      });
    });

    this.loadingVisible = false;

  }

  async onClickGuardar() {
    //Validar
    if (!this.cmbUsuario) {
      await this.showAlert('', 'Debe seleccionar un usuario.', 'warning');
      return;
    }
    if (!this.cmbTransaccion) {
      await this.showAlert('', 'Debe seleccionar una transacción.', 'warning');
      return;
    }

    let accion = 'I'  // Insertar por defecto

    // crear json con las transacciones asignadas al usuario
    const detalle = this.transaccionUsuario.map((x: any) => {
      return {
        trs_usuario: this.cmbUsuario,
        trs_codigo: x.trs_codigo,
        trs_id: x.trs_id
      }
    });

    await new Promise(async (resolve) => {
      const observable = await this._service.transaccionUsuarioGrabar(this.usuario || '', JSON.stringify(detalle), accion);
      observable.subscribe(async(data) => {
        if (data.Codigo) {
          await this.showAlert('', 'Transacciones guardadas correctamente', 'success');
          resolve(true);
        }
        else {
          await this.showAlert('', data.Description, 'error');
          resolve(false);
        }
      });
    });
  }

  async onRemoveTransaccionUsuario($event: any) {
    //implement logic to remove a transaction from the user
    const trsIdToDelete = $event.data.trs_id;
    
    let accion = 'D';  // Eliminar por defecto
    const jsonToDelete = {
        trs_id: trsIdToDelete
    };

    await new Promise(async (resolve) => {
      const observable = await this._service.transaccionUsuarioGrabar(this.usuario || '', JSON.stringify(jsonToDelete), accion);
      observable.subscribe(async(data) => {
        if (data.Codigo) {
          await this.showAlert('', 'Transacción eliminada correctamente', 'success');
          resolve(true);
        }
        else {
          await this.showAlert('', data.Description, 'error');
          resolve(false);
        }
      });
    });
  }

  async onUsuarioChange($event: any) {
    await new Promise(async (resolve) => {
      const observable = await this._service.transaccionUsuarioGet(this.cmbUsuario);
      observable.subscribe(async(data) => {
        if (data.Codigo) {
          this.transaccionUsuario = data.Dt.Table;
          resolve(true);
        }
        else {
          await this.showAlert('', data.Description, 'error');
          resolve(false);
        }
      });
    });
    
  }

  async onAgregarTransaccion() {
    // TODO: Implement logic to add a transaction
    // Check if the transaction is already assigned to the user
    const exists = this.transaccionUsuario.some((tu: any) => tu.trs_codigo === this.cmbTransaccion);
    if (exists) {
      this.showAlert('Advertencia', 'La transacción ya está asignada al usuario.', 'warning');
      return;
    }

    // Find the selected transaction details
    const selectedTransaccion = this.Transacciones.find((t: any) => t.trs_codigo === this.cmbTransaccion);
    if (selectedTransaccion) {
      // Add the transaction to the user's transaction list
      this.transaccionUsuario.push({
        trs_id: 0,
        trs_codigo: selectedTransaccion.trs_codigo,
        trs_descri: selectedTransaccion.trs_descri,
        NOM: this.Usuarios.find((u: any) => u.identifica === this.cmbUsuario)?.NOM || ''
      });
    }
  }

  async showAlert(title, mensaje, tipo) {
      this.loadingVisible = false;
  
      return new Promise(async (resolve) => {
        await Swal.fire({
          title: title,
          html:
            "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" +
            mensaje.replaceAll('\n', '<br>').replaceAll('\\n', '<br>') +
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
