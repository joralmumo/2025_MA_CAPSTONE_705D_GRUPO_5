import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AdminComponent } from './admin.component';
import { ApicrudService } from '../../services/apicrud.service';
import { IUsuarioGPD, ICotizacion } from '../interfaces/interfaces';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let mockApiCrudService: jasmine.SpyObj<ApicrudService>;

  const mockCotizacion: ICotizacion = {
    nro_cotizacion: 'COT-001',
    nombre_empresa: 'Empresa Test',
    nombre_cliente: 'Cliente Test',
    obra_cliente: 'Obra Test',
    fecha: '2025-01-15',
    moneda: 'CLP',
    productos: []
  };

  const mockUsuario1: IUsuarioGPD = {
    id: 1,
    nombre: 'Usuario Test 1',
    correo: 'usuario1@test.com',
    contrasena: 'password123',
    rol: 'usuario',
    isactive: true,
    cotizaciones: [mockCotizacion]
  };

  const mockUsuario2: IUsuarioGPD = {
    id: 2,
    nombre: 'Usuario Test 2',
    correo: 'usuario2@test.com',
    contrasena: 'password456',
    rol: 'admin',
    isactive: true,
    cotizaciones: []
  };

  const mockUsuario3: IUsuarioGPD = {
    id: 3,
    nombre: 'Usuario Inactivo',
    correo: 'inactivo@test.com',
    contrasena: 'password789',
    rol: 'usuario',
    isactive: false,
    cotizaciones: []
  };

  const mockUsuariosResponse = {
    success: true,
    users: [mockUsuario1, mockUsuario2, mockUsuario3]
  };

  beforeEach(async () => {
    mockApiCrudService = jasmine.createSpyObj('ApicrudService', [
      'listarUsuarios',
      'eliminarUsuario'
    ]);

    await TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [
        { provide: ApicrudService, useValue: mockApiCrudService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
  });

  describe('Creación y configuración inicial', () => {
    it('debería crear el componente', () => {
      expect(component).toBeTruthy();
    });

    it('debería inicializar propiedades correctamente', () => {
      expect(component.usuarios).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('debería llamar a cargarUsuarios en ngOnInit', () => {
      spyOn(component, 'cargarUsuarios');
      component.ngOnInit();
      expect(component.cargarUsuarios).toHaveBeenCalled();
    });

    it('debería tener método trackById definido', () => {
      expect(component.trackById).toBeDefined();
    });
  });

  describe('trackById', () => {
    it('debería retornar el id del usuario', () => {
      const result = component.trackById(0, mockUsuario1);
      expect(result).toBe(1);
    });

    it('debería retornar diferentes ids para diferentes usuarios', () => {
      const result1 = component.trackById(0, mockUsuario1);
      const result2 = component.trackById(1, mockUsuario2);
      
      expect(result1).toBe(1);
      expect(result2).toBe(2);
      expect(result1).not.toBe(result2);
    });

    it('debería funcionar independiente del índice', () => {
      const result1 = component.trackById(0, mockUsuario1);
      const result2 = component.trackById(99, mockUsuario1);
      
      expect(result1).toBe(result2);
    });
  });

  describe('cargarUsuarios', () => {
    it('debería cargar usuarios exitosamente', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      expect(mockApiCrudService.listarUsuarios).toHaveBeenCalled();
      expect(component.usuarios.length).toBe(3);
      expect(component.usuarios).toEqual(mockUsuariosResponse.users);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    }));

    it('debería establecer isLoading en true al iniciar carga', () => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));
      
      component.cargarUsuarios();
      
      expect(mockApiCrudService.listarUsuarios).toHaveBeenCalled();
    });

    it('debería limpiar error anterior al cargar', () => {
      component.error = 'Error previo';
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();

      expect(component.error).toBeNull();
    });

    it('debería manejar respuesta vacía', fakeAsync(() => {
      const emptyResponse = { success: true, users: [] };
      mockApiCrudService.listarUsuarios.and.returnValue(of(emptyResponse));

      component.cargarUsuarios();
      tick();

      expect(component.usuarios).toEqual([]);
      expect(component.isLoading).toBe(false);
    }));

    it('debería manejar error del servidor', fakeAsync(() => {
      const error = { status: 500, message: 'Error del servidor' };
      mockApiCrudService.listarUsuarios.and.returnValue(throwError(() => error));

      component.cargarUsuarios();
      tick();

      expect(component.error).toBe('Error al cargar los usuarios. Intente nuevamente.');
      expect(component.isLoading).toBe(false);
      expect(component.usuarios).toEqual([]);
    }));

    it('debería manejar error de autenticación', fakeAsync(() => {
      const error = { status: 401, message: 'No autorizado' };
      mockApiCrudService.listarUsuarios.and.returnValue(throwError(() => error));

      component.cargarUsuarios();
      tick();

      expect(component.error).toBe('Error al cargar los usuarios. Intente nuevamente.');
      expect(component.isLoading).toBe(false);
    }));

    it('debería manejar error de conexión', fakeAsync(() => {
      const error = { status: 0, message: 'Sin conexión' };
      mockApiCrudService.listarUsuarios.and.returnValue(throwError(() => error));

      component.cargarUsuarios();
      tick();

      expect(component.error).toBeTruthy();
      expect(component.isLoading).toBe(false);
    }));

    it('debería cargar usuarios con diferentes roles', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      const usuariosNormales = component.usuarios.filter(u => u.rol === 'usuario');
      const admins = component.usuarios.filter(u => u.rol === 'admin');

      expect(usuariosNormales.length).toBe(2);
      expect(admins.length).toBe(1);
    }));

    it('debería cargar usuarios activos e inactivos', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      const activos = component.usuarios.filter(u => u.isactive);
      const inactivos = component.usuarios.filter(u => !u.isactive);

      expect(activos.length).toBe(2);
      expect(inactivos.length).toBe(1);
    }));

    it('debería cargar usuarios con y sin cotizaciones', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      const conCotizaciones = component.usuarios.filter(u => u.cotizaciones.length > 0);
      const sinCotizaciones = component.usuarios.filter(u => u.cotizaciones.length === 0);

      expect(conCotizaciones.length).toBe(1);
      expect(sinCotizaciones.length).toBe(2);
    }));
  });

  describe('eliminar', () => {
    beforeEach(() => {
      component.usuarios = [mockUsuario1, mockUsuario2, mockUsuario3];
    });

    it('debería eliminar usuario después de confirmación', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(window.confirm).toHaveBeenCalledWith(
        `¿Eliminar al usuario "Usuario Test 1" (correo: usuario1@test.com)?`
      );
      expect(mockApiCrudService.eliminarUsuario).toHaveBeenCalledWith('1');
      expect(component.usuarios.length).toBe(2);
      expect(window.alert).toHaveBeenCalledWith('Usuario eliminado correctamente.');
      expect(component.isLoading).toBe(false);
    }));

    it('no debería eliminar usuario si se cancela la confirmación', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const usuariosIniciales = [...component.usuarios];

      component.eliminar(mockUsuario1, 0);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockApiCrudService.eliminarUsuario).not.toHaveBeenCalled();
      expect(component.usuarios).toEqual(usuariosIniciales);
    });

    it('debería eliminar usuario en cualquier posición del array', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));

      // Eliminar el segundo usuario (índice 1)
      component.eliminar(mockUsuario2, 1);
      tick();

      expect(mockApiCrudService.eliminarUsuario).toHaveBeenCalledWith('2');
      expect(component.usuarios.length).toBe(2);
      expect(component.usuarios[1].id).toBe(3); // El tercero ahora está en posición 1
    }));

    it('debería mostrar mensaje de confirmación con datos del usuario', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.eliminar(mockUsuario1, 0);

      expect(window.confirm).toHaveBeenCalledWith(
        jasmine.stringContaining('Usuario Test 1')
      );
      expect(window.confirm).toHaveBeenCalledWith(
        jasmine.stringContaining('usuario1@test.com')
      );
    });

    it('debería manejar error al eliminar usuario', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(console, 'error');
      const error = { status: 500, message: 'Error del servidor' };
      mockApiCrudService.eliminarUsuario.and.returnValue(throwError(() => error));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar usuario.');
      expect(console.error).toHaveBeenCalledWith('Error al eliminar usuario:', error);
      expect(component.isLoading).toBe(false);
      expect(component.usuarios.length).toBe(3); // No se eliminó del array
    }));

    it('debería manejar error 404 al eliminar', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      const error = { status: 404, message: 'Usuario no encontrado' };
      mockApiCrudService.eliminarUsuario.and.returnValue(throwError(() => error));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar usuario.');
      expect(component.isLoading).toBe(false);
    }));

    it('debería manejar error de autenticación al eliminar', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      const error = { status: 401, message: 'No autorizado' };
      mockApiCrudService.eliminarUsuario.and.returnValue(throwError(() => error));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar usuario.');
      expect(component.isLoading).toBe(false);
    }));

    it('debería establecer isLoading durante la eliminación', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));

      component.eliminar(mockUsuario1, 0);
      
      // Después de confirmar pero antes de tick, debería estar cargando
      expect(component.isLoading).toBe(true);
      
      tick();
      
      expect(component.isLoading).toBe(false);
    }));

    it('debería convertir id a string al llamar al servicio', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(mockApiCrudService.eliminarUsuario).toHaveBeenCalledWith('1');
      expect(mockApiCrudService.eliminarUsuario).toHaveBeenCalledWith(jasmine.any(String));
    }));

    it('debería eliminar el último usuario de la lista', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));

      component.eliminar(mockUsuario3, 2);
      tick();

      expect(component.usuarios.length).toBe(2);
      expect(component.usuarios[component.usuarios.length - 1].id).toBe(2);
    }));

    it('debería manejar eliminación cuando solo hay un usuario', fakeAsync(() => {
      component.usuarios = [mockUsuario1];
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(component.usuarios.length).toBe(0);
      expect(window.alert).toHaveBeenCalledWith('Usuario eliminado correctamente.');
    }));
  });

  describe('Estado de carga', () => {
    it('debería establecer isLoading correctamente durante cargarUsuarios', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      expect(component.isLoading).toBe(false);
      
      component.cargarUsuarios();
      
      // Durante la llamada, isLoading debe cambiar
      tick();
      
      expect(component.isLoading).toBe(false);
    }));

    it('debería establecer isLoading en false después de error en cargarUsuarios', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(throwError(() => ({ status: 500 })));

      component.cargarUsuarios();
      tick();

      expect(component.isLoading).toBe(false);
    }));

    it('debería establecer isLoading en false después de error en eliminar', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(throwError(() => ({ status: 500 })));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe('Manejo de errores', () => {
    it('debería establecer mensaje de error en cargarUsuarios', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(throwError(() => ({ status: 500 })));

      component.cargarUsuarios();
      tick();

      expect(component.error).toBe('Error al cargar los usuarios. Intente nuevamente.');
    }));

    it('debería limpiar error al recargar usuarios exitosamente', fakeAsync(() => {
      component.error = 'Error previo';
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      expect(component.error).toBeNull();
    }));

    it('debería loggear error en consola al cargar usuarios', fakeAsync(() => {
      spyOn(console, 'error');
      const error = { status: 500, message: 'Error' };
      mockApiCrudService.listarUsuarios.and.returnValue(throwError(() => error));

      component.cargarUsuarios();
      tick();

      expect(console.error).toHaveBeenCalledWith('Error al cargar usuarios:', error);
    }));

    it('debería loggear error en consola al eliminar usuario', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      spyOn(console, 'error');
      const error = { status: 500, message: 'Error' };
      mockApiCrudService.eliminarUsuario.and.returnValue(throwError(() => error));

      component.eliminar(mockUsuario1, 0);
      tick();

      expect(console.error).toHaveBeenCalledWith('Error al eliminar usuario:', error);
    }));
  });

  describe('Logging', () => {
    it('debería loggear cuando se invoca cargarUsuarios', fakeAsync(() => {
      spyOn(console, 'log');
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      expect(console.log).toHaveBeenCalledWith('cargarUsuarios() invocado');
    }));

    it('debería loggear usuarios recibidos', fakeAsync(() => {
      spyOn(console, 'log');
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      expect(console.log).toHaveBeenCalledWith('usuarios recibidos:', mockUsuariosResponse);
    }));
  });

  describe('Integración entre métodos', () => {
    it('debería mantener la integridad de los datos después de eliminar', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));
      component.usuarios = [mockUsuario1, mockUsuario2, mockUsuario3];

      component.eliminar(mockUsuario2, 1);
      tick();

      expect(component.usuarios.length).toBe(2);
      expect(component.usuarios[0].id).toBe(1);
      expect(component.usuarios[1].id).toBe(3);
      expect(component.usuarios.find(u => u.id === 2)).toBeUndefined();
    }));

    it('debería poder cargar usuarios después de eliminar', fakeAsync(() => {
      // Primera carga
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));
      component.cargarUsuarios();
      tick();
      expect(component.usuarios.length).toBe(3);

      // Eliminar
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      mockApiCrudService.eliminarUsuario.and.returnValue(of({ success: true }));
      component.eliminar(mockUsuario1, 0);
      tick();
      expect(component.usuarios.length).toBe(2);

      // Recargar
      const updatedResponse = {
        success: true,
        users: [mockUsuario2, mockUsuario3]
      };
      mockApiCrudService.listarUsuarios.and.returnValue(of(updatedResponse));
      component.cargarUsuarios();
      tick();
      expect(component.usuarios.length).toBe(2);
    }));
  });

  describe('Validación de datos', () => {
    it('debería manejar usuarios con cotizaciones vacías', fakeAsync(() => {
      const usuarioSinCotizaciones = { ...mockUsuario1, cotizaciones: [] };
      const response = { success: true, users: [usuarioSinCotizaciones] };
      mockApiCrudService.listarUsuarios.and.returnValue(of(response));

      component.cargarUsuarios();
      tick();

      expect(component.usuarios[0].cotizaciones).toEqual([]);
    }));

    it('debería manejar usuarios con múltiples cotizaciones', fakeAsync(() => {
      const usuarioConVariasCotizaciones = {
        ...mockUsuario1,
        cotizaciones: [mockCotizacion, mockCotizacion, mockCotizacion]
      };
      const response = { success: true, users: [usuarioConVariasCotizaciones] };
      mockApiCrudService.listarUsuarios.and.returnValue(of(response));

      component.cargarUsuarios();
      tick();

      expect(component.usuarios[0].cotizaciones.length).toBe(3);
    }));

    it('debería manejar usuarios con diferentes estados activos', fakeAsync(() => {
      mockApiCrudService.listarUsuarios.and.returnValue(of(mockUsuariosResponse));

      component.cargarUsuarios();
      tick();

      const usuarioActivo = component.usuarios.find(u => u.id === 1);
      const usuarioInactivo = component.usuarios.find(u => u.id === 3);

      expect(usuarioActivo?.isactive).toBe(true);
      expect(usuarioInactivo?.isactive).toBe(false);
    }));
  });
});
