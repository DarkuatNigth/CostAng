import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { DxButtonGroupModule, DxButtonModule, DxChartModule, DxCheckBoxModule, DxContextMenuModule, DxDataGridModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPopoverModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextBoxModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';

import { FrminiciofinloteComponent } from './frminiciofinlote.component';



@NgModule({
  declarations: [
    FrminiciofinloteComponent
  ],
  imports:[
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
        DxPopoverModule,
        DxPopupModule,
        DxSelectBoxModule,
        DxNumberBoxModule,
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
          { path: 'ext-iniciofinlote', canActivate: [AuthGuard], component: FrminiciofinloteComponent },
        ]) ,
    ],
    exports: [
      RouterModule
    ],
})
export class FrminiciofinloteModule { }

export function FrminiciofinloteModuleFactory() {
  return FrminiciofinloteModule;
}