import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard {
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    // Primero verificar si está logueado
    if (!this.authService.IsLogged()) {
      alert("Acceso denegado. Por favor, inicie sesión.");
      this.router.navigateByUrl("/login");
      return false;
    }

    // Luego verificar si tiene rol de admin
    if (!this.authService.IsAdmin()) {
      alert("Acceso denegado. Necesitas permisos de administrador.");
      this.router.navigateByUrl("/home");
      return false;
    }

    return true;
  }
}
