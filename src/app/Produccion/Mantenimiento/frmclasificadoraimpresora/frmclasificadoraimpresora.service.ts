import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmclasificadoraimpresoraService {

  constructor(private http: HttpClient) { 
  }

  getClasificadoraImpresora() {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byCatalogo" }
    ];
    const base = {
      sp: 'produccion.spr_ParametrizacionClasificadoraImpresoraConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  postClasificadoraImpresora(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": data.accion },
      { "Name": "i_detalle", "Type": "varchar", "Value": JSON.stringify(data.detalle) },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud }
    ];
    const base = {
      sp: 'produccion.spr_ParametrizacionClasificadoraImpresoraInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
