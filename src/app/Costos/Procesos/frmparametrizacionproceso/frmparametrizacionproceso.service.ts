import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_APICOSTOS, URL_CONSULT } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { GuardarCierreParamProcRequest, GuardarWarrenRequest } from './param-proc.models';

@Injectable({ providedIn: 'root' })
export class FrmparametrizacionprocesoService {
  constructor(private readonly http: HttpClient) {}

  getDataParametros() {
    const ListParam: any[] = [];
    const base = {
      sp: 'dbo.SP_DATA_UTILIDADCONTENEDOR',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getProcParametros(parametros: any) {
    const url = URL_APICOSTOS + 'ProcesoParametro/param-proc';
    let params = new HttpParams();

    if (parametros) {
      Object.keys(parametros).forEach((key) => {
        const value = parametros[key];
        if (value !== null && value !== undefined) {
          params = params.append(key, value);
        }
      });
    }

    return this.http.get<ResultWS>(url, { params });
  }

  guardarWarren(request: GuardarWarrenRequest) {
    const url = URL_APICOSTOS + 'ProcesoParametro/guardar-warren';
    return this.http.post<ResultWS>(url, request);
  }

  guardarCierre(request: GuardarCierreParamProcRequest) {
    const url = URL_APICOSTOS + 'ProcesoParametro/guardar-cierre-param-proc';
    return this.http.post<ResultWS>(url, request);
  }
}
