import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, CONNECTION_RRHH, URL_CONSULT, URL_CONSULTRRHH, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';


@Injectable({
  providedIn: 'root'
})
export class FrmplanificacionembarqueService {

  constructor(private http: HttpClient) { }

  getPedidosPlanificacionEmbarque() {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byPlanificacion" }
    ];
    const base = {
      sp: 'produccion.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}
