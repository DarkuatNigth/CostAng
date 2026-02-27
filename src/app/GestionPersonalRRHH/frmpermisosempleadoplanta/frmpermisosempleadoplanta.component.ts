import { Component, ElementRef, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FrmPermisosEmpleadoService } from './frmpermisosempleadoplanta.service';
import { HoraCitaDispensario, InfoEmpleadoSupervisor, ItemEmpleadosGrupoSupervisor, ItemGruposSupervisor, ItemTipoPermiso,
  PermisoRegistrado, RegistroPermisoEmpleado,} from 'src/app/Interfaces/interfacesPermisosEmpleado';
import { showAlert, showAlertConfirm } from 'src/app/utilities/sweetAlert.util';
import { varEmpresa, varMenuDT, varUser } from 'src/app/config/url.servicios';
import { DxDataGridComponent } from 'devextreme-angular';

declare let window;

@Component({
  selector: 'app-frmpermisosempleadoplanta',
  templateUrl: './frmpermisosempleadoplanta.component.html',
  styleUrl: './frmpermisosempleadoplanta.component.scss',
})
export class FrmpermisosempleadoplantaComponent {
  loadingVisible: boolean = false;
  idEmpresa?: number;
  idPermisoCabecera?: number;
  usuarioEmpresa: string = '';
  deshabilitaBotonGuardar: boolean = false;
  deshabilitaBotonEliminar: boolean = false;
  habilitarSeleccionGrid: boolean = false;
  modeGridEmpleados: 'multiple' | 'single' = 'multiple';
  listaPermisosRegistrados: PermisoRegistrado[] = [];
  txtFechaPermiso?: string;
  citaHoraEmpleadoSeleccionado: string = '';
  txtFechaBusqueda: Date = new Date();
  infoSupervisor: InfoEmpleadoSupervisor = {
    codigoEmpleado: '',
    turnoEmpleado: '',
    nombreEmpleado: '',
  };

  registroPermisoEmpleado: RegistroPermisoEmpleado = {
    codigoSupervisor: '',
    nombreSupervisor: '',
    turnoSupervisor: '',
    grupoSupervisor: null,
    tipoPermisoSeleccionado: null,
    listaEmpleados: [],
    horaCitaDispensario: null,
  };
  txtCodigoEmpleado: string = '';
  listaHorasDisponiblesDispensario: HoraCitaDispensario[] = [];
  listaGruposSupervisor: ItemGruposSupervisor[] = [];
  ListaTipoPermisosEmpleados: ItemTipoPermiso[] = [];
  ListaEmpleadosPermiso: ItemEmpleadosGrupoSupervisor[] = [];
  ListaEmpleadosCredencialSeleccionados: ItemEmpleadosGrupoSupervisor[] = [];
  ListaPermisosAEliminar: ItemEmpleadosGrupoSupervisor[] = [];
  isInternallyFixingSelection: boolean = false;
  @ViewChild('GridEmpleadosGrupo') gridEmpleadosGrupo: DxDataGridComponent;
  @ViewChild('GridEmpleadosGrupo', { static: false, read: ElementRef })
  gridEmpleadosGrupoEl: ElementRef;

  @ViewChild('GridEmpleadosGrupoCredencial')
  GridEmpleadosGrupoCredencial: DxDataGridComponent;
  @ViewChild('GridEmpleadosGrupoCredencial', {
    static: false,
    read: ElementRef,
  })
  gridEmpleadosGrupoCredencialEl: ElementRef;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    public _service: FrmPermisosEmpleadoService
  ) {}

  /* setLoadingVisible(loading: boolean) {
    this.loadingVisible = loading;
  } */

  async onTabChange(e: any) {
    await this.onClickNuevo();
  }

  async ngOnInit() {

    window.home = this;

    await this.ValidarPermisoAcceso();
  }

  async obtenerDatosIniciales() {
    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .getDatosIniciales(this.idEmpresa, this.usuarioEmpresa)
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              if (Object.keys(res.Dt).length > 0) {
                let dataSupervisor: InfoEmpleadoSupervisor[] = res.Dt.Table;
                this.infoSupervisor = dataSupervisor[0];
                this.registroPermisoEmpleado.codigoSupervisor =
                  this.infoSupervisor.codigoEmpleado;
                this.registroPermisoEmpleado.nombreSupervisor =
                  this.infoSupervisor.codigoEmpleado +
                  ' - ' +
                  this.infoSupervisor.nombreEmpleado;
                this.registroPermisoEmpleado.turnoSupervisor =
                  this.infoSupervisor.turnoEmpleado;
                this.ListaTipoPermisosEmpleados = res.Dt.Table1;
                this.listaGruposSupervisor = res.Dt.Table2;
              }
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            console.error('Error inesperado al consultar:', err);
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor','error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async obtenerEmpleadosDeGrupo() {
    if (!this.registroPermisoEmpleado.grupoSupervisor) {
      return;
    }
    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .getEmpleadosIngresadoGrupo(
          this.idEmpresa,
          this.usuarioEmpresa,
          this.registroPermisoEmpleado.grupoSupervisor?.codigoGrupo
        )
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              if (Object.keys(res.Dt).length > 0) {
                let data: ItemEmpleadosGrupoSupervisor[] = res.Dt.Table;
                this.ListaEmpleadosPermiso = data;

              }
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor','error');
              
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async obtenerHorasDisponiblesDispensario(codigoEmpleado: string = null) {
    if (
      codigoEmpleado == null &&
      this.registroPermisoEmpleado.listaEmpleados.length == 0
    ) {
      return;
    }
    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .getHorasDisponiblesEmpleado(
          this.idEmpresa,
          codigoEmpleado ??
            this.registroPermisoEmpleado.listaEmpleados[0].codigoEmpleado.toString(),
          this.usuarioEmpresa,
          moment(new Date()).format('YYYY/MM/DD')
        )
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              if (Object.keys(res.Dt).length > 0) {
                this.listaHorasDisponiblesDispensario = res.Dt.Table;
              }
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor','error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async ValidarPermisoAcceso() {
    window.home = this;
    // valido que el usuario tenga permiso a la opcion
    var mn = localStorage.getItem(varMenuDT);
    var pathName =
      '/' +
      window.location.pathname.split('/')[
        window.location.pathname.split('/').length - 1
      ];
    if (mn !== undefined && mn !== null) {
      /* if (JSON.parse(mn).filter((c) => c.path == pathName).length === 0) {
        this.router.navigateByUrl('/login');
        return;
      } else { */
      const opcion = JSON.parse(mn).filter((c) => c.path == pathName)[0];
      if (opcion) {
        this.deshabilitaBotonGuardar = opcion.grabar === 0;
        this.deshabilitaBotonEliminar = opcion.eliminar === 0;
      }
      /* } */
    } 
    
    /* else {
      this.router.navigateByUrl('/login');
      return;
    } */

    this.idEmpresa = Number(await localStorage.getItem(varEmpresa));
    this.usuarioEmpresa = await localStorage.getItem(varUser);

    /* if ((await localStorage.getItem(varUser)) === null) {
      await showAlert(
        '',
        'Se terminó el tiempo de su session volver a ingresar al sistema',
        'warning',
        this.setLoadingVisible.bind(this)
      );
      return;
    } */

    await this.onClickNuevo();
  }

  async onClickNuevo() {
    await this.vaciarCampos();
    await this.obtenerDatosIniciales();
  }

  async vaciarCampos() {
    this.txtCodigoEmpleado = '';
    this.isInternallyFixingSelection = false;
    this.citaHoraEmpleadoSeleccionado = '';
    this.ListaPermisosAEliminar = [];
    this.habilitarSeleccionGrid = false;
    this.idPermisoCabecera = null;
    this.txtFechaPermiso = null;
    this.ListaEmpleadosCredencialSeleccionados = [];
    this.infoSupervisor = {
      codigoEmpleado: '',
      turnoEmpleado: '',
      nombreEmpleado: '',
    };

    this.listaHorasDisponiblesDispensario = [];
    this.registroPermisoEmpleado = {
      codigoSupervisor: '',
      nombreSupervisor: '',
      turnoSupervisor: '',
      grupoSupervisor: null,
      tipoPermisoSeleccionado: null,
      listaEmpleados: [],
    };

    this.listaGruposSupervisor = [];
    this.ListaTipoPermisosEmpleados = [];
    this.ListaEmpleadosPermiso = [];
  }

  async LimpiarSeleccionesEmpleado() {
    if (this.gridEmpleadosGrupo) {
      this.gridEmpleadosGrupo.instance.deselectAll();
    }

    this.registroPermisoEmpleado.listaEmpleados = [];
    this.ListaEmpleadosCredencialSeleccionados = [];
  }

  async onSeleccionarEmpleado(event: any) {
    //debugger;
    this.registroPermisoEmpleado.horaCitaDispensario = null;
    //si tiene seleccionado un idpermisocabecera es porq va a eliminar
    if (!this.idPermisoCabecera) {
      let empleadosDepuradosSeleccionados: {
        codigoEmpleado: number;
        nombreEmpleado: string;
      }[] = event.selectedRowsData
        .filter((it) => it.permisoActivo !== 'SI')
        .map((it) => {
          return {
            codigoEmpleado: it.codigoEmpleado,
            nombreEmpleado: it.nombreEmpleado,
          };
        });

      this.registroPermisoEmpleado.listaEmpleados =
        empleadosDepuradosSeleccionados; //event.selectedRowKeys;

      setTimeout(() => this.reapplyDisabledRows(), 10);
    } else {
      if(this.registroPermisoEmpleado.tipoPermisoSeleccionado?.codigoPermiso === 2){
        this.ListaPermisosAEliminar = this.ListaEmpleadosPermiso;
      }else{
        this.ListaPermisosAEliminar = event.selectedRowsData;
      }

      if (
        this.ListaPermisosAEliminar.length > 0 &&
        this.registroPermisoEmpleado.tipoPermisoSeleccionado?.nombrePermiso ==
          'PERMISO DISPENSARIO'
      ) {
        this.citaHoraEmpleadoSeleccionado =
          this.ListaPermisosAEliminar[0].horaCita;
      }
    }

    if (
      this.registroPermisoEmpleado.tipoPermisoSeleccionado &&
      this.registroPermisoEmpleado.tipoPermisoSeleccionado?.nombrePermiso ==
        'PERMISO DISPENSARIO'
    ) {
      setTimeout(async () => {
        await this.obtenerHorasDisponiblesDispensario();
      }, 0);
    }
  }

  reapplyDisabledRows() {
    const rows = this.gridEmpleadosGrupo.instance.getVisibleRows();

    rows.forEach((r) => {
      if (r.data?.permisoActivo === 'SI') {
        const rowEls = this.gridEmpleadosGrupo.instance.getRowElement(
          r.rowIndex
        );

        if (rowEls?.[0]) {
          const el = rowEls[0];

          // Tu clase personalizada
          el.classList.add('row-disabled');

          // Evita que se pinte como seleccionada
          el.classList.remove('dx-selection');
          el.classList.remove('dx-row-focused');
          el.classList.remove('dx-row-selected');
        }
      }
    });
  }

  async onSelectorFormularioChange(
    event: any,
    selector: 'permiso' | 'grupo',
    masivoCredencial: boolean = false
  ) {
    switch (selector) {
      case 'permiso':
        await this.LimpiarSeleccionesEmpleado();
        //PERMISO DISPENSARIO
        this.modeGridEmpleados =
          this.registroPermisoEmpleado &&
          this.registroPermisoEmpleado.tipoPermisoSeleccionado?.nombrePermiso ==
            'PERMISO DISPENSARIO'
            ? 'single'
            : 'multiple';
        this.habilitarSeleccionGrid = true;
        break;

      case 'grupo':
        //get
        /* if (!this.registroPermisoEmpleado.grupoSupervisor) {
          this.ListaEmpleadosPermiso = [];
        } */
       this.ListaEmpleadosPermiso = [];
        await this.obtenerEmpleadosDeGrupo();
        break;

      default:
        break;
    }
  }

  onRowPrepared(e: any) {
    if (e.rowType !== 'data') return;

    const row = e.rowElement;
    if (!row) return;

    // MODO CONSULTA (limpiar estilos)
    if (this.idPermisoCabecera) {
      row.classList.remove('row-disabled');
      return;
    }

    // MODO CREACIÓN
    if (e.data?.permisoActivo === 'SI') {
      row.classList.add('row-disabled');
    } else {
      row.classList.remove('row-disabled');
    }
  }

  onCellPrepared(e: any) {
    if (e.rowType !== 'data') return;

    // Columna de selección
    if (e.column.command === 'select') {
      const disabled = e.data?.permisoActivo === 'SI';

      if (disabled) {
        const cell = e.cellElement;
        const checkbox = cell.querySelector('.dx-select-checkbox');
        const icon = cell.querySelector('.dx-checkbox-icon');

        // No permitir interacción
        cell.style.pointerEvents = 'none';

        if (checkbox) {
          checkbox.classList.add('dx-state-disabled', 'no-select-visual');
          checkbox.style.opacity = '1'; // que no se vea "apagado"
        }

        if (icon) {
          icon.classList.add('checkbox-icon-disabled');
        }
      }
    }
  }

  onContentReady(e: any) {
    // vuelve a aplicar bloqueo DESPUÉS del render dinámico
    const rows = e.component.getVisibleRows();

    rows.forEach((row: any) => {
      const rowIndex = row.rowIndex;
      const cell = e.component.getCellElement(rowIndex, 0);

      if (!cell) return;

      if (this.idPermisoCabecera) {
        cell.style.pointerEvents = '';
        cell.style.cursor = '';
        return;
      }

      if (row?.data?.permisoActivo === 'SI') {
        // Seleccionar la celda del checkbox (columna selección = 0)

        cell.style.pointerEvents = 'none';
        cell.style.cursor = 'not-allowed';
      } else {
        cell.style.pointerEvents = '';
        cell.style.cursor = '';
      }
    });

    setTimeout(() => this.reapplyDisabledRows(), 10);
  }

  async onClickGuardar() {
    let mensajeError = await this.validarFormulario();
    if (mensajeError !== '') {
      await showAlert('',mensajeError,'warning');
      return;
    }

    let confirmacion = await showAlertConfirm('','Está seguro que desea guardar los cambios','question');
    if (!confirmacion) return;

    this.loadingVisible = true;

    let tipoPermiso = this.registroPermisoEmpleado.tipoPermisoSeleccionado;
    let empleados = this.registroPermisoEmpleado.listaEmpleados;

    let empleadosValidadosOK = [];
    let empleadosConError = [];

    // ─────────────────────────────────────────────────────────────
    //  PRIMERA VALIDACIÓN: salida planta
    // ─────────────────────────────────────────────────────────────
    if (tipoPermiso?.validaSalidaPlanta) {
      for (let emp of empleados) {
        let resultado = await this.validarSalidaPlanta(
          emp.codigoEmpleado.toString()
        );

        if (resultado === 'OK') {
          empleadosValidadosOK.push(emp);
        } else {
          empleadosConError.push({
            empleado: emp,
            error: resultado,
          });
        }
      }

      // Si todos fallaron, no continuar
      if (empleadosValidadosOK.length === 0) {
        let msg =
          'No se puede generar el permiso de:\n\n' +
          empleadosConError
            .map(
              (e) =>
                `${e.empleado.codigoEmpleado} | ${e.empleado.nombreEmpleado}: ${e.error}`
            )
            .join('\n');

        await showAlert('', msg, 'error');
        return;
      }

      // empleados que pasaron la primera validación
      empleados = empleadosValidadosOK;
      empleadosValidadosOK = [];
    }

    // ─────────────────────────────────────────────────────────────
    //  SEGUNDA VALIDACIÓN: marcación de turnos
    // ─────────────────────────────────────────────────────────────
    if (tipoPermiso?.validaMarcacionProcesoTurno) {
      let nuevaListaOk = [];
      let nuevaListaErrores = [];

      for (let emp of empleados) {
        let resultado = await this.validarMarcacionProcesadosxTurno(
          emp.codigoEmpleado.toString()
        );

        if (resultado === 'OK') {
          nuevaListaOk.push(emp);
        } else {
          nuevaListaErrores.push({
            empleado: emp,
            error: resultado,
          });
        }
      }

      // Si todos fallan → no guardar
      if (nuevaListaOk.length === 0) {
        let msg =
          'No se puede generar el permiso de:\n\n' +
          nuevaListaErrores
            .map(
              (e) =>
                `${e.empleado.codigoEmpleado} | ${e.empleado.nombreEmpleado}: ${e.error}`
            )
            .join('\n');

        await showAlert('', msg, 'error');
        return;
      }

      // Agregar estos errores a la lista general
      empleadosConError = empleadosConError.concat(nuevaListaErrores);

      // Mantener solo los que pasaron esta validación
      empleados = nuevaListaOk;
    }

    // ─────────────────────────────────────────────────────────────
    //  ACTUALIZAR lista final filtrada
    // ─────────────────────────────────────────────────────────────
    this.registroPermisoEmpleado.listaEmpleados = empleados;
    await this.guardarFormulario(empleados);

    // ─────────────────────────────────────────────────────────────
    //  SI HUBO ERRORES PERO ALGUNOS SE GUARDARON
    // ─────────────────────────────────────────────────────────────
    if (empleadosConError.length > 0) {
      let msg =
        'Se generaron permisos solo para algunos empleados.\n\n' +
        'Los siguientes NO fueron procesados:\n' +
        empleadosConError
          .map(
            (e) =>
              `${e.empleado.codigoEmpleado} | ${e.empleado.nombreEmpleado}: ${e.error}`
          )
          .join('\n');

      await showAlert('', msg, 'warning');
    }

    this.loadingVisible = false;
  }

  async onClickGuardarCredencialesMasivo() {
    let mensajeError = await this.validarFormulario(true);
    if (mensajeError !== '') {
      await showAlert('',mensajeError,'warning');
      return;
    }

    let confirmacion = await showAlertConfirm('','Está seguro que desea guardar los cambios','question');
    if (!confirmacion) return;

    let tipoPermiso = this.registroPermisoEmpleado.tipoPermisoSeleccionado;
    let empleados = this.ListaEmpleadosCredencialSeleccionados.map((it) => {
      return {
        codigoEmpleado: Number(it.codigoEmpleado),
        nombreEmpleado: it.nombreEmpleado,
      };
    });

    let empleadosValidadosOK = [];
    let empleadosConError = [];

    // ─────────────────────────────────────────────────────────────
    //  PRIMERA VALIDACIÓN: salida planta
    // ─────────────────────────────────────────────────────────────
    if (tipoPermiso?.validaSalidaPlanta) {
      for (let emp of empleados) {
        let resultado = await this.validarSalidaPlanta(
          emp.codigoEmpleado.toString()
        );

        if (resultado === 'OK') {
          empleadosValidadosOK.push(emp);
        } else {
          empleadosConError.push({
            empleado: emp,
            error: resultado,
          });
        }
      }

      // Si todos fallaron, no continuar
      if (empleadosValidadosOK.length === 0) {
        let msg =
          'No se puede generar el permiso de:\n\n' +
          empleadosConError
            .map(
              (e) =>
                `${e.empleado.codigoEmpleado} | ${e.empleado.nombreEmpleado}: ${e.error}`
            )
            .join('\n');

        await showAlert('', msg, 'error');
        return;
      }

      // empleados que pasaron la primera validación
      empleados = empleadosValidadosOK;
      empleadosValidadosOK = [];
    }

    // ─────────────────────────────────────────────────────────────
    //  SEGUNDA VALIDACIÓN: marcación de turnos
    // ─────────────────────────────────────────────────────────────
    if (tipoPermiso?.validaMarcacionProcesoTurno) {
      let nuevaListaOk = [];
      let nuevaListaErrores = [];

      for (let emp of empleados) {
        let resultado = await this.validarMarcacionProcesadosxTurno(
          emp.codigoEmpleado.toString()
        );

        if (resultado === 'OK') {
          nuevaListaOk.push(emp);
        } else {
          nuevaListaErrores.push({
            empleado: emp,
            error: resultado,
          });
        }
      }

      // Si todos fallan → no guardar
      if (nuevaListaOk.length === 0) {
        let msg =
          'No se puede generar el permiso de:\n\n' +
          nuevaListaErrores
            .map(
              (e) =>
                `${e.empleado.codigoEmpleado} | ${e.empleado.nombreEmpleado}: ${e.error}`
            )
            .join('\n');

        await showAlert('', msg, 'error');
        return;
      }

      // Agregar estos errores a la lista general
      empleadosConError = empleadosConError.concat(nuevaListaErrores);

      // Mantener solo los que pasaron esta validación
      empleados = nuevaListaOk;
    }

    // ─────────────────────────────────────────────────────────────
    //  ACTUALIZAR lista final filtrada
    // ─────────────────────────────────────────────────────────────
    //this.registroPermisoEmpleado.listaEmpleados = empleados;
    await this.guardarFormulario(empleados);

    // ─────────────────────────────────────────────────────────────
    //  SI HUBO ERRORES PERO ALGUNOS SE GUARDARON
    // ─────────────────────────────────────────────────────────────
    if (empleadosConError.length > 0) {
      let msg =
        'Se generaron permisos solo para algunos empleados.\n\n' +
        'Los siguientes NO fueron procesados:\n' +
        empleadosConError
          .map(
            (e) =>
              `${e.empleado.codigoEmpleado} | ${e.empleado.nombreEmpleado}: ${e.error}`
          )
          .join('\n');

      await showAlert('', msg, 'warning');
    }
  }

  async validarSalidaPlanta(codigoEmpleado: string) {
    return await new Promise((resolve) => {
      try {
        this._service
          .validaSalidaProcesoPlanta(this.idEmpresa, codigoEmpleado)
          .subscribe({
            next: (response) => {
              try {
                if (response && response.Codigo && response.Dt) {
                  resolve('OK');
                } else {
                  resolve(
                    response?.Description ??
                      'No se pudo validar salida de planta'
                  );
                }
              } catch (err) {
                resolve('No se pudo validar salida de planta');
              }
            },

            error: (err) => {
              resolve('No se pudo validar salida de planta');
            },

            complete: () => {},
          });
      } catch (err) {
        resolve('No se pudo validar salida de planta');
      }
    });
  }

  async validarMarcacionProcesadosxTurno(codigoEmpleado: string) {
    return await new Promise((resolve) => {
      try {
        this._service
          .validaMarcacionProcesoTurno(this.idEmpresa, codigoEmpleado)
          .subscribe({
            next: (response) => {
              try {
                if (response && response.Codigo && response.Dt) {
                  resolve('OK');
                } else {
                  resolve(
                    response?.Description ??
                      'No se pudo validar salida de planta'
                  );
                }
              } catch (err) {
                resolve('No se pudo validar salida de planta');
              }
            },

            error: (err) => {
              resolve('No se pudo validar salida de planta');
            },

            complete: () => {},
          });
      } catch (err) {
        console.error(err);
        resolve('No se pudo validar salida de planta');
      }
    });
  }

  async guardarFormulario(
    listaSeleccionados: { codigoEmpleado: number; nombreEmpleado: string }[]
  ) {
    this.loadingVisible = true;

    const fechaFormateada = moment(new Date()).format('YYYY/MM/DD');
    let dataDepurada = [];
    dataDepurada = listaSeleccionados
      .filter((it) => it)
      .map((it) => {
        return {
          codigoEmpleado: it.codigoEmpleado,
        };
      });
    const lista = {
      lista: dataDepurada,
    };
    var jsonListaEmpleado = JSON.stringify(lista);
    return await new Promise((resolve) => {
      this._service
        .guardarPermisosEmpleado(
          this.idEmpresa,
          this.usuarioEmpresa,
          fechaFormateada,
          this.registroPermisoEmpleado.tipoPermisoSeleccionado?.codigoPermiso,
          this.registroPermisoEmpleado.turnoSupervisor == 'DIURNO' ? 'D' : 'N',
          jsonListaEmpleado,
          this.registroPermisoEmpleado.horaCitaDispensario?.Horascita
        )
        .subscribe({
          next: async (res) => {
            if (res.Codigo) {
              await showAlert('','Se han guardado los cambios correctamente','success');
              await this.onClickNuevo();
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');
              resolve(false);
            }
          },
          error: async (err) => {
            console.error('Error inesperado al guardar:', err);
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor', 'error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });
  }

  async validarFormulario(masivoCredencial: boolean = false): Promise<string> {
    let mensajeError = '';

    if (!this.registroPermisoEmpleado.tipoPermisoSeleccionado) {
      mensajeError += 'Debe indicar que permiso desea usar. ';
    }

    if (masivoCredencial) {
      if (this.ListaEmpleadosCredencialSeleccionados.length == 0) {
        mensajeError += 'Debe seleccionar almenos un empleado. ';
      }
    } else {
      if (!this.registroPermisoEmpleado.grupoSupervisor) {
        mensajeError += 'Debe seleccionar el grupo. ';
      }

      if (this.registroPermisoEmpleado.listaEmpleados.length == 0) {
        mensajeError += 'Debe seleccionar almenos un empleado. ';
      }
    }

    if (
      this.registroPermisoEmpleado.tipoPermisoSeleccionado &&
      this.registroPermisoEmpleado.tipoPermisoSeleccionado?.nombrePermiso ==
        'PERMISO DISPENSARIO' &&
      !this.registroPermisoEmpleado.horaCitaDispensario
    ) {
      mensajeError += 'Debe indicar la hora para cita en dispensario. ';
    }

    return mensajeError;
  }

  async obtenerPermisosGenerados() {
    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .getPermisosGenerados(
          this.idEmpresa,
          this.usuarioEmpresa,
          moment(new Date()).format('YYYY/MM/DD')
        )
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              if (Object.keys(res.Dt).length > 0) {
              }
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor','error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async onClickConsultar(content: any) {

    await this.onClickNuevo();
    
    this.modalService
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalConsultaSolicitudes',
      })
      .result.then(
        (result) => {},
        (reason) => {
          if (
            reason === ModalDismissReasons.ESC ||
            reason === ModalDismissReasons.BACKDROP_CLICK
          ) {
            this.txtFechaBusqueda = new Date();
            this.listaPermisosRegistrados = [];
            this.idPermisoCabecera = null;
          }
        }
      );
  }

  async onClickCerrar(modal: any) {
    if (modal) {
      modal.close();
    }
    this.txtFechaBusqueda = new Date();
    this.listaPermisosRegistrados = [];
    this.idPermisoCabecera = null;
  }

  async onClickBuscar() {
    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .getPermisosGenerados(
          this.idEmpresa,
          this.usuarioEmpresa,
          typeof this.txtFechaBusqueda === 'string'
            ? this.txtFechaBusqueda
            : moment(this.txtFechaBusqueda).format('YYYY/MM/DD')
        )
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              if (Object.keys(res.Dt).length > 0) {
                this.listaPermisosRegistrados = res.Dt.Table;
              }
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor', 'error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async onRowPermisoEmpleadosDoubleClick(event: any, modal: any) {
    await this.onClickCerrar(modal);
    await this.LimpiarSeleccionesEmpleado();
    let dataSeleccionada: PermisoRegistrado = event.data;
    this.txtFechaPermiso = dataSeleccionada.fecha;
    this.idPermisoCabecera = dataSeleccionada.id;
    this.registroPermisoEmpleado.tipoPermisoSeleccionado =
      this.ListaTipoPermisosEmpleados.find(
        (it) => it.nombrePermiso == dataSeleccionada.permiso
      );

    this.modeGridEmpleados =
      this.registroPermisoEmpleado &&
      this.registroPermisoEmpleado.tipoPermisoSeleccionado?.nombrePermiso ==
        'PERMISO DISPENSARIO'
        ? 'single'
        : 'multiple';
    await this.obtenerDetallePermisoSeleccionado();

    if(this.registroPermisoEmpleado.tipoPermisoSeleccionado?.codigoPermiso === 2){
      this.ListaPermisosAEliminar = this.ListaEmpleadosPermiso;
      this.citaHoraEmpleadoSeleccionado = this.ListaEmpleadosPermiso[0]?.horaCita;
    }
  }

  async obtenerDetallePermisoSeleccionado() {
    if (!this.idPermisoCabecera) {
      await showAlert('','Debe seleccionar el permiso a consultar','warning');
      return;
    }

    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .getDetalleDePermiso(
          this.idEmpresa,
          this.usuarioEmpresa,
          this.idPermisoCabecera
        )
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              if (Object.keys(res.Dt).length > 0) {
                this.ListaEmpleadosPermiso = res.Dt.Table;
                if (this.ListaEmpleadosPermiso.length > 0) {
                  this.registroPermisoEmpleado.grupoSupervisor =
                    this.listaGruposSupervisor.find(
                      (it) =>
                        it.nombreGrupo === this.ListaEmpleadosPermiso[0].grupo
                    );
                  this.habilitarSeleccionGrid = true;
                }
              }
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            await showAlert('',err.message ?? 'Ocurrió un inconveniente. Intente nuevamente por favor','error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async onClickEliminar() {
    if (!this.idPermisoCabecera) {
      await showAlert('','Debe seleccionar un permiso generado','warning'); 
      return;
    }

    if (this.ListaPermisosAEliminar.length == 0 && this.registroPermisoEmpleado.tipoPermisoSeleccionado.codigoPermiso !== 2) {
      await showAlert('', 'Debe seleccionar almenos un permiso de empleado a eliminar', 'warning');
      return;
    }

    let confirmacion = await showAlertConfirm('','Está seguro que desea eliminar el registro','question');
    if (confirmacion) {
      await this.EliminarPermiso();
    }
  }

  async EliminarPermiso() {
    this.loadingVisible = true;

    const fechaFormateada = moment(this.txtFechaPermiso).format('YYYY/MM/DD');
    let dataDepurada = [];
    dataDepurada = this.ListaPermisosAEliminar.filter((it) => it).map((it) => {
      return {
        idPermisoDetalle: it.id,
        codigoEmpleado: it.codigoEmpleado,
      };
    });
    const lista = {
      lista: dataDepurada,
    };

    var jsonListaEmpleado = JSON.stringify(lista);

    await new Promise(async (resolve) => {
      await this._service
        .eliminarPermisoEmpleado(
          this.idPermisoCabecera,
          this.idEmpresa,
          this.usuarioEmpresa,
          this.registroPermisoEmpleado.tipoPermisoSeleccionado.codigoPermiso,
          jsonListaEmpleado.toString(),
          fechaFormateada,
          this.citaHoraEmpleadoSeleccionado
        )
        .subscribe({
          next: async (res) => {

            if (res.Codigo) {
              await showAlert('','Se ha eliminado el permiso correctamente','success');
              await this.onClickNuevo();
              resolve(true);
            } else {
              await showAlert('',res.Description,'error');

              resolve(false);
            }
          },
          error: async (err) => {
            await showAlert('',err.message ??'Ocurrió un inconveniente. Intente nuevamente por favor','error');
            resolve(false);
          },
          complete: () => {
            this.loadingVisible = false;
          },
        });
    });

    this.loadingVisible = false;
  }

  async onKeyPressCodEmpleado(event: KeyboardEvent) {
    const { key } = event;
    switch (key) {
      case 'Backspace':
      case 'Delete':
        this.txtCodigoEmpleado = null;
        break;

      case 'Tab':
      case 'Enter':
        if (
          this.txtCodigoEmpleado !== '' &&
          this.registroPermisoEmpleado.tipoPermisoSeleccionado
        ) {
          //si ya esta no hago nada
          this.txtCodigoEmpleado = this.txtCodigoEmpleado.replace('$', '');
          if (
            !this.ListaEmpleadosCredencialSeleccionados.find(
              (emp) => emp.credencialEmpleado == this.txtCodigoEmpleado
            )
          ) {
            await this.BuscarEmpleadoEnGruposSupervisor(this.txtCodigoEmpleado);
          }
        }
        break;

      default:
        break;
    }
  }

  async BuscarEmpleadoEnGruposSupervisor(credencialEmpleado: string) {
    //primero debe escoger permiso
    if (this.registroPermisoEmpleado.tipoPermisoSeleccionado) {
      return await new Promise(async (resolve) => {
        try {
          this.loadingVisible = true;
          await this._service
            .getEmpleadoDeGrupos(
              this.idEmpresa,
              this.usuarioEmpresa,
              credencialEmpleado
            )
            .subscribe({
              next: async (response) => {
                try {
 
                  if (response && response.Codigo && response.Dt) {
                    let dt: ItemEmpleadosGrupoSupervisor[] = response.Dt.Table;
                    if (dt.length == 0) {
                      await showAlert('','El empleado ingresado no está disponible o no pertenece a sus grupos','error');
                    } else if (dt[0].permisoActivo === 'SI') {
                      await showAlert('', 'El usuario ingresado ya tiene un permiso activo anterior', 'warning');
                    } else {
                      //si ya esta no lo vuelvo a poner
                      if (
                        !this.ListaEmpleadosCredencialSeleccionados.find(
                          (emp) =>
                            emp.credencialEmpleado == this.txtCodigoEmpleado
                        )
                      ) {
                        // si es otro permiso se adjunta a la lista
                        if (
                          this.registroPermisoEmpleado.tipoPermisoSeleccionado
                            .nombrePermiso !== 'PERMISO DISPENSARIO'
                        ) {
                          this.ListaEmpleadosCredencialSeleccionados.push(
                            dt[0]
                          );
                          //si es dispensario lista nueva y el es el unico seleccionado,
                        } else {
                          //traigo las horas disponibles y reinicio lo anterior
                          this.registroPermisoEmpleado.horaCitaDispensario =
                            null;
                          this.listaHorasDisponiblesDispensario = [];
                          await this.obtenerHorasDisponiblesDispensario(
                            dt[0].codigoEmpleado
                          );
                          this.ListaEmpleadosCredencialSeleccionados = [];
                          this.ListaEmpleadosCredencialSeleccionados = dt;
                        }
                      }
                      this.txtCodigoEmpleado = null;
                    }

                    resolve(true);
                  } else {
                    await showAlert('','El usuario ingresado no está disponible o no pertenece a sus grupos','warning');

                    resolve(false);
                  }
                } catch (err) {
                  console.error(err);
                  await showAlert('','No se pudo verificar empleado','error');
                  resolve(false);
                }
              },

              error: (err) => {
                console.error('Error en validarSalidaPlanta:', err);
                resolve(false);
              },

              complete: () => {
                this.loadingVisible = false;
              },
            });
        } catch (err) {
          
          this.loadingVisible = false;
          resolve(false);
        }
      });
    }
  }
}
