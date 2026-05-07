import { Component, OnInit, Renderer2, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FrmconsgenperService } from './frmconsgenper.service';
import * as moment from 'moment';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { varEmpresa, varMenuDT, varUser } from 'src/app/config/url.servicios';
import { showAlert, showAlertConfirm } from 'src/app/utilities/sweetAlert.util';

declare var window;
declare var $: any;

// Tipo de los datos


@Component({
  selector: 'app-frmconsgenper',
  templateUrl: './frmconsgenper.component.html',
  styleUrl: './frmconsgenper.component.scss',
})
export class FrmconsgenperComponent implements OnInit {
  @ViewChild('GridPrincipalEmpleado', { static: false })
  GridPrincipalEmpleado: DxDataGridComponent;
  @ViewChild('GridPrincipalEmpleHora', { static: false })
  GridPrincipalEmpleHora: DxDataGridComponent;
  @ViewChild('GridPrincipalfechaturno', { static: false })
  GridPrincipalfechaturno: DxDataGridComponent;
  @ViewChild('GridPrincipalfechahorario', { static: false })
  GridPrincipalfechahorario: DxDataGridComponent;

  @ViewChild('contextMenu') contextMenu;

  @ViewChild('autocomplete') autocomplete;

  modalReferenceItem;
  idEmpresa?: number;
  txtCodigo: string = '';
  loadingVisible: boolean = true;
  botonguardar: boolean = true;
  cmb_estado: string = '';
  cmb_usuario: string = '';
  cmb_genpermiso: string = '';
  txtnombre: string = '';
  lblnombre: string = '';

  DataTipoGrupo = [];
  DataEstado = [];
  DataUsuario = [];
  DataGeneralPermiso = [];
  DataPermisoUsuario = [];
  listaConsultaGeneralPermiso = [];
  listaConsultaGeneralUsuario = [];
  columnasTitulo = [];
  

  
  
  allMode: string = 'allPages';
  checkBoxesMode: string = 'always';

  
  keyword: string = 'DESCRIPCION';
  es: any;

  deshabilitaGrabar: boolean = false;
  deshabilitaEliminar: boolean = false;
  constructor(
    private router: Router,
    public _service: FrmconsgenperService,
    private renderer: Renderer2,
    private modalService: NgbModal
  ) {}



  closeModal() {
   
  }

  async ngOnInit() {
    window.home = this;
    await this.SSNuevo();
    this.idEmpresa = Number(localStorage.getItem(varEmpresa)) || 1;
    if ((await localStorage.getItem(varUser)) === null) {
      await showAlert(
        '',
        'Se terminó el tiempo de su session volver a ingresar al sistema',
        'warning'
      );
      return;
    }

    //valido que el usuario tenga permiso a la opcion
    // var mn = localStorage.getItem(varMenuDT);
    // var pathName =
    //   '/' +
    //   window.location.pathname.split('/')[
    //     window.location.pathname.split('/').length - 1
    //   ];

    // if (mn !== undefined && mn !== null) {
    //   if (JSON.parse(mn).filter((c) => c.path == pathName).length === 0) {
    //     this.router.navigateByUrl('/login');
    //     return;
    //   } else {
    //     const opcion = JSON.parse(mn).filter((c) => c.path == pathName)[0];
    //     if (opcion) {
    //       this.deshabilitaGrabar = opcion.grabar === 0;
    //       this.deshabilitaEliminar = opcion.eliminar === 0;
    //     }
    //   }
    // } else {
    //   this.router.navigateByUrl('/login');
    //   return;
    // }

    this.loadingVisible = true;
    await this.GetCargaCombo('CO',this.idEmpresa);
    this.loadingVisible = false;
   
  }
  async GetCargaCombo(accion, empresa, codigo = 0) {
    this.loadingVisible = true;

    await new Promise(async (resolve) => {
      await this._service
        .getConsultasGeneralesPermisos(accion,empresa,codigo,'')
        .subscribe(async (res) => {
            //console.log('GetCargaCombo',res);
          if (res.Codigo) {
            //debugger;
            if (Object.keys(res.Dt).length > 0) {
              
              this.DataEstado = JSON.parse(JSON.stringify(res.Dt.Table));
              this.DataGeneralPermiso = JSON.parse(JSON.stringify(res.Dt.Table1));
              this.DataUsuario = JSON.parse(JSON.stringify(res.Dt.Table2));
    
            }
            resolve(true);
          } else {
            await showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });

    this.loadingVisible = false;
  }
  async SSNuevo() {
    this.loadingVisible = true;
    this.txtCodigo = '';
    this.txtnombre = '';
    this.cmb_estado = 'AC';
    this.cmb_usuario = '';
    this.cmb_genpermiso = '';
    this.DataPermisoUsuario=[];
    this.loadingVisible = false;
  }

  convertirAXML(data: any[]): string {
    let xml = '<root>';
    data.forEach(item => {
        xml += `<item>
            <id>${item.id}</id>
            <cxu_usuario>${item.cxu_usuario}</cxu_usuario>
            <cxu_cgeId>${item.cxu_cgeId}</cxu_cgeId>
            <cxu_estado>${item.cxu_estado}</cxu_estado>
        </item>`;
    });
    xml += '</root>';
    return xml;
  }

  async onClickConsultar(content: any) {
    this.loadingVisible = true;

    
    await this.ConsultarDatos();
    this.loadingVisible = false;
    this.modalService
      .open(content, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalConfGeneralConsultaPermisos',
      })
      .result.then(
        (result) => {},
        (reason) => {}
      );
  }

  async ConsultarDatos() {
   
    this.loadingVisible = true;
    await this.ConsultaGeneralPermiso('GE',this.idEmpresa,'',);
    this.loadingVisible = false;

  }
  async ConsultarDatosUsuario() {
   
    //console.log('entra-ConsultarDatosUsuario');
    this.loadingVisible = true;
    await this.ConsultaGeneralUsuario('US',this.idEmpresa,'',);
    //console.log('sale-ConsultarDatosUsuario');
    this.loadingVisible = false;

  }

  async ConsultaGeneralPermiso(accion,empresa,codigo){
    const valorMenu = await new Promise(async (resolve) => {
      await this._service
        .getConsultasGeneralesPermisos(accion,empresa,codigo,'')
        .subscribe(async (resp) => {
          //console.log('ConsultaGeneralPermiso', resp);
          if (resp.Codigo) {
            if (Object.keys(resp.Dt).length > 0) {
              this.listaConsultaGeneralPermiso = resp.Dt.Table;
              if (this.listaConsultaGeneralPermiso.length) {
                let Columns = [];
                for (
                  let x = 0;
                  x < Object.entries(this.listaConsultaGeneralPermiso[0]).length;
                  x += 1
                ) {
                  Columns.push(
                    Object.entries(this.listaConsultaGeneralPermiso[0])[
                      x
                    ][0].toString()
                  );
                }
                this.columnasTitulo = JSON.parse(JSON.stringify(Columns));
                //this.btnaddperiodo = false;
              }
            }
            return resolve(true);
          } else {
            await showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });
  }

  async ConsultaGeneralUsuario(accion,empresa,codigo){
    const valorMenu = await new Promise(async (resolve) => {
      await this._service
        .getConsultasGeneralesPermisos(accion,empresa,codigo,'')
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            if (Object.keys(resp.Dt).length > 0) {
              this.listaConsultaGeneralUsuario = resp.Dt.Table;
              if (this.listaConsultaGeneralUsuario.length) {
                let Columns = [];
                for (
                  let x = 0;
                  x < Object.entries(this.listaConsultaGeneralUsuario[0]).length;
                  x += 1
                ) {
                  Columns.push(
                    Object.entries(this.listaConsultaGeneralUsuario[0])[
                      x
                    ][0].toString()
                  );
                }
                this.columnasTitulo = JSON.parse(JSON.stringify(Columns));
                //this.btnaddperiodo = false;
              }
            }
            return resolve(true);
          } else {
            await showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });
  }

  onFocusValor(event: Event) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  formatearFecha(fecha: Date, dia2: string): string {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${anio}/${mes}/${dia2}`;
  }



  async onClickNuevo() {
    this.loadingVisible = true;

    await this.SSNuevo();

    this.botonguardar = true;
 
  }

  async onClickGuardarPermisos() {
  
     if(this.txtCodigo === ''){
      await showAlert('','Por favor consulte el usuario','warning');
      return;
    } 

    if(!await await showAlertConfirm('',`¿Estás seguro de que desea guardar el registro?`,'info')) 
    {
      return;
    }
    await this.Guardar();
  }
  async Guardar() {
   
    const resp = await this.SetPermisosGrabar();
    this.loadingVisible = true;
    if (resp === true) {
      this.SSNuevo();
    }

    this.loadingVisible = false;
  }
  async SetPermisosGrabar() {
    let generalpermiso = [];
    var listDet;

    generalpermiso = this.llenarPermiso();
 
    listDet = JSON.stringify(generalpermiso);

    const valor = await new Promise(async (resolve) => {
      await this._service
        .SetPermisosGrabar(
          //this.convertirAXML(listDet),
          listDet,
          await localStorage.getItem(varUser),
          this.idEmpresa
        )
        .subscribe(async (resp) => {
          if (resp.Codigo) {
            await showAlert('', 'Registro grabado con éxito', 'success');

            return resolve(true);
          } else {
            await showAlert('', resp.Description, 'error');
            return resolve(false);
          }
        });
    });

    return valor;
  }
  llenarPermiso() {
    let solicitud = [];
    var lvestado='';
    var d = [];
    d=this.DataPermisoUsuario.filter((s) => s['indicador'] === 1);
    for (let i = 0; i < d.length; i++) {
      if(d[i].estado=='S'){
        lvestado='AC';
      }
      else{
        lvestado='IN';
      }
      solicitud.push({
        id: d[i].codigoper,
        cxu_usuario: this.txtCodigo,
        cxu_cgeId: d[i].codconsulta,
        cxu_estado: lvestado,
      });
    }
    
    return solicitud;
  }
  async onRowConsGeneralDoubleClick(e: any, modal: any) {
    
    this.txtCodigo = e.data.USUARIO;
    
    this.cmb_estado=e.data.ESTADO;
    this.cmb_usuario=e.data.USUARIO;
    this.cmb_genpermiso=e.data.CONSULTA;
    
    this.loadingVisible = true;
    if (modal !== undefined) {
      modal.close();
    }
    this.loadingVisible = false;

    const rubro = this.DataUsuario.find(
      (x) => x.identifica == this.txtCodigo.toUpperCase()
    );
   
    this.txtnombre= rubro.nombre;
    await this.obtenerConsultUsuario(e.data.USUARIO);
  }
  async onUsuarioChange(idusuario: string) {
   
    this.DataPermisoUsuario = [];

    await this.obtenerConsultUsuario(idusuario);
  }

  async obtenerConsultUsuario(idusuario: string) {
    await new Promise(async (resolve) => {
      await this._service
        .getConsultasGeneralesPermisos('ES',this.idEmpresa,'',idusuario)
        .subscribe(async (res) => {
          if (res.Codigo) {
            if (Object.keys(res.Dt).length > 0) {
              let dt: [][] = res.Dt.Table;
              this.DataPermisoUsuario = dt;
              resolve(true);
            }
          } else {
            await showAlert('', res.Description, 'error');
            resolve(false);
          }
        });
    });
  }

  onChangeCridEditar(value: any, data: any, valuen: any) {
    const index = this.DataPermisoUsuario.findIndex(
      (x) => x.codconsulta == data.data.codconsulta && x.codigoper == data.data.codigoper
    );
    if (index != -1) {
      if (value) {
        this.DataPermisoUsuario[index].asignado = 'S';
        this.DataPermisoUsuario[index].indicador = 1;
      }
      else{
        this.DataPermisoUsuario[index].asignado = '';
        this.DataPermisoUsuario[index].indicador = 1;
      }
      
    }
  }
  onChangeCridEditarEstado(value: any, data: any, valuen: any) {
    const index = this.DataPermisoUsuario.findIndex(
      (x) => x.codconsulta == data.data.codconsulta && x.codigoper == data.data.codigoper
    );
    if (index != -1) {
      if (value) {
        this.DataPermisoUsuario[index].estado = 'S';
        this.DataPermisoUsuario[index].indicador = 1;
      }
      else{
        this.DataPermisoUsuario[index].estado = '';
        this.DataPermisoUsuario[index].indicador = 1;
      }
      
    }
  }

  async onKeyPressUsuario(event: KeyboardEvent) {
    

    const charCode = event.which ? event.which : event.keyCode;

    switch (charCode) {
      case 9: // Tab
        
      case 13: // Enter

      if (
        !this.txtCodigo ||
        this.txtCodigo == null
      ) {
        this.txtCodigo = undefined;

        break;
      }
      
        setTimeout(async () => {

          const rubro = this.DataUsuario.find(
            (x) => x.identifica == this.txtCodigo.toUpperCase()
          );
          if (!rubro) {
            await showAlert('', 'Código de Usuario no existe', 'warning');
            this.DataPermisoUsuario = [];
            this.txtnombre = undefined;
            return;
          }

          if (!this.txtCodigo || this.txtnombre == null) {
            this.txtnombre = undefined;
          }

          try {
            this.txtnombre= rubro.nombre;
            const valor = await new Promise(async (resolve) => {
              this.obtenerConsultUsuario(
                this.txtCodigo
              );
            });
          } catch (error) {}
        });
        break;
      case 8:
        this.txtnombre = undefined;
        this.DataPermisoUsuario = [];
        break;
      case 46:
        this.txtnombre = undefined;
        this.DataPermisoUsuario = [];
        break;
      default:
        if (
          (charCode < 65 || charCode > 90) &&
          (charCode <= 97 || charCode >= 122)
        ) {
          // Números (0-9)
          
          event.preventDefault();
        }
        this.txtnombre = undefined;
        this.DataPermisoUsuario = [];
        break;
    }
  }
  async onClickUsuario(modalTrabajadores: any) {
    //this.cmbEstadostrabajadorConsulta = 1;
    //console.log('entra-onClickUsuario');
    await this.ConsultarDatosUsuario();
    //console.log('sale-onClickUsuario');
    this.modalService
      .open(modalTrabajadores, {
        ariaLabelledBy: 'modal-basic-title',
        windowClass: 'cssModalConfGeneralUsuarios',
      })
      .result.then(
        (result) => {},
        (reason) => {}
      );
  }

  async onRowUsuarioDoubleClick(e: any, modal: any) {
    
    this.txtCodigo = e.data.identifica;
    this.txtnombre = e.data.nombre;
    //console.log('onRowUsuarioDoubleClick',e.data);
    await this.obtenerConsultUsuario(e.data.identifica);
    this.modalService.dismissAll();
  }
}
