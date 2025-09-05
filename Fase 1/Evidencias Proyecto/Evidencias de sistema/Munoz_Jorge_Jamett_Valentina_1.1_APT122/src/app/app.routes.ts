import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AcercaDeComponent } from './pages/acerca-de/acerca-de.component';
import { CotizadorComponent } from './pages/cotizador/cotizador.component';
export const routes: Routes = [
    {path: '', component: HomeComponent},
    {path: 'home', component: HomeComponent},
    {path: 'acerca-de', component: AcercaDeComponent},
    {path: 'cotizador', component: CotizadorComponent},
    {path: '**', redirectTo: 'home' }
];
