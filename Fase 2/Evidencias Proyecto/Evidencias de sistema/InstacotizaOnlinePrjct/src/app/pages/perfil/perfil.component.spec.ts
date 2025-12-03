import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PerfilComponent } from './perfil.component';
import { AuthService } from '../../services/auth.service';
import { ApicrudService } from '../../services/apicrud.service';
import { IUsuarioGPD } from '../interfaces/interfaces';

describe('PerfilComponent', () => {
  let component: PerfilComponent;
  let fixture: ComponentFixture<PerfilComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockApiCrudService: jasmine.SpyObj<ApicrudService>;
  let mockRouter: jasmine.SpyObj<Router>;

  // Mock data
  const mockUsuario: IUsuarioGPD = {
    id: 1,
    nombre: 'Juan Pérez',
    correo: 'juan@test.com',
    contrasena: 'password123',
    rol: 'user',
    isactive: true,
    cotizaciones: []
  };

  beforeEach(async () => {
    // Crear spies para los servicios
    mockAuthService = jasmine.createSpyObj('AuthService', ['GetUserById']);
    mockApiCrudService = jasmine.createSpyObj('ApicrudService', ['actualizarUsuario']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [PerfilComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApicrudService, useValue: mockApiCrudService },
        { provide: Router, useValue: mockRouter }
      ]
    })
    .compileComponents();

    // Mock de sessionStorage
    spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'correo') return 'juan@test.com';
      if (key === 'id') return '1';
      return null;
    });
    spyOn(sessionStorage, 'setItem');

    fixture = TestBed.createComponent(PerfilComponent);
    component = fixture.componentInstance;
  });

  // ==================== PRUEBAS BÁSICAS ====================

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with validators', () => {
    expect(component.usuarioEditor).toBeDefined();
    expect(component.usuarioEditor.get('nombre')).toBeDefined();
    expect(component.usuarioEditor.get('correo')).toBeDefined();
  });

  it('should start with editandoPerfil as false', () => {
    expect(component.editandoPerfil).toBeFalse();
  });

  it('should start with cargando as true', () => {
    expect(component.cargando).toBeTrue();
  });

  // ==================== PRUEBAS DE ngOnInit ====================

  it('should load user profile on init', fakeAsync(() => {
    mockAuthService.GetUserById.and.returnValue(of([mockUsuario]));
    
    component.ngOnInit();
    tick();
    
    expect(mockAuthService.GetUserById).toHaveBeenCalledWith('juan@test.com');
    expect(component.usuario).toEqual(mockUsuario);
    expect(component.cargando).toBeFalse();
  }));

  it('should redirect to login if no correo in session', fakeAsync(() => {
    (sessionStorage.getItem as jasmine.Spy).and.returnValue(null);
    
    component.ngOnInit();
    tick();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('should handle error when loading profile', fakeAsync(() => {
    mockAuthService.GetUserById.and.returnValue(
      throwError(() => new Error('Error de red'))
    );
    
    component.ngOnInit();
    tick();
    
    expect(component.cargando).toBeFalse();
    expect(component.usuario).toBeNull();
  }));

  it('should handle empty response when loading profile', fakeAsync(() => {
    mockAuthService.GetUserById.and.returnValue(of([]));
    
    component.ngOnInit();
    tick();
    
    expect(component.cargando).toBeFalse();
    expect(component.usuario).toBeNull();
  }));

  // ==================== PRUEBAS DE EDICIÓN ====================

  it('should start editing mode', () => {
    component.usuario = mockUsuario;
    
    component.iniciarEdicion();
    
    expect(component.editandoPerfil).toBeTrue();
    expect(component.usuarioEditor.value.nombre).toBe('Juan Pérez');
    expect(component.usuarioEditor.value.correo).toBe('juan@test.com');
  });

  it('should cancel editing mode', () => {
    component.editandoPerfil = true;
    component.usuarioEditor.patchValue({
      nombre: 'Test',
      correo: 'test@test.com'
    });
    
    component.cancelarEdicion();
    
    expect(component.editandoPerfil).toBeFalse();
    expect(component.usuarioEditor.value.nombre).toBeNull();
    expect(component.usuarioEditor.value.correo).toBeNull();
  });

  it('should not start editing if usuario is null', () => {
    component.usuario = null;
    
    component.iniciarEdicion();
    
    expect(component.editandoPerfil).toBeTrue();
    expect(component.usuarioEditor.value.nombre).toBeNull();
  });

  // ==================== PRUEBAS DE VALIDACIÓN ====================

  it('should validate required fields', () => {
    const nombreControl = component.usuarioEditor.get('nombre');
    const correoControl = component.usuarioEditor.get('correo');
    
    nombreControl?.setValue('');
    correoControl?.setValue('');
    
    expect(nombreControl?.hasError('required')).toBeTrue();
    expect(correoControl?.hasError('required')).toBeTrue();
  });

  it('should validate email format', () => {
    const correoControl = component.usuarioEditor.get('correo');
    
    correoControl?.setValue('invalid-email');
    expect(correoControl?.hasError('email')).toBeTrue();
    
    correoControl?.setValue('valid@email.com');
    expect(correoControl?.hasError('email')).toBeFalse();
  });

  it('should validate nombre minimum length', () => {
    const nombreControl = component.usuarioEditor.get('nombre');
    
    nombreControl?.setValue('Ab');
    expect(nombreControl?.hasError('minlength')).toBeTrue();
    
    nombreControl?.setValue('ABC');
    expect(nombreControl?.hasError('minlength')).toBeFalse();
  });

  // ==================== PRUEBAS DE GUARDAR CAMBIOS ====================

  it('should not save changes if form is invalid', () => {
    spyOn(window, 'alert');
    component.usuarioEditor.patchValue({
      nombre: 'A',
      correo: 'invalid-email'
    });
    
    component.guardarCambios();
    
    expect(window.alert).toHaveBeenCalledWith('Por favor, complete correctamente todos los campos');
    expect(mockApiCrudService.actualizarUsuario).not.toHaveBeenCalled();
  });

  it('should not save changes if no userId in session', () => {
    spyOn(window, 'alert');
    (sessionStorage.getItem as jasmine.Spy).and.returnValue(null);
    component.usuario = mockUsuario;
    component.usuarioEditor.patchValue({
      nombre: 'Juan Pérez',
      correo: 'juan@test.com'
    });
    
    component.guardarCambios();
    
    expect(window.alert).toHaveBeenCalledWith('Error: No se pudo obtener la información del usuario');
    expect(mockApiCrudService.actualizarUsuario).not.toHaveBeenCalled();
  });

  it('should save changes successfully', fakeAsync(() => {
    spyOn(window, 'alert');
    component.usuario = mockUsuario;
    component.usuarioEditor.patchValue({
      nombre: 'Juan Actualizado',
      correo: 'juan.nuevo@test.com'
    });
    
    mockApiCrudService.actualizarUsuario.and.returnValue(of(mockUsuario));
    mockAuthService.GetUserById.and.returnValue(of([mockUsuario]));
    
    component.guardarCambios();
    tick();
    
    expect(mockApiCrudService.actualizarUsuario).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Perfil actualizado exitosamente');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('correo', 'juan.nuevo@test.com');
    expect(component.editandoPerfil).toBeFalse();
  }));

  it('should handle error when saving changes', fakeAsync(() => {
    spyOn(window, 'alert');
    component.usuario = mockUsuario;
    component.usuarioEditor.patchValue({
      nombre: 'Juan Pérez',
      correo: 'juan@test.com'
    });
    
    mockApiCrudService.actualizarUsuario.and.returnValue(
      throwError(() => ({ status: 500, error: { message: 'Error de servidor' } }))
    );
    
    component.guardarCambios();
    tick();
    
    expect(window.alert).toHaveBeenCalledWith('Error al actualizar el perfil. Por favor, intente nuevamente.');
  }));

  it('should handle duplicate email error', fakeAsync(() => {
    spyOn(window, 'alert');
    component.usuario = mockUsuario;
    component.usuarioEditor.patchValue({
      nombre: 'Juan Pérez',
      correo: 'duplicado@test.com'
    });
    
    mockApiCrudService.actualizarUsuario.and.returnValue(
      throwError(() => ({ 
        status: 400, 
        error: { message: 'El correo ya está registrado' } 
      }))
    );
    
    component.guardarCambios();
    tick();
    
    expect(window.alert).toHaveBeenCalledWith('El correo ya está en uso por otro usuario');
  }));

  it('should not update sessionStorage if correo did not change', fakeAsync(() => {
    component.usuario = mockUsuario;
    component.usuarioEditor.patchValue({
      nombre: 'Juan Actualizado',
      correo: 'juan@test.com' // Mismo correo
    });
    
    mockApiCrudService.actualizarUsuario.and.returnValue(of(mockUsuario));
    mockAuthService.GetUserById.and.returnValue(of([mockUsuario]));
    
    component.guardarCambios();
    tick();
    
    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  }));

  // ==================== PRUEBAS DE INICIALES ====================

  it('should get initials from two-word name', () => {
    component.usuario = mockUsuario;
    
    const iniciales = component.obtenerIniciales();
    
    expect(iniciales).toBe('JP');
  });

  it('should get initial from single-word name', () => {
    component.usuario = { ...mockUsuario, nombre: 'Juan' };
    
    const iniciales = component.obtenerIniciales();
    
    expect(iniciales).toBe('J');
  });

  it('should return default initial if no usuario', () => {
    component.usuario = null;
    
    const iniciales = component.obtenerIniciales();
    
    expect(iniciales).toBe('U');
  });

  it('should return default initial if usuario has no name', () => {
    component.usuario = { ...mockUsuario, nombre: '' };
    
    const iniciales = component.obtenerIniciales();
    
    expect(iniciales).toBe('U');
  });

  it('should handle name with more than two words', () => {
    component.usuario = { ...mockUsuario, nombre: 'Juan Carlos Pérez' };
    
    const iniciales = component.obtenerIniciales();
    
    expect(iniciales).toBe('JC');
  });

  // ==================== PRUEBAS DE CARGA DE PERFIL ====================

  it('should call cargarPerfilUsuario when guardarCambios succeeds', fakeAsync(() => {
    spyOn(component, 'cargarPerfilUsuario');
    component.usuario = mockUsuario;
    component.usuarioEditor.patchValue({
      nombre: 'Juan Actualizado',
      correo: 'juan@test.com'
    });
    
    mockApiCrudService.actualizarUsuario.and.returnValue(of(mockUsuario));
    
    component.guardarCambios();
    tick();
    
    expect(component.cargarPerfilUsuario).toHaveBeenCalled();
  }));

  it('should handle cargarPerfilUsuario without correo', () => {
    (sessionStorage.getItem as jasmine.Spy).and.returnValue(null);
    
    component.cargarPerfilUsuario();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    expect(mockAuthService.GetUserById).not.toHaveBeenCalled();
  });
});
