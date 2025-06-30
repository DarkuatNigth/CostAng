import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, CONNECTION_RRHH, URL_CONSULT, URL_CONSULTRRHH, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';


@Injectable({
  providedIn: 'root'
})
export class FrmplanificacionembarqueService {

  constructor(private http: HttpClient) { }

  getPedidosPlanificacionEmbarque() {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byPlanificacion" }
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getCatalogosPlanificacionEmbarque() {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byCatalogo" }
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  getDetalleStockBloqueado(codprod: string, codtalla: number, tipoBusqueda: string) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": tipoBusqueda },
      { "Name": "i_codprod", "Type": "varchar", "Value": codprod },
      { "Name": "i_codtalla", "Type": "nvarchar", "Value": codtalla.toString() }
    ];
    const base = {
      sp: 'Embarque.spr_stockBloqueadoPlaEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }



  postPlanificacionEmbarque({
    pedido,
    codCliente,
    codPuertoDestino, 
    tipo, 
    estado, 
    plantaEmbarque, 
    fechaPlanificacion, 
    observacion, 
    referenciasMix, 
    pedFechaEstimado, 
    detalle,
    userAud }
  ) {
    const listParam = [
      { "Name": "pemb_referencia", "Type": "varchar", "Value": pedido },
      { "Name": "pemb_cliCodigo", "Type": "int", "Value": codCliente.toString() },
      { "Name": "pemb_ptoCodigoDestino", "Type": "int", "Value": codPuertoDestino.toString() },
      { "Name": "pemb_tipoEmbarque", "Type": "varchar", "Value": tipo },
      { "Name": "pemb_estadoEmbarque", "Type": "varchar", "Value": estado },
      { "Name": "pemb_fechaEmbarque", "Type": "varchar", "Value": formatDate(fechaPlanificacion, 'yyyy-MM-dd', 'en-US') },
      { "Name": "pemb_fechaEstimada", "Type": "varchar", "Value": formatDate(pedFechaEstimado, 'yyyy-MM-dd', 'en-US') },
      { "Name": "pemb_plantaEmbarque", "Type": "int", "Value": plantaEmbarque.toString() },
      { "Name": "pemb_observacion", "Type": "varchar", "Value": observacion },
      { "Name": "pemb_referenciasMix", "Type": "varchar", "Value": referenciasMix },
      { "Name": "i_detalle", "Type": "nvarchar", "Value": JSON.stringify(detalle) },
      { "Name": "i_accion", "Type": "varchar", "Value": "I" },
      { "Name": "i_user_aud", "Type": "varchar", "Value": userAud },
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  
  getReferenciaMix(referenciasMix: any, codCliente: Number) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byGetReferenciaMix" },
      { "Name": "codCliente", "Type": "nvarchar", "Value": codCliente.toString() },
      { "Name": "i_referenciasMix", "Type": "varchar", "Value": JSON.stringify(referenciasMix) }
    ];
    const base = {
      sp: 'Embarque.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  
  postSincronizarPlanificacionExportaciones(data, user){
    const ListParam = [
      { "Name": "pedidos", "Type": "NVarChar", "Value": JSON.stringify(data) },
      { "Name": "user", "Type": "VarChar", "Value": user.toString() }
    ];
    const base = {
      sp: 'exportaciones.sp_planificaPedidos',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
  
  postSincronizarPlanificacionBreakDown(data: {
    pedido: string,
    observBreakDown: string,
    plantaEmb: string,
    ModifBCE?: string,
    serieBCEOtro?: string,
    facturaBCEOtro?: string,
    dataJson: any
  }, user){
    const ListParam = [
      { "Name": "pedido", "Type": "NVarChar", "Value": data.pedido.toString() },
      { "Name": "user", "Type": "VarChar", "Value": user.toString() },
      { "Name": "observBreakDown", "Type": "VarChar", "Value": data.observBreakDown },
      { "Name": "plantaEmb", "Type": "NVarChar", "Value": data.plantaEmb.toString() },
      { "Name": "ModifBCE", "Type": "NVarChar", "Value": data.ModifBCE ? data.ModifBCE.toString() : "0" },
      { "Name": "serieBCEOtro", "Type": "VarChar", "Value": data.serieBCEOtro ? data.serieBCEOtro.toString() : "" },
      { "Name": "facturaBCEOtro", "Type": "VarChar", "Value": data.facturaBCEOtro ? data.facturaBCEOtro.toString() : "" },
      { "Name": "dataJson", "Type": "nVarChar", "Value": JSON.stringify(data.dataJson) }

    ];
    const base = {
      sp: 'exportaciones.sp_generaBreakDown',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    console.log('ListParam', ListParam);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  

}
