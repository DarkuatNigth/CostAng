import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { TimelineModule } from "primeng/timeline";
import { CardModule } from "primeng/card";
import { HttpClientModule } from '@angular/common/http';
import { DxButtonModule,DxLoadPanelModule} from 'devextreme-angular';
import { ZXingScannerModule } from '@zxing/ngx-scanner';


@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    TimelineModule,
    CardModule,
    HttpClientModule,
    DxButtonModule,
    DxLoadPanelModule,
    LoginRoutingModule,
    ReactiveFormsModule,

    ZXingScannerModule,
  ]
})
export class LoginModule { }
