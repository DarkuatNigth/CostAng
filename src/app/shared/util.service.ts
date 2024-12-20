import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class UtilService {

  constructor() { }

  validateNumberInt(value) {
    value = parseInt(value, 10);
    if (isNaN(value) || value < 0) {
      value = 0;
    }
    return value;
  }
  
  onKeypressValidateNumber(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      event.preventDefault();
    }
  }
  
  onPasteValidateNumber(event: ClipboardEvent) {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedData = clipboardData.getData('Text');
    if (!/^\d+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  
  // (redondear(12345.99, 'S', 100)); // Resultado: 12400
  // (redondear(12345.99, 'I', 100)); // Resultado: 12300
  // (redondear(12345.99, 'C', 100)); // Resultado: 12300
  redondear(valorARedondear: number, direccion: 'S' | 'I' | 'C', multiplo: number): number {
    let valorRedondeado: number;

    switch (direccion) {
        case 'S':
            valorRedondeado = Math.ceil(valorARedondear / multiplo) * multiplo;
            break;
        case 'I':
            valorRedondeado = Math.floor(valorARedondear / multiplo) * multiplo;
            break;
        case 'C':
            valorRedondeado = Math.round(valorARedondear / multiplo) * multiplo;
            break;
        default:
            // Si la dirección no es válida, devolver el valor original
            valorRedondeado = valorARedondear;
            break;
    }
    return valorRedondeado;
  }

}
