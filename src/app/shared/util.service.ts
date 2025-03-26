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

  focusNextElement(event: any) {
    debugger;
    const element = event.target as HTMLInputElement;
    // obtener el siguiente elemento input que tengan las mismas clases
    const clases = "form-control.sng-template.ng-valid";  // element.className.split(' ').join('.');
    const elements = document.querySelectorAll(`input.${clases}`);
    const index = Array.from(elements).indexOf(element);
    if (index < elements.length - 1) {
      const elementNext = elements[index + 1] as HTMLInputElement;
      elementNext.focus();
      // elements[index + 1].focus();
    }
  }
  
  onPasteValidateNumber(event: ClipboardEvent) {
    const clipboardData = event.clipboardData || (window as any).clipboardData;
    const pastedData = clipboardData.getData('Text');
    if (!/^\d+$/.test(pastedData)) {
      event.preventDefault();
    }
  }

  selectAllContent(event: any) {
    event.target.select(); // Selecciona todo el contenido del input
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
