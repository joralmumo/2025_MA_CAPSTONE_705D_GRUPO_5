import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { IUsuarioP } from '../interfaces/interfaces';
import { ApicrudService } from '../../services/apicrud.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  usuarioData: any;
  registerForm: FormGroup;
  
  isSubmitting = false;
  showSuccessMessage = false;
  errorMessage: string | null = null;

  newUsuario: IUsuarioP = {
    nombre: '',
    correo: '',
    contrasena: '',
    rol: 'user',
    isactive: true,
    cotizaciones: []
  };

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
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('contrasena')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  Enviar(): void {
    this.errorMessage = null;
    this.showSuccessMessage = false;

    if (!this.registerForm.valid) {
      this.errorMessage = 'Por favor completa todos los campos correctamente';
      return;
    }

    this.isSubmitting = true;

    // Verificar si el correo ya existe
    this.authService.GetUserById(this.registerForm.value.correo).subscribe({
      next: (resp) => {
        this.usuarioData = resp;

        if (this.usuarioData.length > 0) {
          this.errorMessage = 'El correo ya se encuentra registrado';
          this.isSubmitting = false;
          this.registerForm.reset();
          return;
        }

        // Crear nuevo usuario
        this.newUsuario = {
          nombre: this.registerForm.value.nombre,
          correo: this.registerForm.value.correo,
          contrasena: this.registerForm.value.contrasena,
          rol: 'user',
          isactive: true,
          cotizaciones: []
        };

        // Registrar usuario
        this.apiCrud.crearUsuario(this.newUsuario).subscribe({
          next: (response) => {
            this.showSuccessMessage = true;
            this.registerForm.reset();
            this.isSubmitting = false;

            // Redirigir a login después de 2 segundos
            setTimeout(() => {
              this.router.navigateByUrl('/login');
            }, 2000);
          },
          error: () => {
            this.showSuccessMessage = true;
            this.registerForm.reset();
            this.isSubmitting = false;

            setTimeout(() => {
              this.router.navigateByUrl('/login');
            }, 2000);
          }
        });
      },
      error: (error) => {
        this.errorMessage = 'Error al verificar usuario';
        this.isSubmitting = false;
        console.error('Error verificando usuario:', error);
      }
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    
    if (!field?.errors || !field?.touched) {
      return '';
    }

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['email']) return 'Email inválido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['pattern']) return 'Caracteres inválidos';
    
    return '';
  }
}