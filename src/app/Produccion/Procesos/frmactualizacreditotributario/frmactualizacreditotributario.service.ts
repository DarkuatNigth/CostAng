import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CONNECTION_PROD, CONNECTION_PROD2, CONNECTION_PRODIMG, URL_CONSULT, URL_TRANSACIMAGEN } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmactualizacreditotributarioService {

  constructor(private http: HttpClient) { 
  }
  
  actualizaDeuda(jsonDetalle: any) {
    const listParam = [
      { "Name": "@jsonDetalle", "Type": "varchar", "Value": JSON.stringify(jsonDetalle) },
      { "Name": "@usuario", "Type": "varchar", "Value": jsonDetalle.userAud }
    ];
    const base = {
      sp: 'dbo.spr_ActualizaCreditoTributarioDeudasGrabar',
      param: listParam,
      conexion: CONNECTION_PRODIMG
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
  
  getDeudas(jsonDetalle: any) {
debugger;
  const listParam = [
    { "Name": "@jsonDetalle", "Type": "nvarchar", "Value": JSON.stringify(jsonDetalle) }
  ];
  const base = {
    sp: 'dbo.spr_DeudasConsultar',
    param: listParam,
    conexion: CONNECTION_PRODIMG  
  };
  return this.http.post<ResultWS>(URL_CONSULT, base);
}
 
  getPlantillaDeudas() {
    const base = {
      sp: 'dbo.spr_PlantillaDeudasConsultar',
      param: [],
      conexion: CONNECTION_PRODIMG
    };
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }
}

