import { Component, OnInit } from '@angular/core';
import { ApicrudService } from '../../services/apicrud.service';
import { IUsuarioGPD } from '../interfaces/interfaces';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  usuarios: IUsuarioGPD[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private apiCrud: ApicrudService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  trackById(index: number, usuario: IUsuarioGPD): number {
    return usuario.id;
  }

  cargarUsuarios() {
    console.log('cargarUsuarios() invocado');
    this.isLoading = true;
    this.error = null;
    this.apiCrud.listarUsuarios().subscribe({
      next: (data) => {
        console.log('usuarios recibidos:', data);
        this.usuarios = data.users;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.error = 'Error al cargar los usuarios. Intente nuevamente.';
        this.isLoading = false;
      }
    });
  }

  eliminar(usuario: IUsuarioGPD, index: number) {
    const confirmMsg = `¿Eliminar al usuario "${usuario.nombre}" (correo: ${usuario.correo})?`;
    if (!confirm(confirmMsg)) {
      return;
    }
    this.isLoading = true;
    
    this.apiCrud.eliminarUsuario(usuario.id.toString()).subscribe({
      next: () => {
        this.usuarios.splice(index, 1);
        this.isLoading = false;
        alert('Usuario eliminado correctamente.');
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
        alert('Error al eliminar usuario.');
        this.isLoading = false;
      }
    });
  }
}
