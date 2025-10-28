import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorCotizacionesComponent } from './gestor-cotizaciones.component';

describe('GestorCotizacionesComponent', () => {
  let component: GestorCotizacionesComponent;
  let fixture: ComponentFixture<GestorCotizacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestorCotizacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestorCotizacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
