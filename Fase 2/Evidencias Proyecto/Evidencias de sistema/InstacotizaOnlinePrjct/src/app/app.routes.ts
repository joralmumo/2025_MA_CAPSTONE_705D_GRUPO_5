import { Routes } from '@angular/router';
import { CotizadorComponent } from './pages/cotizador/cotizador.component';
import { HomeComponent } from './pages/home/home.component';
import { AcercaDeComponent } from './pages/acerca-de/acerca-de.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AutorizadoGuard } from './guards/autorizado.guard';
import { CotizadorRComponent } from './pages/cotizador-r/cotizador-r.component';
import { PerfilComponent } from './pages/perfil/perfil.component';
import { GestorCotizacionesComponent } from './pages/gestor-cotizaciones/gestor-cotizaciones.component';
import { RecuperarContrasenaComponent } from './pages/recuperar-contrasena/recuperar-contrasena.component';
import { UpdatePerfilComponent } from './pages/update-perfil/update-perfil.component';
import { AdminComponent } from './pages/admin/admin.component';
import { AdminGuard } from './guards/admin.guard';
import { InstalarAppComponent } from './pages/instalar-app/instalar-app.component';

export const routes: Routes = [
    {path: 'home', component: HomeComponent},
    {path: 'acerca-de', component: AcercaDeComponent},
    {path: 'cotizador', component: CotizadorComponent},
    {path: 'login', component: LoginComponent}, 
    {path: 'register', component: RegisterComponent}, 
    {path: 'instalar-app', component: InstalarAppComponent},
    {path: 'cotizador-r', component: CotizadorRComponent, canActivate: [AutorizadoGuard]},
    {path: 'perfil', component: PerfilComponent, canActivate: [AutorizadoGuard]}, 
    {path: 'gestor-cotizaciones', component: GestorCotizacionesComponent, canActivate: [AutorizadoGuard]}, 
    {path: 'recuperar-contrasena', component: RecuperarContrasenaComponent}, 
    {path: 'update-perfil', component: UpdatePerfilComponent, canActivate: [AutorizadoGuard]}, 
    {path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
    {path: '', component: HomeComponent},
    {path: '**', redirectTo: 'home'}, // en caso de 404
];
