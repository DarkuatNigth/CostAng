import { AnularValorizacionesRequest } from './frmcostprodconfig.models';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_APICOSTOS } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { CuentasDisponiblesFiltro, GuardarCostoProductivoMantenimientoRequest } from './frmcostprodconfig.models';

@Injectable({ providedIn: 'root' })
export class FrmcostprodconfigService {
  private readonly baseUrl = URL_APICOSTOS + 'ProcesoParametro/configuracion-costo-productivo';

  constructor(private readonly http: HttpClient) {}

  consultar(incluirCuentas = true) {
    return this.http.get<ResultWS>(this.baseUrl, { params: new HttpParams().set('incluirCuentas', String(incluirCuentas)) });
  }

  consultarCuentas() {
    return this.http.get<ResultWS>(`${this.baseUrl}/cuentas`);
  }

  cuentasDisponibles(filtro: CuentasDisponiblesFiltro) {
    let params = new HttpParams();
    Object.entries(filtro).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v)); });
    return this.http.get<ResultWS>(`${this.baseUrl}/cuentas-disponibles`, { params });
  }

  // la respuesta se procesa con callApi en el componente, como guardar.
  anularValorizaciones(tipo: AnularValorizacionesRequest['tipo'], usuario: string) {
    const request: AnularValorizacionesRequest = { tipo, usuario };
    return this.http.post<ResultWS>(URL_APICOSTOS + 'ProcesoParametro/anular-valorizaciones', request);
  }

  guardar(request: GuardarCostoProductivoMantenimientoRequest) {
    return this.http.post<ResultWS>(this.baseUrl, request);
  }
}
