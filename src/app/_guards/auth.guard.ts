import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, ActivatedRoute,NavigationEnd } from '@angular/router';


@Injectable()
export class AuthGuard {

    constructor(private router: Router, private activeRouter: ActivatedRoute) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

        const Token = localStorage.getItem('UserProd') || '';
        
        if (Token != '') {

            if (state.url.includes("/login")||
                state.url.includes("/CoordenadasLogin")) {
                return true;
            }

            var now = Date.now(); 
            var expiresIn = Number(localStorage.getItem('ExpireProd'));
            if (expiresIn===undefined || expiresIn===null) 
            { 
                expiresIn = 0; 
            }

            if (expiresIn < now) {// Expired
                localStorage.removeItem('ExpireProd');
                localStorage.removeItem('UserProd');
                localStorage.removeItem('menuProd');
                localStorage.removeItem('MenuProdDT');

                //this.router.navigateByUrl('/login');
                
                return false;
            }
            return true;
        }else
        {
            if (state.url.includes("/login") ||
                state.url.includes("/CoordenadasLogin")) {
                return true;
            }
        }

        
        //this.router.navigateByUrl('/login');
        return true;
    }

    
}
