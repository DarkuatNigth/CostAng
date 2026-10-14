import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrmconsolidadoenergiaComponent } from './frmconsolidadoenergia.component';
import { RouterModule } from '@angular/router';
import { TabGridComponent } from 'src/app/shared/tab-grid/tab-grid.component';
import { DxButtonModule, DxCalendarModule, DxChartModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxListModule, DxLoadPanelModule, DxNumberBoxModule, DxPivotGridModule, DxTabPanelModule } from 'devextreme-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClientModule } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [FrmconsolidadoenergiaComponent],
  imports: [
      CommonModule,
      FormsModule,
      NgbModule,
      CardModule,
      HttpClientModule,
      DxButtonModule,
      DxDataGridModule,
      DxNumberBoxModule,
      DxDropDownBoxModule,
      DxLoadPanelModule,
      DxTabPanelModule,
      DxDateBoxModule,
      DxPivotGridModule,
      DxListModule,
      NgSelectModule,
      DxCalendarModule,
      DxCalendarModule,
      DxChartModule,
      TabGridComponent,
      RouterModule.forChild([
        { path: 'ext-consolidadoenergia',  /*canActivate: [AuthGuard],*/component: FrmconsolidadoenergiaComponent },
      ])
  ]
})
export class FrmconsolidadoenergiaModule { }
export function FrmconsolidadoenergiaModuleFactory() {
  return FrmconsolidadoenergiaModule;
}

