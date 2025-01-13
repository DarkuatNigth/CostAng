import { NgModule,ErrorHandler,Injectable,Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { BreadcrumbComponent } from './shared/breadcrumb/breadcrumb.component';
import { HorizontalNavigationComponent } from './shared/horizontal-header/horizontal-navigation.component';
import { HorizontalSidebarComponent } from './shared/horizontal-sidebar/horizontal-sidebar.component';
import { VerticalNavigationComponent } from './shared/vertical-header/vertical-navigation.component';
import { VerticalSidebarComponent } from './shared/vertical-sidebar/vertical-sidebar.component';
import Swal from 'sweetalert2/src/sweetalert2.js';
import { AuthGuard } from './_guards';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { DxLoadPanelModule} from 'devextreme-angular';

declare var window;

@Injectable()
export class MyErrorHandler implements ErrorHandler {

  constructor(private injector: Injector) {
  }

  async showAlert(title, mensaje, tipo) {
    return new Promise(async (resolve) => {
      await Swal.fire({
        title: title,
        html: "<div class='mostly-customized-scrollbar' style='max-height: 50vh;overflow: auto;'>" + mensaje + "</div>",
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

  async handleError(error) {
    

    if(window.home !== undefined){
      if(window.home.loadingVisible !== undefined){
            window.home.loadingVisible = false;
      }
      if(window.home.Band !== undefined){
        window.home.Band = 0;
      }
    }

    if(error.message === "element.getClientRects is not a function"){
      return;
    }

    if(error.message.includes("Loading chunk")){
      window.location.reload();
      return;
    }

    await this.showAlert('',error.message,'error');
  }
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    FullComponent,
    BlankComponent,
    BreadcrumbComponent,
    HorizontalNavigationComponent,
    HorizontalSidebarComponent,
    VerticalNavigationComponent,
    VerticalSidebarComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    DxLoadPanelModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    AuthGuard,
    { provide: ErrorHandler, useClass: MyErrorHandler },
    CurrencyPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
