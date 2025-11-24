import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApicrudService } from '../../services/apicrud.service';
import { CotizacionSharedService } from '../../services/cotizacion-shared.service';
import { Router } from '@angular/router';
import { ICotizacion } from '../interfaces/interfaces';

/*
interface Cotizacion {
  _id?: string;
  nro_cotizacion: string;
  nombre_cliente: string;
  obra_cliente: string;
  fecha: string;
  fecha_creacion: string;
  moneda: string;
  productos: any[];
}
*/
@Component({
  selector: 'app-gestor-cotizaciones',
  imports: [CommonModule],
  templateUrl: './gestor-cotizaciones.component.html',
  styleUrl: './gestor-cotizaciones.component.css'
})
export class GestorCotizacionesComponent implements OnInit {
  
  cotizaciones: ICotizacion[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private apiCrud: ApicrudService,
              private cotizacionShared: CotizacionSharedService,
              private router: Router
  ) {}

  ngOnInit() {
    this.cargarCotizaciones();
  }

  cargarCotizacion(cotizacion: ICotizacion, index: number){
    const confirmar = confirm('¿Está seguro que desea cargar esta plantilla? Se reemplazarán todos los datos actuales de la cotización.');
    
    if (!confirmar) {
      return;
    }
    this.cotizacionShared.setCotizacionSeleccionada(cotizacion);
    this.router.navigate(['/cotizador-r']);
  }

  cargarCotizaciones() {
    //console.log('Cargando cotizaciones del usuario...');
    this.isLoading = true;
    this.error = null;

    const userId = sessionStorage.getItem('id');
    if (!userId) {
      this.error = 'No se encontró usuario logueado. Por favor, inicie sesión nuevamente.';
      this.isLoading = false;
      return;
    }

    this.apiCrud.buscarUsuarioPorId(userId).subscribe({
      next: (user) => {
        this.isLoading = false;
        if (user && user.cotizaciones && user.cotizaciones.length > 0) {
          this.cotizaciones = user.cotizaciones.map((cot: any) => ({
            _id: cot._id,
            nro_cotizacion: cot.nro_cotizacion || 'Sin número',
            nombre_empresa: cot.nombre_empresa || 'Sin Nombre',
            telefono_empresa: cot.telefono_empresa,
            rut_empresa: cot.telefono_empresa,
            email_empresa: cot.email_empresa,
            direccion_empresa: cot.direccion_empresa,
            nombre_cliente: cot.nombre_cliente || 'Sin cliente',
            obra_cliente: cot.obra_cliente || 'Sin obra',
            contacto_cliente: cot.contacto_cliente,
            email_cliente: cot.email_cliente,
            direccion_cliente: cot.direccion_cliente,
            fecha: cot.fecha || 'Sin fecha',
            fecha_creacion: cot.fecha_creacion || 'Sin fecha de creación',
            validez_oferta: cot.validez_oferta,
            forma_pago: cot.forma_pago,
            presupuesto_incluye: cot.presupuesto_incluye,
            moneda: cot.moneda || 'CLP',
            productos: cot.productos || []
          }));
          //console.log('Cotizaciones cargadas:', this.cotizaciones);
        } else {
          this.cotizaciones = [];
          //console.log('No se encontraron cotizaciones para este usuario');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.error = 'Error al cargar las cotizaciones. Por favor, intente nuevamente más tarde.';
        console.error('Error al buscar usuario:', error);
      }
    });
  }

  eliminarCotizacion(cotizacion: ICotizacion, index: number) {
    const confirmMessage = `¿Está seguro que desea eliminar la cotización "${cotizacion.nro_cotizacion}" del cliente "${cotizacion.nombre_cliente}"?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    const userId = sessionStorage.getItem('id');
    if (!userId) {
      alert('No se encontró usuario logueado. Por favor, inicie sesión nuevamente.');
      return;
    }

    // Mostrar cargando
    this.isLoading = true;

    console.log('Eliminando cotizacion:', {
      userId: userId,
      nro_cotizacion: cotizacion.nro_cotizacion
    });

    this.apiCrud.eliminarCotizacion(userId, index).subscribe({
      next: (response) => {
        //console.log('Cotización eliminada exitosamente:', response);
        this.cotizaciones.splice(index, 1);
        alert(`Cotización "${cotizacion.nro_cotizacion}" eliminada exitosamente.`);
        this.isLoading = false;
        this.recargarCotizaciones(); 
      },
      error: (error) => {
        //console.error('Error al eliminar cotización:', error);
        this.isLoading = false;
        
        // debugging, errores específicos
        if (error.status === 404) {
          alert('La cotización no fue encontrada. Puede que ya haya sido eliminada.');
        } else if (error.status === 500) {
          alert('Error del servidor. Por favor, intente nuevamente más tarde.');
        } else if (error.status === 0) {
          alert('Error de conexión. Verifique su conexión a internet.');
        } else {
          alert(`Error al eliminar cotización: ${error.message || 'Error desconocido'}`);
        }
        
        // Recargar cotizaciones 
        this.cargarCotizaciones();
      }
    });
  }


  calcularTotalCotizacion(productos: any[], moneda: string): string {
    const total = productos.reduce((acc, producto) => {
      const cantidad = producto.cantidad || 0;
      const valor = producto.valorUnitario || 0;
      return acc + (cantidad * valor);
    }, 0);

    const totalConIva = total * 1.19; // Incluir IVA

    return this.formatoMoneda(totalConIva, moneda);
  }

  private formatoMoneda(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency === 'CLP' ? 'CLP' : 'USD',
      minimumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Sin fecha';
    
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString('es-CL');
    } catch (error) {
      return fecha; // Devolver la fecha original si no se puede parsear
    }
  }

  recargarCotizaciones() {
    this.cargarCotizaciones();
  }
}
