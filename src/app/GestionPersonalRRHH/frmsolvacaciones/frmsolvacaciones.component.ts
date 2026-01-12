import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { Router } from '@angular/router';
import { FrmsolvacacionesService } from './frmsolvacaciones.service';
import * as moment from 'moment';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../../shared/notify.service';
import { varEmpresa, varMenuDT, varUser } from 'src/app/config/url.servicios';

declare var window;
declare var $: any;
interface ISolicitud{
  sol_id: number;
  codigo: string;
  fechadesde: Date;
  fechahasta: Date;
  dias: number;
  usuario: string;
  observacion: string;
  estado: string;
 }


@Component({
  selector: 'app-frmsolvacaciones',
  templateUrl: './frmsolvacaciones.component.html',
  styleUrl: './frmsolvacaciones.component.scss',
})
export class FrmsolvacacionesComponent implements OnInit {
  @ViewChild('GridPeriodo', { static: false })
  GridPeriodo: DxDataGridComponent;
  @ViewChild('GridPeriodoDetalle', { static: false })
  GridPeriodoDetalle: DxDataGridComponent;
  @ViewChild('gridImpresion') gridImpresion: DxDataGridComponent;
  @ViewChild('autocomplete') autocomplete;
  @ViewChild('modalPeriodo') modalPeriodo: any;


  deshabilitaGrabar: boolean = false;
  deshabilitaEliminar: boolean = false;
  lvvisiblegrabar: boolean = true;
  isVisibleSolicitud:boolean = false;
  jefearea:boolean=false;
  modalReferenceItem: any;
  idEmpresa?: number;
  usuarioEmpresa: string = '';
  loadingVisible: boolean = true;
  
 
 
  txtEmpleadoCodigo: string = '';
  txtEmpleado: string = '';
  openModalDiv: string = '';
 
  txtCentro: string = '';
  txtEstado: string = '';
  txtObservacion: string = '';
  txtdiassolicitado: string = '';
 
  DataEmpleado = [];
  DataSolicitudVacaciones = [];
  selectedFile: string = '';
  lstiddeta: string = '';
  txtEmpleadoInfo: string = '';
  txtSolicitudInfo: string = '';
  txtEmpleadoDetalleInfo: string = '';
  FechaDesde = new Date();
  FechaHasta = new Date();
  vltrbCodigo: string = '';
  diasPendientes:number = 0;
  Fechacalculodesde = new Date();
  listaConsultaSolicitud = [];
  columnasSolicitud = [];
  cmbEstadoConsulta: string = '99';
  listaEstados: any[] = [];
  dtpFechaDesde: Date = new Date();
  dtpFechaHasta: Date = new Date();
  minDate: Date = new Date();
  minFechaHasta: Date = new Date(); 

  vlsol_id: number = 0;

  selectedSolicitud: ISolicitud|null = null;



  constructor(
    private router: Router,
    public _service: FrmsolvacacionesService,
    private renderer: Renderer2,
    private _notificationService: NotificationService,
    private modalService: NgbModal
  ) {
    //this.minDate = new Date();
   
  }

  async showAlert(title, mensaje, tipo, event = null) {
    this.loadingVisible = false;

    return new Promise(async (resolve) => {
      await Swal.fire({
        title: title,
        html:
          "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" +
          mensaje.replaceAll('\n', '<br>').replaceAll('\\n', '<br>') +
          '</div>',
        icon: tipo,
        showCancelButton: false,
        confirmButtonColor:
          tipo === 'error'
            ? '#d33'
            : tipo === 'warning'
            ? '#ff9800'
            : tipo === 'success'
            ? '#4CAF50'
            : tipo === 'info'
            ? '#2196F3'
            : '',
        confirmButtonText: 'Aceptar',
      }).then((result) => {
        if (event !== null) {
          eval(event);
        }
        return resolve(true);
      });
    });
  }

  async showAlertConfirm(title, mensaje, tipo) {
    this.loadingVisible = false;

    return new Promise(async (resolve) => {
      const confirm = await Swal.fire({
        title: title,
        //text: mensaje,
        html:
          "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" +
          mensaje.replaceAll('\n', '<br>').replaceAll('\\n', '<br>') +
          '</div>',
        icon: tipo,
        showCancelButton: true,
        confirmButtonColor: '#2196F3',
        confirmButtonText: 'Aceptar',
      }).then((result) => {
        if (result.isConfirmed) {
          return resolve(true);
        } else {
          return resolve(false);
        }
      });
    });
  }

  closeModal() {
    if (this.openModalDiv !== '') {
      document.getElementById(this.openModalDiv).style.top = '0px';
      document.getElementById(this.openModalDiv).style.left = '0px';

      eval('this.' + this.openModalDiv + ' = true');
    }
    this.openModalDiv = '';
  }

  async ngOnInit() {
    window.home = this;
    this.SSNuevo();
    this.vlsol_id = 0;

    this.idEmpresa = await Number(localStorage.getItem(varEmpresa));
    this.usuarioEmpresa = await localStorage.getItem(varUser);

    if (this.usuarioEmpresa === null) {
      await this.showAlert(
        '',
        'Se terminó el tiempo de su session volver a ingresar al sistema',
        'warning'
      );
      return;
    }


    this.FechaDesde = new Date();
    this.dtpFechaDesde = new Date();
    this.dtpFechaHasta = new Date();
    await this.ObtenerEsJefeArea();

    this.loadingVisible = true;
    await this.GetVacacionesPeriodo(this.idEmpresa, this.usuarioEmpresa, 'CO',(this.jefearea?1:0));
    this.loadingVisible = false;
  }

  async ObtenerEsJefeArea(){
    this.jefearea = false;
    const valorMenu = await new Promise(async (resolve) => {
      await this._service.getesJefeArea(this.usuarioEmpresa).subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            let dt:[][] = resp.Dt.Table;
            if(dt.length > 0){
              this.jefearea = (dt[0]["jefArea"]===1?true:false);
            }
          }
          return resolve(true);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });
  }


  async SSNuevo() {
    this.loadingVisible = true;

    this.FechaDesde = new Date();
    this.FechaHasta = new Date();
    this.txtdiassolicitado="0";
    this.txtObservacion = '';
    this.txtEmpleadoInfo = '';
    if (this.jefearea) {
      this.vltrbCodigo='';
      this.txtEmpleadoDetalleInfo = '';
    }
    this.isVisibleSolicitud = false;

    
    this.loadingVisible = false;
  }
  
  rowPrepared(e: any) {
    if (e.rowType === 'data') {
      e.rowElement.classList.add('selected-row');
    }
  }

  async onClickNuevo() {
    this.loadingVisible = true;
    await this.SSNuevo();
    await this.GetVacacionesPeriodo(this.idEmpresa, this.usuarioEmpresa, 'CO',(this.jefearea?1:0));
    this.loadingVisible = false;
  }

  async GetVacacionesPeriodo(empresa, codigo, accion, jefeporarea) {
    this.loadingVisible = true;
    this.DataEmpleado = [];

    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudVacaciones(empresa, codigo, accion,jefeporarea,'','','')
        .subscribe(async (res) => {
          if (res.Codigo) {
            debugger;
            if (Object.keys(res.Dt).length > 0) {
              let empleado: any = res.Dt.Table;

              this.txtEmpleadoDetalleInfo = empleado[0].resultado;
              this.vltrbCodigo = empleado[0].trb_Codigo;
              this.diasPendientes = empleado[0].diasPendientes;
              this.listaEstados = res.Dt.Table1;
              this.DataEmpleado = JSON.parse(JSON.stringify(res.Dt.Table2));
    
              /* if (empleado !== undefined) {
                if(res.Dt.Table2 !==undefined){
                  if(res.Dt.Table2.length > 0){
                    
                    this.DataEmpleado = JSON.parse(JSON.stringify(res.Dt.Table2));
                 
                  }
                }
                else{
                  if (empleado.length > 0) {
                 
                    this.txtEmpleadoDetalleInfo = empleado[0].resultado;
                    this.vltrbCodigo = empleado[0].trb_Codigo;

                  }
                  this.listaEstados = res.Dt.Table1;
                }
                
              } */
            
            }
            resolve(true);
          } else {
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

    this.loadingVisible = false;
  }
 
  calculateMinDateDesde(data: any): Date {
    const { id, cabid, desde } = data;
    var lvfechadesde = new Date();
    

    return lvfechadesde;
  }
  onChangeFechaDesde(value: Date, data: any) {
    data.desde = moment(value).format('yyyy/MM/DD');
    const { id, cabid, desde } = data;
   
    this.Fechacalculodesde = new Date(value);
  }

  calcularDias(): void {
    if (this.FechaDesde && this.FechaHasta) {
      this.minFechaHasta = new Date(this.FechaDesde);
      const tiempoDesde = moment(new Date(this.FechaDesde)).format('yyyy/MM/D');//new Date(this.FechaDesde).getTime();
      const tiempoHasta = moment(new Date(this.FechaHasta)).format('yyyy/MM/D');//new Date(this.FechaHasta).getTime();
      const diffDays = moment(tiempoHasta).diff(moment(tiempoDesde), 'days');
      let diastomados: number =0;

      if (moment(new Date(this.FechaDesde)).format('yyyy/MM/D') > moment(new Date(this.FechaHasta)).format('yyyy/MM/D')) {
        this.txtdiassolicitado = '0';
      } else {
       
        diastomados =diffDays + 1 >= 0 ? diffDays + 1 : 0;
        this.txtdiassolicitado=diastomados.toString();
      }
    } else {
      this.txtdiassolicitado = ''; // Si faltan fechas, se limpia el campo
    }
  }

  onRowMostrarDetalleEmpleado(e: any): void {
    
    this.txtEmpleadoDetalleInfo = '';
    this.vltrbCodigo = "";
    this.diasPendientes = e.data.diaspendiente;//lcepeda
    this.vltrbCodigo = e.data.codigo;
    this.txtEmpleadoDetalleInfo='Empleado: '+ e.data.empleado + ' \n' + 'Dias Pendientes: ' + e.data.diaspendiente;
    this.selectedSolicitud = e.data;
    //this.isvisibledatosSol = true;
  }

  async onClickGuardarSolicitudVacaciones() {
    //debugger;
    let d = this.diasPendientes;
    let da = this.txtdiassolicitado;
    if(this.diasPendientes < Number(this.txtdiassolicitado)){
      await this.showAlert('','Los días solicitados no pueden ser mayor a los días pendientes','warning');
      return;
    }
    if(this.vltrbCodigo === '' || this.vltrbCodigo === '0'){
      await this.showAlert('','Debe seleccionar un empleado','warning');
      return;
    }
    if (!this.validarFechas(this.FechaDesde, this.FechaHasta)){
      return;
    }
    if(!await await this.showAlertConfirm('',`¿Estás seguro de que desea guardar el registro?`,'')) 
    {
      return;
    }

    await this.Guardar();
  }

  validarFechas(desde, hasta): boolean {

    if (
      moment(hasta).format('yyyy/MM/DD') <
      moment(desde).format('yyyy/MM/DD')
    ) {
      this.showAlert(
        '',
        'La fecha hasta no debe ser menor a la fecha desde',
        'warning'
      );

      return false;
    }
    if (this.txtdiassolicitado === '0') {
      this.showAlert('', 'Los días solicitados no pueden ser 0', 'warning');
      return false;
      
    }
    return true;

  }
  async Guardar() {
   
    const resp = await this.SetVacacionesGrabar();
    this.loadingVisible = true;
    if (resp === true) {
      this.SSNuevo();
    }

    this.loadingVisible = false;
  }

  async SetVacacionesGrabar() {
    let SolicitudVac = [];
    var listDet;


    /* if (this.DataEmpleado.length > 0) { */
      SolicitudVac = this.llenarSolicitud();
    /* }
    else{
      SolicitudVac = this.llenarSolicitudEmpleado();
    } */

    listDet = JSON.stringify(SolicitudVac);

    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetVacacionesGrabar(
          listDet,
          this.usuarioEmpresa,
          this.idEmpresa
        )
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            await this.showAlert('', 'Registro grabado con éxito', 'success');

            return resolve(true);
          } else {
            await this.showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });

    return valor;
  }

  llenarSolicitud() {
    let solicitud = [];

    var d = [];

    d = this.DataSolicitudVacaciones;

    solicitud.push({
      sol_id: this.vlsol_id,
      sol_trbCodigo: this.vltrbCodigo,
      fechadesde: moment(this.FechaDesde).format("YYYY/MM/DD"),
      fechahasta: moment(this.FechaHasta).format("YYYY/MM/DD"),
      dias: this.txtdiassolicitado,
      observacion: this.txtObservacion,
      estado: 'AC'
    });

    return solicitud;
  }


  async onClickConsultarVacaciones(content: any) {

    this.loadingVisible = true;

    await this.ConsultaVacaciones();
    this.loadingVisible = false;
    this.modalService
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalConsultaSolicitudes',
      })
      .result.then(
        (result) => {},
        (reason) => {}
      );
  }
  async onRowVacacionesDoubleClick(e: any, modal: any) {

    this.loadingVisible = true;
    
    this.txtEmpleadoDetalleInfo = e.data.nombre_trabajador;
    this.FechaDesde = e.data.fechadesde;
    this.FechaHasta = e.data.fechahasta;
    
    this.txtObservacion=e.data.observacion;
    this.vlsol_id = e.data.sol_id;
    //this.diasPendientes = e.data.diaspendiente;

    e.data.Estado === 'PENDIENTE' ? (this.txtEstado = 'AC') : (this.txtEstado = 'AP');
    this.txtSolicitudInfo='Solicitud: '+ e.data.sol_id + ' \n' + 'Estado: ' + e.data.Estado;

    this.isVisibleSolicitud = true;
    this.lvvisiblegrabar=false;

    /* if (this.txtEstado==='AC') {
      this.lvvisiblegrabar=true;
      
    }
    else{
      this.lvvisiblegrabar=false;
    } */
    

    if (modal !== undefined) {
      modal.close();
    }
    /* if (this.txtEstado==='DJ' || this.txtEstado==='DE') {
      this.isVisibleSolicitud = true;
      
    }
    else{
      this.isVisibleSolicitud = false;
    } */
    
    this.loadingVisible = false;
  }
  async ConsultaVacaciones() {
   
    await this.ConsultaGeneralSolicitud(await localStorage.getItem(varEmpresa),'LCEPEDA','GEN',(this.jefearea?1:0),'','','');
  }
 async ConsultaGeneralSolicitud(empresa,usuario,accion,jefeporarea,estado,desde,hasta){
  
    const valorMenu = await new Promise(async (resolve) => {
      await this._service
        .getSolicitudVacaciones(empresa,usuario,accion,jefeporarea,estado,desde,hasta)
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            if (Object.keys(resp.Dt).length > 0) {
              this.listaConsultaSolicitud = resp.Dt.Table;
              if (this.listaConsultaSolicitud.length) {
                let Columns = [];
                for (
                  let x = 0;
                  x < Object.entries(this.listaConsultaSolicitud[0]).length;
                  x += 1
                ) {
                  Columns.push(
                    Object.entries(this.listaConsultaSolicitud[0])[
                      x
                    ][0].toString()
                  );
                }
                this.columnasSolicitud = JSON.parse(JSON.stringify(Columns));
                //this.btnaddperiodo = false;
              }
            }
            return resolve(true);
          } else {
            await this.showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });
  }
  async onClickConsultarSolicitudVacaciones() {
    let vlestado = '99';
    if (this.cmbEstadoConsulta!='99') {
      vlestado = this.cmbEstadoConsulta;
    }
   
    const fechaDesdeString = moment(this.dtpFechaDesde).format('YYYY/MM/DD');
    const fechaHastaString = moment(this.dtpFechaHasta).format('YYYY/MM/DD');
    await this.ConsultaGeneralSolicitud(await localStorage.getItem(varEmpresa),'LCEPEDA','GEN',(this.jefearea?1:0),vlestado,fechaDesdeString,fechaHastaString);
  }
 
}
