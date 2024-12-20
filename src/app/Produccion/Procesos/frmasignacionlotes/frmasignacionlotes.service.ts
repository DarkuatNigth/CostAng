import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmasignacionlotesService {

  constructor(private http: HttpClient) { 
  }

  getPedidos() {
    const ListParam = [{ "Name": "TipOri", "Type": "varchar", "Value": "Det" }];
    const base = {
      sp: 'valoragregado.spr_planificacionVA_pedidosConsulta',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  postAsignacionLotes(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "I" },
      { "Name": "i_detalle", "Type": "varchar", "Value": JSON.stringify(data.detalle) },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud }
    ];
    const base = {
      sp: 'valoragregado.spr_AsociarPedidoLoteParaReqInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


}
