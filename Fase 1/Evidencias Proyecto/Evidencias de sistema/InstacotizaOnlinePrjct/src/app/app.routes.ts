import { Routes } from '@angular/router';
import { CotizadorComponent } from './pages/cotizador/cotizador.component';
import { HomeComponent } from './pages/home/home.component';
import { AcercaDeComponent } from './pages/acerca-de/acerca-de.component';

export const routes: Routes = [
    {path: 'home', component: HomeComponent},
    {path: 'acerca-de', component: AcercaDeComponent},
    {path: 'cotizador', component: CotizadorComponent},
    {path: '', component: HomeComponent},
    {path: '**', redirectTo: 'home'} // en caso de 404
];
