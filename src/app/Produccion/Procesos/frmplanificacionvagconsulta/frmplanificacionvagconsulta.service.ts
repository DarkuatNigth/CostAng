import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_APIREPORTPLANIFICACION, URL_CONSULT } from 'src/app/config/url.servicios';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';
import { CabeceraRequerimiento } from './frmplanificacionvagconsulta.component';

@Injectable({
  providedIn: 'root'
})
export class FrmplanificacionvagconsultaService {

  constructor(private http: HttpClient) { 
  }


  getLastPlanificacion() {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byLastPlanificacion" }
    ];
    const base = {
      sp: 'valoragregado.spr_PlanificacionVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getPlanificacionById(id: number) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byId" },
      { "Name": "i_plaId", "Type": "int", "Value": id.toString() }
    ];
    const base = {
      sp: 'valoragregado.spr_PlanificacionVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getPlanificacionSearch(data: any) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byFilter" },
      { "Name": "i_fechaDesde", "Type": "varchar", "Value": data.fechaDesde },
      { "Name": "i_fechaHasta", "Type": "varchar", "Value": data.fechaHasta },
    ];
    const base = {
      sp: 'valoragregado.spr_PlanificacionVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getPlanificacionHistoricaSearch(data: any) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byPlanificacionHistorica" },
      { "Name": "i_fechaDesde", "Type": "varchar", "Value": data.fechaDesde },
      { "Name": "i_fechaHasta", "Type": "varchar", "Value": data.fechaHasta },
    ];
    const base = {
      sp: 'valoragregado.spr_PlanificacionVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  postRequerimientoProductoVA(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "I" },
      { "Name": "rpc_observ", "Type": "varchar", "Value": data.cab.observ },
      { "Name": "rpc_tiplot", "Type": "varchar", "Value": data.cab.tiplot },
      { "Name": "rpc_GenLotOtr", "Type": "varchar", "Value": data.cab.genLotOtr },
      { "Name": "rpc_prodPed", "Type": "varchar", "Value": data.cab.codprod },
      { "Name": "rpc_nroSeLotOtr", "Type": "nvarchar", "Value": data.cab.numSecuencial?.toString() || null },
      { "Name": "rpc_ConLote", "Type": "varchar", "Value": data.cab.ConLote },
      { "Name": "rpc_factura", "Type": "varchar", "Value": data.cab.factura },
      { "Name": "rpc_talPed", "Type": "nvarchar", "Value": data.cab.talPed.toString() },
      { "Name": "rpc_MastPed", "Type": "nvarchar", "Value": data.cab.MastPed.toString() },
      { "Name": "rpc_LibPed", "Type": "nvarchar", "Value": data.cab.LibPed.toString() },
      { "Name": "rpc_MaxLibPed", "Type": "nvarchar", "Value": data.cab.MaxLibPed.toString() },
      { "Name": "rpc_boddes", "Type": "varchar", "Value": data.cab.boddes },
      { "Name": "rpc_loteExistente", "Type": "nvarchar", "Value": data.cab.numLote?.toString() || null },
      { "Name": "rpc_esmaquina", "Type": "varchar", "Value": data.cab.esmaquina },
      // { "Name": "detPlanifica_id", "Type": "int", "Value": data.cab.detPlanifica_id.toString() },
      { "Name": "i_detPlanifica", "Type": "varchar", "Value": JSON.stringify(data.detPlanifica) },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud }
    ];
    if (data.detFr && data.detFr.length > 0) {
      listParam.push({ "Name": "i_detalleFr", "Type": "varchar", "Value": JSON.stringify(data.detFr) });
    }
    if (data.detTe && data.detTe.length > 0) {
      listParam.push({ "Name": "i_detalleTe", "Type": "varchar", "Value": JSON.stringify(data.detTe) });
    }
    console.log('listParam', listParam);
    const base = {
      sp: 'valoragregado.spr_RequerimientoProductoVAInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  callApiReportePlanificacion(idPlanificacion: number) {
    let data = {
      "sp": "valoragregado.spr_PlanificacionVAConsultar",
      "param": [
        {
            "Name": "i_tipoB",
            "Type": "VarChar",
            "Value": "byReportExcel"
        },
        {
            "Name": "i_plaId",
            "Type": "Int",
            "Value": idPlanificacion.toString()
        }
      ],
      "conexion": "ConexionProdSNG"
    }
    const httpOptions = {
      headers: new HttpHeaders(
        {
          'Content-Type':'application/json'
        }
      )
    }

    var param = JSON.stringify(data);
      
    return this.http.post<ResultReportes>(URL_APIREPORTPLANIFICACION, param, httpOptions);
  }


  callApiReportePlanificacionVentas(idPlanificacion: number) {
    let data = {
      "sp": "valoragregado.spr_PlanificacionVAConsultar",
      "param": [
          {
              "Name": "i_tipoB",
              "Type": "VarChar",
              "Value": "byReportVentasExcel"
          },
          {
              "Name": "i_plaId",
              "Type": "Int",
              "Value": idPlanificacion.toString()
          }
      ],
      "conexion": "ConexionProdSNG"
  }
    const httpOptions = {
      headers: new HttpHeaders(
        {
          'Content-Type':'application/json'
        }
      )
    }

    var param = JSON.stringify(data);
      
    return this.http.post<ResultReportes>(URL_APIREPORTPLANIFICACION, param, httpOptions);
  }


  getProductoRequerimientoSearch(data: any) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "bySearchProduct" },
      { "Name": "pro_codcor", "Type": "varchar", "Value": data.codpro.toString() },
      { "Name": "pro_clas03", "Type": "varchar", "Value": data.tipo },
    ];
    const base = {
      sp: 'valoragregado.spr_RequerimientoProductoVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getBodegaDestino(user: any) {
    const ListParam = [
      { "Name": "tipo", "Type": "varchar", "Value": "1" },
      { "Name": "user", "Type": "varchar", "Value": user },
    ];
    const base = {
      sp: 'dbo.sp_obtienebodegareqprod',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
  getTallasVtaProd(codProd?: any) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "bySearchTallasVtaProduct" },
      { "Name": "pro_codcor", "Type": "varchar", "Value": codProd },
    ];
    const base = {
      sp: 'valoragregado.spr_RequerimientoProductoVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
  getCajasProdByLibras(codProd: string, libras: number) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byCalculaMastersCajas" },
      { "Name": "pro_codcor", "Type": "varchar", "Value": codProd },
      { "Name": "libras_cajas", "Type": "nvarchar", "Value": libras.toString() },
    ];
    const base = {
      sp: 'valoragregado.spr_RequerimientoProductoVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  
  getRequerimientoProducto(idRequerimiento: number) {
    const ListParam = [
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byId" },
      { "Name": "rpc_numero", "Type": "nvarchar", "Value": idRequerimiento.toString() },
    ];
    const base = {
      sp: 'valoragregado.spr_RequerimientoProductoVAConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  updateLotePlanificacion(plaDetId, numLote, userAud) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "UL" },
      { "Name": "pld_id", "Type": "nvarchar", "Value": plaDetId.toString() },
      { "Name": "pld_numLote", "Type": "nvarchar", "Value": numLote.toString() },
      { "Name": "i_user_aud", "Type": "varchar", "Value": userAud },
    ];
    const base = {
      sp: 'valoragregado.spr_planificacionVAInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  updateSecuencialPlanificacion(plaDetId, numSecuencial, userAud) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "US" },
      { "Name": "pld_id", "Type": "nvarchar", "Value": plaDetId.toString() },
      { "Name": "pld_numSecuencial", "Type": "nvarchar", "Value": numSecuencial.toString() },
      { "Name": "i_user_aud", "Type": "varchar", "Value": userAud },
    ];
    const base = {
      sp: 'valoragregado.spr_planificacionVAInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  getStockProducto(codpro, codtal, numlote) {
    const listParam = [
      { "Name": "codpro", "Type": "varchar", "Value": codpro.toString() },
      { "Name": "codtal", "Type": "nvarchar", "Value": codtal.toString() },
      { "Name": "tipo", "Type": "nvarchar", "Value": "1" },
      { "Name": "numlote", "Type": "nvarchar", "Value": numlote.toString() },
    ];
    const base = {
      sp: 'dbo.spr_SaldoProdNew3',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
