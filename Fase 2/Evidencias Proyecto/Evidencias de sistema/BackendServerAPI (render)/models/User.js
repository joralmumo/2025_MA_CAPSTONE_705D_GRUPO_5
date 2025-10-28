const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const cotizacionSchema = new mongoose.Schema({
  nro_cotizacion: String,
  nombre_empresa: String,
  telefono_empresa: String,
  rut_empresa: String,
  email_empresa: String,
  direccion_empresa: String,
  nombre_cliente: String,
  obra_cliente: String,
  contacto_cliente: String,
  email_cliente: String,
  direccion_cliente: String,
  fecha: String,
  validez_oferta: String,
  forma_pago: String,
  presupuesto_incluye: String,
  moneda: String,
  productos: [mongoose.Schema.Types.Mixed], // Array de productos
  fecha_creacion: { type: Date, default: Date.now }
}, { _id: false }); // _id: false para evitar que cada cotización tenga un _id y colapsar

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  contrasena: {
    type: String,
    required: true,
    minlength: 6
  },
  rol: {
    type: String,
    default: 'user',
    enum: ['user', 'admin']
  },
  isactive: {
    type: Boolean,
    default: true
  },
  cotizaciones: [cotizacionSchema] 
}, {
  timestamps: true
});

// Hasheo de contraseña!!
userSchema.pre('save', async function(next) {
    if (!this.isModified('contrasena')) return next();
    
    this.contrasena = await bcrypt.hash(this.contrasena, 12);
    next();
});

// comparacion de contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.contrasena);
};

module.exports = mongoose.model('User', userSchema);
