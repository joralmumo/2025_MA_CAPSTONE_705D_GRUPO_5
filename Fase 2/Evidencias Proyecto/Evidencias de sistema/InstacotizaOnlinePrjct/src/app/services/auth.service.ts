import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { IUsuarioGPD, IUsuarioP, ICotizacion } from "../pages/interfaces/interfaces";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  constructor(private httpclient: HttpClient) { }

  GetUserById(correo: any): Observable<any> {
    return this.httpclient.get(`${environment.apiUrl}/usuarios/?correo=${correo}`);
  }

  login(credentials: { correo: string; contrasena: string; }): Observable<any> {
    return this.httpclient.post(
      `${environment.apiUrl}/usuarios/login`,
      credentials
    );
  }

  register(user: any): Observable<any> {
    return this.httpclient.post(`${environment.apiUrl}/usuarios/register`, user);
  }

  IsLogged(){
    return sessionStorage.getItem('correo')!=null;
  }

  IsAdmin(){
    return sessionStorage.getItem('rol')==='admin';
  }

  }