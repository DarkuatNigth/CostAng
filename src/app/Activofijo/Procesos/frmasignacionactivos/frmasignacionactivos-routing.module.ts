import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './../../../_guards';
import { FrmasignacionactivosComponent } from './frmasignacionactivos.component';

const routes: Routes = [{
  path: '',
  canActivate: [AuthGuard],
  component: FrmasignacionactivosComponent,
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrmasignacionactivosRoutingModule { }