import { firstValueFrom, Observable } from 'rxjs';
// Definimos la interfaz de la respuesta para que tu código sea fuertemente tipado
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  hasData?: boolean;
  message?: string;
  status?: number;
}


export async function callApi<T>(obs$: Observable<any>): Promise<ApiResponse<T>> 
{
  try {
    const res: any = await firstValueFrom(obs$);

    if (res?.Codigo === false || res?.codigo === false || res?.succeeded === false) {
      return {
        ok: false,
        message: res?.Description || res?.descripcion || res?.message || 'Error del servidor'
      }
    }

    return { ok: true, data: res?.data || res, hasData: hasData(res) }
  } catch (e: any) {
    const url = e?.url || 'URL desconocida';
    const message = e?.error?.Description ||
      e?.error?.message ||
      (e?.status === 0 && `No se pudo conectar con el servidor (${url}). Verifique su conexión`) ||
      (e?.error?.error.length > 0 && e.error.error[0]) ||
      e.message ||
      `Error inesperado (${url})`
    return {
      ok: false,
      message,
      status: e?.status ?? 0
    }
  }
}

export function hasData(resp: any): boolean {
  return !!(resp?.Dt && resp?.Dt?.Table?.length > 0);
}