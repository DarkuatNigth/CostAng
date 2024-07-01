import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DxButtonModule,DxLoadPanelModule,DxDataGridModule,DxPopoverModule} from 'devextreme-angular';
import { FrmasignacionactivosRoutingModule } from './frmasignacionactivos-routing.module';
import {FrmasignacionactivosComponent} from './frmasignacionactivos.component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { NgSelectModule } from '@ng-select/ng-select';

@NgModule({
  declarations: [
    FrmasignacionactivosComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    FrmasignacionactivosRoutingModule,
    DxButtonModule,
    DxLoadPanelModule,
    DxDataGridModule,
    DxPopoverModule,
    NgSelectModule,
    ZXingScannerModule
  ]
})
export class FrmasignacionactivosModule { }
