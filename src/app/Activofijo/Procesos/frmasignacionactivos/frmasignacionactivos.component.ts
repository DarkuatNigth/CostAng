import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as moment from 'moment';
import Swal from 'sweetalert2/src/sweetalert2.js';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {  BehaviorSubject, timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { FrmasignacionactivosService } from './frmasignacionactivos.service';
import { BarcodeFormat } from '@zxing/library';
import { varUser } from 'src/app/config/url.servicios';

declare var window;
declare var $: any;

@Component({
  selector: 'app-frmasignacionactivos',
  templateUrl: './frmasignacionactivos.component.html',
  styleUrl: './frmasignacionactivos.component.scss'
})
export class FrmasignacionactivosComponent implements OnInit {
  showLoading: boolean = false;
  modalReference;
  availableDevices: MediaDeviceInfo[];
  currentDevice: MediaDeviceInfo = null;
  formatsEnabled: BarcodeFormat[] = [
    /* BarcodeFormat.CODE_128,
    BarcodeFormat.DATA_MATRIX,
    BarcodeFormat.EAN_13, */
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_93
  ];

  hasDevices: boolean;
  hasPermission: boolean;
  qrResultString: string;
  torchEnabled = false;
  torchAvailable$ = new BehaviorSubject<boolean>(false);
  tryHarder = false;
  DataTipoAsig:[][] = [];
  txtEmpleado:string="";
  txtCodEmpleado:string="";
  txtCodActivo:string="";
  txtDescriActivo:string="";
  cmbtipoAsignacion:string="";
  txtObserv:string="";
  withInformacionVisible:boolean = false;

  txtInfoCodActivo:string="";
  txtInfoDescri:string="";
  txtInfoMarca:string="";
  txtInfoModelo:string="";
  txtInfoSerie:string="";
  txtInfoGrupo:string="";
  txtInfoSubGrupo:string="";
  txtInfoAreaEquipo:string="";
  txtInfoNomAsig: string = "";
  tipoCamara: string = "";

  setPositionModal:string = "";
  openModalDiv:string = "";
  setPositionScroll = "";
  ModalDivDetalleItem:boolean = true;

  constructor(public _service: FrmasignacionactivosService,private router: Router
    ,private modalService: NgbModal) { }

  async showAlert(title, mensaje, tipo) {
    this.showLoading = false;

    return new Promise(async (resolve) => {
      //debugger;
      await Swal.fire({
        title: title,
        html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
        icon: tipo,
        showCancelButton: false,
        confirmButtonColor: (tipo === 'error' ? '#d33' : tipo === 'warning' ? '#ff9800' :
          tipo === 'success' ? '#4CAF50' : tipo === 'info' ? '#2196F3' : ''),
        confirmButtonText: 'Aceptar'
      }).then((result) => {
          return resolve(true);
      });
    });
  }

  async showAlertConfirm(title, mensaje, tipo) {
    this.showLoading = false;

    return new Promise(async (resolve) => {
      const confirm = await
        Swal.fire({
          title: title,
          //text: mensaje,
          html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje.replaceAll('\n','<br>').replaceAll('\\n','<br>') + "</div>",
          icon: tipo,
          showCancelButton: true,
          confirmButtonColor: '#2196F3',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            return resolve(true);
          } else {
            return resolve(false);
          }
        });
    });
  }

  async ngOnInit() {

    //valido que el usuario tenga permiso a la opcion
    var mn = localStorage.getItem('MenuProdDT');
    var pathName = "/" + window.location.pathname.split('/')[window.location.pathname.split('/').length - 1];

    if(mn !== undefined && mn !== null){
      if(JSON.parse(mn).filter(c => c.path == pathName).length === 0)
      {
          this.router.navigateByUrl('/login');
          return;
      }
    }else{
      this.router.navigateByUrl('/login');
      return;
    }

    window.home = this;

    this.showLoading = true;
    await timer(50).pipe(take(1)).toPromise();
    this.showLoading = false;
  }

  ngAfterViewChecked() {
    
    if(this.setPositionScroll !== ""){
      this.setPositionScroll = "";

    }
    if(this.setPositionModal !== ""){
      //debugger;
      document.getElementById(this.openModalDiv).style.top = (100 - document.getElementById(this.openModalDiv).getBoundingClientRect().top).toString() + "px";
      this.setPositionModal = "";
    }
  }

  onClickNuevo(){
    this.txtCodActivo = "";
    this.txtDescriActivo = "";
    this.txtCodEmpleado = "";
    this.txtEmpleado = "";
    this.txtInfoAreaEquipo = "";
    this.txtInfoCodActivo = "";
    this.txtInfoDescri = "";
    this.txtInfoGrupo = "";
    this.txtInfoMarca = "";
    this.txtInfoModelo = "";
    this.txtInfoSerie = "";
    this.txtInfoSubGrupo = "";
    this.txtObserv = "";
    this.cmbtipoAsignacion = "";
  }

  async onClickGrabar(){
    this.showLoading = true;
    
    if(this.txtDescriActivo.toString().trim() === ""){
      await this.showAlert('', 'Debe ingresar un código de activo válido.', 'warning');
      return;
    }

    if(this.txtEmpleado.toString().trim() === ""){
      await this.showAlert('', 'Debe ingresar un código de empleado válido.', 'warning');
      return;
    }

    const valor = await new Promise(async (resolve) => {
      await this._service.setGrabar(this.txtCodActivo, this.txtCodEmpleado,this.cmbtipoAsignacion,
                        this.txtObserv,"",await localStorage.getItem(varUser)).subscribe(async (resp) => {
        if (resp.Codigo) {
          this.onClickNuevo();
          await this.showAlert('', 'Registro actualizado con éxito', 'success');
          
          if(this.modalReference !== null && this.modalReference !== undefined){
            this.modalReference.close();
          }

          return resolve(true);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });
    
    this.showLoading = false;
  }

  async onClickCargarEmpleado(){
    this.showLoading = true;

    if(this.txtCodEmpleado.toString().trim() === ""){
      await this.showAlert('', 'Debe ingresar un código de empleado válido.', 'warning');
      return;
    }

    const valor = await new Promise(async (resolve) => {
      await this._service.getDataEmpleado(this.txtCodEmpleado).subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            let dt:[][] = resp.Dt.Table;
            //debugger;
            if (dt.length > 0) {
              this.txtCodEmpleado = dt[0]["Codigo"]
              this.txtEmpleado = dt[0]["Nombre"]
            }else{
              await this.showAlert('Advertencia', 'No existe código de empleado', 'warning');
              return resolve(false);
            }
          }

          return resolve(true);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });
    this.showLoading = false;
  }

  async onClickCargarItem(){
    this.showLoading = true;

    if(this.txtCodActivo.toString().trim() === ""){
      await this.showAlert('', 'Debe ingresar un código de activo válido.', 'warning');
      return;
    }

    const valor = await new Promise(async (resolve) => {
      await this._service.getDataActivo(this.txtCodActivo).subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            let dt:[][] = resp.Dt.Table;
            //debugger;
            if (dt.length > 0) {
              this.txtDescriActivo = dt[0]["Descripcion"]
              this.txtInfoCodActivo = dt[0]["Codigo"]
              this.txtInfoDescri = dt[0]["Descripcion"]
              this.txtInfoMarca = dt[0]["Marca"]
              this.txtInfoModelo = dt[0]["Modelo"]
              this.txtInfoGrupo = dt[0]["Grupo"]
              this.txtInfoSubGrupo = dt[0]["SubGrupo"]
              this.txtInfoSerie = dt[0]["Serie"]
              this.txtInfoAreaEquipo = dt[0]["Area Equipo"]
              this.txtInfoNomAsig = dt[0]["NomAsig"]

            }else{
              await this.showAlert('Advertencia', 'No existe código de activo', 'warning');
              return resolve(false);
            }
          }

          return resolve(true);
        } else {
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
      });
    });
    this.showLoading = false;
  }

  async onKeyPressCodActivo(e){
    if(e.keyCode === 13){
      if(this.txtCodActivo !== ""){ 
      /* if(e.target.value !== ""){ */
        
        await this.onClickCargarItem();
        
        return true;
      } 
    }
  }

  async onKeyPressCodEmpleado(e){
    if(e.keyCode === 13){
      if(this.txtCodEmpleado !== ""){ 
      /* if(e.target.value !== ""){ */
        
        await this.onClickCargarEmpleado();
        
        return true;
      } 
    }
  }

  OnChangecmbtipoAsignacion(e){

  }

  toggleInformacion(){
    this.withInformacionVisible = !this.withInformacionVisible;
  }

  onClickOpenCamaraEmpl(content){
    this.tipoCamara = "Empleado";
    this.modalReference = this.modalService.open(content,
      {ariaLabelledBy: 'modal-basic-title', windowClass:'cssModalCliente'});
  }

  onClickOpenCamara(content){
    this.tipoCamara = "Activo";
    this.modalReference = this.modalService.open(content,
      {ariaLabelledBy: 'modal-basic-title', windowClass:'cssModalCliente'});
  }

  clearResult(): void {
    this.qrResultString = null;
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
  }

  async onCodeResult(resultString: string, contentCamara) {
    this.qrResultString = resultString;

    if(this.tipoCamara === "Activo"){
      this.txtCodActivo = this.qrResultString;
      await this.onClickCargarItem();
    }

    if(this.tipoCamara === "Empleado"){
      this.txtCodEmpleado = this.qrResultString;
      await this.onClickCargarEmpleado();
    }

    if(this.modalReference !== null && this.modalReference !== undefined){
      this.modalReference.close();
    }
  }

  onDeviceSelectChange(selected: string) {
    const device = this.availableDevices.find(x => x.deviceId === selected);
    this.currentDevice = device || null;
  }

  onHasPermission(has: boolean) {
    this.hasPermission = has;
  }

  onTorchCompatible(isCompatible: boolean): void {
    this.torchAvailable$.next(isCompatible || false);
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  toggleTryHarder(): void {
    this.tryHarder = !this.tryHarder;
  }

  toggleClick(): void {
    this.ModalDivDetalleItem = false;
    this.openModalDiv = "ModalDivDetalleItem";
    let modalContent: any = $('.modal-content');
    modalContent.draggable({
      handle: '.modal-header'
    });
    this.setPositionModal="S";
  }

  closeModal(){
    if(this.openModalDiv !== ""){
      document.getElementById(this.openModalDiv).style.top = "0px";
      document.getElementById(this.openModalDiv).style.left = "0px";
      
      eval("this." + this.openModalDiv + " = true");
    }
    this.openModalDiv = "";
  }
}
