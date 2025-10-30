import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import courseRoutes from './routes/courseRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();

// Configuración de CORS (permite peticiones desde el frontend)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Permite recibir JSON en requests
app.use(express.json());

// IMPORTANTE: Aumentar el límite de payload para archivos grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check para Render (obligatorio)
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta base de prueba
app.get('/', (_req, res) => {
  res.status(200).json({ 
    message: 'API OnLearn', 
    version: '1.0.0',
    endpoints: {
      courses: '/api/courses',
      enrollments: '/api/enrollments',
      users: '/api/users',
      upload: '/api/upload',
      health: '/health'
    }
  });
});

// Rutas principales
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo global de errores
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Error interno del servidor' 
  });
});

// Puerto y host configurables para Render
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0'; // Crucial para Render

// Escuchar en 0.0.0.0 (no solo localhost)
app.listen(PORT, HOST, () => {
  console.log(`Servidor OnLearn escuchando en ${HOST}:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check disponible en: http://${HOST}:${PORT}/health`);
});

// Manejo de señales de terminación (graceful shutdown)
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});