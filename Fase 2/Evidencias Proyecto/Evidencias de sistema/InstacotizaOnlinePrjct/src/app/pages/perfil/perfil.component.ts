import { Component } from '@angular/core';
import { IUsuarioGPD } from '../interfaces/interfaces';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApicrudService } from '../../services/apicrud.service';

@Component({
  selector: 'app-perfil',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {
  usuario: IUsuarioGPD | null = null;
  cargando = true;
  editandoPerfil = false;
  usuarioEditor: FormGroup;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private api: ApicrudService,
    private formBuilder: FormBuilder
  ) {
    // Inicializar el formulario con validaciones
    this.usuarioEditor = this.formBuilder.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {
    this.cargarPerfilUsuario();
  }

  cargarPerfilUsuario() {
    const correoUsuario = sessionStorage.getItem('correo');
    
    if (!correoUsuario) {
      this.router.navigate(['/login']);
      return;
    }

    this.authService.GetUserById(correoUsuario).subscribe({
      next: (response) => {
        if (response && response.length > 0) {
          this.usuario = response[0];
          console.log('Usuario cargado:', this.usuario);
        }
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar el perfil:', error);
        this.cargando = false;
      }
    });
  }

  iniciarEdicion() {
    this.editandoPerfil = true;
    
    // Cargar datos actuales del usuario en el formulario
    if (this.usuario) {
      this.usuarioEditor.patchValue({
        nombre: this.usuario.nombre,
        correo: this.usuario.correo
      });
    }
  }

  cancelarEdicion() {
    this.editandoPerfil = false;
    
    // Resetear el formulario
    this.usuarioEditor.reset();
  }

  guardarCambios() {
    if (this.usuarioEditor.invalid) {
      alert('Por favor, complete correctamente todos los campos');
      return;
    }

    const userId = sessionStorage.getItem('id');
    
    if (!userId || !this.usuario) {
      alert('Error: No se pudo obtener la información del usuario');
      return;
    }

    // Crear objeto con los datos actualizados
    const datosActualizados: IUsuarioGPD = {
      ...this.usuario,
      nombre: this.usuarioEditor.value.nombre,
      correo: this.usuarioEditor.value.correo
    };

    console.log('Actualizando usuario con:', datosActualizados);

    // Llamar al servicio de actualización
    this.api.actualizarUsuario(userId, datosActualizados).subscribe({
      next: (response) => {
        console.log('Usuario actualizado exitosamente:', response);
        alert('Perfil actualizado exitosamente');
        
        // Actualizar sessionStorage si cambió el correo
        if (datosActualizados.correo !== this.usuario?.correo) {
          sessionStorage.setItem('correo', datosActualizados.correo);
        }
        
        // Actualizar el objeto local
        this.usuario = datosActualizados;
        this.editandoPerfil = false;
        
        // Recargar el perfil para obtener datos frescos
        this.cargarPerfilUsuario();
      },
      error: (error) => {
        console.error('Error al actualizar el perfil:', error);
        
        if (error.status === 400 && error.error?.message?.includes('correo')) {
          alert('El correo ya está en uso por otro usuario');
        } else {
          alert('Error al actualizar el perfil. Por favor, intente nuevamente.');
        }
      }
    });
  }

  obtenerIniciales(): string {
    if (!this.usuario?.nombre) return 'U';
    
    const nombres = this.usuario.nombre.split(' ');
    if (nombres.length >= 2) {
      return (nombres[0][0] + nombres[1][0]).toUpperCase();
    }
    return nombres[0][0].toUpperCase();
  }
}
