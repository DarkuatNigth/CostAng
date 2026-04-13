import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD,CONNECTION_COSTOS, URL_CONSULT, URL_APICOSTOS } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmparametrizacionprocesoService {

  constructor(private http: HttpClient) { }

    
    getDataParametros(){
      const ListParam = [];
  
      const base = {
        sp: 'dbo.SP_DATA_UTILIDADCONTENEDOR',
        param: ListParam,
        conexion: CONNECTION_PROD
      };
      console.log(base);
      return this.http.post<ResultWS>(URL_CONSULT, base);
    }

    
    getProcParametros(parametros){
      const URL_PROC_PARAM= URL_APICOSTOS +'ProcesoParametro/param-proc';
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
    
    
    postProcParametros(parametros){
      const URL_PROC_PARAM= URL_APICOSTOS +'ProcesoParametro/guardar-param-pfr';
      console.log('postProcParametros',parametros);
      return this.http.post<ResultWS>(URL_PROC_PARAM,parametros);
    }
}
