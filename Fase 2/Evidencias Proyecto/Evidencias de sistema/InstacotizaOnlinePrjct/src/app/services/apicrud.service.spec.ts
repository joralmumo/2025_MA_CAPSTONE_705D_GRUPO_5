import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApicrudService } from './apicrud.service';
import { IUsuarioGPD, IUsuarioP, ICotizacion, IProducto } from '../pages/interfaces/interfaces';
import { environment } from '../../environments/environment';

describe('ApicrudService', () => {
  let service: ApicrudService;
  let httpMock: HttpTestingController;

  const mockProducto: IProducto = {
    producto: 'Producto Test',
    descripcion: 'Descripción del producto',
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
    presupuesto_incluye: 'Materiales y mano de obra',
    moneda: 'CLP',
    productos: [mockProducto],
    logo: null
  };

  const mockUsuarioGPD: IUsuarioGPD = {
    id: 1,
    nombre: 'Usuario Test',
    correo: 'usuario@test.com',
    contrasena: 'hashedPassword',
    rol: 'usuario',
    isactive: true,
    cotizaciones: [mockCotizacion]
  };

  const mockUsuarioP: IUsuarioP = {
    nombre: 'Nuevo Usuario',
    correo: 'nuevo@test.com',
    contrasena: 'password123',
    rol: 'usuario',
    isactive: true,
    cotizaciones: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApicrudService]
    });
    service = TestBed.inject(ApicrudService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // Verifica que no haya requests pendientes
  });

  describe('Creación del servicio', () => {
    it('debería crear el servicio', () => {
      expect(service).toBeTruthy();
    });

    it('debería tener la URL de API configurada', () => {
      expect(service['apiUrl']).toBe(environment.apiUrl);
    });
  });

  describe('CRUD de Usuarios', () => {
    describe('crearUsuario', () => {
      it('debería crear un nuevo usuario exitosamente', () => {
        const mockResponse = {
          message: 'Usuario creado',
          usuario: { ...mockUsuarioP, id: 2 }
        };

        service.crearUsuario(mockUsuarioP).subscribe(response => {
          expect(response).toEqual(mockResponse);
          expect(response.usuario.correo).toBe(mockUsuarioP.correo);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockUsuarioP);
        req.flush(mockResponse);
      });

      it('debería fallar al crear usuario con correo duplicado', () => {
        const errorMessage = 'El correo ya existe';

        service.crearUsuario(mockUsuarioP).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(409);
            expect(error.error).toBe(errorMessage);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
        req.flush(errorMessage, { status: 409, statusText: 'Conflict' });
      });

      it('debería manejar datos inválidos', () => {
        const invalidUser = { ...mockUsuarioP, correo: 'invalid-email' };

        service.crearUsuario(invalidUser).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(400);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
        req.flush('Email inválido', { status: 400, statusText: 'Bad Request' });
      });
    });

    describe('actualizarUsuario', () => {
      it('debería actualizar un usuario existente', () => {
        const userId = '1';
        const usuarioActualizado = { ...mockUsuarioGPD, nombre: 'Nombre Actualizado' };

        service.actualizarUsuario(userId, usuarioActualizado).subscribe(response => {
          expect(response).toEqual(usuarioActualizado);
          expect(response.nombre).toBe('Nombre Actualizado');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(usuarioActualizado);
        req.flush(usuarioActualizado);
      });

      it('debería fallar al actualizar usuario inexistente', () => {
        const userId = '999';
        const errorMessage = 'Usuario no encontrado';

        service.actualizarUsuario(userId, mockUsuarioGPD).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        req.flush(errorMessage, { status: 404, statusText: 'Not Found' });
      });

      it('debería actualizar el rol del usuario', () => {
        const userId = '1';
        const usuarioConRolAdmin = { ...mockUsuarioGPD, rol: 'admin' };

        service.actualizarUsuario(userId, usuarioConRolAdmin).subscribe(response => {
          expect(response.rol).toBe('admin');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        req.flush(usuarioConRolAdmin);
      });

      it('debería actualizar el estado activo del usuario', () => {
        const userId = '1';
        const usuarioInactivo = { ...mockUsuarioGPD, isactive: false };

        service.actualizarUsuario(userId, usuarioInactivo).subscribe(response => {
          expect(response.isactive).toBe(false);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        req.flush(usuarioInactivo);
      });
    });

    describe('eliminarUsuario', () => {
      it('debería eliminar un usuario exitosamente', () => {
        const userId = '1';
        const mockResponse = { success: true };

        service.eliminarUsuario(userId).subscribe(response => {
          expect(response.success).toBe(true);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(mockResponse);
      });

      it('debería fallar al eliminar usuario inexistente', () => {
        const userId = '999';

        service.eliminarUsuario(userId).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        req.flush('Usuario no encontrado', { status: 404, statusText: 'Not Found' });
      });

      it('debería retornar success: false en caso de error', () => {
        const userId = '1';
        const mockResponse = { success: false };

        service.eliminarUsuario(userId).subscribe(response => {
          expect(response.success).toBe(false);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        req.flush(mockResponse);
      });
    });

    describe('listarUsuarios', () => {
      it('debería listar todos los usuarios', () => {
        const mockResponse = {
          success: true,
          users: [mockUsuarioGPD, { ...mockUsuarioGPD, id: 2, correo: 'otro@test.com' }]
        };

        service.listarUsuarios().subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.users.length).toBe(2);
          expect(response.users[0]).toEqual(mockUsuarioGPD);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/all`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it('debería retornar lista vacía cuando no hay usuarios', () => {
        const mockResponse = {
          success: true,
          users: []
        };

        service.listarUsuarios().subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.users.length).toBe(0);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/all`);
        req.flush(mockResponse);
      });

      it('debería manejar error del servidor', () => {
        service.listarUsuarios().subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(500);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/all`);
        req.flush('Error interno', { status: 500, statusText: 'Internal Server Error' });
      });

      it('debería filtrar usuarios activos', () => {
        const mockResponse = {
          success: true,
          users: [
            mockUsuarioGPD,
            { ...mockUsuarioGPD, id: 2, isactive: false }
          ]
        };

        service.listarUsuarios().subscribe(response => {
          const activos = response.users.filter(u => u.isactive);
          expect(activos.length).toBe(1);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/all`);
        req.flush(mockResponse);
      });
    });

    describe('buscarUsuarioPorId', () => {
      it('debería buscar un usuario por ID', () => {
        const userId = '1';

        service.buscarUsuarioPorId(userId).subscribe(response => {
          expect(response).toEqual(mockUsuarioGPD);
          expect(response.id).toBe(1);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockUsuarioGPD);
      });

      it('debería fallar con ID inexistente', () => {
        const userId = '999';

        service.buscarUsuarioPorId(userId).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        req.flush('Usuario no encontrado', { status: 404, statusText: 'Not Found' });
      });

      it('debería buscar usuario con ID string', () => {
        const userId = 'abc123';

        service.buscarUsuarioPorId(userId).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockUsuarioGPD);
      });
    });
  });

  describe('Gestión de Cotizaciones', () => {
    describe('agregarCotizacion', () => {
      it('debería agregar una cotización a un usuario', () => {
        const userId = '1';
        const mockResponse = {
          message: 'Cotización agregada',
          usuario: { ...mockUsuarioGPD, cotizaciones: [mockCotizacion] }
        };

        service.agregarCotizacion(userId, mockCotizacion).subscribe(response => {
          expect(response.message).toBe('Cotización agregada');
          expect(response.usuario.cotizaciones.length).toBe(1);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(mockCotizacion);
        req.flush(mockResponse);
      });

      it('debería fallar al agregar cotización a usuario inexistente', () => {
        const userId = '999';

        service.agregarCotizacion(userId, mockCotizacion).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones`);
        req.flush('Usuario no encontrado', { status: 404, statusText: 'Not Found' });
      });

      it('debería agregar cotización con múltiples productos', () => {
        const userId = '1';
        const cotizacionConProductos = {
          ...mockCotizacion,
          productos: [mockProducto, { ...mockProducto, producto: 'Producto 2' }]
        };

        service.agregarCotizacion(userId, cotizacionConProductos).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones`);
        expect(req.request.body.productos.length).toBe(2);
        req.flush({ message: 'OK' });
      });

      it('debería manejar cotización sin productos', () => {
        const userId = '1';
        const cotizacionSinProductos = { ...mockCotizacion, productos: [] };

        service.agregarCotizacion(userId, cotizacionSinProductos).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(400);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones`);
        req.flush('Productos requeridos', { status: 400, statusText: 'Bad Request' });
      });
    });

    describe('actualizarCotizacionPorNumero', () => {
      it('debería actualizar una cotización por número', () => {
        const userId = '1';
        const cotizacionActualizada = { ...mockCotizacion, nombre_empresa: 'Empresa Actualizada' };
        const mockResponse = {
          message: 'Cotización actualizada',
          cotizacion: cotizacionActualizada
        };

        service.actualizarCotizacionPorNumero(userId, cotizacionActualizada).subscribe(response => {
          expect(response.message).toBe('Cotización actualizada');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones-numero`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(cotizacionActualizada);
        req.flush(mockResponse);
      });

      it('debería fallar al actualizar cotización inexistente', () => {
        const userId = '1';
        const cotizacionInexistente = { ...mockCotizacion, nro_cotizacion: 'COT-999' };

        service.actualizarCotizacionPorNumero(userId, cotizacionInexistente).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones-numero`);
        req.flush('Cotización no encontrada', { status: 404, statusText: 'Not Found' });
      });

      it('debería actualizar productos de la cotización', () => {
        const userId = '1';
        const nuevosProductos = [
          mockProducto,
          { ...mockProducto, producto: 'Nuevo Producto', cantidad: 20 }
        ];
        const cotizacionActualizada = { ...mockCotizacion, productos: nuevosProductos };

        service.actualizarCotizacionPorNumero(userId, cotizacionActualizada).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones-numero`);
        expect(req.request.body.productos.length).toBe(2);
        req.flush({ message: 'OK' });
      });
    });

    describe('eliminarCotizacion', () => {
      it('debería eliminar una cotización por índice', () => {
        const userId = '1';
        const cotizacionIndex = 0;
        const mockResponse = { message: 'Cotización eliminada' };

        service.eliminarCotizacion(userId, cotizacionIndex).subscribe(response => {
          expect(response.message).toBe('Cotización eliminada');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${cotizacionIndex}`);
        expect(req.request.method).toBe('DELETE');
        req.flush(mockResponse);
      });

      it('debería fallar al eliminar cotización con índice inválido', () => {
        const userId = '1';
        const cotizacionIndex = 999;

        service.eliminarCotizacion(userId, cotizacionIndex).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${cotizacionIndex}`);
        req.flush('Índice inválido', { status: 404, statusText: 'Not Found' });
      });

      it('debería eliminar cotización con índice 0', () => {
        const userId = '1';
        const cotizacionIndex = 0;

        service.eliminarCotizacion(userId, cotizacionIndex).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${cotizacionIndex}`);
        expect(req.request.method).toBe('DELETE');
        req.flush({ message: 'OK' });
      });

      it('debería manejar eliminación de última cotización', () => {
        const userId = '1';
        const cotizacionIndex = 5;
        const mockResponse = {
          message: 'Última cotización eliminada',
          cotizaciones_restantes: 0
        };

        service.eliminarCotizacion(userId, cotizacionIndex).subscribe(response => {
          expect(response.cotizaciones_restantes).toBe(0);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${cotizacionIndex}`);
        req.flush(mockResponse);
      });
    });

    describe('actualizarCotizacion', () => {
      it('debería actualizar una cotización por userId y nro_cotizacion', () => {
        const userId = '1';
        const nro_cotizacion = 'COT-001';
        const cotizacionActualizada = { ...mockCotizacion, validez_oferta: '60 días' };
        const mockResponse = {
          message: 'Cotización actualizada',
          cotizacion: cotizacionActualizada
        };

        service.actualizarCotizacion(userId, nro_cotizacion, cotizacionActualizada).subscribe(response => {
          expect(response.message).toBe('Cotización actualizada');
          expect(response.cotizacion.validez_oferta).toBe('60 días');
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${nro_cotizacion}`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual(cotizacionActualizada);
        req.flush(mockResponse);
      });

      it('debería fallar al actualizar con nro_cotizacion inexistente', () => {
        const userId = '1';
        const nro_cotizacion = 'COT-999';

        service.actualizarCotizacion(userId, nro_cotizacion, mockCotizacion).subscribe(
          () => fail('Debería haber fallado'),
          (error) => {
            expect(error.status).toBe(404);
          }
        );

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${nro_cotizacion}`);
        req.flush('Cotización no encontrada', { status: 404, statusText: 'Not Found' });
      });

      it('debería actualizar todos los campos de la cotización', () => {
        const userId = '1';
        const nro_cotizacion = 'COT-001';
        const cotizacionCompleta = {
          ...mockCotizacion,
          nombre_empresa: 'Nueva Empresa',
          forma_pago: 'Efectivo',
          moneda: 'USD',
          productos: [{ ...mockProducto, cantidad: 100 }]
        };

        service.actualizarCotizacion(userId, nro_cotizacion, cotizacionCompleta).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${nro_cotizacion}`);
        expect(req.request.body.nombre_empresa).toBe('Nueva Empresa');
        expect(req.request.body.forma_pago).toBe('Efectivo');
        expect(req.request.body.moneda).toBe('USD');
        req.flush({ message: 'OK' });
      });

      it('debería manejar caracteres especiales en nro_cotizacion', () => {
        const userId = '1';
        const nro_cotizacion = 'COT-2025/001';

        service.actualizarCotizacion(userId, nro_cotizacion, mockCotizacion).subscribe();

        const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${nro_cotizacion}`);
        expect(req.request.method).toBe('PUT');
        req.flush({ message: 'OK' });
      });
    });
  });

  describe('Manejo de errores globales', () => {
    it('debería manejar timeout de petición', () => {
      const userId = '1';

      service.buscarUsuarioPorId(userId).subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.status).toBe(0);
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
      req.error(new ProgressEvent('timeout'));
    });

    it('debería manejar error de red', () => {
      service.listarUsuarios().subscribe(
        () => fail('Debería haber fallado'),
        (error) => {
          expect(error.error.type).toBe('error');
        }
      );

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/all`);
      req.error(new ProgressEvent('error'));
    });

    it('debería manejar respuesta vacía del servidor', () => {
      const userId = '1';

      service.buscarUsuarioPorId(userId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}`);
      req.flush(null);
    });
  });

  describe('Validación de URLs', () => {
    it('debería usar la URL correcta para crear usuario', () => {
      service.crearUsuario(mockUsuarioP).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/register`);
      expect(req.request.url).toBe(`${environment.apiUrl}/usuarios/register`);
      req.flush({});
    });

    it('debería usar la URL correcta para listar usuarios', () => {
      service.listarUsuarios().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/all`);
      expect(req.request.url).toBe(`${environment.apiUrl}/usuarios/all`);
      req.flush({ success: true, users: [] });
    });

    it('debería construir URL correctamente con parámetros dinámicos', () => {
      const userId = '123';
      const nro_cotizacion = 'COT-456';
      
      service.actualizarCotizacion(userId, nro_cotizacion, mockCotizacion).subscribe();
      
      const req = httpMock.expectOne(`${environment.apiUrl}/usuarios/${userId}/cotizaciones/${nro_cotizacion}`);
      expect(req.request.url).toContain(userId);
      expect(req.request.url).toContain(nro_cotizacion);
      req.flush({});
    });
  });
});
