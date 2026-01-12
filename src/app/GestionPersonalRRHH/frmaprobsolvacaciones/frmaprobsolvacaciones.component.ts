import {
  Component,
  OnInit,
  Renderer2,
  ViewChild,
  HostListener,
} from '@angular/core';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { Router } from '@angular/router';
import { FrmaprobsolvacacionesService } from './frmaprobsolvacaciones.service';
import * as moment from 'moment';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from '../../shared/notify.service';
import { varEmpresa, varMenuDT, varUser } from 'src/app/config/url.servicios';
import { datarpt } from 'src/app/Interfaces/dataRpt';
import {  ActivatedRoute } from '@angular/router';

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
  selector: 'app-frmaprobsolvacaciones',
  templateUrl: './frmaprobsolvacaciones.component.html',
  styleUrl: './frmaprobsolvacaciones.component.scss',
})
export class FrmaprobsolvacacionesComponent implements OnInit {
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
 
  txtCentro: string = '';
  txtEstado: string = '';
  txtObservacion: string = '';
  txtdiassolicitado: string = '';
 
  DataEmpleadoSolicitud = [];
  
  selectedFile: string = '';
  lstiddeta: string = '';
  txtEmpleadoInfo: string = '';
  
  FechaDesde = new Date();
  FechaHasta = new Date();
  Fechacalculodesde = new Date();
  listaConsultaSolicitud = [];
  columnasSolicitud = [];
  listaDataPeriodoInfo = [];
  listadetaMasivo = [];
  vlestado: string = '';
  vlopcion: number = 0;
  isAllSolSelected = false;

  selectedSolicitud: ISolicitud|null = null;
  allMode: string = "allPages";
  checkBoxesMode: string = "always";


  constructor(
    private router: Router,
    public _service: FrmaprobsolvacacionesService,
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
      await this.showAlert(
        '',
        'Se terminó el tiempo de su session volver a ingresar al sistema',
        'warning'
      );
      return;
    }

    //valido que el usuario tenga permiso a la opcion
    var mn = localStorage.getItem(varMenuDT);
    var pathName =
      '/' +
      window.location.pathname.split('/')[
        window.location.pathname.split('/').length - 2
      ] +'/' + window.location.pathname.split('/')[
        window.location.pathname.split('/').length - 1
      ];

    if (mn !== undefined && mn !== null) {
      
      const valorMenu = await new Promise(async (resolve) => {
        await this.activatedRoute.params.subscribe(params => {
          if(params['opcion'] !== undefined){
            this.vlopcion = Number(params['opcion']); // (+) converts string 'id' to a number
          }else{
            this.vlopcion = 0;
          }
          return resolve(true);
        });
      });


    
        this.loadingVisible = true;
        await this.GetVacacionesPeriodo(this.idEmpresa, this.usuarioEmpresa, 'CO',this.vlopcion);
        this.loadingVisible = false;

    } else {
      this.router.navigateByUrl('/login');
      return;
    }
   
  }

  async SSNuevo() {
    this.loadingVisible = true;

    this.FechaDesde = new Date();
    this.txtdiassolicitado="0";
    this.txtObservacion = '';
    this.txtEmpleadoInfo = '';
    this.DataEmpleadoSolicitud=[];
    this.loadingVisible = false;

    await this.GetVacacionesPeriodo(this.idEmpresa, this.usuarioEmpresa, 'CO',this.vlopcion);

    if(this.GridDataEmpleadoSolicitud !== undefined){
      this.GridDataEmpleadoSolicitud.instance.clearSelection();
    }
  }
  
  rowPrepared(e: any) {
    if (e.rowType === 'data') {
      e.rowElement.classList.add('selected-row');
    }
  }

 

  async GetVacacionesPeriodo(empresa, codigo, accion,opcion) {
    this.loadingVisible = true;
    this.DataEmpleadoSolicitud = [];

    await new Promise(async (resolve) => {
      await this._service
        .getSolicitudVacaciones(empresa, codigo, accion,opcion)
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {

                    this.DataEmpleadoSolicitud = JSON.parse(JSON.stringify(res.Dt.Table));

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
 
  llenarPeriodoMasivo() {
    let periodos = [];

    var d = [];
    
    d = this.DataEmpleadoSolicitud.filter((s) => s['Marcado'] === 'S' );

    var joinedData = d.map((solicitud) => {
      let periodoInfo = this.listaDataPeriodoInfo.find((periodo) => periodo.codtrbcodigo === solicitud.trb_codigo);
      if (periodoInfo) {
        return {
          ...solicitud,
          ...periodoInfo
        };
      }
      return null;
    }).filter(item => item !== null);

    for (let i = 0; i < joinedData.length; i++) {
    
      const [inicio, fin] = joinedData[i].periodo
        .split(' - ')
        .map((part) => part.split('/')[0]);

      periodos.push({
        id: 0,
        cabid: joinedData[i].cabid,
        desde: joinedData[i].desde,
        hasta: joinedData[i].hasta,
        fecha: moment(new Date()).format('yyyy/MM/DD'),
        periodoini: inicio,
        periodofin: fin,
        diastomados: joinedData[i].DiasAGozar,
        trb_codigo: joinedData[i].codtrbcodigo,
        dias_pendiente: joinedData[i].diaspendiente,
        Estado: 'AC',
        observacion: 'Masivo',
      });
    }
    return periodos;
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
      const tiempoDesde = new Date(this.FechaDesde).getTime();
      const tiempoHasta = new Date(this.FechaHasta).getTime();

      if (tiempoDesde > tiempoHasta) {
        this.txtdiassolicitado = '0';
      } else {
        const diferenciaMilisegundos = (tiempoHasta - tiempoDesde)+1;
        this.txtdiassolicitado = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24)).toString(); // Conversión a días
      }
    } else {
      this.txtdiassolicitado = ''; // Si faltan fechas, se limpia el campo
    }
  }

  async onClickGuardarSolicitudVacaciones() {

    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    if(d.length === 0){
      await this.showAlert('', 'Debe seleccionar al menos un registro', 'warning');
      return;
    }

    if (
      await await this.showAlertConfirm(
        '',
        `¿Estás seguro de que desea aprobar el registro?`,
        ''
      )
    ) {
      if(await this.validarDatosExcel())
      {
        await this.Aprobar();
      }
    }
  }

  async ImprimirReporteMasivo() {
    var detalle: string = '';

    detalle = this.listadetaMasivo.map((x) => x.Id).join(',');

    const valor = new Promise(async (resolve) => {
      await this._service
        .getVacacionesTrabajador(this.idEmpresa, 0, 'I', 0, detalle, '')
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {
              const dt: any = res.Dt.Table;
              const rpt: datarpt = dt[0] as datarpt;
              if (rpt) {
                await this.ImprimirRPT(rpt);
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
  async ImprimirRPT(data: datarpt) {
    this.loadingVisible = true;
    const valorMenu = await new Promise(async (resolve) => {
      debugger
      await this._service.callReports(data).subscribe(async (rr) => {
        let resp = JSON.parse(JSON.parse(JSON.stringify(rr)));
        if (resp.Codigo) {
          var byteCharacters = atob(resp.doc);
          var byteNumbers = new Array(byteCharacters.length);
          for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          var byteArray = new Uint8Array(byteNumbers);
          var file = new Blob([byteArray], {
            type: 'application/pdf;base64',
          });
          var fileURL = URL.createObjectURL(file);
          this.loadingVisible = false;
          window.open(fileURL);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
        return resolve(true);
      });
    });
    this.loadingVisible = false;
  }
  async onClickDenegarSolicitudVacaciones() {
    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    if(d.length === 0){
      await this.showAlert('', 'Debe seleccionar al menos un registro', 'warning');
      return;
    }

    if (
      await await this.showAlertConfirm(
        '',
        `¿Estás seguro de que desea denegar el registro?`,
        ''
      )
    ) {
      //await this.Denegar();
      await this.SetVacacionesDenegar();
      this.SSNuevo();
    }
  }

  async Aprobar() {
  
    const resp = await this.SetVacacionesGrabar();
    this.loadingVisible = true;
    if (resp === true && this.vlopcion===2) {
      await this.ImprimirReporteMasivo();
    }
    this.SSNuevo();

    this.loadingVisible = false;
  }
  
  async SetVacacionesGrabar() {
    let SolicitudVac = [];
    let ListaVacaiones = [];
    var listDet;
    var listVac;

    if (this.vlopcion===2){
      ListaVacaiones = this.llenarPeriodoMasivo();
    }

    SolicitudVac = this.llenarPeriodoDetalle();
   
    listDet = JSON.stringify(SolicitudVac);
    listVac = JSON.stringify(ListaVacaiones);

    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetVacacionesGrabar(
          listDet,
          this.txtEmpleadoCodigo,
          this.usuarioEmpresa,
          this.idEmpresa,
          listVac,
          this.vlopcion,
          (this.vlopcion===1?'AJ':'AP')
        )
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            await this.showAlert('', 'Registro grabado con éxito', 'success');
            if (this.vlopcion===2){
              this.listadetaMasivo = JSON.parse(JSON.stringify(resp.Dt.Table));
            }
            return resolve(true);
          } else {
            await this.showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });

    return valor;
  }

  async SetVacacionesDis() {
    let ListaVacaiones = [];
    var listDet;

    if (this.vlestado==='AJ'){
      ListaVacaiones = this.llenarPeriodoMasivo();
    }
   
    listDet = JSON.stringify(ListaVacaiones);
    
    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetVacacionesDist(
          listDet,
          this.txtEmpleadoCodigo,
          this.usuarioEmpresa,
          this.idEmpresa
        )
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            await this.showAlert('', 'Registro grabado con éxito', 'success');
            this.listadetaMasivo = JSON.parse(JSON.stringify(resp.Dt.Table));
            return resolve(true);
          } else {
            await this.showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });

    return valor;
  }
  
  llenarPeriodoDetalle() {
    let periodosDetalles = [];


    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    for (let i = 0; i < d.length; i++) {
      
        periodosDetalles.push({
          sol_id: d[i].sol_id
          
        });
      
    }

    return periodosDetalles;
  }
  
  async SetVacacionesDenegar() {
    let SolicitudVac = [];
    var listDet;


   
      SolicitudVac = this.llenarPeriodoDetalle();
   
    listDet = JSON.stringify(SolicitudVac);
    
    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetVacacionesGrabar(listDet,this.txtEmpleadoCodigo,this.usuarioEmpresa,
          await localStorage.getItem(varEmpresa),'',this.vlopcion,(this.vlopcion===1?'DJ':'DE')
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

  async onClickConsultarVacaciones() {

    this.loadingVisible = true;

    if(this.GridDataEmpleadoSolicitud !== undefined){
      this.GridDataEmpleadoSolicitud.instance.clearSelection();
    }

    await this.GetVacacionesPeriodo(this.idEmpresa, this.usuarioEmpresa, 'CO',this.vlopcion);
    this.loadingVisible = false;
  
  }
 /*  async ConsultaVacaciones() {
    const valorMenu = await new Promise(async (resolve) => {
      await this._service
        .getSolicitudVacaciones(await localStorage.getItem(varEmpresa),'MGUEVARA','CO')
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
  } */

  onChangeCridTipoNomina(value: any, data: any, valuen: any) {
    const index = this.DataEmpleadoSolicitud.findIndex(
      (x) => x.sol_id == data.data.sol_id
    );
    if (index != -1) {
      if (value) {
        this.DataEmpleadoSolicitud[index].Marcado = 'S';
      }
      else {
        this.isAllSolSelected = false;
      } 
    } 
  }
  onSelectionChangedDetalle(e) {
    if (e.currentDeselectedRowKeys.length > 0) {
      for (let index = 0; index < e.currentDeselectedRowKeys.length; index++) {
        if (
          this.DataEmpleadoSolicitud.find(
            (d) => d.sol_id === e.currentDeselectedRowKeys[index]
          )
        ) {
          this.DataEmpleadoSolicitud.find(
            (d) => d.sol_id === e.currentDeselectedRowKeys[index]
          )['Marcado'] = '';
        }
      }
    }
    if (e.currentSelectedRowKeys.length > 0) {
      for (let index = 0; index < e.currentSelectedRowKeys.length; index++) {
        if (
          this.DataEmpleadoSolicitud.find(
            (d) => d.sol_id === e.currentSelectedRowKeys[index]
          )
        ) {
          this.DataEmpleadoSolicitud.find(
            (d) => d.sol_id === e.currentSelectedRowKeys[index]
          )['Marcado'] = 'S';
        }
      }
    }
  }

  async validarDatosExcel() {
    let periodosDetalles = [];

    var d = this.GridDataEmpleadoSolicitud.instance.getSelectedRowsData();

    for (let i = 0; i < d.length; i++) {
      
        periodosDetalles.push({
          codigo: d[i].trb_codigo,
          dias: d[i].dias_solicitado,
          desde: moment(d[i].fechadesde).format('yyyy/MM/DD'),
          
        });
    }


    this.loadingVisible = true;
    const valor = await new Promise((resolve) => {
      this._service
        .getVacacionesTrabajador(
          this.idEmpresa,
          this.txtEmpleadoCodigo,
          'V',
          '',
          '',
          JSON.stringify(periodosDetalles)
        )
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {
              let dt: any[] = res.Dt.Table;

              this.listaDataPeriodoInfo = JSON.parse(
                JSON.stringify(res.Dt.Table2)
              );
            }
            resolve(true);
          } else {
            await this.showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

    return valor;
    this.loadingVisible = false;
  }

  onSelectAllDiurnoChanged(event: Event): void {
    this.isAllSolSelected = (event.target as HTMLInputElement).checked;

    this.DataEmpleadoSolicitud.forEach((empleado) => {
     // if (this.isAllSolSelected) {
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
      //}
    });
  }
  onDiurnoSelectionChanged(data: any): void {
    this.isAllSolSelected = this.DataEmpleadoSolicitud.every(
      (empleado) => empleado.Marcado === ''
    );
  }
}
