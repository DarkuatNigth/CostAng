import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import {
  DxButtonModule,
  DxDataGridModule,
  DxLoadPanelModule,
  DxSelectBoxModule,
  DxTabPanelModule,
} from 'devextreme-angular';

import { FrmdiarioscierreComponent } from './frmdiarioscierre.component';

@NgModule({
  declarations: [FrmdiarioscierreComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,

    // DevExtreme 23.1.x: todos están incluidos en tu package.json.
    DxButtonModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxSelectBoxModule,
    DxTabPanelModule,

    RouterModule.forChild([
      {
        path: 'ext-diarios-cierre',
        /*canActivate: [AuthGuard],*/
        component: FrmdiarioscierreComponent,
      },
    ]),
  ],
})
export class FrmdiarioscierreModule { }

export function FrmdiarioscierreModuleFactory() {
  return FrmdiarioscierreModule;
}
