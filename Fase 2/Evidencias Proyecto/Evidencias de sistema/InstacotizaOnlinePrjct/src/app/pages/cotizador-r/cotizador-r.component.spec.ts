import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CotizadorRComponent } from './cotizador-r.component';

describe('CotizadorRComponent', () => {
  let component: CotizadorRComponent;
  let fixture: ComponentFixture<CotizadorRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CotizadorRComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CotizadorRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
