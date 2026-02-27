import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrmpermisosempleadoplantaComponent } from './frmpermisosempleadoplanta.component';
import { AuthGuard } from '../../_guards';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    component: FrmpermisosempleadoplantaComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FrmPermisosEmpleadoRoutingModule {}
