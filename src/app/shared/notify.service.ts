import { Injectable } from '@angular/core';
import { auto } from '@popperjs/core';
import notify from 'devextreme/ui/notify';
import Swal from 'sweetalert2/src/sweetalert2.js';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  private showNotification(
    message: string,
    type: 'success' | 'warning' | 'error' | 'info'
  ): void {
    notify(
      {
        message: message,
        height: auto,
        width: auto,
        type: type,
        displayTime: 4000,
        animation: {
          show: {
            type: 'fade',
            duration: 400,
            from: 0,
            to: 1,
          },
          hide: { type: 'fade', duration: 40, to: 0 },
        },
      },
      { position: 'top center' }
    );
  }

  sucess(message: string): void {
    this.showNotification(message, 'success');
  }

  warning(message: string): void {
    this.showNotification(message, 'warning');
  }

  error(message: string): void {
    this.showNotification(message, 'error');
  }
  
  info(message: string): void {
    this.showNotification(message, 'info');
  }

  async showAlert(title, mensaje, tipo) {
    return new Promise(async (resolve) => {
      //debugger;
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
