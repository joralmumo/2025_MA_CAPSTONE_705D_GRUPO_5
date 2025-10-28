import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICotizacion } from '../pages/interfaces/interfaces';

@Injectable({
  providedIn: 'root'
})
export class CotizacionSharedService {
  private cotizacionSeleccionada = new BehaviorSubject<ICotizacion | null>(null);
  public cotizacionSeleccionada$ = this.cotizacionSeleccionada.asObservable();

  setCotizacionSeleccionada(cotizacion: ICotizacion) {
    this.cotizacionSeleccionada.next(cotizacion);
  }

  clearCotizacionSeleccionada() {
    this.cotizacionSeleccionada.next(null);
  }
}
