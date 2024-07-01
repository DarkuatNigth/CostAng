import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrmcoordenadasRoutingModule } from './frmcoordenadas-routing.module';
import { FrmcoordenadasComponent } from './frmcoordenadas.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TimelineModule } from "primeng/timeline";
import { CardModule } from "primeng/card";
import { HttpClientModule } from '@angular/common/http';
import { DxButtonModule, DxLoadPanelModule} from 'devextreme-angular';

@NgModule({
  declarations: [
    FrmcoordenadasComponent
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
    FrmcoordenadasRoutingModule
  ]
})
export class FrmcoordenadasModule { }
