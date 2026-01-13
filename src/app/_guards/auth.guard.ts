import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, ActivatedRoute,NavigationEnd } from '@angular/router';
import { varEmpresa, varExpire, varMenu, varMenuDT, varToken, varUser, varUser2 } from '../config/url.servicios';
import {LoginService} from './../login/login.service'; 

@Injectable()
export class AuthGuard {

    constructor(
        private router: Router, 
        private activeRouter: ActivatedRoute,
        private _login: LoginService
    ) { }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        let params = (state.url.split('?').length > 1 ? state.url.split('?')[1] : "");
        let tokenuSr = "";
        let validaToken = true;
        let empresa = "";

        //se valida que el usuario tenga permiso a ese formulario excepto las externas que se controlan por token y las de login
        if (!state.url.includes("/login") &&
            !state.url.includes("/CoordenadasLogin") &&
            !state.url.includes("/tokenExpired") &&
            state.url !== "/"
            && !state.url.includes("/ext-")
        ) {
            var mn = localStorage.getItem(varMenuDT);
            var pathName = state.url;
            if (mn !== undefined && mn !== null) {
                if (JSON.parse(mn).filter((c) => c.path == pathName).length === 0) {
                    this.router.navigateByUrl('/login');
                    return false;
                }
            } else {
                this.router.navigateByUrl('/login');
                return false;
            }
        }

        /* if(state.url.includes("ext-AprobSolicitudVacaciones") ||
           state.url.includes("ext-SolicitudVacaciones")){
            return true;
        } */
 
        if(params !== ""){
            let contra = this._login.Decrypt(decodeURIComponent(params.toString()), 2);
            let Listparams = contra.split(';');
            let usr = "";
            
            if(Listparams.length > 0){
                let params = Listparams[0].split('&');
                for (let index = 0; index < params.length; index++) {
                    let colParam = params[index].toString().split("=");
                    if(colParam.length>0){

                        if(colParam[0].toString() == "user"){
                            usr = colParam[1].toString();
                        }

                        if(colParam[0].toString() == "empresa"){
                            empresa = colParam[1].toString();
                        }
                    }
                }
                if(state['root'].queryParams || state['root'].queryParams !== undefined){
                    tokenuSr =state['root'].queryParams.tk;
                }
            }

            if(tokenuSr === undefined){
                tokenuSr = "";
            }
            
            if (tokenuSr === ""){
                if(await localStorage.getItem(varToken) !== null && await localStorage.getItem(varToken) !== ""){
                    tokenuSr = await localStorage.getItem(varToken);
                    validaToken = false;
                }
            }

            if(tokenuSr === ""){
                usr = "";
            }else{
                if (!await this.validatorToken(usr,tokenuSr) && validaToken){
                    usr = "";
                    localStorage.removeItem(varUser);
                    localStorage.removeItem(varUser2);
                    localStorage.removeItem(varExpire);                    
                    localStorage.removeItem(varToken);
                    localStorage.removeItem(varEmpresa);
                    this.router.navigateByUrl('/tokenExpired');
                    return true;
                } else {
                    localStorage.setItem(varToken, tokenuSr);
                }
            }

            if(usr !== ""){
                localStorage.setItem(varUser, usr);
                var timeout = 120;
                var now = Date.now();
                var schedule = now + 60*1000*timeout; //60 seg por 1000 mileseg por 120 minutos = 2 horas 
                localStorage.setItem(varExpire, schedule.toString());
                localStorage.setItem(varEmpresa, empresa);
            }

        }
        
        //debugger;
        if (tokenuSr === ""){
            if(await localStorage.getItem(varToken) !== null && await localStorage.getItem(varToken) !== ""){
                tokenuSr = await localStorage.getItem(varToken);
            }
        }
        
        //debugger;
        if(tokenuSr === "" && state.url.includes("/ext-") ){
            localStorage.removeItem(varUser);
            localStorage.removeItem(varUser2);
            localStorage.removeItem(varExpire);
            localStorage.removeItem(varToken);
            localStorage.removeItem(varEmpresa);
            this.router.navigateByUrl('/tokenExpired');
            return true;
        } 

        if(state.url.includes("/tokenExpired")){
            return true;
        }

        const Token = await localStorage.getItem(varUser) || '';
        
        if (Token != '') {
            if (state.url.includes("/login") ||
                state.url.includes("/CoordenadasLogin") ||
                state.url.includes("/tokenExpired")
            ) {
                return true;
            }

            var now = Date.now(); 
            var expiresIn = Number(await localStorage.getItem(varExpire));
            if (expiresIn===undefined || expiresIn===null) 
            { 
                expiresIn = 0; 
            }

            if (expiresIn < now) {// Expired
                localStorage.removeItem(varExpire);
                localStorage.removeItem(varUser);
                localStorage.removeItem(varMenu);
                localStorage.removeItem(varMenuDT);
                localStorage.removeItem(varEmpresa);
                //this.router.navigateByUrl('/login');
                
                return false;
            }
            return true;
        }else
        {
            if (state.url.includes("/login") ||
                state.url.includes("/CoordenadasLogin") ||
                state.url.includes("/tokenExpired")
            ) {
                return true;
            }


        }

        this.router.navigateByUrl('/login');
        return true;
    }

    async validatorToken(usr, tokenUsr) {

        const valorToken = await new Promise(async (resolve) => {
          await this._login.getValidaToken(usr, tokenUsr).subscribe(async (resp) => {
            if (resp.Codigo) {

              if (Object.keys(resp.Dt).length > 0) {

                let dt:[][] = resp.Dt.Table;
                if(dt.length > 0){
                  if(dt[0]["Estado"] === 1){
                    return resolve(true);
                  }
                }
              }
              return resolve(false);
            } else {

              return resolve(false);
            }
          });
        });
        return valorToken;
      }

    
}
