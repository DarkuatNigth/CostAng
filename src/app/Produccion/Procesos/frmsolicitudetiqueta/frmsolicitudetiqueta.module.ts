import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { DxButtonGroupModule, DxButtonModule, DxChartModule, DxCheckBoxModule, DxContextMenuModule, DxDataGridModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPieChartModule, DxPopoverModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxSwitchModule, DxTabPanelModule, DxTextBoxModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';


import { FrmsolicitudetiquetaComponent } from './frmsolicitudetiqueta.component';



@NgModule({
  declarations: [
    FrmsolicitudetiquetaComponent
  ],
  imports: [
      CommonModule,
      FormsModule,
      NgSelectModule,
      DxButtonModule,
      DxChartModule,
      DxDataGridModule,
      DxDateBoxModule,
      DxLoadPanelModule,
      DxTabPanelModule,
      DxButtonGroupModule,
      DxDropDownButtonModule,
      DxPieChartModule,
      DxPopoverModule,
      DxPopupModule,
      DxSelectBoxModule,
      DxNumberBoxModule,
      DxSwitchModule,
      DxTextBoxModule,
      DxFormModule,
      DxCheckBoxModule,
      DxRadioGroupModule,
      DxFileUploaderModule,
      DxContextMenuModule,
      CdkDropList, 
      CdkDrag, 
      MatTableModule, 
      MatIconModule,
      RouterModule.forChild([
        { path: 'ext-solicitudEtiqueta', canActivate: [AuthGuard], component: FrmsolicitudetiquetaComponent },
      ]) ,
  ],
  exports: [
    RouterModule
  ],
})
export class FrmsolicitudetiquetaModule { }

export function FrmsolicitudetiquetaModuleFactory() {
  return FrmsolicitudetiquetaModule;
}