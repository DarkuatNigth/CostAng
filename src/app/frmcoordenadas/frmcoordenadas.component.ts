import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FrmcoordenadasService } from './frmcoordenadas.service';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { varUser, varUser2 } from '../config/url.servicios';

@Component({
  selector: 'app-frmcoordenadas',
  templateUrl: './frmcoordenadas.component.html',
  styleUrls: ['./frmcoordenadas.component.scss']
})
export class FrmcoordenadasComponent implements OnInit {
  
  loadingVisible = false;
  urlLogo1:string = "";
  lbl1:string = "";
  txt_lbl1:string = "";
  lbl2:string = "";
  txt_lbl2:string = "";
  lbl3:string = "";
  txt_lbl3:string = "";
  user:string = "";
  intentos:number = 0;

  constructor(public router: Router,
    public _service: FrmcoordenadasService) { 
        
      /* if(this.router.getCurrentNavigation().extras.state != undefined){
        if(this.router.getCurrentNavigation().extras.state.user !== undefined){
          this.user = this.router.getCurrentNavigation().extras.state.user;
        }
      }; */
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
  
  async ngOnInit() {
    if(await localStorage.getItem(varUser2) === ""){
      
      this.router.navigateByUrl('/login');
    }

    this.loadingVisible = true;

    this.lbl1 = "";
    this.lbl2 = "";
    this.lbl3 = "";
    this.intentos = 0;

    let y = "";
    for (let i = 0; i < 3; i++) {
      y = "";
      var letra = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
      var num = Math.floor(Math.random() * (3 - 1 + 1)) + 1;
      //debugger;
      if (letra === 1)
      {
          y = "A";
      }
      if (letra === 2)
      {
          y = "B";
      }
      if (letra === 3)
      {
          y = "C";
      }
      y = y + num.toString();
      if (i == 0)
      {
          this.lbl1 = y;
      }
      if (i == 1)
      {
          if (this.lbl1 !== y)
          {
            this.lbl2 = y;
          }
          else
          {
              i--;
          }
      }
      if (i == 2)
      {
          if (this.lbl1 != y && this.lbl2 != y)
          {
              this.lbl3 = y;
          }
          else
          {
              i--;
          }
      }
    }

    //await this.SendCoodernadas();
    this.loadingVisible = false;
  }

  async SendCoodernadas(){
    const valorMenu = await new Promise(async (resolve) => {
      await this._service.setCoord(await localStorage.getItem(varUser2)).subscribe(async (resp) => {
        if (resp.Codigo) {
          if (Object.keys(resp.Dt).length > 0) {
            let dt: [][] = resp.Dt.Table;

            if (dt.length > 0) {
              if(dt[0]["VALOR"].toString() === "SI"){
                await this.showAlert('', dt[0]["DESCRI"].toString(), 'success');
                return resolve(true);
              }else{
                await this.showAlert('', dt[0]["DESCRI"].toString(), 'warning');
                return resolve(false);
              }
            }
          }
        }else{
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
        return resolve(true);
      });
    });
  }

  async checkCoodernadas(){
    this.loadingVisible = true;

    if(this.txt_lbl1 === "" || this.txt_lbl2 === "" || this.txt_lbl3 === ""){
      await this.showAlert('', 'Debe ingresar todas las coordenadas solicitadas', 'warning');
      return;
    }
    
    const valorMenu = await new Promise(async (resolve) => {
      await this._service.setVerifCoord(await localStorage.getItem(varUser2), this.lbl1,this.txt_lbl1,this.lbl2,this.txt_lbl2,this.lbl3,this.txt_lbl3).subscribe(async (resp) => {
        if (resp.Codigo) {
       
          if (Object.keys(resp.Dt).length > 0) {
            let dt: [][] = resp.Dt.Table;

            if (dt.length > 0) {
              if(dt[0]["PERMISO"].toString() === "OK"){
                //await this.showAlert('', 'OK', 'success');
                return resolve(true);
              }else{
                this.intentos ++;
                if(this.intentos < 3){
                  await this.showAlert('', 'Coordenadas Incorrectas', 'warning');
                  
                  return resolve(false);
                }else{
                  await this.showAlert('', 'Excedió el número de intentos fallidos', 'warning');
                  return resolve(false);
                }
                
              }
            }
          }
        }else{
          await this.showAlert('', resp.Description, 'error');
          return resolve(false);
        }
        
      });
    });

    if(valorMenu){
      localStorage.setItem(varUser, await localStorage.getItem(varUser2));
      this.router.navigateByUrl('/');
    }else{
      this.txt_lbl1 = "";
      this.txt_lbl2 = "";
      this.txt_lbl3 = "";
      if(this.intentos >= 3){

        this.router.navigateByUrl('/login');
      }
    }
    
    this.loadingVisible = false;
  }

  /* Valida que digite solo numeros */
  isNumberKey(evt){
    //debugger;
    var charCode = (evt.which) ? evt.which : evt.keyCode
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57))
    {
      return false;
    }else{
      //debugger;
      if(isNaN(Number(evt.target.value + String.fromCharCode(charCode)))){
        return false;
      }
    }
    return true;
  }

}
