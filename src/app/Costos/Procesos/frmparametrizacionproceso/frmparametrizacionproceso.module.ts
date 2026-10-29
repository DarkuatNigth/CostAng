import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {
  DxButtonModule,
  DxLoadPanelModule,
  DxDataGridModule
} from 'devextreme-angular';

import { FrmparametrizacionprocesoComponent } from './frmparametrizacionproceso.component';

@NgModule({
  declarations: [
    FrmparametrizacionprocesoComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgSelectModule,
    NgbModule,
    DxButtonModule,
    DxLoadPanelModule,
    DxDataGridModule,
    RouterModule.forChild([
      {
        path: 'ext-parametrizacionprocesos',
        component: FrmparametrizacionprocesoComponent
      }
    ])
  ],
  exports: [
    RouterModule
  ]
})
export class FrmparametrizacionprocesoModule {}

export function FrmparametrizacionprocesoModuleFactory() {
  return FrmparametrizacionprocesoModule;
}
