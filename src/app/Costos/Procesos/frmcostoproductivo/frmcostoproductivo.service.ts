import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponseCostoProductivo,
  GuardarCostoProductivoRequest
} from './costo-productivo.model';
import { URL_APICOSTOS } from 'src/app/config/url.servicios';

@Injectable({ providedIn: 'root' })
export class FrmcostoproductivoService {
  private readonly endpoint = URL_APICOSTOS +'ProcesoParametro/costo-productivo';

  constructor(private readonly http: HttpClient) {}

  consultar(anio: number, mes: number): Observable<ApiResponseCostoProductivo> {
    const params = new HttpParams()
      .set('strAnio', anio.toString())
      .set('strMes', mes.toString());

    return this.http.get<ApiResponseCostoProductivo>(this.endpoint, { params });
  }

  guardar(request: GuardarCostoProductivoRequest): Observable<ApiResponseCostoProductivo> {
    return this.http.post<ApiResponseCostoProductivo>(this.endpoint, request);
  }

  callExcellFile(data: any): Observable<Blob> {
    const request = JSON.stringify(data);
    const url = URL_APICOSTOS + 'Reporting/exportar-excel';

    return this.http.post(url, request, {
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'blob'
    });
  }
}
