import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { URL_CONSULT,CONNECTION_PROD,CONNECTION_RRHH,URL_APIPRODUCCION,CONNECTION_BETAPRORRHH} from '../../config/url.servicios';
import { ResultWS } from '../../Interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class FrmPermisosEmpleadoService {
  ListParam = [];

  constructor(private http: HttpClient) {}

  getDatosIniciales(idEmpresa: number, usuario: string) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'N' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
    ];

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoPlantaConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };


    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getEmpleadosIngresadoGrupo(
    idEmpresa: number,
    usuario: string,
    grupoSupervisor: number
  ) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'CE' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      {
        Name: 'i_grupoSupervisor',
        Type: 'Int',
        Value: grupoSupervisor.toString(),
      },
    ];

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoPlantaConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    console.log(base);

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getEmpleadoDeGrupos(
    idEmpresa: number,
    usuario: string,
    credencialEmpleado: string
  ) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'CG' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      { Name: 'i_empleado', Type: 'VarChar', Value: credencialEmpleado.toString() },
      
    ];

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoPlantaConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    console.log(base);

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getHorasDisponiblesEmpleado(
    idEmpresa: number,
    codigoEmpleado: string,
    usuario: string,
    fecha: string
  ) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'CH' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_empleado', Type: 'VarChar', Value: codigoEmpleado.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      { Name: 'i_fecha', Type: 'VarChar', Value: fecha },
    ];

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoPlantaConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };


    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getPermisosGenerados(idEmpresa: number, usuario: string, fecha: string) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'CP' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      { Name: 'i_fecha', Type: 'VarChar', Value: fecha },
    ];

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoPlantaConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };


    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getDetalleDePermiso(idEmpresa: number, usuario: string, idPermiso: number) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'CD' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      { Name: 'i_idPermisoCab', Type: 'VarChar', Value: idPermiso.toString() },
    ];

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoPlantaConsultar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };


    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  validaSalidaProcesoPlanta(idEmpresa: number, empleado: string) {
    this.ListParam = [
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_empleado', Type: 'VarChar', Value: empleado.toString() },
    ];

    const base = {
      sp: 'nomina.sp_validaSalidaEmpleadoProcesoPlanta',
      param: this.ListParam,
      conexion: CONNECTION_PROD,
    };

    console.log(base);

    return this.http.post<ResultWS>(URL_APIPRODUCCION, base);
  }

  validaMarcacionProcesoTurno(idEmpresa: number, empleado: string) {
    this.ListParam = [
      { Name: 'codEmpleado', Type: 'VarChar', Value: empleado.toString() },
    ];

    const base = {
      sp: 'produccion.sp_validaMarcacionProcesadosxTurno',
      param: this.ListParam,
      conexion: CONNECTION_PROD,
    };

    console.log(base);

    return this.http.post<ResultWS>(URL_APIPRODUCCION, base);
  }

  guardarPermisosEmpleado(
    idEmpresa: number,
    usuario: string,
    fecha: string,
    tipoPermiso: number,
    turnoSupervisor: string,
    listaEmpleado: string,
    horaCita?: string
  ) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'G' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      { Name: 'i_fecha', Type: 'VarChar', Value: fecha },
      { Name: 'i_tipoPermiso', Type: 'Int', Value: tipoPermiso.toString() },
      {
        Name: 'i_turnoSupervisor',
        Type: 'VarChar',
        Value: turnoSupervisor.toString(),
      },
      {
        Name: 'i_listaEmpleadosPermiso',
        Type: 'VarChar',
        Value: listaEmpleado,
      },
    ];

    if (horaCita) {
      this.ListParam.push({
        Name: 'i_horaCita',
        Type: 'VarChar',
        Value: horaCita.toString(),
      });
    }

    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoGuardar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  eliminarPermisoEmpleado(
    idPermisoCabecera: number,
    idEmpresa: number,
    usuario: string,
    tipoPermiso: number,
    listaPermisos: string,
    fecha: string,
    horacita?: string
  ) {
    this.ListParam = [
      { Name: 'i_accion', Type: 'VarChar', Value: 'D' },
      { Name: 'i_empresa', Type: 'Int', Value: idEmpresa.toString() },
      {
        Name: 'i_idPermisoCabecera',
        Type: 'Int',
        Value: idPermisoCabecera.toString(),
      },
      { Name: 'i_usuario', Type: 'VarChar', Value: usuario.toString() },
      { Name: 'i_tipoPermiso', Type: 'VarChar', Value: tipoPermiso.toString() },
      {
        Name: 'i_listaEmpleadosPermiso',
        Type: 'VarChar',
        Value: listaPermisos,
      },
      { Name: 'i_fecha', Type: 'VarChar', Value: fecha },
    ];



    if (horacita && horacita !== '') {
      this.ListParam.push({
        Name: 'i_horaCita',
        Type: 'VarChar',
        Value: horacita.toString(),
      });
    }


    const base = {
      sp: 'bienestar.spr_PermisosEmpleadoGuardar',
      param: this.ListParam,
      conexion: CONNECTION_BETAPRORRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}
