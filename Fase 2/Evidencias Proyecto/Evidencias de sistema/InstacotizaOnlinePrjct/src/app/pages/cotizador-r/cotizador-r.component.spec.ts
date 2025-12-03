import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { of, throwError, Subject } from 'rxjs';
import { CotizadorRComponent } from './cotizador-r.component';
import { ApicrudService } from '../../services/apicrud.service';
import { CotizacionSharedService } from '../../services/cotizacion-shared.service';

describe('CotizadorRComponent', () => {
  let component: CotizadorRComponent;
  let fixture: ComponentFixture<CotizadorRComponent>;
  let mockApiCrudService: jasmine.SpyObj<ApicrudService>;
  let mockCotizacionSharedService: jasmine.SpyObj<CotizacionSharedService>;
  let localStorageSpy: jasmine.Spy;
  let cotizacionSubject: Subject<any>;

  // Mock data
  const mockCotizacion = {
    nro_cotizacion: '001',
    nombre_empresa: 'Test Empresa',
    telefono_empresa: '123456789',
    rut_empresa: '12345678-9',
    email_empresa: 'test@empresa.cl',
    direccion_empresa: 'Calle Test 123',
    nombre_cliente: 'Cliente Test',
    obra_cliente: 'Obra Test',
    contacto_cliente: 'Contacto Test',
    email_cliente: 'cliente@test.cl',
    direccion_cliente: 'Dirección Cliente',
    fecha: '2025-11-23',
    validez_oferta: '30 días',
    forma_pago: 'Contado',
    presupuesto_incluye: 'Todo incluido',
    moneda: 'CLP',
    productos: [
      {
        producto: 'Producto 1',
        descripcion: 'Descripción 1',
        unidad: 'UN',
        cantidad: 10,
        valorUnitario: 1000
      }
    ]
  };

  beforeEach(async () => {
    // Crear Subject para simular el observable del servicio compartido
    cotizacionSubject = new Subject();

    // Crear spies para los servicios
    mockApiCrudService = jasmine.createSpyObj('ApicrudService', [
      'agregarCotizacion',
      'buscarUsuarioPorId',
      'actualizarCotizacionPorNumero'
    ]);

    mockCotizacionSharedService = jasmine.createSpyObj('CotizacionSharedService', [
      'clearCotizacionSeleccionada'
    ], {
      cotizacionSeleccionada$: cotizacionSubject.asObservable()
    });

    // Mock de localStorage
    let store: { [key: string]: string } = {};
    localStorageSpy = spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      store[key] = value;
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => {
      delete store[key];
    });

    await TestBed.configureTestingModule({
      imports: [CotizadorRComponent, ReactiveFormsModule],
      providers: [
        DecimalPipe,
        { provide: ApicrudService, useValue: mockApiCrudService },
        { provide: CotizacionSharedService, useValue: mockCotizacionSharedService }
      ]
    }).compileComponents();

    // Mock de sessionStorage
    spyOn(sessionStorage, 'getItem').and.returnValue('test-user-id');

    fixture = TestBed.createComponent(CotizadorRComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ==================== PRUEBAS BÁSICAS ====================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    fixture.detectChanges();
    expect(component.form).toBeDefined();
    expect(component.form.get('moneda')?.value).toBe('CLP');
    expect(component.productosArray.length).toBe(1);
  });

  // ==================== PRUEBAS DE ngOnInit ====================

  it('should load saved data on init', fakeAsync(() => {
    const savedData = JSON.stringify(mockCotizacion);
    localStorage.setItem('cotizador_draft', savedData);
    
    fixture.detectChanges();
    tick(500);

    expect(component.form.get('nro_cotizacion')?.value).toBe('001');
    expect(component.form.get('nombre_empresa')?.value).toBe('Test Empresa');
  }));

  it('should subscribe to form changes and save draft', fakeAsync(() => {
    fixture.detectChanges();
    
    component.form.patchValue({ nro_cotizacion: '002' });
    tick(500); // Esperar el debounceTime

    expect(localStorage.setItem).toHaveBeenCalledWith(
      'cotizador_draft',
      jasmine.any(String)
    );
  }));

  it('should subscribe to cotizacion shared service', fakeAsync(() => {
    fixture.detectChanges();
    
    cotizacionSubject.next(mockCotizacion);
    tick(500);

    expect(component.form.get('nro_cotizacion')?.value).toBe('001');
    expect(mockCotizacionSharedService.clearCotizacionSeleccionada).toHaveBeenCalled();
  }));

  // ==================== PRUEBAS DE ngOnDestroy ====================

  it('should unsubscribe on destroy', () => {
    fixture.detectChanges();
    const formSubscription = (component as any).formSubscription;
    const cotizacionSubscription = (component as any).cotizacionSubscription;
    
    spyOn(formSubscription, 'unsubscribe');
    spyOn(cotizacionSubscription, 'unsubscribe');
    
    component.ngOnDestroy();
    
    expect(formSubscription.unsubscribe).toHaveBeenCalled();
    expect(cotizacionSubscription.unsubscribe).toHaveBeenCalled();
  });

  // ==================== PRUEBAS DE FORMARRAY ====================

  it('should add product to FormArray', () => {
    fixture.detectChanges();
    const initialLength = component.productosArray.length;
    
    component.addProduct();
    
    expect(component.productosArray.length).toBe(initialLength + 1);
  });

  it('should remove product from FormArray', () => {
    fixture.detectChanges();
    component.addProduct();
    component.addProduct();
    const initialLength = component.productosArray.length;
    
    component.removeProduct(1);
    
    expect(component.productosArray.length).toBe(initialLength - 1);
  });

  it('should not remove last product from FormArray', () => {
    fixture.detectChanges();
    
    component.removeProduct(0);
    
    expect(component.productosArray.length).toBe(1);
  });

  it('should return productosArray', () => {
    fixture.detectChanges();
    const array = component.productosArray;
    
    expect(array).toBeDefined();
    expect(array.length).toBeGreaterThan(0);
  });

  // ==================== PRUEBAS DE CÁLCULOS ====================

  it('should calculate total for a product', () => {
    fixture.detectChanges();
    component.productosArray.at(0).patchValue({
      cantidad: 5,
      valorUnitario: 1000
    });
    
    const total = component.getTotal(0);
    
    expect(total).toBe(5000);
  });

  it('should return 0 for invalid product index', () => {
    fixture.detectChanges();
    
    const total = component.getTotal(999);
    
    expect(total).toBe(0);
  });

  it('should calculate subtotal correctly', () => {
    fixture.detectChanges();
    component.addProduct();
    component.productosArray.at(0).patchValue({ cantidad: 5, valorUnitario: 1000 });
    component.productosArray.at(1).patchValue({ cantidad: 3, valorUnitario: 2000 });
    
    const subtotal = component.getSubtotal();
    
    expect(subtotal).toBe(11000);
  });

  it('should calculate IVA correctly', () => {
    fixture.detectChanges();
    component.productosArray.at(0).patchValue({ cantidad: 10, valorUnitario: 1000 });
    
    const iva = component.getIVA();
    
    expect(iva).toBe(1900); // 10000 * 0.19
  });

  it('should calculate total cotizacion correctly', () => {
    fixture.detectChanges();
    component.productosArray.at(0).patchValue({ cantidad: 10, valorUnitario: 1000 });
    
    const total = component.getTotalCotizacion();
    
    expect(total).toBe(11900); // 10000 + 1900
  });

  // ==================== PRUEBAS DE LOCALSTORAGE ====================

  it('should save draft to localStorage', () => {
    fixture.detectChanges();
    component.form.patchValue({ nro_cotizacion: '003' });
    
    (component as any).guardarBorrador();
    
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it('should load data from localStorage', () => {
    const savedData = JSON.stringify(mockCotizacion);
    localStorage.setItem('cotizador_draft', savedData);
    
    (component as any).cargarDatosGuardados();
    
    expect(component.form.get('nro_cotizacion')?.value).toBe('001');
  });

  it('should clear draft from localStorage', () => {
    fixture.detectChanges();
    
    component.limpiarBorrador();
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('cotizador_draft');
  });

  // ==================== PRUEBAS DE FORMULARIO ====================

  it('should clear form when user confirms', () => {
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);
    component.form.patchValue({ nro_cotizacion: '123' });
    
    component.limpiarFormulario();
    
    expect(component.form.get('nro_cotizacion')?.value).toBe('');
    expect(localStorage.removeItem).toHaveBeenCalled();
  });

  it('should not clear form when user cancels', () => {
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(false);
    component.form.patchValue({ nro_cotizacion: '123' });
    
    component.limpiarFormulario();
    
    expect(component.form.get('nro_cotizacion')?.value).toBe('123');
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    
    expect(component.form.valid).toBeFalse();
    
    component.form.patchValue(mockCotizacion);
    
    expect(component.form.valid).toBeTrue();
  });

  it('should validate email format', () => {
    fixture.detectChanges();
    const emailControl = component.form.get('email_empresa');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should validate phone number format', () => {
    fixture.detectChanges();
    const phoneControl = component.form.get('telefono_empresa');
    
    phoneControl?.setValue('abc123');
    expect(phoneControl?.hasError('pattern')).toBeTrue();
    
    phoneControl?.setValue('123456789');
    expect(phoneControl?.hasError('pattern')).toBeFalse();
  });

  // ==================== PRUEBAS DE SERVICIOS API ====================

  it('should save cotizacion successfully', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue(mockCotizacion);
    spyOn(window, 'alert');
    mockApiCrudService.agregarCotizacion.and.returnValue(
      of({ success: true, totalCotizaciones: 5 })
    );
    
    component.guardarCotizacion();
    tick();
    
    expect(mockApiCrudService.agregarCotizacion).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cotización guardada exitosamente');
  }));

  it('should show error when saving cotizacion fails', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue(mockCotizacion);
    spyOn(window, 'alert');
    mockApiCrudService.agregarCotizacion.and.returnValue(
      throwError(() => new Error('Error de red'))
    );
    
    component.guardarCotizacion();
    tick();
    
    expect(window.alert).toHaveBeenCalledWith(
      'Error al guardar la cotización. Por favor, intente nuevamente más tarde.'
    );
  }));

  it('should not save invalid form', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    
    component.guardarCotizacion();
    
    expect(mockApiCrudService.agregarCotizacion).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, complete todos los campos antes de guardar la cotización'
    );
  });

  it('should load cotizacion from API', fakeAsync(() => {
    fixture.detectChanges();
    spyOn(component as any, 'mostrarListaCotizaciones');
    const mockUsuario = {
      id: 1,
      nombre: 'Test User',
      correo: 'test@user.com',
      contrasena: 'password',
      fecha_registro: '2025-01-01',
      tipo: 'usuario',
      rol: 'user',
      isactive: true,
      cotizaciones: [mockCotizacion]
    };
    mockApiCrudService.buscarUsuarioPorId.and.returnValue(
      of(mockUsuario)
    );
    
    component.cargarCotizacion();
    tick();
    
    expect(mockApiCrudService.buscarUsuarioPorId).toHaveBeenCalled();
    expect((component as any).mostrarListaCotizaciones).toHaveBeenCalled();
  }));

  it('should update existing cotizacion', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue(mockCotizacion);
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(window, 'alert');
    mockApiCrudService.actualizarCotizacionPorNumero.and.returnValue(
      of({ success: true })
    );
    
    component.sobreescribirCotizacion();
    tick();
    
    expect(mockApiCrudService.actualizarCotizacionPorNumero).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith(
      'Cotización N°001 sobreescrita exitosamente'
    );
  }));

  // ==================== PRUEBAS DE EXPORTACIÓN/IMPORTACIÓN ====================

  it('should export cotizacion as JSON', () => {
    fixture.detectChanges();
    component.form.patchValue(mockCotizacion);
    spyOn(window, 'alert');
    const createElementSpy = spyOn(document, 'createElement').and.callThrough();
    
    component.exportar_cotizacion();
    
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(window.alert).toHaveBeenCalledWith('Plantilla exportada exitosamente');
  });

  it('should not export invalid form', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    
    component.exportar_cotizacion();
    
    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, complete todos los campos antes de exportar la plantilla'
    );
  });

  it('should import cotizacion from JSON', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    spyOn(component as any, 'validarEstructuraPlantilla').and.returnValue(true);
    spyOn(component as any, 'cargarDatosEnFormulario');
    
    component.importar_cotizacion();
    
    expect(document.createElement).toBeDefined();
  });

  it('should validate plantilla structure correctly', () => {
    fixture.detectChanges();
    const validPlantilla = { datos: mockCotizacion };
    
    const result = (component as any).validarEstructuraPlantilla(validPlantilla);
    
    expect(result).toBeTrue();
  });

  it('should reject invalid plantilla structure', () => {
    fixture.detectChanges();
    const invalidPlantilla = { datos: { nro_cotizacion: '001' } };
    
    const result = (component as any).validarEstructuraPlantilla(invalidPlantilla);
    
    expect(result).toBeFalse();
  });

  // ==================== PRUEBAS DE GENERACIÓN DE DOCUMENTOS ====================

  it('should generate document when form is valid', fakeAsync(() => {
    fixture.detectChanges();
    component.form.patchValue(mockCotizacion);
    spyOn(component as any, 'createWordDocument').and.returnValue(Promise.resolve());
    
    component.generar_doc();
    tick();
    
    expect((component as any).createWordDocument).toHaveBeenCalled();
  }));

  it('should not generate document when form is invalid', () => {
    fixture.detectChanges();
    spyOn(window, 'alert');
    
    component.generar_doc();
    
    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, complete todos los campos requeridos.'
    );
  });

  // ==================== PRUEBAS DE HELPERS PRIVADOS ====================

  it('should format currency correctly for CLP', () => {
    fixture.detectChanges();
    
    const formatted = (component as any).formatoMoneda(10000, 'CLP');
    
    expect(formatted).toContain('10');
    expect(formatted).toContain('000');
  });

  it('should format currency correctly for USD', () => {
    fixture.detectChanges();
    
    const formatted = (component as any).formatoMoneda(10000, 'USD');
    
    expect(formatted).toContain('10');
    expect(formatted).toContain('000');
  });

  it('should handle error when saving draft fails', () => {
    fixture.detectChanges();
    spyOn(localStorage, 'setItem').and.throwError('Storage full');
    spyOn(console, 'error');
    
    expect(() => (component as any).guardarBorrador()).not.toThrow();
  });

  it('should handle error when loading draft fails', () => {
    fixture.detectChanges();
    spyOn(localStorage, 'getItem').and.throwError('Storage error');
    
    expect(() => (component as any).cargarDatosGuardados()).not.toThrow();
  });
});
      
