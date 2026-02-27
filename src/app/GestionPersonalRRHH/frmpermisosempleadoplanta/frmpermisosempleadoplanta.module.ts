import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AutocompleteLibModule } from 'angular-ng-autocomplete';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { HttpClientModule } from '@angular/common/http';

import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import { DxTabPanelModule } from 'devextreme-angular/ui/tab-panel';
import { DxDataGridModule } from 'devextreme-angular/ui/data-grid';

import { DxButtonGroupModule } from 'devextreme-angular/ui/button-group';
import { DxDropDownButtonModule } from 'devextreme-angular/ui/drop-down-button';
import { DxDateBoxModule } from 'devextreme-angular/ui/date-box';

import { NgSelectModule } from '@ng-select/ng-select';

import { DxListModule, DxPopupModule } from 'devextreme-angular';
import { DxSelectBoxModule } from 'devextreme-angular';
import { DxNumberBoxModule } from 'devextreme-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { DxTextBoxModule } from 'devextreme-angular'; // Importa los módulos necesarios
import { DxFormModule, DxCheckBoxModule } from 'devextreme-angular';
import { DxRadioGroupModule } from 'devextreme-angular';
import { DxFileUploaderModule } from 'devextreme-angular';
import { FrmpermisosempleadoplantaComponent } from './frmpermisosempleadoplanta.component';
import { FrmPermisosEmpleadoRoutingModule } from './frmpermisosempleadoplanta-routing.module';
@NgModule({
  declarations: [FrmpermisosempleadoplantaComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgbModule,
    TimelineModule,
    CardModule,
    HttpClientModule,
    DxButtonModule,
    DxDataGridModule,
    DxDateBoxModule,
    DxLoadPanelModule,
    DxTabPanelModule,
    DxButtonGroupModule,
    DxDropDownButtonModule,
    NgSelectModule,
    AutocompleteLibModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    ReactiveFormsModule,
    DxTextBoxModule,
    DxFormModule,
    DxListModule,
    DxCheckBoxModule,
    DxRadioGroupModule,
    DxFileUploaderModule,
    FrmPermisosEmpleadoRoutingModule,
  ],
})
export class FrmPermisosEmpleadoModule {}
