import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './../../_guards';
import { FrmsolpermisosComponent } from './frmsolpermisos.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: FrmsolpermisosComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FrmsolpermisosRoutingModule {}
