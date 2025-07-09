import { formatDate } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, CONNECTION_RRHH, URL_CONSULT, URL_CONSULTRRHH, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';


const itemsMenu = [
  { text: 'Quitar de Planificación', icon: 'trash', action: 'delete' },
  { text: 'Replanificar', icon: 'edit', action: 'edit' },
  { text: 'Ver Detalle', icon: 'info', action: 'details' },
  { text: 'Confirmar Planificación de VA', icon: 'check', action: 'confirmVA' },
  { text: 'Generar BreakDown', icon: 'exportselected', action: 'breakDown' },
];

export interface IUpdatePlanificacionEmbarque {
  numeroEmbarque: number, 
  fechaEmbarque?: Date, 
  plantaEmbarque?: number,
  observacion?: string,
  tipoUpdate: string,
  userAud: string, 
}

@Injectable({
  providedIn: 'root'
})

export class FrmplanificacionhorarioService {

  constructor(private http: HttpClient) { }

  getItemsMenuContext() {
    return itemsMenu;
  }


  getDataByMes = ({fecIni, fecFin}) => {
    const ListParam = [
      { "Name": "Desde", "Type": "VarChar", "Value": fecIni.toString() },
      { "Name": "Hasta", "Type": "VarChar", "Value": fecFin.toString() },
      { "Name": "i_tipoB", "Type": "VarChar", "Value": "byCalendario" },
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getPlanificacionById = (numeroEmbarque) => {
    const ListParam = [
      { "Name": "numeroEmbarque", "Type": "Int", "Value": numeroEmbarque.toString() },
      { "Name": "i_tipoB", "Type": "VarChar", "Value": "byId" },
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  updatePlanificacionEmbarque = (data: IUpdatePlanificacionEmbarque) => {
    const ListParam = [
      { "Name": "pemb_numero", "Type": "Int", "Value": data.numeroEmbarque.toString() },
      { "Name": "pemb_fechaEmbarque", "Type": "VarChar", "Value": data.fechaEmbarque ? formatDate(data.fechaEmbarque, 'yyyy-MM-dd', 'en-US') : null },
      { "Name": "pemb_plantaEmbarque", "Type": "Int", "Value": data.plantaEmbarque ? data.plantaEmbarque.toString() : null },
      { "Name": "pemb_observacion", "Type": "VarChar", "Value": data.observacion ? data.observacion : null },
      { "Name": "i_accion", "Type": "varchar", "Value": "U" },
      { "Name": "i_accion2", "Type": "varchar", "Value": data.tipoUpdate },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud },
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueInsert',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
}
