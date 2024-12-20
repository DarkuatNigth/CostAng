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

  postRequerimientoProductoVA(data: any) {
    const listParam = [
      { "Name": "i_accion", "Type": "char", "Value": "I" },
      { "Name": "rpc_observ", "Type": "varchar", "Value": data.cab.observ },
      { "Name": "rpc_tiplot", "Type": "varchar", "Value": data.cab.tiplot },
      { "Name": "rpc_codprod", "Type": "varchar", "Value": data.cab.codprod },
      { "Name": "rpc_ConLote", "Type": "varchar", "Value": data.cab.ConLote },
      { "Name": "rpc_factura", "Type": "varchar", "Value": data.cab.factura },
      { "Name": "rpc_talPed", "Type": "decimal", "Value": data.cab.talPed.toString() },
      { "Name": "rpc_MastPed", "Type": "decimal", "Value": data.cab.MastPed.toString() },
      { "Name": "rpc_LibPed", "Type": "decimal", "Value": data.cab.LibPed.toString() },
      { "Name": "rpc_MaxLibPed", "Type": "decimal", "Value": data.cab.MaxLibPed.toString() },
      { "Name": "rpc_boddes", "Type": "varchar", "Value": data.cab.boddes },
      { "Name": "i_detalleFr", "Type": "varchar", "Value": JSON.stringify(data.detFr) },
      { "Name": "i_detalleTe", "Type": "varchar", "Value": JSON.stringify(data.detTe) },
      { "Name": "i_user_aud", "Type": "varchar", "Value": data.userAud }
    ];
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

}
