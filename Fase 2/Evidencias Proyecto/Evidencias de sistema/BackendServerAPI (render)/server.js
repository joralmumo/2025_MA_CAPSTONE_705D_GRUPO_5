const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:4200', // <-- APP ANGULAR!!! CAMBIAR EN PRODUCCION!!!!
    credentials: true
}));
app.use(express.json());

// Rutas
app.use('/api/usuarios', userRoutes);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('CONEXION A MONGODB READY!!!'))
    .catch(err => console.error('NO SE CONECTÓ!!: ', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`VERSION 2 - Servidor corriendo en puerto ${PORT}`);
});
