import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './../../_guards';
import { FrmaprobpermisosComponent } from './frmaprobpermisos.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: FrmaprobpermisosComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FrmaprobpermisosRoutingModule {}
