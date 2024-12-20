import { Component, OnInit } from '@angular/core';
import {
  varUser,
  varUser2,
  varExpire,
  varMenu,
  varMenuDT,
  BaseConexion,
} from './../config/url.servicios';

declare var window;

@Component({
  selector: 'app-tokenexpired',
  templateUrl: './tokenexpired.component.html',
  styleUrl: './tokenexpired.component.scss'
})
export class TokenexpiredComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    window.home = this;

    localStorage.removeItem(varUser);
    localStorage.removeItem(varUser2);
    localStorage.removeItem(varMenu);
    localStorage.removeItem(varExpire);
    localStorage.removeItem(varMenuDT);

    let dbase = BaseConexion;
  }

}
