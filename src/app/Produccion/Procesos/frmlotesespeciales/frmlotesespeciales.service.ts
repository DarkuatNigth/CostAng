import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CONNECTION_PROD, URL_CONSULT } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { int } from '@zxing/library/esm/customTypings';


@Injectable({
  providedIn: 'root'
})
export class FrmlotesespecialesService {

  constructor(private http: HttpClient) { }

  async lotesEspecialesGrabar(lotesCantidad: number, fecha: string, clase: string, usuario: string) {

    const ListParam = [
      { Name: 'lotesCantidad', Type: 'Int', Value: lotesCantidad.toString() },
      { Name: 'fecha', Type: 'Varchar', Value: fecha },
      { Name: 'clase', Type: 'Varchar', Value: clase },
      { Name: 'usuario', Type: 'Varchar', Value: usuario },
    ];

    const base = {
      sp: 'Liquidaciones.spr_lotesEspecialesCrear',
      param: ListParam,
      conexion: CONNECTION_PROD,
    };

    return this.http.post<ResultWS>(URL_CONSULT, base);
    };

    async obtenerCatalogoTCA() {

      const ListParam = [
        { Name: 'cat_codigo', Type: 'Varchar', Value: 'tca' },
        { Name: 'incluirCampoVacio', Type: 'Int', Value: '0' },
      ];
  
      const base = {
        sp: 'general.sp_obtenerCatalogo',
        param: ListParam,
        conexion: CONNECTION_PROD,
      };
  
      return this.http.post<ResultWS>(URL_CONSULT, base);
      }

}
