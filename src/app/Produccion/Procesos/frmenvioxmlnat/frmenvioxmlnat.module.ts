import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { DxButtonGroupModule, DxButtonModule, DxCheckBoxModule, DxDataGridModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextBoxModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FrmenvioxmlnatComponent } from './frmenvioxmlnat.component';



@NgModule({
  declarations: [
    FrmenvioxmlnatComponent
  ],
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
    
        RouterModule.forChild([
          { path: 'ext-envioXml', component: FrmenvioxmlnatComponent },
        ]) 
  ]
})
export class FrmenvioxmlnatModule { }


export function FrmenvioxmlnatModuleFactory() {
  return FrmenvioxmlnatModule;
}