import express from 'express';
import cors from 'cors';
import 'dotenv/config';

// Importación de las rutas principales
import courseRoutes from './src/routes/courseRoutes.js';
import enrollmentRoutes from './src/routes/enrollmentRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import uploadRoutes from './src/routes/uploadRoutes.js';

const app = express();

// Configuración de CORS para permitir solicitudes desde cualquier origen
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Configuración para manejar JSON y formularios grandes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ruta de verificación del estado del servidor
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta raíz con información general de la API
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

// Rutas principales del sistema
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Manejo de rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores del servidor
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Configuración del puerto y host
const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// Inicio del servidor
app.listen(PORT, HOST, () => {
  console.log(`Servidor OnLearn escuchando en ${HOST}:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
});

// Manejo de señales para cierre seguro del servidor
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});
