import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../_guards';
import { FrmsolvacacionesComponent } from './frmsolvacaciones.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: FrmsolvacacionesComponent
  }
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FrmsolvacacionesRoutingModule {}
