const User = require('../models/User');
const jwt = require('jsonwebtoken');

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


