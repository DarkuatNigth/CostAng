import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import {
  CONNECTION_PROD,
  URL_APICOSTOS,
  URL_CONSULT,
} from 'src/app/config/url.servicios';
import {
  ConfirmarDiariosCierreRequest,
  DiariosCierreDTO,
  ResultWS,
} from './diarios-cierre';
import {
  MOCK_CONFIRMAR_DIARIOS_CIERRE,
  MOCK_DIARIOS_CIERRE_ENERO_2026,
  MOCK_PARAMETROS_DIARIOS_CIERRE,
  USAR_MOCK_DIARIOS_CIERRE,
} from './diarios-cierre.mock';

@Injectable({ providedIn: 'root' })
export class FrmdiarioscierreService {

  private readonly urlDiarios = URL_APICOSTOS + 'ProcesoParametro/diarios-cierre';

  constructor(private http: HttpClient) { }

  getDataParametros(): Observable<ResultWS<any>> {
    if (USAR_MOCK_DIARIOS_CIERRE) {
      return of(MOCK_PARAMETROS_DIARIOS_CIERRE);
    }

    const base = {
      sp: 'dbo.SP_DATA_UTILIDADCONTENEDOR',
      param: [],
      conexion: CONNECTION_PROD,
    };

    return this.http.post<ResultWS<any>>(URL_CONSULT, base);
  }

  /**
   * En modo mock solo está cargado ENERO 2026, que corresponde
   * a los archivos de cierre compartidos.
   */
  getDiariosCierre(anio: number, mes: number): Observable<ResultWS<DiariosCierreDTO>> {
    if (USAR_MOCK_DIARIOS_CIERRE) {
      if (anio === 2026 && mes === 1) {
        return of(MOCK_DIARIOS_CIERRE_ENERO_2026);
      }

      return of({
        Codigo: false,
        Description: 'El mock únicamente contiene información para ENERO 2026.',
      });
    }

    const params = new HttpParams()
      .set('strAnio', anio.toString())
      .set('strMes', mes.toString());

    return this.http.get<ResultWS<DiariosCierreDTO>>(this.urlDiarios, { params });
  }

  confirmarDiariosCierre(
    request: ConfirmarDiariosCierreRequest
  ): Observable<ResultWS<any>> {
    if (USAR_MOCK_DIARIOS_CIERRE) {
      return of(MOCK_CONFIRMAR_DIARIOS_CIERRE);
    }

    return this.http.post<ResultWS<any>>(`${this.urlDiarios}/confirmar`, request);
  }

  callExcellFile(data: any) {

  const request = JSON.stringify(data);

  const url =
    URL_APICOSTOS + 'Reporting/exportar-excel';

  return this.http.post(url, request, {
    headers: {
      'Content-Type': 'application/json'
    },
    responseType: 'blob'
  });
}
}
