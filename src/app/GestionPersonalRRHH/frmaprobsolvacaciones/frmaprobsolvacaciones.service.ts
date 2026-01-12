import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  CONNECTION_PROD,
  CONNECTION_PROD2,
  CONNECTION_RRHH,
  URL_REPORTES,
  URL_CONSULT,
  URL_TRANSACIMAGEN,
  URL_CONSULTRRHH,
  URL_TRANSACIMAGENRRHH,
} from 'src/app/config/url.servicios';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';
import { datarpt } from 'src/app/Interfaces/dataRpt';

@Injectable({
  providedIn: 'root',
})
export class FrmaprobsolvacacionesService {
  ListParam = [];
  constructor(private http: HttpClient) {}

  getDataEmpleado(empresa) {
    const ListParam = [
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() }
    ];

    const base = {
      sp: 'nomina.spr_TrabajadoresConsulta',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  getSolicitudVacaciones(
    empresa,
    codigotrabajador,
    accion,
    opcion
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
        Name: 'opcion',
        Type: 'NVarChar',
        Value: opcion.toString(),
      },
    ];

    const base = {
      sp: 'nomina.spr_datosInicialesAprobacionSolVacaciones',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }
  
  getPermisosUser(user, tipo) {
    const ListParam = [
      { Name: 'USUARIO', Type: 'VarChar', Value: user.toString() },
      { Name: 'tipo', Type: 'VarChar', Value: tipo.toString() },
    ];

    const base = {
      sp: 'SP_PERMISO_MOD_PLANIEMB',
      param: ListParam,
      conexion: CONNECTION_PROD,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  getDataUser(user) {
    const ListParam = [
      { Name: 'codigo', Type: 'NVarChar', Value: user.toString() },
    ];

    const base = {
      sp: 'maestros.spr_TrabajadorConsultaDatos',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  SetVacacionesGrabar(listSolicitud, codtra, user, empresa,listaVacaciones,opcion, estado) {
    const ListParam = [
      { Name: 'listSolicitud',Type: 'NVarChar',Value: listSolicitud === null ? 'null' : listSolicitud.toString()},
      { Name: 'codtra', Type: 'VarChar', Value: codtra.toString() },
      { Name: 'user', Type: 'VarChar', Value: user.toString() },
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() },
      { Name: 'listaVacaciones',Type: 'NVarChar',Value: listaVacaciones === null ? 'null' : listaVacaciones.toString()},
      { Name: 'opcion', Type: 'NVarChar', Value: opcion.toString() },
      { Name: 'estado', Type: 'VarChar', Value: estado.toString() }
    ];

    const base = {
      sp: 'nomina.spr_ActualizarAprobacionVacaciones',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    var formdata = new FormData();
    formdata.append('param', JSON.stringify(base));
    formdata.append('paramImagen', '{}');
    return this.http.post<ResultWS>(URL_TRANSACIMAGENRRHH, formdata);
  }
  SetVacacionesDist(listDet, codtra, user, empresa) {
    const ListParam = [
      {
        Name: 'listDet',
        Type: 'NVarChar',
        Value: listDet === null ? 'null' : listDet.toString(),
      },
      { Name: 'codtra', Type: 'VarChar', Value: codtra.toString() },
      { Name: 'user', Type: 'VarChar', Value: user.toString() },
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() }
      
    ];

    const base = {
      sp: 'nomina.sp_vacacionesGrabar',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    var formdata = new FormData();
    formdata.append('param', JSON.stringify(base));
    formdata.append('paramImagen', '{}');
    return this.http.post<ResultWS>(URL_TRANSACIMAGENRRHH, formdata);
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
      conexion: CONNECTION_RRHH,
    };
    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
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
    debugger;
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
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  getVacacionesTrabajador(
    empresa,
    codigotrabajador,
    accion,
    idcab,
    iddetalle,
    json: string
  ) {
    const ListParam = [
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() },
      {
        Name: 'trbcodigo',
        Type: 'VarChar',
        Value: codigotrabajador.toString(),
      },
      {
        Name: 'i_accion',
        Type: 'VarChar',
        Value: accion.toString(),
      },
      {
        Name: 'idcab',
        Type: 'VarChar',
        Value: idcab.toString(),
      },
      {
        Name: 'iddetalle',
        Type: 'NVarChar',
        Value: iddetalle.toString(),
      },
      { Name: 'i_json', Type: 'Varchar', Value: json },
    ];

    const base = {
      sp: 'nomina.spr_datosInicialesVacacionesConsultar',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }
}
