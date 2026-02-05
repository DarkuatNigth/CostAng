import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { Router } from '@angular/router';
import { FrmsolpermisosService } from './frmsolpermisos.service';
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
  selector: 'app-frmsolpermisos',
  templateUrl: './frmsolpermisos.component.html',
  styleUrl: './frmsolpermisos.component.scss',
})
export class FrmsolpermisosComponent implements OnInit {
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
  habilitallegada: boolean = false;
  modalReferenceItem: any;
  idEmpresa?: number;
  usuarioEmpresa: string = '';

  loadingVisible: boolean = true;
  
  txtEmpleadoCodigo: string = '';
  txtEmpleado: string = '';
  openModalDiv: string = '';
 
  txtCentro: string = '';
  txtEstado: string = '';
  txtMotivo: string = '';
  txtdiassolicitado: string = '';
 
  DataEmpleado = [];
  DataPermisos = [];
  DataRegresa= [];

  horallegada: Date = new Date();
  horasalida: Date = new Date();

  DataSolicitudPermisos = [];
  selectedFile: string = '';
  lstiddeta: string = '';
  txtEmpleadoInfo: string = '';
  txtSolicitudInfo: string = '';
  txtEmpleadoDetalleInfo: string = '';
  txtnumeroPermiso: string = '';
  FechaDesde = new Date();
  FechaHasta = new Date();
  vltrbCodigo: string = '';
  diasPendientes:number = 0;
  Fechacalculodesde = new Date();
  listaConsultaPermiso = [];
  columnasPermiso = [];

  cmbPermisos: string = '';
  cmbRegresa:string = '';

  cmbEstadoConsulta: string = '99';
  listaEstados: any[] = [];
  dtpFechaDesde: Date = new Date();
  dtpFechaHasta: Date = new Date();
  minDate: Date = new Date();
  minFechaHasta: Date = new Date(); 

  vlsol_id: number = 0;
  i_opcionPermisos: string = 'USAP';

  constructor(
    private router: Router,
    public _service: FrmsolpermisosService,
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
      await this.showAlert('','Se terminó el tiempo de su session volver a ingresar al sistema','warning');
      return;
    }

    this.FechaDesde = new Date();
    this.dtpFechaDesde = new Date();
    this.dtpFechaHasta = new Date();
    this.horallegada.setHours(0, 0, 0, 0); 
    this.horasalida.setHours(0, 0, 0, 0);
    
    await this.ObtenerEsJefeArea();

    this.loadingVisible = true;
    await this.GetPermisoTrabajador(this.idEmpresa, this.usuarioEmpresa, 'IN',(this.jefearea?1:0));
   
    this.loadingVisible = false;
  }

  async ObtenerEsJefeArea(){
    this.jefearea = false;
    const valorMenu = await new Promise(async (resolve) => {
      await this._service.getesJefeArea(this.usuarioEmpresa,this.idEmpresa,this.i_opcionPermisos).subscribe(async (resp) => {
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
    this.horallegada = new Date();
    this.horasalida = new Date();
    this.horallegada.setHours(0, 0, 0, 0);
    this.horasalida.setHours(0, 0, 0, 0);
    this.txtdiassolicitado="0";
    this.cmbPermisos = '';
    this.cmbRegresa = ''; 
    this.txtMotivo = '';
    //this.txtEmpleadoInfo = '';
    if (!this.jefearea) {
      this.vltrbCodigo='';
      this.txtEmpleadoDetalleInfo = '';
      this.txtnumeroPermiso = '';
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
    await this.GetPermisoTrabajador(this.idEmpresa, this.usuarioEmpresa, 'IN',(this.jefearea?1:0));
    this.loadingVisible = false;
  }

  async GetPermisoTrabajador(empresa, usuario, accion, jefeporarea) {
    this.loadingVisible = true;
    this.DataEmpleado = [];

    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(accion,empresa, usuario, jefeporarea, '', '', 0,'',0)  
        .subscribe(async (res) => {
          if (res.Codigo) {
            
            if (Object.keys(res.Dt).length > 0) {
 
              this.DataRegresa = JSON.parse(JSON.stringify(res.Dt.Table));
              this.DataPermisos = JSON.parse(JSON.stringify(res.Dt.Table1));
              let empleado: any = res.Dt.Table2;
              this.listaEstados = res.Dt.Table3;

             if (empleado.length>0) {

              this.txtEmpleadoDetalleInfo = 'Empleado: '+empleado[0].trb_Codigo + ' - ' +empleado[0].nombre_trabajador;
              this.txtnumeroPermiso = empleado[0].Cantidad_Permiso;
              this.vltrbCodigo = empleado[0].trb_Codigo;
             }
             if(res.Dt.Table4 !== undefined){
             
              this.DataEmpleado = JSON.parse(JSON.stringify(res.Dt.Table4));
             }
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

  async GetPermisoTrabajadorEspecifica(empresa, usuario, accion, itransaccion) {
    this.loadingVisible = true;

    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(accion,empresa, usuario, '0', '', '', 0,'',itransaccion)  
        .subscribe(async (res) => {
          if (res.Codigo) {
            
            if (Object.keys(res.Dt).length > 0) {         
              let empleado: any = res.Dt.Table;
             if (empleado.length>0) {

              this.cmbPermisos = empleado[0].per_taCodigo;
              this.cmbRegresa = empleado[0].per_retorna;
              this.vltrbCodigo = empleado[0].per_trbCodigo;
              this.txtMotivo =empleado[0].per_motivo;

              this.FechaDesde = new Date(empleado[0].Fecha_Desde);
              this.FechaHasta = new Date(empleado[0].Fecha_Hasta);            
              this.horallegada = moment(empleado[0].Hora_Entrada, 'HH:mm:ss').toDate();
              this.horasalida = moment(empleado[0].Hora_Salida, 'HH:mm:ss').toDate();
             }
             
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
  
  async GetPermisoTrabajadorEspecifica2(empresa, usuario, accion, trbCodigo) {
    this.loadingVisible = true;

    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(accion,empresa, usuario, '0', '', '', trbCodigo,'',0)  
        .subscribe(async (res) => {
          if (res.Codigo) {
            
            if (Object.keys(res.Dt).length > 0) {         
              let empleado: any = res.Dt.Table;
             if (empleado.length>0) {

              this.txtnumeroPermiso= empleado[0].Cantidad_Permiso;
             }
             
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
      this.txtdiassolicitado = ''; 
    }
  }

  async onRowMostrarDetalleEmpleado(e: any) {
    
    if (e.data === undefined) {
      return;
    }
    
    this.txtEmpleadoDetalleInfo = '';
    this.txtnumeroPermiso = '';
    this.vltrbCodigo = e.data.Codigo;
    this.txtSolicitudInfo='';
    this.vlsol_id = 0;
    this.isVisibleSolicitud = false;
    this.lvvisiblegrabar= true;
    this.cmbPermisos = '';
    this.cmbRegresa = '';
    this.FechaDesde = new Date();
    this.FechaHasta = new Date();
    this.horallegada = new Date();
    this.horasalida = new Date();
    this.horallegada.setHours(0, 0, 0, 0);
    this.horasalida.setHours(0, 0, 0, 0);
    this.txtEmpleadoDetalleInfo= 'Empleado: ' + e.data.Codigo + ' - ' + e.data.Nombre;
    //this.txtnumeroPermiso =  e.data.Cantidad_Permiso;
    this.txtMotivo=e.data.Motivo;
    await this.GetPermisoTrabajadorEspecifica2(this.idEmpresa, this.usuarioEmpresa, 'ES', e.data.Codigo)
  }

  async onClickGuardarPermisosTrabajador() {
 
    if(this.vltrbCodigo === '' || this.vltrbCodigo === '0'){
      await this.showAlert('','Debe seleccionar un empleado','warning');
      return;
    }
    if (!this.validarFechas(this.FechaDesde, this.FechaHasta)){
      return;
    }
    
    if (this.cmbPermisos === '' || this.cmbPermisos === '0') {
      await this.showAlert('', 'Debe seleccionar un tipo de permiso', 'warning');
      return;
      
    }
    if (this.cmbRegresa === '' || this.cmbRegresa === '0') {
      await this.showAlert('', 'Debe seleccionar si regresa o no', 'warning');
      return;
      
    }
    if (this.horasalida === null || this.horasalida === undefined) 
    {
      await this.showAlert('', 'Debe seleccionar la hora de salida', 'warning');
      return;
      
    }
    if(this.txtMotivo?.trim() === ''){
      await this.showAlert('', 'Debe ingresar el motivo del permiso', 'warning');
      return;
    }
    /* if ((this.horasalida.getHours() >= this.horallegada.getHours()) && this.cmbRegresa === '1' &&
        (moment(this.FechaDesde).format('yyyy/MM/DD') ===moment(this.FechaHasta).format('yyyy/MM/DD'))) {
      await this.showAlert('', 'La Hora Salida no debe ser mayor o igual a la Hora Llegada', 'warning');
      return;
      
    } */
    if ((this.horasalida.getTime() >= this.horallegada.getTime()) && this.cmbRegresa === '1' &&
      (moment(this.FechaDesde).format('yyyy/MM/DD') ===moment(this.FechaHasta).format('yyyy/MM/DD'))) {
    await this.showAlert('', 'La Hora Salida no debe ser mayor o igual a la Hora Llegada', 'warning');
    return;
    
    }
    const resp = await this.verificarMarcacionesPlanta();
    if (resp) {
      return;
    }

    let msgConfirm = 'Estás seguro de que desea guardar el siguiente permiso?\n' + 
      this.txtEmpleadoDetalleInfo.replace('Empleado:', '<b>Empleado:</b>') + '\n' +
    '<b>Permiso:</b> ' + this.DataPermisos.find(p => p.CODIGO === this.cmbPermisos)?.DESCRIPCION + '\n' + 
      '<b>Regresa:</b> ' + this.DataRegresa.find(p => p.CODIGO === this.cmbRegresa)?.DESCRIPCION + '\n' +
      '<b>Desde:</b> ' + moment(this.FechaDesde).format("YYYY/MM/DD") + '\n' +
      '<b>Hasta:</b> ' + moment(this.FechaHasta).format("YYYY/MM/DD") + '\n' +
      '<b>Hora Salida:</b> ' + moment(this.horasalida).format('HH:mm') + '\n' +
      '<b>Hora Llegada:</b> ' + moment(this.horallegada).format('HH:mm') + '\n';
    if(!await await this.showAlertConfirm('',msgConfirm,'')) 
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
   this.loadingVisible = true;

    const resp = await this.SetPermisosTrabajadorGrabar();
    
    if (resp === true) {
      this.SSNuevo();
    }

    this.loadingVisible = false;
  }

  async SetPermisosTrabajadorGrabar() {
    let Solicitud = [];
    var listDet;

    Solicitud = this.llenarSolicitudPermiso();

    listDet = JSON.stringify(Solicitud);

    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetPermisosTrabajadorGrabar(
          listDet,
          //this.txtEmpleadoCodigo,
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

  llenarSolicitudPermiso() {
    let solicitud = [];
    
    solicitud.push({
      per_id: this.vlsol_id,
      per_trbCodigo: this.vltrbCodigo,
      per_taCodigo:this.cmbPermisos,
      per_fechaDesde: moment(this.FechaDesde).format("YYYY/MM/DD"),
      per_fechaHasta: moment(this.FechaHasta).format("YYYY/MM/DD"),
      per_retorna: this.cmbRegresa,
      per_horaSalida: moment(this.horasalida).format('HH:mm'),
      per_horaEntrada: moment(this.horallegada).format('HH:mm'),
      per_motivo: this.txtMotivo,
      per_estado: 'AC'
    });

    return solicitud;
  }
  

  async onClickConsultarPermisos(content: any) {
    if (this.usuarioEmpresa === null) {
      await this.showAlert(
        '',
        'Se terminó el tiempo de su session volver a ingresar al sistema',
        'warning'
      );
      this.router.navigateByUrl('/login');
      return;
    }

    this.listaConsultaPermiso = [];
    this.columnasPermiso = [];
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
  async onRowPermisosDoubleClick(e: any, modal: any) {

    if (e.data === undefined) {
      return;
    }
    
    this.loadingVisible = true;
   
    this.txtEmpleadoDetalleInfo= 'Empleado: ' + e.data.Empleado;
    this.txtnumeroPermiso = e.data.Cantidad_Permiso;

    const horaEntrada = e.data.Hora_Entrada;
    const horaSalida = e.data.Hora_Salida;
   
    this.FechaDesde = new Date(e.data.Fecha_Desde);
    this.FechaHasta = new Date(e.data.Fecha_Hasta);
  
    this.horallegada = moment(horaEntrada, 'HH:mm:ss').toDate();
    this.horasalida = moment(horaSalida, 'HH:mm:ss').toDate();

    //this.txtMotivo = e.data.Motivo;

    this.vlsol_id = e.data.Codigo;
  
    this.txtSolicitudInfo='Solicitud Permiso: '+ e.data.Codigo + ' \n' + 'Estado: ' + e.data.Estado;
 
    await this.GetPermisoTrabajadorEspecifica(this.idEmpresa, this.usuarioEmpresa, 'CE', e.data.Codigo);
    this.isVisibleSolicitud = true;
    this.lvvisiblegrabar=e.data.Estado != 'PENDIENTE' ? false  : true;

    if (modal !== undefined) {
      modal.close();
    }

    this.loadingVisible = false;
  }
  async ConsultaPermisos() {
   
    await this.ConsultaGeneralPermisos(this.idEmpresa,this.usuarioEmpresa,'GE',(this.jefearea?1:0),'','','','');
  }
 async ConsultaGeneralPermisos(empresa,usuario,accion,jefeporarea,desde,hasta, codigotrabajador,estado) {
    const valorMenu = await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(accion,empresa,usuario,jefeporarea,desde,hasta, codigotrabajador,estado,0)
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            if (Object.keys(resp.Dt).length > 0) {
              this.listaConsultaPermiso = resp.Dt.Table;
              if (this.listaConsultaPermiso.length) {
                let Columns = [];
                for (
                  let x = 0;
                  x < Object.entries(this.listaConsultaPermiso[0]).length;
                  x += 1
                ) {
                  Columns.push(
                    Object.entries(this.listaConsultaPermiso[0])[
                      x
                    ][0].toString()
                  );
                }
                this.columnasPermiso = JSON.parse(JSON.stringify(Columns));
               
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
  async onClickConsultarPermiso() {
    let vlestado = '99';
    if (this.cmbEstadoConsulta!='99') {
      vlestado = this.cmbEstadoConsulta;
    }
   
    const fechaDesdeString = moment(this.dtpFechaDesde).format('YYYY/MM/DD');
    const fechaHastaString = moment(this.dtpFechaHasta).format('YYYY/MM/DD');
    this.listaConsultaPermiso = [];
    this.columnasPermiso = [];

    await this.ConsultaGeneralPermisos(this.idEmpresa,this.usuarioEmpresa,'GE',(this.jefearea?1:0),fechaDesdeString,fechaHastaString,0,vlestado);
  }
  async onRegresaChange(idRegresa) {
    
    this.loadingVisible = true;
   
      this.habilitallegada = idRegresa === '2' ? true : false;
    
    this.loadingVisible = false;
  }

  /* async ConsultaEspecificaPermiso(accion,empresa,codigo){
    const valorMenu = await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(accion,empresa,0,0,0,0,codigo,'',0)
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {
              let numeropermiso: any = res.Dt.Table;
                
                if (numeropermiso.length>0) {

                this.txtEmpleadoDetalleInfo= 'Empleado: ' + numeropermiso[0].nombre_trabajador ;
                this.txtnumeroPermiso = numeropermiso[0].Cantidad_Permiso;
              }
                
                }
            resolve(true);
          } else {
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });
  } */

  async  verificarMarcacionesPlanta() {
    let respuesta = false;
    this.loadingVisible = true;
    await new Promise(async (resolve) => {
      await this._service
        .verificaMarcacionesPlanta(this.vltrbCodigo)
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {
              const data: any[] = res.Dt.Table;
              if (data.length > 0) {
                if (data[0].total > 0) {
                  await this.showAlert(
                    '',
                    'El codigo del empleado ' +
                    this.vltrbCodigo +
                      ' no ha marcado su salida en la planta',
                    'warning'
                  );
                  respuesta = true;
                  resolve(true);
                  return;
                }
              }
            }
            resolve(false);
          } else {
            respuesta = true;
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

    this.loadingVisible = false;
    return respuesta;
  }
 
}
