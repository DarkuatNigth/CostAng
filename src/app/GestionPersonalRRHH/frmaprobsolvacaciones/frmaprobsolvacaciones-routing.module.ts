import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../_guards';
import { FrmaprobsolvacacionesComponent } from './frmaprobsolvacaciones.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: FrmaprobsolvacacionesComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FrmaprobsolvacacionesRoutingModule {}
