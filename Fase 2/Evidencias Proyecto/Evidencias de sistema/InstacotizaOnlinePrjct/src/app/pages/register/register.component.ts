// RegisterComponent corregido completamente:
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { IUsuarioP } from '../interfaces/interfaces';
import { ApicrudService } from '../../services/apicrud.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  usuarioData: any;
  newUsuario: IUsuarioP = {
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'user',
    isactive: true,
    cotizaciones: []
  }; 

  registerForm: FormGroup;

  constructor(
    private router: Router,
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private apiCrud: ApicrudService
  ) {
    this.registerForm = this.formBuilder.group({
      nombre: ['', [
        Validators.required, 
        Validators.minLength(1),
        Validators.maxLength(80),
        Validators.pattern('^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]*$')
      ]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [
        Validators.required, 
        Validators.minLength(6), 
        Validators.maxLength(20)
      ]]
    });
  }

  Enviar() {
    console.log("REGISTRANDO USUARIO...!");
    
    if (this.registerForm.valid) {
      this.authService.GetUserById(this.registerForm.value.correo).subscribe({
        next: (resp) => {
          this.usuarioData = resp;
          console.log(this.usuarioData);
          
          if (this.usuarioData.length > 0) {
            alert("El correo ya se encuentra registrado");
            this.registerForm.reset();
          } else { 
            this.newUsuario = {
              nombre: this.registerForm.value.nombre,
              correo: this.registerForm.value.correo,
              contrasena: this.registerForm.value.contrasena,
              rol: 'user',
              isactive: true,
              cotizaciones: []
            }; 

            this.apiCrud.crearUsuario(this.newUsuario).subscribe({
              next: (response) => {
                console.log('Usuario registrado:', response);
                alert("Usuario registrado exitosamente");
                this.registerForm.reset();
                this.router.navigateByUrl('/login');
              },
              error: (error) => {
                console.error('Error:', error);
                alert("Error al registrar usuario");
              }
            });
          }
        },
        error: (error) => {
          console.error('Error verificando usuario:', error);
          alert("Error al verificar usuario");
        }
      });
    } else {
      alert("Formulario inválido, por favor verifique los datos");
    }
  }
}
