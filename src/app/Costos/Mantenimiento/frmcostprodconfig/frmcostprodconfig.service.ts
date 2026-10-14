import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { URL_APICOSTOS } from 'src/app/config/url.servicios';
import { ResultWS } from 'src/app/Interfaces/interfaces';
import { GuardarCostoProductivoMantenimientoRequest } from './frmcostprodconfig.models';

@Injectable({ providedIn: 'root' })
export class FrmcostprodconfigService {
  private readonly baseUrl = URL_APICOSTOS + 'ProcesoParametro/configuracion-costo-productivo';

  constructor(private readonly http: HttpClient) {}

  consultar() {
    return this.http.get<ResultWS>(this.baseUrl);
  }

  guardar(request: GuardarCostoProductivoMantenimientoRequest) {
    return this.http.post<ResultWS>(this.baseUrl, request);
  }
}
