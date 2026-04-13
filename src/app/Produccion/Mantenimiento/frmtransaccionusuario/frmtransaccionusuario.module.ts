import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthGuard } from 'src/app/_guards';
import { FrmtransaccionusuarioComponent } from './frmtransaccionusuario.component';
import { DxLoadPanelModule, DxButtonModule, DxDataGridModule } from "devextreme-angular";
import { NgSelectModule } from "@ng-select/ng-select";
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [FrmtransaccionusuarioComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
        { path: 'ext-transauser', canActivate: [], component: FrmtransaccionusuarioComponent },
    ]),
    DxLoadPanelModule,
    DxButtonModule,
    NgSelectModule,
    FormsModule,
    DxDataGridModule
]
})
export class FrmtransaccionusuarioModule { }

export function FrmtransaccionusuarioModuleFactory() {
  return FrmtransaccionusuarioModule;
}


