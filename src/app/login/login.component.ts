import { Component, OnInit } from '@angular/core';
import { NavigationExtras,Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from './../login/login.service';
import { RouteInfo } from '../shared/vertical-sidebar/vertical-sidebar.metadata';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { BaseConexion  } from './../config/url.servicios';
import { SidebarService } from './../shared/vertical-sidebar/vertical-sidebar.service';
import { MatDialog } from '@angular/material/dialog';

declare var window;

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  msg = "";
  loadingVisible = false;
  menuR: RouteInfo[] = [];

  urlLogo1:SafeUrl = "";
  urlLogo2:SafeUrl = "";

  constructor(public router: Router,private menuServise: SidebarService,
    public _login: LoginService, public domSanitizer: DomSanitizer,
    private readonly _dialog: MatDialog) { }

  async ngOnInit() {

    window.home = this;

    localStorage.removeItem('UserProd');
    localStorage.removeItem('UserProd2');
    localStorage.removeItem('menuProd');
    localStorage.removeItem('ExpireProd');
    localStorage.removeItem('MenuProdDT');
    
    this.urlLogo1 = "assets/images/logo-header.png";
    this.urlLogo2 = "assets/images/logo-icon.png";

    let dbase = BaseConexion;
  }

  /* async getLogo(){
    
    const valorMenu = await new Promise(async (resolve) => {
      await this._login.getLogo().subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            let dt: [][] = resp.Dt.Table;

            if(dt.length > 0){
              //debugger;
              if(dt[0]["emp_logo"] !== null){
                              
                this.urlLogo2 = this.domSanitizer.bypassSecurityTrustUrl('data:image/jpg;base64, ' + dt[0]["emp_logo"]);
              }
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

  check(uname: string, p: string) {
    this.doLogin(uname, p);
  }

  async showAlert(title, mensaje, tipo) {
    this.loadingVisible = false;

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
    this.loadingVisible = false;

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

  async doLogin(usuario, pass) {
    let navigationExtras: NavigationExtras = {
      state: {
        user: usuario
      }
    }
    
    
    this.loadingVisible = true;
    let valOpt: string = "";
    const valor = await new Promise(async (resolve) => {
      await this._login.getIngreso(usuario.toString().toUpperCase(), pass, "ANGPROD").subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            let dt: [][] = resp.Dt.Table;
            if (dt.length > 0) {
              valOpt = dt[0]["error"].toString();

              if (valOpt === '1') {
                
                await this.showAlertConfirm('', dt[0]["mensaje"].toString(), 'warning');
                return resolve(false);

              } else {

                if (valOpt === '3') {
                  await localStorage.setItem("UserProd2", dt[0]["usuario"].toString().toUpperCase());
                  await this.showAlert('', dt[0]["mensaje"].toString(), 'warning');
                  
                }else{
                
                  localStorage.setItem("UserProd", dt[0]["usuario"].toString().toUpperCase());
                }

                var timeout = Number(dt[0]["timeout"]=== undefined || dt[0]["timeout"]=== null ? 0 :dt[0]["timeout"]);
                var now = Date.now();
                var schedule = now + 60*1000*timeout; //60 seg por 1000 mileseg por 120 minutos = 2 horas 
                
                localStorage.setItem('ExpireProd', schedule.toString());

                const valorMenu = await new Promise(async (resolve) => {
                  await this._login.cargaMenu(usuario).subscribe(async (resp) => {
                    if (resp.Codigo) {
                      if (Object.keys(resp.Dt).length > 0) {
                        let dt: [][] = resp.Dt.Table;
                        localStorage.setItem("MenuProdDT", JSON.stringify(dt));
                        this.menuR = await this.menuServise.armarmenu(dt);
                      }
                      return resolve(true);
                    } else {
                      await this.showAlert('', resp.Description, 'error');
                      return resolve(false);
                    }
                  });
                });
                if (valorMenu) {
                  return resolve(true);
                } else {
                  return resolve(false);
                }
              }
            }
          }
        } else {
          await this.showAlert('', resp.Description, 'error');
        }
        return resolve(false);

      });
    });

    if (valor) {
      
      this.loadingVisible = false;
      
      if(valOpt === "3"){
        this.router.navigateByUrl('/CoordenadasLogin',navigationExtras);
      }else{
        this.router.navigateByUrl('/');
      }
    }


    this.loadingVisible = false;
  }

  
}
