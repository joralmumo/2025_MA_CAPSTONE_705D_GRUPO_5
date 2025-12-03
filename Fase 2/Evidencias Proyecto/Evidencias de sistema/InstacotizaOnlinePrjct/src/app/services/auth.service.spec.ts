import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { IUsuarioGPD } from '../pages/interfaces/interfaces';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUsuario: IUsuarioGPD = {
    id: 1,
    nombre: 'Test User',
    correo: 'test@example.com',
    contrasena: 'hashedPassword',
    rol: 'usuario',
    isactive: true,
    cotizaciones: []
  };

  const mockCredentials = {
    correo: 'test@example.com',
    contrasena: 'password123'
  };

  const mockLoginResponse = {
    message: 'Login exitoso',
    usuario: mockUsuario,
    token: 'fake-jwt-token'
  };

  const mockRegisterUser = {
    nombre: 'Nuevo Usuario',
    correo: 'nuevo@example.com',
    contrasena: 'password123',
    rol: 'usuario'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Limpiar sessionStorage antes de cada prueba
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya requests pendientes
    sessionStorage.clear();
  });

  describe('Creación del servicio', () => {
    it('debería crear el servicio', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('GetUserById', () => {
    it('debería obtener un usuario por correo', () => {
      const correo = 'test@example.com';

      service.GetUserById(correo).subscribe(response => {
        expect(response).toEqual(mockUsuario);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/?correo=${correo}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockUsuario);
    });

    it('debería manejar errores al obtener usuario', () => {
      const correo = 'noexiste@example.com';
      const errorMessage = 'Usuario no encontrado';

      service.GetUserById(correo).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(404);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/?correo=${correo}`);
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('debería obtener usuario con correo que contiene caracteres especiales', () => {
      const correo = 'test+special@example.com';

      service.GetUserById(correo).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/?correo=${correo}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsuario);
    });
  });

  describe('login', () => {
    it('debería hacer login exitosamente con credenciales válidas', () => {
      service.login(mockCredentials).subscribe(response => {
        expect(response).toEqual(mockLoginResponse);
        expect(response.message).toBe('Login exitoso');
        expect(response.usuario.correo).toBe(mockCredentials.correo);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockLoginResponse);
    });

    it('debería fallar con credenciales inválidas', () => {
      const invalidCredentials = {
        correo: 'test@example.com',
        contrasena: 'wrongpassword'
      };
      const errorMessage = 'Credenciales inválidas';

      service.login(invalidCredentials).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(401);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/login`);
      req.flush(errorMessage, { status: 401, statusText: 'Unauthorized' });
    });

    it('debería fallar con usuario no existente', () => {
      const credentials = {
        correo: 'noexiste@example.com',
        contrasena: 'password123'
      };
      const errorMessage = 'Usuario no encontrado';

      service.login(credentials).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(404);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/login`);
      req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
    });

    it('debería manejar error del servidor', () => {
      service.login(mockCredentials).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/login`);
      req.flush('Error interno', { status: 500, statusText: 'Internal Server Error' });
    });

    it('debería enviar credenciales con campos vacíos', () => {
      const emptyCredentials = { correo: '', contrasena: '' };

      service.login(emptyCredentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/login`);
      expect(req.request.body).toEqual(emptyCredentials);
      req.flush({ error: 'Campos requeridos' }, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('register', () => {
    it('debería registrar un nuevo usuario exitosamente', () => {
      const mockResponse = {
        message: 'Usuario registrado exitosamente',
        usuario: { ...mockRegisterUser, id: 2, isactive: true }
      };

      service.register(mockRegisterUser).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.usuario.correo).toBe(mockRegisterUser.correo);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRegisterUser);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });

    it('debería fallar al registrar usuario con correo existente', () => {
      const errorMessage = 'El correo ya está registrado';

      service.register(mockRegisterUser).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(409);
          expect(error.error).toBe(errorMessage);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      req.flush(errorMessage, { status: 409, statusText: 'Conflict' });
    });

    it('debería fallar con datos incompletos', () => {
      const incompleteUser = { nombre: 'Test', correo: '' };

      service.register(incompleteUser).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      req.flush('Datos incompletos', { status: 400, statusText: 'Bad Request' });
    });

    it('debería manejar error de validación', () => {
      const invalidUser = { ...mockRegisterUser, correo: 'invalid-email' };

      service.register(invalidUser).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(400);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      req.flush('Email inválido', { status: 400, statusText: 'Bad Request' });
    });

    it('debería registrar usuario con rol admin', () => {
      const adminUser = { ...mockRegisterUser, rol: 'admin' };
      const mockResponse = {
        message: 'Admin registrado',
        usuario: { ...adminUser, id: 3, isactive: true }
      };

      service.register(adminUser).subscribe(response => {
        expect(response.usuario.rol).toBe('admin');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      expect(req.request.body.rol).toBe('admin');
      req.flush(mockResponse);
    });
  });

  describe('IsLogged', () => {
    it('debería retornar true si el usuario está logueado', () => {
      sessionStorage.setItem('correo', 'test@example.com');
      expect(service.IsLogged()).toBe(true);
    });

    it('debería retornar false si no hay correo en sessionStorage', () => {
      expect(service.IsLogged()).toBe(false);
    });

    it('debería retornar false si sessionStorage está vacío', () => {
      sessionStorage.clear();
      expect(service.IsLogged()).toBe(false);
    });

    it('debería retornar true con cualquier valor en correo', () => {
      sessionStorage.setItem('correo', 'cualquier@correo.com');
      expect(service.IsLogged()).toBe(true);
    });
  });

  describe('IsAdmin', () => {
    it('debería retornar true si el usuario es admin', () => {
      sessionStorage.setItem('rol', 'admin');
      expect(service.IsAdmin()).toBe(true);
    });

    it('debería retornar false si el usuario no es admin', () => {
      sessionStorage.setItem('rol', 'usuario');
      expect(service.IsAdmin()).toBe(false);
    });

    it('debería retornar false si no hay rol en sessionStorage', () => {
      expect(service.IsAdmin()).toBe(false);
    });

    it('debería retornar false con rol vacío', () => {
      sessionStorage.setItem('rol', '');
      expect(service.IsAdmin()).toBe(false);
    });

    it('debería retornar false con rol undefined', () => {
      sessionStorage.setItem('rol', 'undefined');
      expect(service.IsAdmin()).toBe(false);
    });

    it('debería ser case-sensitive para rol admin', () => {
      sessionStorage.setItem('rol', 'Admin');
      expect(service.IsAdmin()).toBe(false);
      
      sessionStorage.setItem('rol', 'ADMIN');
      expect(service.IsAdmin()).toBe(false);
    });
  });

  describe('Configuración HTTP', () => {
    it('debería incluir headers correctos en todas las peticiones', () => {
      service.GetUserById('test@example.com').subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/?correo=test@example.com`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });

    it('debería usar withCredentials en login', () => {
      service.login(mockCredentials).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/login`);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockLoginResponse);
    });

    it('debería usar withCredentials en register', () => {
      service.register(mockRegisterUser).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });
  });

  describe('Integración con sessionStorage', () => {
    it('debería verificar estado de autenticación después de login', () => {
      // Antes del login, no debe estar logueado
      expect(service.IsLogged()).toBe(false);
      
      // Simular que después del login se guarda el correo
      sessionStorage.setItem('correo', mockCredentials.correo);
      sessionStorage.setItem('rol', 'usuario');
      
      expect(service.IsLogged()).toBe(true);
      expect(service.IsAdmin()).toBe(false);
    });

    it('debería verificar rol admin después de login', () => {
      sessionStorage.setItem('correo', 'admin@example.com');
      sessionStorage.setItem('rol', 'admin');
      
      expect(service.IsLogged()).toBe(true);
      expect(service.IsAdmin()).toBe(true);
    });

    it('debería manejar logout limpiando sessionStorage', () => {
      sessionStorage.setItem('correo', 'test@example.com');
      sessionStorage.setItem('rol', 'usuario');
      
      expect(service.IsLogged()).toBe(true);
      
      // Simular logout
      sessionStorage.clear();
      
      expect(service.IsLogged()).toBe(false);
      expect(service.IsAdmin()).toBe(false);
    });
  });
});
