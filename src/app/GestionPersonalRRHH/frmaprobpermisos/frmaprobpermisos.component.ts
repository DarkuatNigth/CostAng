import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  HostListener,
} from '@angular/core';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { Router } from '@angular/router';
import { FrmaprobpermisosService } from './frmaprobpermisos.service';
import * as moment from 'moment';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../../shared/notify.service';
import { varEmpresa, varMenuDT, varUser } from 'src/app/config/url.servicios';
import { datarpt } from 'src/app/Interfaces/dataRpt';
import {  ActivatedRoute } from '@angular/router';

declare var window;
declare var $: any;


@Component({
  selector: 'app-frmaprobpermisos',
  templateUrl: './frmaprobpermisos.component.html',
  styleUrl: './frmaprobpermisos.component.scss',
})
export class FrmaprobpermisosComponent implements OnInit {
  @ViewChild('GridDataEmpleadoSolicitud', { static: false })
  GridDataEmpleadoSolicitud: DxDataGridComponent;

  @ViewChild('gridImpresion') gridImpresion: DxDataGridComponent;
  @ViewChild('autocomplete') autocomplete;
  @ViewChild('modalPeriodo') modalPeriodo: any;

  modalReferenceItem: any;
  idEmpresa?: number;
  usuarioEmpresa: string = '';
  loadingVisible: boolean = true;
  txtEmpleadoCodigo: string = '';
  txtEmpleado: string = '';
  openModalDiv: string = '';
 
  txtGenero: string = '';
  txtCargo: string = '';
  txtCentro: string = '';
  txtEstado: string = '';
  txtPermiso: string = '';
  txtRegresa: string = '';
  txtHoraSalida: string = '';
  txtHoraEntrada: string = '';
  txtFechaDesde: string = '';
  txtFechaHasta: string = '';
  txtMotivo: string = '';
  txtdiassolicitado: string = '';
 
  DataEmpleadoSolicitudPermiso = [];
  DataEmpleadoPermiso= [];
  
  selectedFile: string = '';
  lstiddeta: string = '';
  txtEmpleadoInfo: string = '';
  
  FechaDesde = new Date();
  FechaHasta = new Date();
  Fechacalculodesde = new Date();
  
  vlopcion: number = 0;
  isAllSolSelected = false;
  vlbotonAP: boolean = false;
  vlbotonDN: boolean = false;

  allMode: string = "allPages";
  checkBoxesMode: string = "always";

  jefearea: boolean = false;

  constructor(
    private router: Router,
    public _service: FrmaprobpermisosService,
    private renderer: Renderer2,
    private _notificationService: NotificationService,
    private modalService: NgbModal,
    private activatedRoute: ActivatedRoute
  ) {
  
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

    this.idEmpresa = await Number(localStorage.getItem(varEmpresa));
    this.usuarioEmpresa = await localStorage.getItem(varUser);
    
    if (this.usuarioEmpresa === null) {
      await this.showAlert('','Se terminó el tiempo de su session volver a ingresar al sistema','warning');
      return;
    }

    this.loadingVisible = true;
    await this.ObtenerEsJefeArea();

    if(this.GridDataEmpleadoSolicitud !== undefined){
      this.GridDataEmpleadoSolicitud.instance.clearSelection();
    }

    await this.GetPermisoTrabajador(this.idEmpresa, this.usuarioEmpresa, 'AP',(this.jefearea?1:0),moment(this.FechaDesde).format('yyyy/MM/DD'), moment(this.FechaHasta).format('yyyy/MM/DD'));
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
    this.txtdiassolicitado="0";

    this.txtEmpleadoInfo = '';
    this.DataEmpleadoSolicitudPermiso=[];
    this.loadingVisible = false;

    if(this.GridDataEmpleadoSolicitud !== undefined){
      this.GridDataEmpleadoSolicitud.instance.clearSelection();
    }
  }
  
  rowPrepared(e: any) {
    if (e.rowType === 'data') {
      e.rowElement.classList.add('selected-row');
    }
  }

 

  async GetPermisoTrabajador(empresa, codigo, accion,opcion,fechadesde,fechahasta) {
    this.loadingVisible = true;
    this.DataEmpleadoSolicitudPermiso = [];

    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(empresa, codigo, accion,opcion,fechadesde,fechahasta,0)
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {

                    this.DataEmpleadoSolicitudPermiso = JSON.parse(JSON.stringify(res.Dt.Table));

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
 
  llenarPermisoMasivo() {
    let periodos = [];

    var d = [];
    
    d = this.DataEmpleadoSolicitudPermiso.filter((s) => s['Marcado'] === 'S' );

    for (let i = 0; i < d.length; i++) {
     
      periodos.push({
        per_id: d[i].ID,
        per_trbCodigo: d[i].CODTRA,
        per_taCodigo: d[i].codtrbcodigo,
        per_fechaDesde: d[i].DESDE,
        per_fechaHasta: d[i].HASTA,
        per_retorna: '',
        per_horaSalida: '',
        per_horaEntrada: '',
        per_motivo: d[i].Motivo,
        per_estado: 'AP',
      });
    }
    return periodos;
  }

  async onClickAprobarPermisoTrabajador() {

    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    if(d.length === 0){
      await this.showAlert('', 'Debe seleccionar al menos un registro', 'warning');
      return;
    }

    if (
      await await this.showAlertConfirm('',`¿Estás seguro de que desea aprobar el permiso?`,'')
    ) {
        this.vlbotonAP = true;
        this.vlbotonDN = false;
        await this.Aprobar();
    }
  }



  async onClickDenegarPermisoTrabajador() {
    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    if(d.length === 0){
      await this.showAlert('', 'Debe seleccionar al menos un registro', 'warning');
      return;
    }

    if (
      await await this.showAlertConfirm(
        '',
        `¿Estás seguro de que desea denegar el permiso?`,
        ''
      )
    ) {
      //await this.Denegar();
      this.vlbotonAP = false;
      this.vlbotonDN = true;
      await this.SetPermisosDenegar();
      this.SSNuevo();
    }
  }

  async Aprobar() {
  
    this.loadingVisible = true;

    const resp = await this.SetAprobarPermisos();
    
    this.SSNuevo();

    this.loadingVisible = false;
  }
  
  async SetAprobarPermisos() {
    let SolicitudVac = [];
    let ListaVacaiones = [];
    var listDet;

    if (this.vlopcion===2){
      ListaVacaiones = this.llenarPermisoMasivo();
    }

    SolicitudVac = this.llenarAprobacionDenegacionPermiso();
   
    listDet = JSON.stringify(SolicitudVac);

    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetAprobarPermisos(
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

  llenarAprobacionDenegacionPermiso() {
    let periodosDetalles = [];


    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    for (let i = 0; i < d.length; i++) {
      
        periodosDetalles.push({
          per_id:d[i].ID,
          per_trbCodigo:d[i].CODTRA,
          per_taCodigo:0,
          per_fechaDesde:d[i].DESDE,
          per_fechaHasta:d[i].HASTA,
          per_retorna:0,
          per_horaSalida:'',
          per_horaEntrada:'',
          per_motivo:d[i].MOTIVO,
          per_estado: this.vlbotonAP ? 'AP' : 'DS',
        });
      
    }

    return periodosDetalles;
  }
  
  async SetPermisosDenegar() {
    let SolicitudVac = [];
    var listDet;

    SolicitudVac = this.llenarAprobacionDenegacionPermiso();
   
    listDet = JSON.stringify(SolicitudVac);
    
    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetAprobarPermisos(listDet,this.usuarioEmpresa,
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

  async onClickConsultarPermisos() {
    if (this.usuarioEmpresa === null) {
      await this.showAlert(
        '',
        'Se terminó el tiempo de su session volver a ingresar al sistema',
        'warning'
      );
      this.router.navigateByUrl('/login');
      return;
    }

    this.loadingVisible = true;

    if(this.GridDataEmpleadoSolicitud !== undefined){
      this.GridDataEmpleadoSolicitud.instance.clearSelection();
    }

    await this.GetPermisoTrabajador(this.idEmpresa, this.usuarioEmpresa, 'AP',(this.jefearea?1:0),moment(this.FechaDesde).format('yyyy/MM/DD'), moment(this.FechaHasta).format('yyyy/MM/DD'));
    this.loadingVisible = false;
  
  }

  onSelectionChangedDetalle(e) {
    if (e.currentDeselectedRowKeys.length > 0) {
      for (let index = 0; index < e.currentDeselectedRowKeys.length; index++) {
        if (
          this.DataEmpleadoSolicitudPermiso.find(
            (d) => d.ID === e.currentDeselectedRowKeys[index]
          )
        ) {
          this.DataEmpleadoSolicitudPermiso.find(
            (d) => d.ID === e.currentDeselectedRowKeys[index]
          )['Marcado'] = '';
        }
      }
    }
    if (e.currentSelectedRowKeys.length > 0) {
      for (let index = 0; index < e.currentSelectedRowKeys.length; index++) {
        if (
          this.DataEmpleadoSolicitudPermiso.find(
            (d) => d.ID === e.currentSelectedRowKeys[index]
          )
        ) {
          this.DataEmpleadoSolicitudPermiso.find(
            (d) => d.ID === e.currentSelectedRowKeys[index]
          )['Marcado'] = 'S';
        }
      }
    }
  }



  onSelectAllDiurnoChanged(event: Event): void {
    this.isAllSolSelected = (event.target as HTMLInputElement).checked;
    this.DataEmpleadoSolicitudPermiso.forEach((empleado) => {
        if (this.isAllSolSelected) {
          empleado.Marcado = 'S';
          
        } else {
          empleado.Marcado = '';
        }

        if (this.isAllSolSelected) {
          this.isAllSolSelected = true;
        } else {
          this.isAllSolSelected = false;
        }
    });
  }
  onDiurnoSelectionChanged(data: any): void {
    this.isAllSolSelected = this.DataEmpleadoSolicitudPermiso.every(
      (empleado) => empleado.Marcado === ''
    );
  }

  async onClickConsultar(content: any,data:any) {
    this.loadingVisible = true;
    //this.selectedPeriodo = data;
    await this.ConsultarDatosEmpleadoPermiso(data.ID,data.CODTRA);
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
  
  async ConsultarDatosEmpleadoPermiso(codigotrs,codigotrabajador) {
    this.DataEmpleadoPermiso = [];
    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudPermisos(this.idEmpresa, this.usuarioEmpresa, 'CT',0,'','',codigotrs)
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {

                    this.DataEmpleadoPermiso = JSON.parse(JSON.stringify(res.Dt.Table));

                    if (this.DataEmpleadoPermiso.length > 0) {
                      this.txtEmpleado = this.DataEmpleadoPermiso[0].nombre_trabajador;
                      this.txtGenero = this.DataEmpleadoPermiso[0].sexo;
                      this.txtCargo = this.DataEmpleadoPermiso[0].cgo_descri;
                      this.txtEstado = this.DataEmpleadoPermiso[0].estado;
                      this.txtPermiso = this.DataEmpleadoPermiso[0].Permiso;
                      this.txtRegresa = this.DataEmpleadoPermiso[0].retorna;
                      this.txtHoraSalida = this.DataEmpleadoPermiso[0].per_horaSalida;
                      this.txtHoraEntrada = this.DataEmpleadoPermiso[0].per_horaEntrada;
                      this.txtFechaDesde = moment(this.DataEmpleadoPermiso[0].per_fechaDesde).format('YYYY-MM-DD');
                      this.txtFechaHasta = moment(this.DataEmpleadoPermiso[0].per_fechaHasta).format('YYYY-MM-DD');
                      this.txtMotivo = this.DataEmpleadoPermiso[0].per_motivo;
                    
                      
                    }

            }
            resolve(true);
          } else {
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

  }
}
