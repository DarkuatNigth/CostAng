import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CuentaDriverDTO } from './distribucion-luz';
import { CONNECTION_PROD, URL_APICOSTOS, URL_CONSULT } from 'src/app/config/url.servicios';


interface ResultWS {
  Codigo: boolean;
  Description: string;
  Dt?: any;
}

@Injectable({ providedIn: 'root' })
export class FrmdistribucionluzService {

  constructor(private http: HttpClient) {}

  getDataParametros(): Observable<ResultWS> {
    const ListParam: any = [];

    const base = {
      sp: 'dbo.SP_DATA_UTILIDADCONTENEDOR',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    //console.log(base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  /**
   * Trae las cuentas de los 2 asientos + el split fijo S1/S2.
   */
  getCuentasDriver(parametros: any): Observable<ResultWS> {
    const URL_PROC_PARAM = URL_APICOSTOS + 'ProcesoParametro/param-elec';
    // Convertimos el objeto simple en HttpParams
    let params = new HttpParams();
    if (parametros) {
      Object.keys(parametros).forEach(key => {
        if (parametros[key] !== null && parametros[key] !== undefined) {
          params = params.append(key, parametros[key]);
        }
      });
    }

    console.log('Solicitando URL:', URL_PROC_PARAM, 'con params:', params.toString());
    return this.http.get<ResultWS>(URL_PROC_PARAM, { params });
  }

  
  copiarPorcentajesMes(anio: number, mes: number): Observable<ResultWS> {
    let parametros = {
      'strAnio': anio,
      'strMes': mes
    };
    return this.getCuentasDriver(parametros);
  }

  postDistribucion(parametros: CuentaDriverDTO[]): Observable<ResultWS> {
    const URL_PROC_PARAM = URL_APICOSTOS + 'ProcesoParametro/param-elec';
    return this.http.post<ResultWS>(URL_PROC_PARAM, parametros);
  }
}