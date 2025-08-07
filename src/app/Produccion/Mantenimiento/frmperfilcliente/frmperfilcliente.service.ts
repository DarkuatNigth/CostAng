import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';


export enum EnumAccion {
  Insertar = 'I',
  Actualizar = 'U'
}

@Injectable({
  providedIn: 'root'
})
export class FrmperfilclienteService {

  constructor(private http: HttpClient) { }


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

  postPerfilCliente(parametros: any, accion: EnumAccion) {
    const ListParam = [
      { "Name": "i_accion", "Type": "varchar", "Value": accion.toString() },
      { "Name": "pcl_id", "Type": "nvarchar", "Value": parametros.pcl_id ? parametros.pcl_id.toString() : null },
      { "Name": "pcl_tipo", "Type": "varchar", "Value": parametros.tipo },
      { "Name": "pcl_grupo", "Type": "varchar", "Value": parametros.grupo ? parametros.grupo.toString() : null },
      { "Name": "pcl_pais", "Type": "nvarchar", "Value": parametros.pais ?  parametros.pais.toString() : null },
      { "Name": "pcl_destino", "Type": "nvarchar", "Value": parametros.destino ? parametros.destino.toString() : null },
      { "Name": "pcl_cliente", "Type": "nvarchar", "Value": parametros.cliente ? parametros.cliente.toString() : null },
      { "Name": "pcl_paletsSulfito", "Type": "nvarchar", "Value": parametros.paletsSulfito ? parametros.paletsSulfito.toString() : '0' },
      { "Name": "pcl_paletsAusenciaVibrios", "Type": "nvarchar", "Value": parametros.paletsAusenciaVibrios ? parametros.paletsAusenciaVibrios.toString() : '0' },
      { "Name": "pcl_permiteMix", "Type": "nvarchar", "Value": parametros.permiteMix ? '1' : null },
      { "Name": "pcl_permiteMixTemp", "Type": "nvarchar", "Value": parametros.permiteMixTemp ? '1' : null },
      { "Name": "pcl_permiteElegirDestino", "Type": "nvarchar", "Value": parametros.permiteElegirDestino ? '1' : null },
      { "Name": "pcl_fechaMixTemp", "Type": "varchar", "Value": parametros.fechaMixTemp },
      { "Name": "i_user_aud", "Type": "varchar", "Value": parametros.userAud },
    ];
    console.log('ListParam', ListParam);
    const base = {
      sp: 'Embarque.spr_perfilClientePlanificacionInsert',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  
  getPerfilClienteByParams({
    tipo,
    grupo = null,
    pais = null,
    destino = null,
    cliente = null
  }) {
    const ListParam = [
      { "Name": "pcl_tipo", "Type": "varchar", "Value": tipo ? tipo.toString() : null },
      { "Name": "pcl_grupo", "Type": "varchar", "Value": grupo ? grupo.toString() : null },
      { "Name": "pcl_pais", "Type": "nvarchar", "Value": pais ? pais.toString() : null },
      { "Name": "pcl_destino", "Type": "nvarchar", "Value": destino ? destino.toString() : null },
      { "Name": "pcl_cliente", "Type": "nvarchar", "Value": cliente ? cliente.toString() : null },
      { "Name": "i_tipoB", "Type": "varchar", "Value": "byParams" }
    ];
    const base = {
      sp: 'Embarque.spr_perfilClientePlanificacionConsultar',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
