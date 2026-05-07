import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { varUser } from 'src/app/config/url.servicios';
import { CONNECTION_SGCAM, URL_APICOSTOS, URL_CONSULT } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmconsultageneralService {

  constructor(private http: HttpClient) { }

  
  getDataParametros(idConsulta){
    const ListParam = [{ "Name": "idConsulta", "Type": "VarChar", "Value": idConsulta.toString() },
    { "Name": "tipo", "Type": "VarChar", "Value": "Inicial" }];

    const base = {
      sp: 'general.sp_dataConsultaGeneral',
      param: ListParam,
      conexion: CONNECTION_SGCAM
    };
    //console.log(base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getDataListaParametros(idConsulta,name, sp, user, empresa){
    const ListParam = [{ "Name": "idConsulta", "Type": "VarChar", "Value": idConsulta.toString() },
    { "Name": "name", "Type": "VarChar", "Value": name.toString() },
    { "Name": "user", "Type": "VarChar", "Value": user.toString() },
    { "Name": "i_empresa", "Type": "NVarChar", "Value": empresa.toString() }];
    
    const base = {
      sp: sp,
      param: ListParam,
      conexion: CONNECTION_SGCAM
    };
    //console.log('getDataListaParametros',base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
  getConsultasByUser(user: string) {
    const ListParam = [
      { "Name": "user", "Type": "varchar", "Value": user }
    ];
    const base = {
      sp: 'general.sp_getConsultasGeneralByUser',
      param: ListParam,
      conexion: CONNECTION_SGCAM
    };
    //console.log('getConsultasByUser',base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getConsultaDatosByFilters(ListParam, sp: string){
    //console.log('getConsultaDatosByFilters',ListParam);
    let strFechaIn = ListParam.find(item => item.Name == "fecInicio");
    let strFechaFin = ListParam.find(item => item.Name == "fecFin");
    sp = sp.replace("[dtFechaIn]",strFechaIn.Value).replace("[dtFechaFi]", strFechaFin.Value);
    //console.log('getConsultaDatosByFilters',sp);
    return this.http.get<ResultWS>(URL_APICOSTOS.concat(sp));
  }


    postGrabarDatos(ListParam, sp: string){
    //console.log('getConsultaDatosByFilters',ListParam);
    sp = URL_APICOSTOS.concat("Reporting/"+sp);
    //console.log('URL_APICOSTOS',sp, 'paramas: ', ListParam);
    return this.http.post<ResultWS>(sp, ListParam);
  }

  callExcellFile(data) {

    var request = JSON.stringify(data);

    var url = URL_APICOSTOS+"Reporting/exportar-excel?";

    return this.http.post(url, request,{
      headers: { 'Content-Type': 'application/json' },
      responseType: 'blob'
    });
  }
}
