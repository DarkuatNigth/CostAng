import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules  } from '@angular/router';
import { AuthGuard } from './_guards';
import { FullComponent } from './layouts/full/full.component';
import { BlankComponent } from './layouts/blank/blank.component';
import { LoginComponent } from './login/login.component';
import { FrmplanificacionvagconsultaModuleFactory } from './Produccion/Procesos/frmplanificacionvagconsulta/frmplanificacionvagconsulta.module';
import { FrmplanificacionvagModuleFactory } from './Produccion/Procesos/frmplanificacionvag/frmplanificacionvag.module';
import { TokenexpiredModuleFactory } from './tokenexpired/tokenexpired.module';
import { FrmplanificacionembarqueModuleFactory } from './Produccion/Procesos/frmplanificacionembarque/frmplanificacionembarque.module';
import { FrmperfilclienteModuleFactory } from './Produccion/Mantenimiento/frmperfilcliente/frmperfilcliente.module';
import { FrmdiasparadaplantaModuleFactory } from './Produccion/Mantenimiento/frmdiasparadaplanta/frmdiasparadaplanta.module';
import { FrmenvioxmlnatModuleFactory } from './Produccion/Procesos/frmenvioxmlnat/frmenvioxmlnat.module';
import { FrmtransaccionusuarioModuleFactory } from './Produccion/Mantenimiento/frmtransaccionusuario/frmtransaccionusuario.module';
import { FrmclasificadoraimpresoraModuleFactory } from './Produccion/Mantenimiento/frmclasificadoraimpresora/frmclasificadoraimpresora.module';

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
      },
      { 
        path: '', 
        loadChildren: () => import('./Produccion/Mantenimiento/frmplanificacionparametrizacion/frmplanificacionparametrizacion.module').then(m => m.FrmplanificacionparametrizacionModule) 
      },
      { 
        path: '', 
        loadChildren: () => import('./Produccion/Mantenimiento/frmtipocorte/frmtipocorte.module').then(m => m.FrmtipocorteModule) 
      },
      { 
        path: '', 
        loadChildren: () => import('./Produccion/Procesos/frmasignacionlotes/frmasignacionlotes.module').then(m => m.FrmasignacionlotesModule) 
      },
      { 
        path: '', 
        loadChildren: FrmplanificacionvagconsultaModuleFactory 
      },
      { 
        path: '', 
        loadChildren: FrmplanificacionvagModuleFactory 
      },
      { 
        path: '', 
        loadChildren: FrmplanificacionembarqueModuleFactory 
      },
      { 
        path: '', 
        loadChildren: FrmperfilclienteModuleFactory 
      },
      { 
        path: '', 
        loadChildren: TokenexpiredModuleFactory 
      },
      {
        path: '',
        loadChildren: FrmdiasparadaplantaModuleFactory
      },
      {
        path: '',
        loadChildren: FrmenvioxmlnatModuleFactory
      },
      {
        path: '',
        loadChildren: FrmtransaccionusuarioModuleFactory
      },
      {
        path: '',
        loadChildren: FrmclasificadoraimpresoraModuleFactory
      },//solicitud vacaciones
      { 
        path: 'ext-SolicitudVacaciones',
        loadChildren: () => import('./GestionPersonalRRHH/frmsolvacaciones/frmsolvacaciones.module').then((m) => m.FrmsolvacacionesModule),
      },
      { 
        path: 'ext-AprobSolicitudVacaciones/:opcion',
        loadChildren: () => import('./GestionPersonalRRHH/frmaprobsolvacaciones/frmaprobsolvacaciones.module').then((m) => m.FrmaprobsolvacacionesModule),
      }
      ,//solicitud permisos
      { 
        path: 'ext-solictudPermisosEmp',
        loadChildren: () => import('./GestionPersonalRRHH/frmsolpermisos/frmsolpermisos.module').then((m) => m.FrmsolpermisosModule),
      },
      { 
        path: 'ext-aprobsolictudPermisosEmp',
        loadChildren: () => import('./GestionPersonalRRHH/frmaprobpermisos/frmaprobpermisos.module').then((m) => m.FrmaprobpermisosModule),
      }
      ,
      { 
        path: 'ext-PermisosEmpleadosPlanta',
        loadChildren: () => import('./GestionPersonalRRHH/frmpermisosempleadoplanta/frmpermisosempleadoplanta.module').then((m) => m.FrmPermisosEmpleadoModule),
      }
		]
	},
  
  // otherwise redirect to home
  { path: '**', redirectTo: '' },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
