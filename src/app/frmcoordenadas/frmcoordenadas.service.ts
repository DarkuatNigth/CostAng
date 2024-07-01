import { Title } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap, filter } from 'rxjs/operators';
import { URL_CONSULT, CONNECTION_PROD } from './../config/url.servicios';
import { ResultWS } from './../Interfaces/interfaces'


@Injectable({
  providedIn: 'root'
})
export class FrmcoordenadasService {

  constructor(private http: HttpClient) { }

  setCoord(Usuario: string) {
    const ListParam = [{ "Name": "USUARIO", "Type": "VarChar", "Value": Usuario }];

    const base = {
      sp: 'SP_ENVIO_COORDENADAS',
      param: ListParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  setVerifCoord(Usuario: string,param1, val1,param2,val2,param3,val3) {
    const ListParam = [{ "Name": "USUARIO", "Type": "VarChar", "Value": Usuario.toString() },
    { "Name": "PARAM1", "Type": "VarChar", "Value": param1.toString() },
    { "Name": "VALUE1", "Type": "Int", "Value": val1.toString() },
    { "Name": "PARAM2", "Type": "VarChar", "Value": param2.toString() },
    { "Name": "VALUE2", "Type": "Int", "Value": val2.toString() },
    { "Name": "PARAM3", "Type": "VarChar", "Value": param3.toString() },
    { "Name": "VALUE3", "Type": "Int", "Value": val3.toString() }];

    const base = {
      sp: 'SP_VALIDA_COORDENADAS',
      param: ListParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}
