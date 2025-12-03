import { Component, inject } from '@angular/core';
import { RouterLinkActive, RouterLink, RouterOutlet, Router } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { toast } from 'ngx-sonner';
// import { inject as injectAnalytics } from '@vercel/analytics';

// injectAnalytics();

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgxSonnerToaster],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'InstacotizaRequeteOnline';
  constructor(
              private router: Router
  ) {}
  consoleDebug() {
    console.log('AppComponent loaded');
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('ingresado') === 'true';
  }
  isAdmin(): boolean {
    return sessionStorage.getItem('rol') === 'admin';
  }

  cerrarSesion() {
    sessionStorage.clear();
    toast.success('Sesión cerrada exitosamente');
    this.router.navigateByUrl('/login');
  }

  getUserName(): string {
    const nombre = sessionStorage.getItem('nombre');
    if (!nombre) return 'Usuario';
    
    // Retornar solo el primer nombre
    const primerNombre = nombre.split(' ')[0];
    return primerNombre;
  }

  getInitials(): string {
    const nombre = sessionStorage.getItem('nombre');
    if (!nombre) return 'U';
    
    const nombres = nombre.split(' ');
    if (nombres.length >= 2) {
      return (nombres[0][0] + nombres[1][0]).toUpperCase();
    }
    return nombres[0][0].toUpperCase();
  }
}
