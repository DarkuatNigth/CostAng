import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap, filter } from 'rxjs/operators';
import { URL_CONSULT, CONNECTION_PROD,codModule,varUser } from './../config/url.servicios';
import { ResultWS } from './../Interfaces/interfaces'

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  constructor(private http: HttpClient) { }

  validarToken() {
    const Token = localStorage.getItem(varUser) || '';
    if (Token != '') {
      return true;

    }
    else {
      return false;
    }
  }

  getIngreso(Usuario: string, contrasena: string, modulo) {
    let contra = this.encrypt(contrasena.toUpperCase(), 2);

    const ListParam = [{ "Name": "user", "Type": "VarChar", "Value": Usuario },
    { "Name": "pass", "Type": "VarChar", "Value": contra },
    { "Name": "modulo", "Type": "VarChar", "Value": modulo }];

    const base = {
      sp: 'exportaciones.sp_loginUser',//'sp_login_user',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  cargaMenu(Usuario: string) {
    const ListParam = [{ "Name": "user", "Type": "VarChar", "Value": Usuario },
    { "Name": "tipo", "Type": "VarChar", "Value": codModule }];

    const base = {
      sp: 'sp_menuAngular',
      param: ListParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);

  }

  getLogo() {
    const ListParam = [];

    const base = {
      sp: 'paramGeneral.sp_logoEmpresa',
      param: ListParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);

  }

  encrypt(Cadena: string, key: number) {
    let Encriptado = '';
    try {
      let Cad = '';
      let tamaño;

      let caracter;
      let i: number;

      Cad = Cadena.trim();
      tamaño = Cad.length;
      for (i = 1; i <= tamaño; i++) {
        caracter = this.Asc(Cad.substring((i - 1), i)) + key;
        Encriptado = Encriptado + String.fromCharCode(caracter);
      }
    } catch (error) {
    }
    return Encriptado;
  }

  Decrypt(Cadena:string,key:number)
  {
    //debugger;
    let Cad = '';
    let tamaño;
    let Desencriptado = '';
    let caracter;
    let i: number;

    Cad = Cadena.trim();
    tamaño = Cad.length;
    for (i = 1; i <= tamaño; i++)
    {
        caracter = this.Asc(Cad.substring(i - 1, i)) - key;
        Desencriptado = Desencriptado + String.fromCharCode(caracter);
    }
    return Desencriptado;
  }

  Asc(cadena: string) {
    const cad = cadena.substring(0, 1).charCodeAt(0);
    return cad;
  }

  saveMenuFavorite(Usuario,modulo, opt, accion) {
    //debugger;
    const ListParam = [{ "Name": "user", "Type": "VarChar", "Value": Usuario.toString() },
                      { "Name": "module", "Type": "VarChar", "Value": modulo.toString() },
                      { "Name": "idopcion", "Type": "NVarChar", "Value": opt.toString() },
                      { "Name": "accion", "Type": "int", "Value": accion.toString() }];

    const base = {
      sp: 'embarquesang.sp_grabaFavoritosMenu',
      param: ListParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getValidaToken(Usuario, token) {
    const ListParam = [{ "Name": "user", "Type": "VarChar", "Value": Usuario },
    { "Name": "token", "Type": "VarChar", "Value": token }];

    const base = {
      sp: 'seguridad.sp_validaTokenUser',
      param: ListParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);

  }
}
