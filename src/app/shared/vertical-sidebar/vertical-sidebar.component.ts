import { SidebarService } from './../vertical-sidebar/vertical-sidebar.service';
import { Component, OnInit,ElementRef } from '@angular/core';
import { RouteInfo } from './vertical-sidebar.metadata';
import { Router, ActivatedRoute } from '@angular/router';
import { FullComponent } from './../../layouts/full/full.component';
import Swal from 'sweetalert2/src/sweetalert2.js';
declare var $: any;
declare var window;

@Component({
  selector: 'app-vertical-sidebar',
  templateUrl: './vertical-sidebar.component.html'
})
export class VerticalSidebarComponent  implements OnInit {

  showMenu = '';
  showSubMenu = '';
  public sidebarnavItems: RouteInfo[] = [];
  path = '';
  nombre: string = '';
  activePinStatic: number = 0;

  constructor(private menuServise: SidebarService, private router: Router,private element: ElementRef,
    private _router: Router,
    private _menu: FullComponent) {
      //debugger;
      window.Menu = this;
  }

  async showAlert(title, mensaje, tipo) {

    Swal.fire({
      title: title,
      html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje + "</div>",
      icon: tipo,
      showCancelButton: false,
      confirmButtonColor: (tipo === 'error' ? '#d33' : tipo === 'warning' ? '#ff9800' :
        tipo === 'success' ? '#4CAF50' : tipo === 'info' ? '#2196F3' : ''),
      confirmButtonText: 'Aceptar'
    });
  }

  async ngOnInit() {
    this.nombre = await localStorage.getItem('UserProd');
    
    this.menuServise.loadmenu();
    this.menuServise.items.subscribe(menuItems => {
      
      this.sidebarnavItems = menuItems;
      if(menuItems === null){
        this.showAlert('', 'Usuario no posee opciones. Por favor vuelva a ingresar su usuario o pida a sistemas las opciones', 'error');
        return;
      }
      // Active menu 
      this.sidebarnavItems.filter(m => m.submenu.filter(
        (s) => {
          
          if (s.path === this.router.url) {
            //this.path = m.title;
            this._menu.LabelOpcion = s.title;
            this._menu.opcionSelect = s.id;
            this._menu.chkFavorite = (s.favorite === 1 ? true: false);
            if(s.favorite === 1){
              this._menu.lblFavorite = "Remove Favorite";
            }else{
              
              this._menu.lblFavorite = "Add Favorite";
            }
          }
        }
      ));

 
      this.sidebarnavItems.filter(m => m.submenu.filter(s => s.submenu.filter(o => {
        if (o.path === this.router.url) {
          
          this._menu.LabelOpcion = o.title;
          this._menu.opcionSelect = o.id;
          this._menu.chkFavorite = (o.favorite === 1 ? true: false);
          if(o.favorite === 1){
            this._menu.lblFavorite = "Remove Favorite";
          }else{
            
            this._menu.lblFavorite = "Add Favorite";
          } 
        }
      })));


      this.addExpandClass(this.path);
    });

    if(this._menu.LabelOpcion === "Inicio"){
      this._menu.showFavorite = true;
    }else{
      this._menu.showFavorite = false;
    }
  }

  RefreshMenu(){
    this.menuServise.loadmenu();
    this.menuServise.items.subscribe(menuItems => {
      
      this.sidebarnavItems = menuItems;
      if(menuItems === null){
        this.showAlert('', 'Usuario no posee opciones. Por favor vuelva a ingresar su usuario o pida a sistemas las opciones', 'error');
        return;
      }

      this.addExpandClass(this.path);
    });
  }

  logout() {
    localStorage.removeItem('UserProd');
    localStorage.removeItem('UserProd2');
    localStorage.removeItem('menuProd');
    localStorage.removeItem('ExpireProd');
    localStorage.removeItem('MenuProdDT');
    this._router.navigateByUrl('/login');
  }

  setearMenu(){
    //debugger;
    this.showMenu = '0';
    this.showSubMenu = '0';
  }

  addExpandClass(element: any) {

    if (element === this.showMenu) {
      this.showMenu = '0';
    } else {
      this.showMenu = element;
    }
  }

  addActiveClass(element: any) {
    
    if (element === this.showSubMenu) {
      this.showSubMenu = '0';
    } else {
      this.showSubMenu = element;
    }
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  onclickMenu(e, id, favorite, path) {
    
    if(path !== ""){

      this.router.navigateByUrl(path);

      if (this._menu.showMobileMenu) {
        this._menu.showMobileMenu = !this._menu.showMobileMenu;
      }
 
      this._menu.MenuOver();
      this._menu.LabelOpcion = e;
      this._menu.opcionSelect = id;

      if(this._menu.LabelOpcion === "Inicio"){
        this._menu.showFavorite = true;
      }else{
        this._menu.showFavorite = false;
      }

      this._menu.chkFavorite = (favorite === 1 ? true: false);
      if(favorite === 1){
        this._menu.lblFavorite = "Remove Favorite";
      }else{
        
        this._menu.lblFavorite = "Add Favorite";
      }
    }else{
      this.addActiveClass(e);
    }
  }

  onActivePinClick(){
   
    let myMenuPaper = this.element.nativeElement.parentElement.parentElement.parentElement.querySelector("#pageWrapper");
    let myMenu = this.element.nativeElement.parentElement.parentElement.parentElement.querySelector("#CtrMenu")
    //debugger;
    this.activePinStatic = (this.activePinStatic === 0 ? 1 : 0);
    if(this.activePinStatic === 1){
      myMenuPaper.classList.add("containerStaticMenu");
      myMenu.classList.add("ShowStaticMenu");
    }else{
      myMenuPaper.classList.remove("containerStaticMenu");
      myMenu.classList.remove("ShowStaticMenu");
    }
  }
}
