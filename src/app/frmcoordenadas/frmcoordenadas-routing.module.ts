import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './../_guards';
import { FrmcoordenadasComponent } from './frmcoordenadas.component'

const routes: Routes = [{
  path: '',
  canActivate: [AuthGuard],
  component: FrmcoordenadasComponent,
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrmcoordenadasRoutingModule { }
