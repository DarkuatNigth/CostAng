import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { int } from '@zxing/library/esm/customTypings';
import { CONNECTION_PROD, CONNECTION_RRHH, URL_CONSULTRRHH } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmdiasparadaplantaService {

  constructor(private http: HttpClient) { }
  
  getPlantas(opcion: string) {
    const ListParam = [
      { "Name": "opcion", "Type": "varchar", "Value": opcion }
    ];
    const base = {
      sp: 'SGCAM.produccion.spr_plantaProcOEGet',
      param: ListParam,
      conexion: CONNECTION_RRHH
    };
    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  getCatalogosTipoProceso(cabcodigo: string) {
    const ListParam = [
      { "Name": "i_cabCodigo", "Type": "varchar", "Value": cabcodigo }
    ];
    const base = {
      sp: 'SGCAM.general.spr_catalogoConsulta',
      param: ListParam,
      conexion: CONNECTION_RRHH
    };
    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  getCatalogoTurno(cabcodigo: string) {
    const ListParam = [
      { "Name": "i_cabCodigo", "Type": "varchar", "Value": cabcodigo }
    ];
    const base = {
      sp: 'RRHH.general.spr_catalogoConsulta',
      param: ListParam,
      conexion: CONNECTION_RRHH
    };
    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  diasParaPlantaGuardar(usuario: string, jsonData: string) {

    const ListParam = [
      { Name: 'usuario', Type: 'Varchar', Value: usuario },
      { Name: 'jsonData', Type: 'Varchar', Value: jsonData },
    ];

    const base = {
      sp: 'SGCAM.produccion.spr_procesoDiasParadaPlantaGuardar',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  diasParaPlantaEliminar(pp_id: string, usuario: string) {

    const ListParam = [
      { Name: 'ppid', Type: 'varchar', Value: pp_id },
      { Name: 'usuario', Type: 'Varchar', Value: usuario },
    ];

    const base = {
      sp: 'SGCAM.produccion.spr_procesoDiasParadaPlantaEliminar',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

  diasParaPlantaConsultar(paCodigo: string, tipo: string, fecha: string) {

    const ListParam = [
      { Name: 'paCodigo', Type: 'Varchar', Value: paCodigo },
      { Name: 'tipo', Type: 'Varchar', Value: tipo },
      { Name: 'fecha', Type: 'Varchar', Value: fecha },
    ];

    const base = {
      sp: 'SGCAM.produccion.spr_procesoDiasParadaPlantaConsultar',
      param: ListParam,
      conexion: CONNECTION_RRHH,
    };

    return this.http.post<ResultWS>(URL_CONSULTRRHH, base);
  }

}
