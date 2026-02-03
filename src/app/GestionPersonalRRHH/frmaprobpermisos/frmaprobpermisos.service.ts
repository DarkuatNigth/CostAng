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
export class FrmaprobpermisosService {
  ListParam = [];
  constructor(private http: HttpClient) {}

  getSolicitudPermisos(
    empresa,
    codigotrabajador,
    accion,
    jefeporarea,
    fechadesde,
    fechahasta,
    codigotransaccion
  ) {
    const ListParam = [
      { Name: 'i_empresa', Type: 'VarChar', Value: empresa.toString() },
      {
        Name: 'i_usuario',
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
        Type: 'int',
        Value: jefeporarea.toString(),
      },
      {
        Name: 'i_fechadesde',
        Type: 'VarChar',
        Value: fechadesde.toString(),
      },
      {
        Name: 'i_fechahasta',
        Type: 'VarChar',
        Value: fechahasta.toString(),
      },
      {
        Name: 'i_codigotrs',
        Type: 'Int',
        Value: codigotransaccion.toString(),
      },
    ];

    const base = {
      sp: 'horario.spr_datosInicialesPermisoTrabajador',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  getesJefeArea(user) {
    const ListParam = [
      { Name: 'User', Type: 'VarChar', Value: user.toString() }
    ];

    const base = {
      sp: 'seguridad.sp_UsuarioJefeArea',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  SetAprobarPermisos(listSolicitud, user, empresa) {
    const ListParam = [
      { Name: 'listPermisotrabajaor',Type: 'NVarChar',Value: listSolicitud === null ? 'null' : listSolicitud.toString()},
      { Name: 'user', Type: 'VarChar', Value: user.toString() },
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() }
    ];

    const base = {
      sp: 'horario.spr_GrabarPermisoTrabajador',
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

  verificaMarcacionesPlanta(trbCodigo) {
      this.ListParam = [
        { Name: 'CodEmpleado', Type: 'Int', Value: trbCodigo.toString() },
      ];
  
      const base = {
        sp: 'bienestar.spr_verificaMarcacionesPlanta',
        param: this.ListParam,
        conexion: CONNECTION_RRHH,
      };
  
      return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
    }
}
