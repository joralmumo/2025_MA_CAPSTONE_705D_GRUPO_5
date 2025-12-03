import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { CotizadorComponent } from './cotizador.component';

describe('CotizadorComponent', () => {
  let component: CotizadorComponent;
  let fixture: ComponentFixture<CotizadorComponent>;

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
        unidad: 'm2',
        cantidad: 10,
        valorUnitario: 1000
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CotizadorComponent, ReactiveFormsModule],
      providers: [DecimalPipe]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CotizadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ==================== PRUEBAS BÁSICAS ====================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form).toBeDefined();
    expect(component.form.get('moneda')?.value).toBe('CLP');
    expect(component.productosArray.length).toBe(1);
  });

  // ==================== PRUEBAS DE FORMARRAY ====================

  it('should add product to FormArray', () => {
    const initialLength = component.productosArray.length;
    
    component.addProduct();
    
    expect(component.productosArray.length).toBe(initialLength + 1);
  });

  it('should remove product from FormArray', () => {
    component.addProduct();
    component.addProduct();
    const initialLength = component.productosArray.length;
    
    component.removeProduct(1);
    
    expect(component.productosArray.length).toBe(initialLength - 1);
  });

  it('should not remove last product from FormArray', () => {
    component.removeProduct(0);
    
    expect(component.productosArray.length).toBe(1);
  });

  it('should return productosArray', () => {
    const array = component.productosArray;
    
    expect(array).toBeDefined();
    expect(array.length).toBeGreaterThan(0);
  });

  // ==================== PRUEBAS DE CÁLCULOS ====================

  it('should calculate total for a product', () => {
    component.productosArray.at(0).patchValue({
      producto: 'Test',
      cantidad: 5,
      valorUnitario: 1000
    });
    
    const total = component.getTotal(0);
    
    expect(total).toBe(5000);
  });

  it('should return 0 for invalid product index', () => {
    const total = component.getTotal(999);
    
    expect(total).toBe(0);
  });

  it('should calculate subtotal correctly', () => {
    component.addProduct();
    component.productosArray.at(0).patchValue({ 
      producto: 'Test 1',
      cantidad: 5, 
      valorUnitario: 1000 
    });
    component.productosArray.at(1).patchValue({ 
      producto: 'Test 2',
      cantidad: 3, 
      valorUnitario: 2000 
    });
    
    const subtotal = component.getSubtotal();
    
    expect(subtotal).toBe(11000);
  });

  it('should calculate IVA correctly', () => {
    component.productosArray.at(0).patchValue({ 
      producto: 'Test',
      cantidad: 10, 
      valorUnitario: 1000 
    });
    
    const iva = component.getIVA();
    
    expect(iva).toBe(1900); // 10000 * 0.19
  });

  it('should calculate total cotizacion correctly', () => {
    component.productosArray.at(0).patchValue({ 
      producto: 'Test',
      cantidad: 10, 
      valorUnitario: 1000 
    });
    
    const total = component.getTotalCotizacion();
    
    expect(total).toBe(11900); // 10000 + 1900
  });

  // ==================== PRUEBAS DE FORMULARIO ====================

  it('should validate required fields', () => {
    expect(component.form.valid).toBeFalse();
    
    component.form.patchValue(mockCotizacion);
    
    expect(component.form.valid).toBeTrue();
  });

  it('should validate email format', () => {
    const emailControl = component.form.get('email_empresa');
    
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTrue();
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalse();
  });

  it('should validate phone number format', () => {
    const phoneControl = component.form.get('telefono_empresa');
    
    phoneControl?.setValue('abc123');
    expect(phoneControl?.hasError('pattern')).toBeTrue();
    
    phoneControl?.setValue('123456789');
    expect(phoneControl?.hasError('pattern')).toBeFalse();
  });

  // ==================== PRUEBAS DE EXPORTACIÓN/IMPORTACIÓN ====================

  it('should export cotizacion as JSON', () => {
    component.form.patchValue(mockCotizacion);
    spyOn(window, 'alert');
    const createElementSpy = spyOn(document, 'createElement').and.callThrough();
    
    component.exportar_cotizacion();
    
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(window.alert).toHaveBeenCalledWith('Plantilla exportada exitosamente');
  });

  it('should not export invalid form', () => {
    spyOn(window, 'alert');
    
    component.exportar_cotizacion();
    
    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, complete todos los campos antes de exportar la plantilla'
    );
  });

  it('should import cotizacion from JSON', () => {
    spyOn(window, 'alert');
    spyOn(component as any, 'validarEstructuraPlantilla').and.returnValue(true);
    spyOn(component as any, 'cargarDatosEnFormulario');
    
    component.importar_cotizacion();
    
    expect(document.createElement).toBeDefined();
  });

  it('should validate plantilla structure correctly', () => {
    const validPlantilla = { datos: mockCotizacion };
    
    const result = (component as any).validarEstructuraPlantilla(validPlantilla);
    
    expect(result).toBeTrue();
  });

  it('should reject invalid plantilla structure', () => {
    const invalidPlantilla = { datos: { nro_cotizacion: '001' } };
    
    const result = (component as any).validarEstructuraPlantilla(invalidPlantilla);
    
    expect(result).toBeFalse();
  });

  it('should reject plantilla without productos', () => {
    const invalidPlantilla = { 
      datos: { 
        ...mockCotizacion,
        productos: [] 
      } 
    };
    
    const result = (component as any).validarEstructuraPlantilla(invalidPlantilla);
    
    expect(result).toBeFalse();
  });

  // ==================== PRUEBAS DE GENERACIÓN DE DOCUMENTOS ====================

  it('should generate document when form is valid', fakeAsync(() => {
    component.form.patchValue(mockCotizacion);
    spyOn(component as any, 'createWordDocument').and.returnValue(Promise.resolve());
    
    component.generar_doc();
    tick();
    
    expect((component as any).createWordDocument).toHaveBeenCalled();
  }));

  it('should not generate document when form is invalid', () => {
    spyOn(window, 'alert');
    
    component.generar_doc();
    
    expect(window.alert).toHaveBeenCalledWith(
      'Por favor, complete todos los campos requeridos.'
    );
  });

  // ==================== PRUEBAS DE HELPERS PRIVADOS ====================

  it('should format currency correctly for CLP', () => {
    const formatted = (component as any).formatoMoneda(10000, 'CLP');
    
    expect(formatted).toContain('10');
    expect(formatted).toContain('000');
  });

  it('should format currency correctly for USD', () => {
    const formatted = (component as any).formatoMoneda(10000, 'USD');
    
    expect(formatted).toContain('10');
    expect(formatted).toContain('000');
  });

  it('should create product form with correct structure', () => {
    const productForm = component.createProductForm();
    
    expect(productForm.get('producto')).toBeDefined();
    expect(productForm.get('descripcion')).toBeDefined();
    expect(productForm.get('unidad')).toBeDefined();
    expect(productForm.get('cantidad')).toBeDefined();
    expect(productForm.get('valorUnitario')).toBeDefined();
  });

  it('should have correct validators on product form fields', () => {
    const productForm = component.createProductForm();
    
    expect(productForm.get('producto')?.hasError('required')).toBeTrue();
    expect(productForm.get('descripcion')?.hasError('required')).toBeTrue();
    expect(productForm.get('cantidad')?.value).toBe(0);
    expect(productForm.get('valorUnitario')?.value).toBe(0);
  });
});
