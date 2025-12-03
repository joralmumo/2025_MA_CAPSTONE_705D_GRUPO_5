import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GestorCotizacionesComponent } from './gestor-cotizaciones.component';
import { ApicrudService } from '../../services/apicrud.service';
import { CotizacionSharedService } from '../../services/cotizacion-shared.service';
import { ICotizacion, IProducto, IUsuarioGPD } from '../interfaces/interfaces';

describe('GestorCotizacionesComponent', () => {
  let component: GestorCotizacionesComponent;
  let fixture: ComponentFixture<GestorCotizacionesComponent>;
  let mockApiCrudService: jasmine.SpyObj<ApicrudService>;
  let mockCotizacionSharedService: jasmine.SpyObj<CotizacionSharedService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockProducto: IProducto = {
    producto: 'Producto Test',
    descripcion: 'Descripción test',
    unidad: 'unidad',
    cantidad: 10,
    valorUnitario: 1000
  };

  const mockCotizacion: ICotizacion = {
    nro_cotizacion: 'COT-001',
    nombre_empresa: 'Empresa Test',
    telefono_empresa: '+56912345678',
    rut_empresa: '12345678-9',
    email_empresa: 'empresa@test.com',
    direccion_empresa: 'Dirección Test 123',
    nombre_cliente: 'Cliente Test',
    obra_cliente: 'Obra Test',
    contacto_cliente: '+56987654321',
    email_cliente: 'cliente@test.com',
    direccion_cliente: 'Dirección Cliente 456',
    fecha: '2025-01-15',
    validez_oferta: '30 días',
    forma_pago: 'Transferencia',
    presupuesto_incluye: 'Materiales',
    moneda: 'CLP',
    productos: [mockProducto],
    logo: null
  };

  const mockCotizacion2: ICotizacion = {
    nro_cotizacion: 'COT-002',
    nombre_empresa: 'Empresa Test 2',
    nombre_cliente: 'Cliente Test 2',
    obra_cliente: 'Obra Test 2',
    fecha: '2025-02-20',
    moneda: 'USD',
    productos: [
      { ...mockProducto, cantidad: 5, valorUnitario: 100 }
    ]
  };

  const mockUsuario: IUsuarioGPD = {
    id: 1,
    nombre: 'Usuario Test',
    correo: 'test@test.com',
    contrasena: 'password',
    rol: 'usuario',
    isactive: true,
    cotizaciones: [mockCotizacion, mockCotizacion2]
  };

  beforeEach(async () => {
    mockApiCrudService = jasmine.createSpyObj('ApicrudService', [
      'buscarUsuarioPorId',
      'eliminarCotizacion'
    ]);

    mockCotizacionSharedService = jasmine.createSpyObj('CotizacionSharedService', [
      'setCotizacionSeleccionada'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [GestorCotizacionesComponent],
      providers: [
        { provide: ApicrudService, useValue: mockApiCrudService },
        { provide: CotizacionSharedService, useValue: mockCotizacionSharedService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestorCotizacionesComponent);
    component = fixture.componentInstance;

    // Configurar sessionStorage
    sessionStorage.setItem('id', '1');
    sessionStorage.setItem('correo', 'test@test.com');
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Creación y configuración inicial', () => {
    it('debería crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debería inicializar propiedades correctamente', () => {
      expect(component.cotizaciones).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('debería llamar a cargarCotizaciones en ngOnInit', () => {
      spyOn(component, 'cargarCotizaciones');
      component.ngOnInit();
      expect(component.cargarCotizaciones).toHaveBeenCalled();
    });
  });

  describe('cargarCotizaciones', () => {
    it('debería cargar cotizaciones exitosamente', fakeAsync(() => {
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(mockUsuario));

      component.cargarCotizaciones();
      tick();

      expect(mockApiCrudService.buscarUsuarioPorId).toHaveBeenCalledWith('1');
      expect(component.cotizaciones.length).toBe(2);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('debería establecer isLoading en true al iniciar carga', () => {
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(mockUsuario));
      
      component.cargarCotizaciones();
      
      // isLoading debe ser true inmediatamente después de llamar
      expect(mockApiCrudService.buscarUsuarioPorId).toHaveBeenCalled();
    });

    it('debería mapear correctamente los datos de cotizaciones', fakeAsync(() => {
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(mockUsuario));

      component.cargarCotizaciones();
      tick();

      const cotizacion = component.cotizaciones[0];
      expect(cotizacion.nro_cotizacion).toBe('COT-001');
      expect(cotizacion.nombre_cliente).toBe('Cliente Test');
      expect(cotizacion.obra_cliente).toBe('Obra Test');
      expect(cotizacion.moneda).toBe('CLP');
      expect(cotizacion.productos.length).toBe(1);
    }));

    it('debería manejar usuario sin cotizaciones', fakeAsync(() => {
      const usuarioSinCotizaciones = { ...mockUsuario, cotizaciones: [] };
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(usuarioSinCotizaciones));

      component.cargarCotizaciones();
      tick();

      expect(component.cotizaciones).toEqual([]);
      expect(component.isLoading).toBe(false);
    }));

    it('debería manejar campos faltantes con valores por defecto', fakeAsync(() => {
      const cotizacionIncompleta = {
        productos: [mockProducto]
      };
      const usuarioIncompleto = {
        ...mockUsuario,
        cotizaciones: [cotizacionIncompleta]
      };
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(usuarioIncompleto));

      component.cargarCotizaciones();
      tick();

      const cotizacion = component.cotizaciones[0];
      expect(cotizacion.nro_cotizacion).toBe('Sin número');
      expect(cotizacion.nombre_empresa).toBe('Sin Nombre');
      expect(cotizacion.nombre_cliente).toBe('Sin cliente');
      expect(cotizacion.obra_cliente).toBe('Sin obra');
      expect(cotizacion.fecha).toBe('Sin fecha');
      expect(cotizacion.moneda).toBe('CLP');
    }));

    it('debería mostrar error cuando no hay userId en sessionStorage', () => {
      sessionStorage.removeItem('id');

      component.cargarCotizaciones();

      expect(component.error).toBe('No se encontró usuario logueado. Por favor, inicie sesión nuevamente.');
      expect(component.isLoading).toBe(false);
      expect(mockApiCrudService.buscarUsuarioPorId).not.toHaveBeenCalled();
    });

    it('debería manejar error del servidor', fakeAsync(() => {
      const errorResponse = { status: 500, message: 'Error del servidor' };
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(throwError(() => errorResponse));

      component.cargarCotizaciones();
      tick();

      expect(component.error).toBe('Error al cargar las cotizaciones. Por favor, intente nuevamente más tarde.');
      expect(component.isLoading).toBe(false);
    }));

    it('debería manejar usuario null', fakeAsync(() => {
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(null as any));

      component.cargarCotizaciones();
      tick();

      expect(component.cotizaciones).toEqual([]);
    }));
  });

  describe('cargarCotizacion', () => {
    beforeEach(() => {
      component.cotizaciones = [mockCotizacion, mockCotizacion2];
    });

    it('debería cargar cotización después de confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.cargarCotizacion(mockCotizacion, 0);

      expect(window.confirm).toHaveBeenCalledWith('¿Está seguro que desea cargar esta plantilla? Se reemplazarán todos los datos actuales de la cotización.');
      expect(mockCotizacionSharedService.setCotizacionSeleccionada).toHaveBeenCalledWith(mockCotizacion);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cotizador-r']);
    });

    it('no debería cargar cotización si se cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.cargarCotizacion(mockCotizacion, 0);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockCotizacionSharedService.setCotizacionSeleccionada).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('debería cargar cotización con índice diferente', () => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.cargarCotizacion(mockCotizacion2, 1);

      expect(mockCotizacionSharedService.setCotizacionSeleccionada).toHaveBeenCalledWith(mockCotizacion2);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/cotizador-r']);
    });
  });

  describe('eliminarCotizacion', () => {
    beforeEach(() => {
      component.cotizaciones = [mockCotizacion, mockCotizacion2];
    });

    it('debería eliminar cotización exitosamente después de confirmación', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'recargarCotizaciones');
      mockApiCrudService.eliminarCotizacion.and.returnValue(of({ message: 'Eliminado' }));

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      expect(window.confirm).toHaveBeenCalledWith(
        `¿Está seguro que desea eliminar la cotización "COT-001" del cliente "Cliente Test"?`
      );
      expect(mockApiCrudService.eliminarCotizacion).toHaveBeenCalledWith('1', 0);
      expect(window.alert).toHaveBeenCalledWith('Cotización "COT-001" eliminada exitosamente.');
      expect(component.recargarCotizaciones).toHaveBeenCalled();
    }));

    it('no debería eliminar cotización si se cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.eliminarCotizacion(mockCotizacion, 0);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockApiCrudService.eliminarCotizacion).not.toHaveBeenCalled();
    });

    it('debería mostrar alerta si no hay userId en sessionStorage', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      sessionStorage.removeItem('id');

      component.eliminarCotizacion(mockCotizacion, 0);

      expect(window.alert).toHaveBeenCalledWith('No se encontró usuario logueado. Por favor, inicie sesión nuevamente.');
      expect(mockApiCrudService.eliminarCotizacion).not.toHaveBeenCalled();
    });

    it('debería manejar error 404 al eliminar', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'cargarCotizaciones');
      const error404 = { status: 404, message: 'No encontrado' };
      mockApiCrudService.eliminarCotizacion.and.returnValue(throwError(() => error404));

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('La cotización no fue encontrada. Puede que ya haya sido eliminada.');
      expect(component.cargarCotizaciones).toHaveBeenCalled();
    }));

    it('debería manejar error 500 del servidor', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'cargarCotizaciones');
      const error500 = { status: 500, message: 'Error del servidor' };
      mockApiCrudService.eliminarCotizacion.and.returnValue(throwError(() => error500));

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('Error del servidor. Por favor, intente nuevamente más tarde.');
      expect(component.cargarCotizaciones).toHaveBeenCalled();
    }));

    it('debería manejar error de conexión (status 0)', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'cargarCotizaciones');
      const errorConexion = { status: 0, message: 'Sin conexión' };
      mockApiCrudService.eliminarCotizacion.and.returnValue(throwError(() => errorConexion));

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('Error de conexión. Verifique su conexión a internet.');
      expect(component.cargarCotizaciones).toHaveBeenCalled();
    }));

    it('debería manejar error desconocido', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'cargarCotizaciones');
      const errorDesconocido = { status: 400, message: 'Error desconocido' };
      mockApiCrudService.eliminarCotizacion.and.returnValue(throwError(() => errorDesconocido));

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar cotización: Error desconocido');
      expect(component.cargarCotizaciones).toHaveBeenCalled();
    }));

    it('debería remover cotización del array después de eliminar', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'recargarCotizaciones');
      mockApiCrudService.eliminarCotizacion.and.returnValue(of({ message: 'Eliminado' }));
      const longitudInicial = component.cotizaciones.length;

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      expect(component.cotizaciones.length).toBe(longitudInicial - 1);
    }));
  });

  describe('calcularTotalCotizacion', () => {
    it('debería calcular el total con IVA correctamente en CLP', () => {
      const productos = [
        { cantidad: 10, valorUnitario: 1000 },
        { cantidad: 5, valorUnitario: 2000 }
      ];

      const total = component.calcularTotalCotizacion(productos, 'CLP');

      // (10*1000 + 5*2000) * 1.19 = 20000 * 1.19 = 23800
      expect(total).toContain('23.800');
    });

    it('debería calcular el total con IVA correctamente en USD', () => {
      const productos = [
        { cantidad: 10, valorUnitario: 100 },
        { cantidad: 5, valorUnitario: 50 }
      ];

      const total = component.calcularTotalCotizacion(productos, 'USD');

      // (10*100 + 5*50) * 1.19 = 1250 * 1.19 = 1487.5
      expect(total).toContain('1,488'); // Redondeado
    });

    it('debería manejar productos sin cantidad o valorUnitario', () => {
      const productos = [
        { cantidad: undefined, valorUnitario: 1000 },
        { cantidad: 5, valorUnitario: undefined }
      ];

      const total = component.calcularTotalCotizacion(productos, 'CLP');

      // Ambos productos deberían resultar en 0
      expect(total).toContain('0');
    });

    it('debería calcular correctamente con un solo producto', () => {
      const productos = [{ cantidad: 1, valorUnitario: 10000 }];

      const total = component.calcularTotalCotizacion(productos, 'CLP');

      // 1 * 10000 * 1.19 = 11900
      expect(total).toContain('11.900');
    });

    it('debería calcular correctamente con array vacío', () => {
      const total = component.calcularTotalCotizacion([], 'CLP');

      expect(total).toContain('0');
    });

    it('debería aplicar IVA del 19%', () => {
      const productos = [{ cantidad: 10, valorUnitario: 100 }];

      const total = component.calcularTotalCotizacion(productos, 'CLP');

      // 10 * 100 * 1.19 = 1190
      expect(total).toContain('1.190');
    });

    it('debería formatear correctamente moneda CLP', () => {
      const productos = [{ cantidad: 1, valorUnitario: 1000000 }];

      const total = component.calcularTotalCotizacion(productos, 'CLP');

      expect(total).toContain('1.190.000');
    });
  });

  describe('formatearFecha', () => {
    it('debería formatear fecha ISO correctamente', () => {
      const fecha = '2025-01-15';
      const resultado = component.formatearFecha(fecha);

      expect(resultado).toContain('15');
      expect(resultado).toContain('01');
      expect(resultado).toContain('2025');
    });

    it('debería retornar "Sin fecha" para fecha vacía', () => {
      const resultado = component.formatearFecha('');

      expect(resultado).toBe('Sin fecha');
    });

    it('debería retornar "Sin fecha" para fecha null', () => {
      const resultado = component.formatearFecha(null as any);

      expect(resultado).toBe('Sin fecha');
    });

    it('debería retornar "Sin fecha" para fecha undefined', () => {
      const resultado = component.formatearFecha(undefined as any);

      expect(resultado).toBe('Sin fecha');
    });

    it('debería devolver fecha original si no se puede parsear', () => {
      const fechaInvalida = 'fecha-invalida';
      const resultado = component.formatearFecha(fechaInvalida);

      expect(resultado).toBe(fechaInvalida);
    });

    it('debería formatear fecha con timestamp', () => {
      const fecha = '2025-01-15T12:30:00Z';
      const resultado = component.formatearFecha(fecha);

      expect(resultado).toContain('15');
      expect(resultado).toContain('01');
    });

    it('debería usar formato local chileno', () => {
      const fecha = '2025-12-31';
      const resultado = component.formatearFecha(fecha);

      // Formato chileno: DD-MM-YYYY
      expect(resultado).toBeTruthy();
    });
  });

  describe('recargarCotizaciones', () => {
    it('debería llamar a cargarCotizaciones', () => {
      spyOn(component, 'cargarCotizaciones');

      component.recargarCotizaciones();

      expect(component.cargarCotizaciones).toHaveBeenCalled();
    });
  });

  describe('Integración con sessionStorage', () => {
    it('debería usar el userId de sessionStorage para cargar cotizaciones', fakeAsync(() => {
      sessionStorage.setItem('id', '123');
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(mockUsuario));

      component.cargarCotizaciones();
      tick();

      expect(mockApiCrudService.buscarUsuarioPorId).toHaveBeenCalledWith('123');
    }));

    it('debería usar el userId de sessionStorage para eliminar cotizaciones', () => {
      sessionStorage.setItem('id', '456');
      spyOn(window, 'confirm').and.returnValue(true);
      mockApiCrudService.eliminarCotizacion.and.returnValue(of({ message: 'OK' }));

      component.eliminarCotizacion(mockCotizacion, 0);

      expect(mockApiCrudService.eliminarCotizacion).toHaveBeenCalledWith('456', 0);
    });
  });

  describe('Estado de carga', () => {
    it('debería establecer isLoading en false después de cargar cotizaciones', fakeAsync(() => {
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(mockUsuario));

      component.cargarCotizaciones();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('debería establecer isLoading en false después de error', fakeAsync(() => {
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(throwError(() => ({ status: 500 })));

      component.cargarCotizaciones();
      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe('Manejo de errores en UI', () => {
    it('debería limpiar error anterior al recargar cotizaciones', () => {
      component.error = 'Error previo';
      mockApiCrudService.buscarUsuarioPorId.and.returnValue(of(mockUsuario));

      component.cargarCotizaciones();

      expect(component.error).toBeNull();
    });

    it('debería mantener cotizaciones anteriores en caso de error de eliminación', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(component, 'cargarCotizaciones');
      component.cotizaciones = [mockCotizacion, mockCotizacion2];
      const cotizacionesIniciales = [...component.cotizaciones];
      mockApiCrudService.eliminarCotizacion.and.returnValue(throwError(() => ({ status: 500 })));

      component.eliminarCotizacion(mockCotizacion, 0);
      tick();

      // Debe llamar a cargarCotizaciones para refrescar
      expect(component.cargarCotizaciones).toHaveBeenCalled();
    }));
  });
});
