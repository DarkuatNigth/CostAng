import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './../_guards';
import { LoginComponent } from './login.component'

const routes: Routes = [{
  path: '',
  canActivate: [AuthGuard],
  component: LoginComponent
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LoginRoutingModule { }
