import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { DxButtonGroupModule, DxButtonModule, DxCheckBoxModule, DxDataGridModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextBoxModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FrmplanificacionvagComponent } from './frmplanificacionvag.component';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';



@NgModule({
  declarations: [
    FrmplanificacionvagComponent,
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
    CdkDropList, 
    CdkDrag, 
    MatTableModule, 
    MatIconModule,
    RouterModule.forChild([
      { path: 'planificacion', canActivate: [AuthGuard], component: FrmplanificacionvagComponent },
    ]) 
  ],
  exports: [
    RouterModule
  ],
})
export class FrmplanificacionvagModule { }


export function FrmplanificacionvagModuleFactory() {
  return FrmplanificacionvagModule;
}