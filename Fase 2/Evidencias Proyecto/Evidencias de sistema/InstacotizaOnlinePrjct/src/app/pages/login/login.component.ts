import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder, ReactiveFormsModule} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent{

  usuarioData: any;

  usuario = {
    id: 0,
    nombre: '',
    correo: '',
    contrasena: '',
    rol: '',
    isactive: true,
    cotizaciones: []
  };

  loginForm: FormGroup;

  constructor(
    private router: Router,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ){
    this.loginForm = this.formBuilder.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]]
    });
  }

  ngOnInit() {}

  IniciarSesion() {
    if (this.loginForm.valid) {
      const creds = this.loginForm.value;
      this.authService.login(creds).subscribe({
        next: ({ success, user, token }) => {
          if (success) {
            const userId = user.id;
            sessionStorage.setItem('id', userId);
            // Guarda datos en sessionStorage
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('correo', user.correo);
            sessionStorage.setItem('nombre', user.nombre);
            sessionStorage.setItem('rol', user.rol);
            sessionStorage.setItem('ingresado', 'true');
            this.router.navigateByUrl('/cotizador-r');
            sessionStorage.removeItem('token')
            toast.success('Sesión Iniciada');
          } else {
            toast.error('Credenciales inválidas');
          }
        },
        error: () => toast.error('El usuario no existe o sus credenciales son incorrectas')
      });
    }
  }
}
