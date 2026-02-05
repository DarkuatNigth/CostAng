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
export class FrmsolpermisosService {
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

  getesJefeArea(user,empresa,opcion) {
    const ListParam = [
      { Name: 'User', Type: 'VarChar', Value: user.toString() },
      { Name: 'i_empresa', Type: 'Int', Value: empresa.toString() },
      { Name: 'i_opcion', Type: 'VarChar', Value: opcion.toString() }
    ];

    const base = {
      sp: 'seguridad.sp_UsuarioJefeArea',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  

  getSolicitudPermisos(
    accion,
    empresa,
    usuario,
    jefeporarea,fechadesde,fechahasta,codigotrabajador,estado,codigotrabsac
  ) {
    const ListParam = [
      { Name: 'i_empresa', Type: 'VarChar', Value: empresa.toString() },
      {
        Name: 'i_usuario',
        Type: 'VarChar',
        Value: usuario.toString(),
      },
      {
        Name: 'i_accion',
        Type: 'VarChar',
        Value: accion.toString(),
      },
      {
        Name: 'jefeporarea',
        Type: 'Int',
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
        Name: 'i_codigotrb',
        Type: 'Int',
        Value: codigotrabajador.toString(),
      },
      {
        Name: 'i_estado',
        Type: 'VarChar',
        Value: estado.toString(),
      },
      {
        Name: 'i_codigotrs',
        Type: 'Int',
        Value: codigotrabsac.toString(),
      },
    ];

    const base = {
      sp: 'horario.spr_datosInicialesPermisoTrabajador',
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

  SetPermisosTrabajadorGrabar(listDet,  user, empresa) {
    const ListParam = [
      {
        Name: 'listPermisotrabajaor',
        Type: 'NVarChar',
        Value: listDet === null ? 'null' : listDet.toString(),
      },
      { Name: 'user', Type: 'VarChar', Value: user.toString() },
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() },
    ];

    const base = {
      sp: 'horario.spr_GrabarPermisoTrabajador',
      param: ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    var formdata = new FormData();
    formdata.append('param', JSON.stringify(base));
    formdata.append('paramImagen', '{}');
    return this.http.post<ResultWS>(URL_TRANSACIMAGEN, formdata);
  }

  verificaMarcacionesPlanta(trbCodigo) {
    this.ListParam = [
      { Name: 'CodEmpleado', Type: 'Int', Value: trbCodigo.toString() },
    ];

    const base = {
      sp: 'bienestar.spr_verificaMarcacionesPlanta',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}
