import { HttpClient } from '@angular/common/http';
import { RouteInfo } from './vertical-sidebar.metadata';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
    providedIn: 'root'
})
export class SidebarService {
    public menu: RouteInfo[] = [
    ];
    items: BehaviorSubject<RouteInfo[]>;
   
    constructor(private http: HttpClient) {
    }

    loadmenu() {
      
        this.menu = JSON.parse(localStorage.getItem('menuProd'));
        this.items = new BehaviorSubject<RouteInfo[]>(this.menu);
    }

    armarmenu(menu) {

      let supermenu: RouteInfo[] = []
      let supermenu2: RouteInfo[] = []
      let supermenu3: RouteInfo[] = []
  
      const id_pad = [...new Set(menu.map(item => item.parentid))];
      id_pad.forEach(element => {
        let submenu = menu.filter(resp => resp.parentid === element && resp.id === element);
        submenu.forEach(subelement => {
  
          let delete0 = menu.filter(resp => resp.parentid === element && resp.id === element);
          delete0.forEach(del0 => {
            menu.forEach((rc, index) => {
              if (rc.id === del0.id) {
                menu.splice(index, 1);
              }
            });
          });
  
          supermenu2 = [];
          let submenu2 = menu.filter(resp => resp.parentid === element);
          submenu2.forEach(subelement2 => {
  
            let delete1 = menu.filter(resp => resp.parentid === element && resp.id === subelement2.id);
            delete1.forEach(del2 => {
              menu.forEach((rc, index) => {
                //debugger;
                if (rc.id === del2.id && rc.parentid === del2.parentid) {
                  menu.splice(index, 1);
                }
              });
            });
  
            supermenu3 = [];
            let submenu3 = menu.filter(resp => resp.parentid === subelement2.id);
            submenu3.forEach(subelement3 => {
  
              supermenu3.push({
                path: subelement3.path,
                title: subelement3.title,
                icon: subelement3.icon,
                class: subelement3.class,
                extralink: subelement3.extralink,
                label: subelement3.label,
                labelClass: subelement3.labelClass,
                submenu: [],
                id: subelement3.id,
                favorite: subelement3.favorite
              })
            });
  
            supermenu2.push({
              path: subelement2.path,
              title: subelement2.title,
              icon: subelement2.icon,
              class: subelement2.class,
              extralink: subelement2.extralink,
              label: subelement2.label,
              labelClass: subelement2.labelClass,
              submenu: supermenu3,
              id: subelement2.id,
              favorite: subelement2.favorite
            })
  
          });
  
          supermenu.push({
            path: subelement.path,
            title: subelement.title,
            icon: subelement.icon,
            class: subelement.class,
            extralink: subelement.extralink,
            label: subelement.label,
            labelClass: subelement.labelClass,
            submenu: supermenu2,
            id: subelement.id,
            favorite: subelement.favorite
          })
        });
      });
      //debugger;
      localStorage.setItem('menuProd', JSON.stringify(supermenu));
      return supermenu;
    }

}
