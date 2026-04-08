import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, URL_CONSULT } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmenviadatosempagranService {

  constructor(
    private http: HttpClient
  ) { 
  }

  obtenerLotesEnvioApiEmpagran(fechaDesde: string, fechaHasta: string) {
    const ListParam = [
      { "Name": "i_fechaDesde", "Type": "varchar", "Value": fechaDesde },
      { "Name": "i_fechaHasta", "Type": "varchar", "Value": fechaHasta },
      { "Name": "i_tipoB", "Type": "varchar", "Value": 'byFilter' },
    ];
    const base = {
      sp: 'produccion.spr_obtenerLotesEnvioApiEmpagran',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  


  enviaDataApiEmpagran(lote: string) {
    const ListParam = [
      { "Name": "i_rloNumero", "Type": "varchar", "Value": lote },
    ];
    const base = {
      sp: 'produccion.sp_enviaDataApiEmpagran',
      param: ListParam,
      conexion: CONNECTION_PROD
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }


}
