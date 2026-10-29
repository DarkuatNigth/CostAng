import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, varUser } from 'src/app/config/url.servicios';
import { CONNECTION_SGCAM, URL_APICOSTOS, URL_CONSULT,CONNECTION_SONG } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

export const crearObjBase = (sp = '', param: any[] = [], connec = CONNECTION_SGCAM) => ({
  sp: sp,
  param: param,
  conexion: connec
});

@Injectable({
  providedIn: 'root'
})
export class FrmconsultageneralService {

  constructor(private http: HttpClient) { }

  
  getDataParametros(idConsulta: any){
    const ListParam = [{ "Name": "idConsulta", "Type": "VarChar", "Value": idConsulta.toString() },
    { "Name": "tipo", "Type": "VarChar", "Value": "Inicial" }];

    const base = crearObjBase('general.sp_dataConsultaGeneral', ListParam);
    //console.log(base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getDataListaParametros(idConsulta: any, name: any, sp: any, user: any, empresa: any){
    const ListParam = [{ "Name": "idConsulta", "Type": "VarChar", "Value": idConsulta.toString() },
    { "Name": "name", "Type": "VarChar", "Value": name.toString() },
    { "Name": "user", "Type": "VarChar", "Value": user.toString() },
    { "Name": "i_empresa", "Type": "NVarChar", "Value": empresa.toString() }];
    
    const base = crearObjBase(sp, ListParam);
    //console.log('getDataListaParametros',base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
  getConsultasByUser(user: string | null) {
    const ListParam = [
      { "Name": "user", "Type": "varchar", "Value": user }
    ];
    const base = crearObjBase('general.sp_getConsultasGeneralByUser', ListParam);
    //console.log('getConsultasByUser',base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getConsultaDatosByFilters(ListParam: any[], sp: string){
    if (sp.includes('/')) {
      //console.log('getConsultaDatosByFilters',ListParam);
      let strFechaIn = ListParam.find(item => item.Name == "fecInicio");
      let strFechaFin = ListParam.find(item => item.Name == "fecFin");
      sp = sp.replace("[dtFechaIn]",strFechaIn.Value).replace("[dtFechaFi]", strFechaFin.Value);
      //console.log('getConsultaDatosByFilters',sp);
      const queryIndex = sp.indexOf('?');
      const ruta = queryIndex === -1 ? sp : sp.substring(0, queryIndex);
      if (ruta.startsWith('Reporting/') && ruta !== 'Reporting/inv-estructura' && ruta !== 'Reporting/exportar-excel') {
        const body: Record<string, string | number | boolean> = Object.create(null);
        const query = queryIndex === -1 ? '' : sp.substring(queryIndex + 1);
        query.split('&').filter(param => param !== '').forEach(param => {
          const valueIndex = param.indexOf('=');
          const key = decodeURIComponent(valueIndex === -1 ? param : param.substring(0, valueIndex));
          const value = decodeURIComponent(valueIndex === -1 ? '' : param.substring(valueIndex + 1));
          body[key] = value === 'true' ? true : value === 'false' ? false : /^[+-]?\d+$/.test(value) ? Number(value) : value;
        });
        return this.http.post<ResultWS>(URL_APICOSTOS.concat(ruta), body);
      }
      return this.http.get<ResultWS>(URL_APICOSTOS.concat(sp));
    }
    else {
      const base = crearObjBase(sp, ListParam.filter(item => item.Name !== "i_empresa"), CONNECTION_PROD);
      // console.log('getConsultaDatosByFilters',base);
      // console.log('URL',URL_CONSULT);
      return this.http.post<ResultWS>(URL_CONSULT, base);
    }
  }


    postGrabarDatos(ListParam: any[], sp: string){
    //console.log('getConsultaDatosByFilters',ListParam);
    sp = URL_APICOSTOS.concat("Reporting/"+sp);
    //console.log('URL_APICOSTOS',sp, 'paramas: ', ListParam);
    return this.http.post<ResultWS>(sp, ListParam);
  }

  callExcellFile(data: any) {

    var request = JSON.stringify(data);

    var url = URL_APICOSTOS+"Reporting/exportar-excel?";

    return this.http.post(url, request,{
      headers: { 'Content-Type': 'application/json' },
      responseType: 'blob'
    });
  }
}
