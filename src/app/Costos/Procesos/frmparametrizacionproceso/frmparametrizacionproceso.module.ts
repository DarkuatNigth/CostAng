import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CardModule } from 'primeng/card';
import { HttpClientModule } from '@angular/common/http';
import { DxButtonModule, DxCalendarModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxListModule, DxLoadPanelModule, DxPivotGridModule, DxTabPanelModule } from 'devextreme-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule } from '@angular/router';
import { FrmparametrizacionprocesoComponent } from './frmparametrizacionproceso.component';
import { AuthGuard } from 'src/app/_guards';
import { TabGridComponent } from 'src/app/shared/tab-grid/tab-grid.component';


@NgModule({
  declarations: [FrmparametrizacionprocesoComponent],
    imports: [
      CommonModule,
      FormsModule,
      NgbModule,
      CardModule,
      HttpClientModule,
      DxButtonModule,
      DxDataGridModule,
      DxDropDownBoxModule,
      DxLoadPanelModule,
      DxTabPanelModule,
      DxDateBoxModule,
      DxPivotGridModule,
      DxListModule,
      NgSelectModule,
      DxCalendarModule,
      TabGridComponent,
      RouterModule.forChild([
            { path: 'ext-parametrizacionprocesos',  component: FrmparametrizacionprocesoComponent },
      ]) 
    ],
      exports: [
        RouterModule
      ],
})
export class FrmparametrizacionprocesoModule { }
export function FrmparametrizacionprocesoModuleFactory() {  
  return FrmparametrizacionprocesoModule;
}