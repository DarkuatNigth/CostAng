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
      sp: 'produccion.spr_PedidosPlanificacionEmbarqueConsultar',
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
      sp: 'produccion.spr_PedidosPlanificacionEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  getDetalleStockBloqueado(codprod: string, codtalla: number) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byId" },
      { "Name": "i_codprod", "Type": "varchar", "Value": codprod },
      { "Name": "i_codtalla", "Type": "nvarchar", "Value": codtalla.toString() }
    ];
    const base = {
      sp: 'produccion.spr_stockBloqueadoPlaEmbarqueConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }



  postPlanificacionEmbarque({fecPedido, pedido, codCliente, observacion, plantaEmbarque, fechaPlanificacion, pedFechaEstimado, userAud }) {
    const listParam = [
      { "Name": "emb_fechaped", "Type": "varchar", "Value": formatDate(fecPedido, 'yyyy-MM-dd', 'en-US') },
      { "Name": "emb_factura", "Type": "varchar", "Value": pedido },
      { "Name": "emb_cliente", "Type": "int", "Value": codCliente.toString() },
      { "Name": "emb_observaciones", "Type": "varchar", "Value": observacion },
      { "Name": "emb_plantaemb", "Type": "int", "Value": plantaEmbarque.toString() },
      { "Name": "emb_fechacarga", "Type": "varchar", "Value": formatDate(fechaPlanificacion, 'yyyy-MM-dd', 'en-US') },
      { "Name": "emb_fechaestimada", "Type": "varchar", "Value": formatDate(pedFechaEstimado, 'yyyy-MM-dd', 'en-US') },
      { "Name": "i_accion", "Type": "varchar", "Value": "I" },
      { "Name": "i_user_aud", "Type": "varchar", "Value": userAud },
    ];
    const base = {
      sp: 'produccion.spr_PedidosPlanificacionEmbarqueInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
