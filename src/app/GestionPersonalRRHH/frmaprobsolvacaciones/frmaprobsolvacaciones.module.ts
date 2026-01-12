import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FrmaprobsolvacacionesRoutingModule } from './frmaprobsolvacaciones-routing.module';
import { FrmaprobsolvacacionesComponent } from './frmaprobsolvacaciones.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { HttpClientModule } from '@angular/common/http';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';
import { DxChartModule } from 'devextreme-angular/ui/chart';
import { DxFileUploaderModule } from 'devextreme-angular/ui/file-uploader';
import { DxResponsiveBoxModule } from 'devextreme-angular/ui/responsive-box';
import { DxButtonGroupModule } from 'devextreme-angular/ui/button-group';
import { DxPopoverModule } from 'devextreme-angular/ui/popover';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';
import { NgSelectModule } from '@ng-select/ng-select';
import { CalendarModule } from 'primeng/calendar';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
@NgModule({
  declarations: [FrmaprobsolvacacionesComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    TimelineModule,
    CardModule,
    HttpClientModule,
    DxButtonModule,
    DxDateBoxModule,
    DxDataGridModule,
    DxFileUploaderModule,
    DxLoadPanelModule,
    DxChartModule,
    DxTabPanelModule,
    DxResponsiveBoxModule,
    DxButtonGroupModule,
    DxPopoverModule,
    DxContextMenuModule,
    NgSelectModule,
    CalendarModule,
    AutocompleteLibModule,
    FrmaprobsolvacacionesRoutingModule,
  ]
})

export class FrmaprobsolvacacionesModule {}
