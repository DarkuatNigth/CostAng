import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT, URL_PRINT } from 'src/app/config/url.servicios';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmsolicitudetiquetaService {

  constructor(private http: HttpClient) { }

  obtieneInfoUsuario(usuario: string) {
    const listParam = [
      { Name: 'usuario', Type: 'VarChar', Value: usuario }
    ];
    const base = {
      sp: 'sp_obtienejefelineaymaq',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  obtieneLotesPlanificadosXMaquina(maquina: string, usuario: string, turno: string, soloCerrados: boolean = false) {
    const listParam = [
      { Name: 'maquina', Type: 'VarChar', Value: maquina },
      { Name: 'usuario', Type: 'VarChar', Value: usuario },
      { Name: 'turno', Type: 'VarChar', Value: turno },
      { Name: 'soloCerrados', Type: 'VarChar', Value: soloCerrados ? '1' : '0' }
    ];
    const base = {
      sp: 'sp_obtieneloteplanificadosxmaquina',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  obtieneResumenLiquidacionEtiquetasSolicitadas(usuario: string, turno: string, soloCerrados: boolean = false) {
    const listParam = [
      { Name: 'usuario', Type: 'VarChar', Value: usuario },
      { Name: 'turno', Type: 'VarChar', Value: turno },
      { Name: 'soloCerrados', Type: 'VarChar', Value: soloCerrados ? '1' : '0' }
    ];
    const base = {
      sp: 'sp_obtieneResumenLiquidacionEtiquetasSolicitadas',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  
  obtieneDetalleLote(secuencia: string, proceso: string) {
    const listParam = [
      { Name: 'secuencia', Type: 'VarChar', Value: secuencia },
      { Name: 'proceso', Type: 'VarChar', Value: proceso }
    ];
    const base = {
      sp: 'sp_detobtloteplanifxmaquina_ANGPROD',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  Obtienegeneradoybloqueado(lote: string, codproducto: string, Talla: string, proceso: string, CodPedido: string, codMaquina: string) {
    const listParam = [
      { Name: 'numlote', Type: 'VarChar', Value: lote },
      { Name: 'codprod', Type: 'VarChar', Value: codproducto },
      { Name: 'taldescri', Type: 'VarChar', Value: Talla },
      { Name: 'proceso', Type: 'VarChar', Value: proceso },
      { Name: 'codpedido', Type: 'VarChar', Value: CodPedido },
      { Name: 'makina', Type: 'VarChar', Value: codMaquina },
    ];
    const base = {
      sp: 'sp_Obtienegeneradoybloqueado_ANGPROD',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  Obtienecantxgenerar(CodPedido: string, codproducto: string, codtalla: string, proceso: string) {
    const listParam = [
      { Name: 'codpedido', Type: 'VarChar', Value: CodPedido },
      { Name: 'codproducto', Type: 'VarChar', Value: codproducto },
      { Name: 'codtalla', Type: 'VarChar', Value: codtalla },
      { Name: 'tipo', Type: 'VarChar', Value: proceso }
    ];
    const base = {
      sp: 'sp_obtienenumeroPOconsulta',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  ObtieneEtiqSolicitaVsLiquidada(lote: string, cmbMaquina: string, codTurno: string) {
    const listParam = [
      { Name: 'lote', Type: 'VarChar', Value: lote },
      { Name: 'maquina', Type: 'VarChar', Value: cmbMaquina },
      { Name: 'turno', Type: 'VarChar', Value: codTurno }
    ];
    const base = {
      sp: 'etiquetas.spr_etiqsolicitadaVsetiqLiquidada_Consultar',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  grabaDatosBalanza2(data: {
    maquina: string;
    lote: string;
    jefelinea: string;
    tiporomaneo: string;
    codproveedor: string;
    piscina: string;
    codart: string;
    talla: string;
    secuenlote: string;
    numrequerimiento: string;
    i_user_aud: string;
    i_accion: string;
  }) {
    const listParam = [
      { Name: 'maquina', Type: 'VarChar', Value: data.maquina },
      { Name: 'lote', Type: 'VarChar', Value: data.lote },
      { Name: 'jefelinea', Type: 'VarChar', Value: data.jefelinea },
      { Name: 'tiporomaneo', Type: 'VarChar', Value: data.tiporomaneo },
      { Name: 'codproveedor', Type: 'VarChar', Value: data.codproveedor },
      { Name: 'piscina', Type: 'VarChar', Value: data.piscina },
      { Name: 'codart', Type: 'VarChar', Value: data.codart },
      { Name: 'talla', Type: 'VarChar', Value: data.talla },
      { Name: 'secuenlote', Type: 'VarChar', Value: data.secuenlote },
      { Name: 'numrequerimiento', Type: 'Int', Value: data.numrequerimiento },
      { Name: 'i_user_aud', Type: 'VarChar', Value: data.i_user_aud },
      { Name: 'i_accion', Type: 'VarChar', Value: data.i_accion }
    ];

    const base = {
      sp: 'dbo.spr_tbDatosMaquinaParaBalanzaInsert',
      param: listParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  solicitaetiquetas(maquina: string,
    codJefeLinea: string,
    codproducto: string,
    proceso: string,
    codtalla: string,
    codtallavta: string,
    codTurno: string,
    cmbGrupo: string,
    lote: string,
    cmbTipoEtiqueta: string,
    CodPedido: string,
    cantidadSolicitada: number,
    observacion: string,
    fechaEtiqueta: string,
    usuarioEmpresa: string,
    esTallaFrecuencia: boolean
  ) {

    const listParam = [
      { Name: 'makina', Type: 'VarChar', Value: maquina },
      { Name: 'jefelinea', Type: 'NVarChar', Value: codJefeLinea },
      { Name: 'codprod', Type: 'VarChar', Value: codproducto },
      { Name: 'proceso', Type: 'VarChar', Value: proceso },
      { Name: 'codtalla', Type: 'VarChar', Value: codtalla },
      { Name: 'codtallam', Type: 'VarChar', Value: codtallavta },
      { Name: 'turno', Type: 'VarChar', Value: codTurno },
      { Name: 'grupo', Type: 'VarChar', Value: cmbGrupo },
      { Name: 'lote', Type: 'VarChar', Value: lote },
      { Name: 'tipoetiqueta', Type: 'VarChar', Value: cmbTipoEtiqueta },
      { Name: 'pedido', Type: 'VarChar', Value: CodPedido },
      { Name: 'cantidad', Type: 'VarChar', Value: cantidadSolicitada.toString() },
      { Name: 'observacion', Type: 'VarChar', Value: observacion },
      { Name: 'estallafrecuencia', Type: 'VarChar', Value: esTallaFrecuencia ? '1' : '0' },
      { Name: 'fecha', Type: 'VarChar', Value: fechaEtiqueta },
      { Name: 'usuario', Type: 'VarChar', Value: usuarioEmpresa }
    ];

    const base = {
      sp: 'dbo.sp_GeneraEtiquetas_ANGPROD',
      param: listParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  recomiendaCantidadEtiquetas(
    makina: string,
    jefelinea: string,
    proceso: string,
    codprod: string,
    codtalla: string,
    lote: string,
    tipoetiqueta: string,
    turno: string,
    estallafrecuencia: string
  ) {
    const listParam = [
      { Name: 'makina', Type: 'VarChar', Value: makina },
      { Name: 'jefelinea', Type: 'NVarChar', Value: jefelinea },
      { Name: 'proceso', Type: 'VarChar', Value: proceso },
      { Name: 'codprod', Type: 'VarChar', Value: codprod },
      { Name: 'codtalla', Type: 'VarChar', Value: codtalla },
      { Name: 'lote', Type: 'VarChar', Value: lote },
      { Name: 'tipoetiqueta', Type: 'VarChar', Value: tipoetiqueta },
      { Name: 'turno', Type: 'VarChar', Value: turno },
      { Name: 'estallafrecuencia', Type: 'VarChar', Value: estallafrecuencia }
    ];

    const base = {
      sp: 'dbo.sp_RecomiendaCantidadEtiquetas_ANGPROD',
      param: listParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  // TODO: SOLO DEJAR LOTE
  obtenerDistribucionHistoricaPorGramaje(
    lote: string,
  ) {
    const listParam = [
      { Name: 'makina', Type: 'VarChar', Value: 'makina' },
      { Name: 'jefelinea', Type: 'NVarChar', Value: '0' },
      { Name: 'proceso', Type: 'VarChar', Value: 'proceso' },
      { Name: 'codprod', Type: 'VarChar', Value: 'codprod' },
      { Name: 'codtalla', Type: 'VarChar', Value: 'codtalla' },
      { Name: 'lote', Type: 'VarChar', Value: lote },
      { Name: 'tipoetiqueta', Type: 'VarChar', Value: 'tipoetiqueta' },
      { Name: 'turno', Type: 'VarChar', Value: 'turno' },
      // { Name: 'lote', Type: 'VarChar', Value: lote },
      { Name: 'soloHistTall', Type: 'VarChar', Value: '1' }
    ];

    const base = {
      sp: 'dbo.sp_RecomiendaCantidadEtiquetas_ANGPROD',
      param: listParam,
      conexion: CONNECTION_PROD
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


  imprimirEtiquetaBalanza(ip: string, port: number, texto: string) {
    let data = {
      "ip": ip,
      "port": port,
      "text": texto
    }
    const httpOptions = {
      headers: new HttpHeaders(
        {
          'Content-Type': 'application/json'
        }
      )
    }
    var param = JSON.stringify(data);
    return this.http.post<ResultReportes>(URL_PRINT, param, httpOptions);
    // return this.http.post<ResultReportes>('http://localhost/SiteReports/Api/Print2', param, httpOptions);
  }

}
