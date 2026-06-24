import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT, URL_PRINT } from 'src/app/config/url.servicios';
import { ResultReportes, ResultWS } from 'src/app/Interfaces/interfaces';


@Injectable({
  providedIn: 'root'
})
export class FrminiciofinloteService {

  constructor(private http: HttpClient) { }

  obtieneListadoMotivos() {
    const base = {
      sp: 'produccion.spr_listadomotivos_Consulta',
      param: [],
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

  iniciofinproceso(data: {
    tipo: string;
    codasignacion: string;
    numemple: string;
    asistencia: string;
    faltas: string;
    atrasos: string;
    permvac: string;
    usuario: string;
    lbsproc: string;
    observacion: string;
    maquina: string;
    lote: string;
    retiraMatLot: boolean;
    motivoretiro: string | null;
  }) {
    const listParam = [
      { Name: 'tipo', Type: 'VarChar', Value: data.tipo },
      { Name: 'codasignacion', Type: 'NVarChar', Value: data.codasignacion },
      { Name: 'numemple', Type: 'VarChar', Value: data.numemple },
      { Name: 'asistencia', Type: 'VarChar', Value: data.asistencia },
      { Name: 'faltas', Type: 'VarChar', Value: data.faltas },
      { Name: 'atrasos', Type: 'VarChar', Value: data.atrasos },
      { Name: 'permvac', Type: 'VarChar', Value: data.permvac },
      { Name: 'usuario', Type: 'VarChar', Value: data.usuario },
      { Name: 'lbsproc', Type: 'VarChar', Value: data.lbsproc },
      { Name: 'observacion', Type: 'VarChar', Value: data.observacion },
      { Name: 'maquina', Type: 'VarChar', Value: data.maquina },
      { Name: 'lote', Type: 'VarChar', Value: data.lote },
      { Name: 'retiraMatLot', Type: 'VarChar', Value: data.retiraMatLot ? '1' : '0' },
      { Name: 'motivoretiro', Type: 'Int', Value: data.motivoretiro?.toString() ?? null }
    ];
    const base = {
      sp: 'sp_iniciofinprocesolote',
      param: listParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}
