import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { CONNECTION_PROD, URL_APICOSTOS, URL_CONSULT } from 'src/app/config/url.servicios';

// Ajusta a tu proyecto real:
// import { URL_CONSULT, CONNECTION_PROD, ResultWS } from 'src/app/config/url.servicios';

interface ResultWS {
  Codigo: boolean;
  Description: string;
  Dt?: any;
}

@Injectable({ providedIn: 'root' })
export class FrmconsolidadoenergiaService {

  constructor(private http: HttpClient) {}

  /** Combo de años. */
  getAnios(): Observable<ResultWS> {
      const ListParam: any = [];
  
      const base = {
        sp: 'dbo.SP_DATA_UTILIDADCONTENEDOR',
        param: ListParam,
        conexion: CONNECTION_PROD
      };
      //console.log(base);
      return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  /** Consolidado (USD, Kwh, Alumbrado) de un año. */
  getConsolidado(strAnio: number): Observable<ResultWS> {
    const URL_PROC_PARAM = URL_APICOSTOS + 'ProcesoParametro/consol-elec';
    const params = new HttpParams().set('strAnio', strAnio.toString());
    return this.http.get<ResultWS>(URL_PROC_PARAM,{params});
  }
}