import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules  } from '@angular/router';
import { AuthGuard } from './_guards';
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'CargaFilePedido',
        loadChildren: () => import('./Activofijo/Procesos/frmasignacionactivos/frmasignacionactivos.module').then(m => m.FrmasignacionactivosModule)
      }
    ]
  },
  {
		path: '',
		component: BlankComponent,
		children: [
      {
        path: 'login',
        loadChildren: () => import('./login/login.module').then(m => m.LoginModule)
      },
      {
        path: 'CoordenadasLogin',
        loadChildren: () => import('./frmcoordenadas/frmcoordenadas.module').then(m => m.FrmcoordenadasModule)
      }
		]
	},
  // otherwise redirect to home
  { path: '**', redirectTo: '' }];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
