import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmenvioxmlnatService {

  constructor(private http: HttpClient) { }

  getLotesEnvioNaturisaByFecha(fechaDesde: string, fechaHasta: string) {
    const ListParam = [
      { "Name": "fechaIni", "Type": "varchar", "Value": fechaDesde },
      { "Name": "fechaFin", "Type": "varchar", "Value": fechaHasta }
    ];
    const base = {
      sp: 'produccion.spr_lotesEnvioNaturisaByFecha',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
