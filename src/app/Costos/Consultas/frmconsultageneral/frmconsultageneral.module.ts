import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FrmconsultageneralComponent } from './frmconsultageneral.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CardModule } from 'primeng/card';
import { HttpClientModule } from '@angular/common/http';
import { DxButtonModule, DxCalendarModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxListModule, DxLoadPanelModule, DxPivotGridModule, DxTabPanelModule } from 'devextreme-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';


@NgModule({
  declarations: [
    FrmconsultageneralComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    CardModule,
    HttpClientModule,
    DxButtonModule,
    DxDataGridModule,
    DxDropDownBoxModule,
    DxLoadPanelModule,
    DxTabPanelModule,
    DxDateBoxModule,
    DxPivotGridModule,
    DxListModule,
    NgSelectModule,
    DxCalendarModule,
    RouterModule.forChild([
          { path: 'ext-consultageneral', canActivate: [AuthGuard],  component: FrmconsultageneralComponent },
    ]) 
  ],
    exports: [
      RouterModule
    ],
})
export class FrmconsultageneralModule { }

export function FrmconsultageneralModuleFactory() {  
  return FrmconsultageneralModule;
}
