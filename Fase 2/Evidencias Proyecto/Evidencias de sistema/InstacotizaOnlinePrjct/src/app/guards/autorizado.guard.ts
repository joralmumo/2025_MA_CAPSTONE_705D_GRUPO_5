import { Injectable, NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AutorizadoGuard {

  constructor(private router: Router,
              private authservice: AuthService){}

  canActivate():
    
    |Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if (!this.authservice.IsLogged()){
        alert("Acceso denegado. Por favor, inicie sesión.");
        this.router.navigateByUrl("/login");
        return false;
      }
    return true;
  }
  
}
