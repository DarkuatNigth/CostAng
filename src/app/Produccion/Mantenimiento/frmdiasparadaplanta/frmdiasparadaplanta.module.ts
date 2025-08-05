import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { DxButtonGroupModule, DxButtonModule, DxCheckBoxModule, DxContextMenuModule, DxDataGridModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextBoxModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

import { FrmdiasparadaplantaComponent } from './frmdiasparadaplanta.component';


@NgModule({
  declarations: [FrmdiasparadaplantaComponent],
  imports: [
      CommonModule,
      FormsModule,
      NgSelectModule,
      DxButtonModule,
      DxDataGridModule,
      DxDateBoxModule,
      DxLoadPanelModule,
      DxTabPanelModule,
      DxButtonGroupModule,
      DxDropDownButtonModule,
      DxPopupModule,
      DxSelectBoxModule,
      DxNumberBoxModule,
      DxTextBoxModule,
      DxFormModule,
      DxCheckBoxModule,
      DxRadioGroupModule,
      DxFileUploaderModule,
      DxContextMenuModule,
      RouterModule.forChild([
        { path: 'ext-parada', canActivate: [], component: FrmdiasparadaplantaComponent },
      ]) ,
    ],
    exports: [
      RouterModule
    ],
})

export class FrmdiasparadaplantaModule { }

export function FrmdiasparadaplantaModuleFactory() {
  return FrmdiasparadaplantaModule;
}
