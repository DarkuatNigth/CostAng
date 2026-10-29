import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TabGridComponent } from 'src/app/shared/tab-grid/tab-grid.component';
import { DxButtonModule, DxCalendarModule, DxDataGridModule, DxDateBoxModule, DxDropDownBoxModule, DxListModule, DxLoadPanelModule, DxNumberBoxModule, DxPivotGridModule, DxTabPanelModule } from 'devextreme-angular';
import { NgSelectModule } from '@ng-select/ng-select';
import { HttpClientModule } from '@angular/common/http';
import { CardModule } from 'primeng/card';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { FrmdistribucionluzComponent } from './frmdistribucionluz.component';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';

@NgModule({
  declarations: [FrmdistribucionluzComponent],
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
    TabGridComponent,
    RouterModule.forChild([
      { path: 'ext-mantcostelectric',  canActivate: [AuthGuard],component: FrmdistribucionluzComponent },
    ])
  ]
})
export class FrmdistribucionluzModule { }
export function FrmdistribucionluzModuleFactory() {
  return FrmdistribucionluzModule;
}
