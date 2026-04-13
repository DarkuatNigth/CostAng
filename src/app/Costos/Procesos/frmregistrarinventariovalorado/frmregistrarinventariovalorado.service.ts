import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD,CONNECTION_COSTOS, URL_CONSULT, URL_APICOSTOS } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmregistrarinventariovaloradoService {

  constructor(private http: HttpClient) { }

     getDataParametros(){
      const objEndPoint = URL_APICOSTOS.concat("Reporting/inv-estructura");
      console.log('[FrmregistrarinventariovaloradoService].[getDataParametros] :' ,objEndPoint);
      return this.http.get<ResultWS>(objEndPoint);
    }
    
    postProcParametros(parametros){
      const URL_PROC_PARAM= URL_APICOSTOS.concat('Reporting/inv-val');
      console.log('postProcParametros',parametros, '\n' , 'url: ', URL_PROC_PARAM);

      return this.http.post<ResultWS>(URL_PROC_PARAM,parametros);
    }
}
