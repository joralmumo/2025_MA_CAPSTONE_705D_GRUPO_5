//server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const app = express();

// Lista de origenes permitidos
const allowedOrigins = [
    'http://localhost:4200',
    'https://instacotiza-online-dlx.vercel.app',
    'https://instacotiza.com',
    'https://www.instacotiza.com'
];

// Configuración CORS
const corsOptions = {
    origin: function(origin, callback) {
        // Permitir peticiones sin origin
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log(`CORS bloqueado: ${origin}`);
            callback(new Error('CORS error'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 86400
};

app.use(cors(corsOptions));

// Middleware para debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
    next();
});

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
