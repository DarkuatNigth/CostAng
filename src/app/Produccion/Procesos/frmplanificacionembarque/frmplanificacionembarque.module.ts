import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { DxButtonGroupModule, DxButtonModule, DxCheckBoxModule, DxContextMenuModule, DxDataGridModule, DxDateBoxModule, DxDropDownButtonModule, DxFileUploaderModule, DxFormModule, DxLoadPanelModule, DxNumberBoxModule, DxPopoverModule, DxPopupModule, DxRadioGroupModule, DxSelectBoxModule, DxTabPanelModule, DxTextBoxModule } from 'devextreme-angular';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatTable, MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';

import { FrmplanificacionembarqueComponent } from './frmplanificacionembarque.component';
import { FrmplanificacionhorarioComponent } from './frmplanificacionhorario/frmplanificacionhorario.component';
import { ChunkPipe } from './frmplanificacionhorario/ChunkPipe';



@NgModule({
  declarations: [
    FrmplanificacionembarqueComponent,
    FrmplanificacionhorarioComponent,
    ChunkPipe,
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
        { path: 'ext-planificacionEmbarque', canActivate: [AuthGuard], component: FrmplanificacionembarqueComponent },
      ]) ,
  ],
  exports: [
    RouterModule
  ],
})
export class FrmplanificacionembarqueModule { }

export function FrmplanificacionembarqueModuleFactory() {
  return FrmplanificacionembarqueModule;
}