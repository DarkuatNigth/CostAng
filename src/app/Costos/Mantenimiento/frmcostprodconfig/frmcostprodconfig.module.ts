import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  DxButtonModule,
  DxDataGridModule,
  DxLoadPanelModule,
  DxNumberBoxModule,
  DxPopupModule,
  DxSelectBoxModule,
  DxSwitchModule,
  DxTextBoxModule
} from 'devextreme-angular';
import { FrmcostprodconfigComponent } from './frmcostprodconfig.component';

@NgModule({
  declarations: [FrmcostprodconfigComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DxButtonModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxNumberBoxModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxSwitchModule,
    DxTextBoxModule,
    RouterModule.forChild([
      {
        path: 'ext-costprodconfig',  /*canActivate: [AuthGuard],*/
        component: FrmcostprodconfigComponent
      }
    ])
  ],
  exports: [RouterModule]
})
export class FrmcostprodconfigModule {}

export function FrmcostprodconfigModuleFactory() {
  return FrmcostprodconfigModule;
}
