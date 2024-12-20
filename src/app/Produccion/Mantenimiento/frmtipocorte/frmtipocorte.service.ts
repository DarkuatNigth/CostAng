import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmtipocorteService {

  constructor(private http: HttpClient) { 
  }

  getTiposCortes() {
    const ListParam = [{ "Name": "i_tipoB", "Type": "varchar", "Value": "byCatalogo" }];
    const base = {
      sp: 'valoragregado.spr_ParametrizacionCorteConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  
  getValoresTiposCortes(tipoCorteId: number) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byId" },
      { "Name": "i_tipoCorteId", "Type": "Int", "Value": tipoCorteId.toString() }
    ];
    console.log(ListParam);
    const base = {
      sp: 'valoragregado.spr_ParametrizacionCorteConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  guardarValoresTipoCorte(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "I" },
      { "Name": "i_detalle", "Type": "varchar", "Value": JSON.stringify(data.detalle) },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud }
    ];
    const base = {
      sp: 'valoragregado.spr_ParametrizacionCorteInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
