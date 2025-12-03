const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rutas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/', userController.getUserByEmail); 
router.get('/all', userController.getAllUsers);
router.put('/:userId', userController.actualizarUsuario);

router.post('/:userId/cotizaciones', userController.agregarCotizacion);
router.put('/:userId/cotizaciones/:cotizacionIndex', userController.actualizarCotizacion);
router.delete('/:userId/cotizaciones/:cotizacionIndex', userController.eliminarCotizacion);
router.post('/:userId/cotizaciones', userController.agregarCotizacion);
router.get('/:id', userController.getUserById); 
router.put('/:userId/cotizaciones-numero', userController.actualizarCotizacionPorNumero);

router.post('/solicitar-codigo', userController.solicitarCodigoRecuperacion);
router.post('/verificar-codigo', userController.verificarCodigoRecuperacion);
router.post('/cambiar-contrasena', userController.cambiarContrasenaConCodigo);


module.exports = router;
