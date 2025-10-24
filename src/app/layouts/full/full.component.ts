import { Component, OnInit, HostListener,ElementRef  } from '@angular/core';
import { Router } from '@angular/router';
declare var $: any;
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { BaseConexion, codModule,varUser, varMenuDT, varNombreEmpresa  } from './../../config/url.servicios';
import { LoginService } from './../../login/login.service';
import { SidebarService } from './../../shared/vertical-sidebar/vertical-sidebar.service';

declare var window;

@Component({
  selector: 'app-full-layout',
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss']
})
export class FullComponent implements OnInit {
  public config: PerfectScrollbarConfigInterface = {};
  constructor(public router: Router,private element: ElementRef, private menuServise: SidebarService,
    private _serviceloginService: LoginService
    ) { }

  showFavorite: boolean = true;
  showMenuMovil: boolean = false;
  LostFocusMenu: boolean = false;
  logoMenu:string = "";

  tabStatus = 'justified';
  chkFavorite:boolean = false;
  lblFavorite:string = "Add Favorite";
  opcionSelect: number = 0;

  public isCollapsed = false;

  public innerWidth: any;
  public defaultSidebar: any;
  public showSettings = false;
  public showMobileMenu = false;
  public expandLogo = false;

  LabelOpcion:string = "Inicio";
  LabelPublicacion:string = "2025-10-08";
  
  options = {
    theme: 'light', // two possible values: light, dark
    dir: 'ltr', // two possible values: ltr, rtl
    layout: 'vertical', // two possible values: vertical, horizontal
    sidebartype: 'full', // four possible values: full, iconbar, overlay, mini-sidebar
    sidebarpos: 'fixed', // two possible values: fixed, absolute
    headerpos: 'fixed', // two possible values: fixed, absolute
    boxed: 'full', // two possible values: full, boxed
    navbarbg: 'skin2', // six possible values: skin(1/2/3/4/5/6)
    sidebarbg: 'skin2', // six possible values: skin(1/2/3/4/5/6)
    logobg: 'skin2' // six possible values: skin(1/2/3/4/5/6)
  };

  Logo() {
    this.expandLogo = !this.expandLogo;
  }

  ngOnInit() {
    let dbase = BaseConexion;

    this.logoMenu = "assets/images/logo-light-icon.png";

    if(dbase === "MARINA"){
      this.logoMenu = "assets/images/logo-iconmdr.png";
    }

    if(dbase === "SEAFOOD"){
      this.logoMenu = "assets/images/logo-iconSFT.png";
    }

    if (this.router.url === '/') {
      this.router.navigate(['/dashboard/classic']);
    }
    this.defaultSidebar = this.options.sidebartype;
    this.handleSidebar();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: string) {
    this.handleSidebar();
  }

  MenuShow(){
    let MenuMovil = this.element.nativeElement.querySelector("#MenuMovil");
    
    let myMenu = this.element.nativeElement.querySelector("#CtrMenu");

    if(this.LostFocusMenu){
      this.showMenuMovil = !this.showMenuMovil;
      this.LostFocusMenu = false;
    }

    if(!this.showMenuMovil){
      myMenu.style.display = "block";
      this.showMenuMovil = true;
    }else{
      myMenu.style.display = "none";
      this.showMenuMovil = false;
    }

    if(MenuMovil.clientHeight > 0){
      myMenu.classList.add('ShowMenuMovil');
    }else{
      myMenu.classList.remove('ShowMenuMovil');
    }
  }

  MenuOver(){
        
    let myMenu = this.element.nativeElement.querySelector("#CtrMenu");
    
    let MenuMovil = this.element.nativeElement.querySelector("#MenuMovil");
    if(MenuMovil.clientHeight > 0){
      myMenu.style.display = "none";
      this.LostFocusMenu = true;
    }
  }

  handleSidebar() {
    this.innerWidth = window.innerWidth;
    switch (this.defaultSidebar) {
      case 'full':
      case 'iconbar':
        break;
      case 'overlay':
        break;

      default:
    }
  }

  OnClickContainer() {
  }

  toggleSidebarType() {
    switch (this.options.sidebartype) {
      case 'full':
      case 'iconbar':
        break;

      case 'overlay':
        break;

      case 'mini-sidebar':
        break;

      default:
    }
    
  }

  OnChangeFavorite(e){
    var accion = 0;

    if(this.chkFavorite){
      accion = 1;
      this.lblFavorite = "Remove Favorite";
    }else{
      
      this.lblFavorite = "Add Favorite";
    }
    this.GuardarFavorite(this.opcionSelect, accion)

  }

  async GuardarFavorite(opcion,accion){
    
    const valorMenu = await new Promise(async (resolve) => {
      await this._serviceloginService.saveMenuFavorite(await localStorage.getItem(varUser),codModule,
        opcion,accion).subscribe(async (resp) => {
        if (resp.Codigo) {
          return resolve(true);
        } else {
          return resolve(false);
        }
      });
    });

    if(valorMenu){
      await this.CargarMenu();
    }
  }

  async CargarMenu(){
    const valorMenu = await new Promise(async (resolve) => {
      await this._serviceloginService.cargaMenu(await localStorage.getItem(varUser)).subscribe(async (resp) => {
        if (resp.Codigo) {
          
          if (Object.keys(resp.Dt).length > 0) {
            let dt: [][] = resp.Dt.Table;
            
            localStorage.setItem(varMenuDT, JSON.stringify(dt));
            await this.menuServise.armarmenu(dt);

            window.Menu.RefreshMenu();

          }
          return resolve(true);
        } else {
          return resolve(false);
        }
      });
    });
  }
}
