import { Component } from '@angular/core';
import { interval } from 'rxjs';
import { Router } from '@angular/router';
import { varUser } from './config/url.servicios';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private router: Router) { }

  ngOnInit(){
    var source = interval(2000);
    var subscribe = source.subscribe(async val => {
      
      if (await localStorage.getItem(varUser) === null && 
        !window.location.href.includes("/login") &&
        !window.location.href.includes("/CoordenadasLogin")
      ){
        this.router.navigateByUrl('/login');
      }
    });
  }
}
