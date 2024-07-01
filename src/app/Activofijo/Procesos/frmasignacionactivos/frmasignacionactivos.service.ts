import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { URL_CONSULT, CONNECTION_PROD, CONNECTION_PROYECTO, URL_TRANSACIMAGEN } from './../../../config/url.servicios';
import { ResultWS } from './../../../Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmasignacionactivosService {

  constructor(private http: HttpClient) { }

  getDataActivo(codactivo) {
    const ListParam = [{ "Name": "codigo", "Type": "Char", "Value": codactivo.toString() }];

    const base = {
      sp: 'activos.sp_infoActivo',
      param: ListParam,
      conexion: CONNECTION_PROYECTO
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getDataEmpleado(codempleado) {
    const ListParam = [{ "Name": "codigo", "Type": "Char", "Value": codempleado.toString() }];

    const base = {
      sp: 'activos.sp_cargEmpleado',
      param: ListParam,
      conexion: CONNECTION_PROYECTO
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  setGrabar(codactivo,codempleado,tipoasig,observ,estado,user){
    const ListParam = [{"Name":"codigo","Type":"VarChar","Value": (codactivo === null ? "null" : codactivo.toString())},
    {"Name":"codEmpleado","Type":"VarChar","Value": (codempleado === null ? "null" : codempleado.toString())},
    {"Name":"tipoAsignacion","Type":"VarChar","Value": (tipoasig === null ? "null" : tipoasig.toString())},
    {"Name":"estado","Type":"VarChar","Value": (estado === null ? "null" : estado.toString())},
    {"Name":"observ","Type":"VarChar","Value": (observ === null ? "null" : observ.toString())},
    {"Name":"user","Type":"VarChar","Value": (user === null ? "null" : user.toString())},
    ];

    const base = {
    sp: 'activos.sp_grabaAsignacionActivos',
    param: ListParam,
    conexion: CONNECTION_PROYECTO
    };

    var formdata = new FormData();
    formdata.append("param", JSON.stringify(base));
    formdata.append("paramImagen", "{}");


    return this.http.post<ResultWS>(URL_TRANSACIMAGEN, formdata);
  }

}
