import { HttpClient } from '@angular/common/http';
import { CONNECTION_PROD, URL_CONSULT } from 'src/app/config/url.servicios';
import { Injectable } from '@angular/core';
import { ResultWS } from 'src/app/Interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class FrmtransaccionusuarioService {

  constructor(private http: HttpClient) { }

    async usuariosGet() {
      const ListParam = [{ "Name": "tipo", "Type": "int", "Value": "1" }];
      const base = {
        sp: 'seguridad.spr_transaccionUsuarioConsultar',
        param: ListParam,
        conexion: CONNECTION_PROD
      };
      return this.http.post<ResultWS>(URL_CONSULT, base);
    }

    async transaccionesGet() {
      const ListParam = [{ "Name": "tipo", "Type": "int", "Value": "2" }];
      const base = {
        sp: 'seguridad.spr_transaccionUsuarioConsultar',
        param: ListParam,
        conexion: CONNECTION_PROD
      };
      return this.http.post<ResultWS>(URL_CONSULT, base);
    };

    async transaccionUsuarioGet(Usuario: string) {
      const ListParam = [
        { "Name": "tipo", "Type": "int", "Value": "3" },
        { "Name": "identifica", "Type": "varchar", "Value": Usuario }
      ];
      const base = {
        sp: 'seguridad.spr_transaccionUsuarioConsultar',
        param: ListParam,
        conexion: CONNECTION_PROD
      };
      return this.http.post<ResultWS>(URL_CONSULT, base);
    };

    async transaccionUsuarioGrabar(usuario: string, jsonData: string, accion: string) {
    
      const ListParam = [
        { Name: 'usuario', Type: 'Varchar', Value: usuario },
        { Name: 'jsonData', Type: 'Varchar', Value: jsonData },
        { Name: 'accion', Type: 'Varchar', Value: accion },
      ];
  
      const base = {
        sp: 'seguridad.spr_transaccionUsuarioGrabar',
        param: ListParam,
        conexion: CONNECTION_PROD,
      };

      return this.http.post<ResultWS>(URL_CONSULT, base);
    };
}
