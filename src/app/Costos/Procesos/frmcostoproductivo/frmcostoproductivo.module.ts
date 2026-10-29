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
  DxPopupModule
} from 'devextreme-angular';
import { FrmcostoproductivoComponent } from './frmcostoproductivo.component';
import { AuthGuard } from 'src/app/_guards';

@NgModule({
  declarations: [FrmcostoproductivoComponent],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    DxButtonModule,
    DxDataGridModule,
    DxLoadPanelModule,
    DxSelectBoxModule,
    DxPopupModule,
    RouterModule.forChild([
      {
        path: 'ext-costoproductivo',
        canActivate: [AuthGuard],
        component: FrmcostoproductivoComponent
      }
    ])
  ]
})
export class FrmcostoproductivoModule { }

export function FrmcostoproductivoModuleFactory() {
  return FrmcostoproductivoModule;
}
