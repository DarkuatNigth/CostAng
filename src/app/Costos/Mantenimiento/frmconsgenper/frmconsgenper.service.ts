import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_CONSULT, URL_TRANSACIMAGEN, CONNECTION_SGCAM} from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class FrmconsgenperService {
  constructor(private http: HttpClient) {}

 
  SetPermisosGrabar(listDet,  user, empresa) {
    const ListParam = [
      {
        Name: 'listConsgene',
        Type: 'NVarChar',
        Value: listDet === null ? 'null' : listDet.toString(),
      },
      { Name: 'user', Type: 'VarChar', Value: user.toString() },
      { Name: 'empresa', Type: 'VarChar', Value: empresa.toString() },

    ];

    const base = {
      sp: 'seguridad.spr_GrabarGeneralPermiso',
      param: ListParam,
      conexion: CONNECTION_SGCAM,
    };

    var formdata = new FormData();
    formdata.append('param', JSON.stringify(base));
    formdata.append('paramImagen', '{}');
    //console.log('SetPermisosGrabar',base);
    return this.http.post<ResultWS>(URL_TRANSACIMAGEN, formdata);
  }

  getConsultasGeneralesPermisos(accion,empresa,codigo,idusuario ) {
    const ListParam = [   
      { Name: 'i_accion',Type: 'VarChar',  Value: accion.toString()},
      { Name: 'i_empresa', Type: 'VarChar', Value: empresa.toString() },
      { Name: 'i_codigo', Type: 'VarChar', Value: empresa.toString() },
      { Name: 'usuario', Type: 'VarChar', Value: idusuario.toString() },
    ];

    const base = {
      sp: 'seguridad.spr_datosInicialesConsultaGeneral',
      param: ListParam,
      conexion: CONNECTION_SGCAM,
    };
    //console.log('getConsultasGeneralesPermisos',base);
    return this.http.post<ResultWS>(URL_CONSULT, base);
  }

}
