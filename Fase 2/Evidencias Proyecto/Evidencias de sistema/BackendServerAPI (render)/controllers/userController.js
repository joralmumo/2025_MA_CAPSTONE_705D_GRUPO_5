const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendPasswordResetCode } = require('../services/emailService');

// Recuperar contraseña!!
exports.solicitarCodigoRecuperacion = async (req, res) => {
  try {
    const { correo } = req.body;

    // Buscar usuario
    const user = await User.findOne({ correo });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'Si el correo existe, recibirás un código de recuperación'
      });
    }

    // Se genera el codigo de 4 digitos pq 6 no funcionó la weá
    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Establecer expiración en 15 minutos
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    // Guardar código y expiración
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();

    // Enviar email con el código
    sendPasswordResetCode(user.nombre, user.correo, resetCode).catch(err => {
      console.error('⚠️ Error al enviar código de recuperación:', err);
    });

    res.json({
      success: true,
      message: 'Si el correo existe, recibirás un código de recuperación'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// Verificar código de recuperación
exports.verificarCodigoRecuperacion = async (req, res) => {
  try {
    const { correo, codigo } = req.body;

    const user = await User.findOne({ correo });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar si el código ha expirado
    if (new Date() > user.resetCodeExpiry) {
      // Limpiar código expirado
      user.resetCode = null;
      user.resetCodeExpiry = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'El código ha expirado. Solicita uno nuevo'
      });
    }

    // Verificar si el código calza
    if (user.resetCode !== codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código incorrecto'
      });
    }

    // Código válido
    res.json({
      success: true,
      message: 'Código verificado correctamente',
      userId: user._id // Para usar en el siguiente paso
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// Cambiar contraseña con código validado
exports.cambiarContrasenaConCodigo = async (req, res) => {
  try {
    const { correo, codigo, nuevaContrasena } = req.body;

    const user = await User.findOne({ correo });

    if (!user || !user.resetCode || !user.resetCodeExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Código inválido o expirado'
      });
    }

    // Verificar expiración
    if (new Date() > user.resetCodeExpiry) {
      user.resetCode = null;
      user.resetCodeExpiry = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'El código ha expirado'
      });
    }

    // Verificar código
    if (user.resetCode !== codigo) {
      return res.status(400).json({
        success: false,
        message: 'Código incorrecto'
      });
    }

    // Validar nueva contraseña
    if (!nuevaContrasena || nuevaContrasena.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Actualizar contraseña (el hook pre-save la hashea de una asi que tamos pulento)
    user.contrasena = nuevaContrasena;
    user.resetCode = null; 
    user.resetCodeExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// Registro
exports.register = async (req, res) => {
    try {
        const { nombre, correo, contrasena } = req.body;

        // ¿existe el usuariO?
        const existingUser = await User.findOne({ correo });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }

        // crea usuario nuevo
        const user = new User({
            nombre,
            correo,
            contrasena
        });

        await user.save();

        // manda el mail de bienvenida
        sendWelcomeEmail(nombre, correo).catch(err => {
          console.error('⚠️ Error al enviar email (usuario creado exitosamente):', err);
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: user._id,
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: error.message
        });
    }
};

// login....
exports.login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        // Buscar usuario
        const user = await User.findOne({ correo });
        if (!user || !user.isactive) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(contrasena);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar clave secreta JWT
        const token = jwt.sign(
            { userId: user._id, correo: user.correo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                id: user._id,
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol,
                cotizaciones: user.cotizaciones
            },
            token
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: error.message
        });
    }
};

exports.getUserByEmail = async (req, res) => {
    try {
        const { correo } = req.query;
        
        const user = await User.findOne({ correo });
        
        if (!user) {
            return res.json([]);
        }

        res.json([{
            id: user._id,
            nombre: user.nombre,
            correo: user.correo,
            contrasena: user.contrasena,
            rol: user.rol,
            isactive: user.isactive,
            cotizaciones: user.cotizaciones
        }]);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: error.message
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isactive: true })
            .select('-contrasena') // no contraseñas
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error del servidor',
            error: error.message
        });
    }
};

exports.agregarCotizacion = async (req, res) => {
  try {
    const { userId } = req.params;
    const cotizacionData = req.body;

    cotizacionData.fecha_creacion = new Date();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.cotizaciones.push(cotizacionData);
    await user.save();

    res.json({
      success: true,
      message: 'Cotización guardada exitosamente',
      cotizacion: cotizacionData,
      totalCotizaciones: user.cotizaciones.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      id: user._id,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      isactive: user.isactive,
      cotizaciones: user.cotizaciones
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

exports.actualizarCotizacion = async (req, res) => {
  try {
    const { userId, cotizacionIndex } = req.params;
    const cotizacionData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (cotizacionIndex >= user.cotizaciones.length || cotizacionIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    user.cotizaciones[cotizacionIndex] = { 
      ...user.cotizaciones[cotizacionIndex], 
      ...cotizacionData,
      fecha_modificacion: new Date()
    };
    
    await user.save();

    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente',
      cotizacion: user.cotizaciones[cotizacionIndex]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

exports.eliminarCotizacion = async (req, res) => {
  try {
    const { userId, cotizacionIndex } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (cotizacionIndex >= user.cotizaciones.length || cotizacionIndex < 0) {
      return res.status(404).json({
        success: false,
        message: 'Cotización no encontrada'
      });
    }

    // Eliminar cotización del array
    user.cotizaciones.splice(cotizacionIndex, 1);
    await user.save();

    res.json({
      success: true,
      message: 'Cotización eliminada exitosamente',
      totalCotizaciones: user.cotizaciones.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// Actualizar cotización por número de cotización (el otro no funciono pero lo dejo por siaca)
exports.actualizarCotizacionPorNumero = async (req, res) => {
  try {
    const { userId } = req.params;
    const cotizacionData = req.body;
    const nroCotizacion = cotizacionData.nro_cotizacion;

    if (!nroCotizacion) {
      return res.status(400).json({
        success: false,
        message: 'Número de cotización no proporcionado'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Buscar la cotización por número
    const cotizacionIndex = user.cotizaciones.findIndex(
      cot => cot.nro_cotizacion === nroCotizacion
    );

    if (cotizacionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Cotización N°${nroCotizacion} no encontrada`
      });
    }

    // Sobreescribir la cotización
    user.cotizaciones[cotizacionIndex] = {
      ...cotizacionData,
      fecha_modificacion: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: `Cotización N°${nroCotizacion} actualizada exitosamente`,
      cotizacion: user.cotizaciones[cotizacionIndex],
      index: cotizacionIndex
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// Actualizar usuarios a ver si ahora funciona la wea
exports.actualizarUsuario = async (req, res) => {
  try {
    const { userId } = req.params;
    const { nombre, correo, rol, isactive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (correo && correo !== user.correo) {
      const correoExiste = await User.findOne({ correo, _id: { $ne: userId } });
      if (correoExiste) {
        return res.status(400).json({
          success: false,
          message: 'Error, prueba con otro email'
        });
      }
    }

    // Actualizar nombre 
    if (nombre) user.nombre = nombre;
    if (correo) user.correo = correo;
    if (rol) user.rol = rol;
    if (typeof isactive !== 'undefined') user.isactive = isactive;

    await user.save();

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: {
        id: user._id,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol,
        isactive: user.isactive,
        cotizaciones: user.cotizaciones
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
};


