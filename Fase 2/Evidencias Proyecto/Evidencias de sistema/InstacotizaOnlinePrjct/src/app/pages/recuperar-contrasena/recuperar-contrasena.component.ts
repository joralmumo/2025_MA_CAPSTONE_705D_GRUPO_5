import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApicrudService } from '../../services/apicrud.service';

@Component({
  selector: 'app-recuperar-contrasena',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css'
})
export class RecuperarContrasenaComponent {
  paso: number = 1; // 1: solicitar código, 2: ingresar código, 3: cambiar contraseña
  correoForm: FormGroup;
  codigoForm: FormGroup;
  contrasenaForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  correoGuardado: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private apiCrud: ApicrudService,
    private router: Router
  ) {
    // Formulario para solicitar código
    this.correoForm = this.formBuilder.group({
      correo: ['', [Validators.required, Validators.email]]
    });

    // Formulario para ingresar código
    this.codigoForm = this.formBuilder.group({
      codigo: ['', [Validators.required, Validators.pattern(/^\d{4}$/), Validators.minLength(4), Validators.maxLength(4)]]
    });

    // Formulario para nueva contraseña
    this.contrasenaForm = this.formBuilder.group({
      nuevaContrasena: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('nuevaContrasena')?.value;
    const confirmPassword = group.get('confirmarContrasena')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  // Paso 1: Solicitar código
  solicitarCodigo(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.correoForm.invalid) {
      this.errorMessage = 'Por favor ingresa un correo válido';
      return;
    }

    this.isSubmitting = true;
    this.correoGuardado = this.correoForm.value.correo;

    this.apiCrud.solicitarCodigoRecuperacion(this.correoGuardado).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Si el correo existe, recibirás un código de 4 dígitos';
        setTimeout(() => {
          this.paso = 2;
          this.successMessage = null;
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = 'Error al enviar código. Intenta nuevamente';
        console.error('Error:', error);
      }
    });
  }

  // Paso 2: Verificar código
  verificarCodigo(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.codigoForm.invalid) {
      this.errorMessage = 'Por favor ingresa un código de 4 dígitos';
      return;
    }

    this.isSubmitting = true;

    this.apiCrud.verificarCodigoRecuperacion(
      this.correoGuardado, 
      this.codigoForm.value.codigo
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Código verificado. Ahora ingresa tu nueva contraseña';
        setTimeout(() => {
          this.paso = 3;
          this.successMessage = null;
        }, 1500);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Código inválido o expirado';
        console.error('Error:', error);
      }
    });
  }

  // Paso 3: Cambiar contraseña
  cambiarContrasena(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.contrasenaForm.invalid) {
      if (this.contrasenaForm.errors?.['passwordMismatch']) {
        this.errorMessage = 'Las contraseñas no coinciden';
      } else {
        this.errorMessage = 'Por favor completa todos los campos correctamente';
      }
      return;
    }

    this.isSubmitting = true;

    this.apiCrud.cambiarContrasenaConCodigo(
      this.correoGuardado,
      this.codigoForm.value.codigo,
      this.contrasenaForm.value.nuevaContrasena
    ).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = '¡Contraseña actualizada exitosamente! Redirigiendo...';
        setTimeout(() => {
          sessionStorage.clear();
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage = error.error?.message || 'Error al cambiar contraseña';
        console.error('Error:', error);
      }
    });
  }

  volverAPaso(numeroPaso: number): void {
    this.paso = numeroPaso;
    this.errorMessage = null;
    this.successMessage = null;
  }

  isLoggedIn(): boolean {
    return sessionStorage.getItem('ingresado') === 'true';
  }
}
