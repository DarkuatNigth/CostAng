# Componentes del proyecto Costos (CostAng)

Fuente: repo `DarkuatNigth/CostAng`, rama `master`, commit `dcedaaa` (14/10/2026), carpeta `src/app/Costos`.
Backend: `DarkuatNigth/CostMan`, commit `7ae5151`. Base API: `URL_APICOSTOS`.
Todos los módulos se cargan como hijos de `FullComponent` en `app-routing.module.ts`.

> Al momento del commit, ninguna ruta de Costos tiene `AuthGuard` activo (está comentado para pruebas).

## Pantallas

| Carpeta | Ruta | Endpoints / SP que consume | Qué hace |
| --- | --- | --- | --- |
| `Consultas/frmconsultageneral` | `ext-consultageneral` | `Reporting/*` (ruta armada en tiempo de ejecución), `Reporting/exportar-excel` | Consulta general de reportes de costos |
| `Mantenimiento/frmconsgenper` | `ext-mantconfig` | SP `seguridad.spr_datosInicialesConsultaGeneral`, `seguridad.spr_GrabarGeneralPermiso` | Permisos de la consulta general |
| `Mantenimiento/frmcostprodconfig` | `ext-costprodconfig` | GET/POST `ProcesoParametro/configuracion-costo-productivo` | Matriz de costeo (tipos de proceso × procesos), tipos y cuentas |
| `Procesos/frmconsolidadoenergia` | `ext-consolidadoenergia` | GET `ProcesoParametro/consol-elec`, SP `dbo.SP_DATA_UTILIDADCONTENEDOR` (años) | Consolidado anual USD / kWh / alumbrado por planta |
| `Procesos/frmcostoproductivo` | `ext-costoproductivo` | GET/POST `ProcesoParametro/costo-productivo`, `Reporting/exportar-excel` (sp `costo-productivo`) | Costo productivo por cuenta y etapa; guarda el resultado |
| `Procesos/frmdiarioscierre` | `ext-diarios-cierre` | GET `ProcesoParametro/diarios-cierre`, POST `.../diarios-cierre/confirmar`, `Reporting/exportar-excel` (sp `diarios-cierre`), SP `dbo.SP_DATA_UTILIDADCONTENEDOR` | Diarios de cierre (retorno de contenedores, transferencia G.I.F.) |
| `Procesos/frmdistribucionluz` | `ext-mantcostelectric` | GET/POST `ProcesoParametro/param-elec`, SP `dbo.SP_DATA_UTILIDADCONTENEDOR` | Drivers y distribución de energía y basura (SONGA 1/2, COMIN) |
| `Procesos/frmparametrizacionproceso` | `ext-parametrizacionprocesos` | GET `ProcesoParametro/param-proc`, POST `guardar-warren`, POST `guardar-cierre-param-proc`, SP `dbo.SP_DATA_UTILIDADCONTENEDOR` | Parametrización por proceso, cálculo Warren y cierre |
| `Procesos/frmregistrarinventariovalorado` | `ext-registroinventarioval` | GET `Reporting/inv-estructura`, POST `Reporting/inv-val` | Registro de inventario valorado |

## Archivos de apoyo por pantalla

- `frmparametrizacionproceso`: `param-proc.mapper.ts` (cálculo de la hoja y Warren), `param-proc.models.ts`.
- `frmdistribucionluz`: `distribucion-luz.ts` (modelos y cálculo de distribución).
- `frmconsolidadoenergia`: `consolidado-energia.ts` (modelos, pivotes; códigos de medidor fijos).
- `frmcostoproductivo`: `costo-productivo.model.ts`.
- `frmdiarioscierre`: `diarios-cierre.ts` (modelos), `diarios-cierre.mock.ts` (mock, apagado).
- `frmcostprodconfig`: `frmcostprodconfig.models.ts`.

## Compartidos

- `src/app/shared/tab-grid` (`app-tab-grid`) y `procesos-agrupacion.config.ts`: lo importan los módulos de luz y consolidado, pero ninguna plantilla lo usa en este commit.
- `src/app/config/url.servicios` (`URL_APICOSTOS`, `URL_CONSULT`, `CONNECTION_PROD`, `varUser`), `src/app/config/Helpers` (`callApi`), `src/app/utilities/sweetAlert.util` (`showAlert`).

## Controladores backend (CostMan)

- `API/Controllers/ProcesoParametroController.cs`: `param-proc`, `param-proc-data`, `consol-elec`, `param-elec`, `guardar-warren`, `costo-productivo`, `guardar-cierre-param-proc`, `configuracion-costo-productivo`, `diarios-cierre`, `diarios-cierre/confirmar`.
- `API/Controllers/ReportingController.cs`: `exportar-excel` (cases `costo-productivo`, `diarios-cierre`, `materia-prima-sal`, etc.), `inv-estructura`, `inv-val`.
