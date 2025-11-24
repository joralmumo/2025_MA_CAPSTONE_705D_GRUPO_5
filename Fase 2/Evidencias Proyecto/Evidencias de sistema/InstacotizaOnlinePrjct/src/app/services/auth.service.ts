import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { IUsuarioGPD, IUsuarioP, ICotizacion } from "../pages/interfaces/interfaces";
import { environment } from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    
    // Opciones CORS pa que no falle la wea
    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        }),
        withCredentials: true 
    };

    constructor(private httpclient: HttpClient) { }

    GetUserById(correo: any): Observable<any> {
        return this.httpclient.get(
            `${environment.apiUrl}/usuarios/?correo=${correo}`,
            this.httpOptions
        );
    }

    login(credentials: { correo: string; contrasena: string; }): Observable<any> {
        return this.httpclient.post(
            `${environment.apiUrl}/usuarios/login`,
            credentials,
            this.httpOptions
        );
    }

    register(user: any): Observable<any> {
        return this.httpclient.post(
            `${environment.apiUrl}/usuarios/register`,
            user,
            this.httpOptions
        );
    }

    IsLogged() {
        return sessionStorage.getItem('correo') != null;
    }

    IsAdmin() {
        return sessionStorage.getItem('rol') === 'admin';
    }
}
