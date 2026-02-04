import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CONNECTION_PROD,
  CONNECTION_PROD2,
  CONNECTION_BETAPRORRHH,
  URL_REPORTES,
  URL_CONSULT,
  URL_TRANSACIMAGEN
} from 'src/app/config/url.servicios';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';
import { datarpt } from 'src/app/Interfaces/dataRpt';

@Injectable({
  providedIn: 'root',
})
export class FrmsolvacacionesService {
  ListParam = [];
  constructor(private http: HttpClient) {}

  getDataEmpleado(empresa) {
    const ListParam = [
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() }
    ];

    const base = {
      sp: 'nomina.spr_TrabajadoresConsulta',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getesJefeArea(user) {
    const ListParam = [
      { Name: 'User', Type: 'VarChar', Value: user.toString() }
    ];

    const base = {
      sp: 'seguridad.sp_UsuarioJefeArea',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  

  getSolicitudVacaciones(
    empresa,
    codigotrabajador,
    accion,jefeporarea,estado,desde,hasta
  ) {
    const ListParam = [
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() },
      {
        Name: 'usuario',
        Type: 'VarChar',
        Value: codigotrabajador.toString(),
      },
      {
        Name: 'i_accion',
        Type: 'VarChar',
        Value: accion.toString(),
      },
      {
        Name: 'jefeporarea',
        Type: 'VarChar',
        Value: jefeporarea.toString(),
      },
      {
        Name: 'estado',
        Type: 'VarChar',
        Value: estado.toString(),
      },
      {
        Name: 'desde',
        Type: 'VarChar',
        Value: desde.toString(),
      },
      {
        Name: 'hasta',
        Type: 'VarChar',
        Value: hasta.toString(),
      },
    ];

    const base = {
      sp: 'nomina.spr_datosInicialesSolicitudVacaciones',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  

  getDataUser(user) {
    const ListParam = [
      { Name: 'codigo', Type: 'NVarChar', Value: user.toString() },
    ];

    const base = {
      sp: 'maestros.spr_TrabajadorConsultaDatos',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  SetVacacionesGrabar(listDet,  user, empresa) {
    const ListParam = [
      {
        Name: 'listDet',
        Type: 'NVarChar',
        Value: listDet === null ? 'null' : listDet.toString(),
      },
      { Name: 'user', Type: 'VarChar', Value: user.toString() },
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() },
    ];

    const base = {
      sp: 'nomina.spr_GrabarSolicitudVacaciones',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    var formdata = new FormData();
    formdata.append('param', JSON.stringify(base));
    formdata.append('paramImagen', '{}');
    return this.http.post<ResultWS>(URL_TRANSACIMAGEN, formdata);
  }
    
  consultarDatosImprimir(
    empresa: number,
    trbcodigo: number,
    idcab: number,
    iddetalle: string
  ) {
    const ListParam = [
      { Name: 'empresa', Type: 'int', Value: empresa.toString() },
      { Name: 'trbcodigo', Type: 'Int', Value: trbcodigo.toString() },
      { Name: 'idcab', Type: 'Int', Value: idcab.toString() },
      { Name: 'iddetalle', Type: 'Int', Value: iddetalle.toString() },
    ];
    const base = {
      sp: `trabajador.spr_trabajadorConsultar`,
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  callReports(datarpt: datarpt) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
    const data = {
      rpt: datarpt.rpt,
      parameters: datarpt.parameters,
      formula: datarpt.formula,
      selectionFormularpt: datarpt.selectionFormularpt,
    };

    var param = JSON.stringify(JSON.stringify(data).replace(/\\\\/g, '\\'));
    return this.http.post<ResultReportes>(URL_REPORTES, param, httpOptions);
  }
  validaDatosNovedades(idEmpresa: number, json: string) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'Varchar', Value: 'V' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_json', Type: 'Varchar', Value: json },
    ];

    const base = {
      sp: 'nomina.spr_datosInicialesVacacionesConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}
