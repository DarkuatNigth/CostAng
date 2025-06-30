import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, CONNECTION_RRHH, URL_CONSULT, URL_CONSULTRRHH, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmplanificacionvagService {

  constructor(private http: HttpClient) { 
  }

  getPedidosParaPlanificacion() {
    const ListParam = [
      { "Name": "tipoBusqueda", "Type": "varchar", "Value": "byPlanificacion" }
    ];
    const base = {
      sp: 'valoragregado.spr_planificacionVA_pedidosConsulta',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  postPlanificacionVag(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "I" },
      { "Name": "pla_fechaDesde", "Type": "varchar", "Value": data.fechaDesde },
      { "Name": "pla_fechaHasta", "Type": "varchar", "Value": data.fechaHasta },
      { "Name": "pla_paCodigo", "Type": "int", "Value": data.paCodigo.toString() },
      { "Name": "pla_nroPersonasDia", "Type": "int", "Value": data.nroPersonasDia.toString() },
      { "Name": "pla_nroPersonasNoche", "Type": "int", "Value": data.nroPersonasNoche.toString() },
      { "Name": "pla_nroModulos", "Type": "int", "Value": data.nroModulos.toString() },
      { "Name": "pla_observacion", "Type": "varchar", "Value": data.observacion },
      { "Name": "pla_estado", "Type": "varchar", "Value": data.estado },
      { "Name": "i_detalle", "Type": "varchar", "Value": JSON.stringify(data.detalle) },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud },
      { "Name": "i_equipo_aud", "Type": "varchar", "Value": data.equipoAud },
    ];
    const base = {
      sp: 'valoragregado.spr_planificacionVAInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  postPlanificacionEmbarque(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "I" },
      { "Name": "pla_id", "Type": "int", "Value": data.planificacionId.toString() },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud },
    ];
    const base = {
      sp: 'valoragregado.spr_planificaEmbarqueFromPlanificaVA',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  getCatalogos() {
    const ListParam = [{ "Name": "i_tipoB", "Type": "varchar", "Value": "byCatalogo" }];
    const base = {
      sp: 'valoragregado.spr_PlanificacionVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getDisponibilidadPersonal(fechaDesde, fechaHasta) {
    const ListParam = [
      { "Name": "i_fechaDesde", "Type": "varchar", "Value": formatDate(fechaDesde, 'yyyy-MM-dd', 'en-US') },
      { "Name": "i_fechaHasta", "Type": "varchar", "Value": formatDate(fechaHasta, 'yyyy-MM-dd', 'en-US') }
    ];
    const base = {
      sp: 'horario.sp_jornadaResumenPeladoVAConsultar',
      param: ListParam,
      conexion: CONNECTION_RRHH
    };
    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);

  }
}
