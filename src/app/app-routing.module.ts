import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules  } from '@angular/router';
import { AuthGuard } from './_guards';
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { LoginComponent } from './login/login.component';
import { FrmplanificacionvagconsultaModuleFactory } from './Produccion/Procesos/frmplanificacionvagconsulta/frmplanificacionvagconsulta.module';
import { FrmplanificacionvagModuleFactory } from './Produccion/Procesos/frmplanificacionvag/frmplanificacionvag.module';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'AsignacionActivos',
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
  { 
    path: '', 
    component: FullComponent,
    loadChildren: () => import('./Produccion/Mantenimiento/frmtipocorte/frmtipocorte.module').then(m => m.FrmtipocorteModule) 
  },
  { 
    path: '', 
    component: FullComponent,
    loadChildren: () => import('./Produccion/Mantenimiento/frmplanificacionparametrizacion/frmplanificacionparametrizacion.module').then(m => m.FrmplanificacionparametrizacionModule) 
  },
  { 
    path: '', 
    component: FullComponent,
    loadChildren: () => import('./Produccion/Procesos/frmasignacionlotes/frmasignacionlotes.module').then(m => m.FrmasignacionlotesModule) 
  },
  { path: '', component: FullComponent, loadChildren: FrmplanificacionvagconsultaModuleFactory },
  { path: '', component: FullComponent, loadChildren: FrmplanificacionvagModuleFactory },
  
  
  // otherwise redirect to home
  { path: '**', redirectTo: '' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
