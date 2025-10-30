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

// Ruta base de prueba
app.get('/', (_req, res) => res.send('API OnLearn'));

// Rutas principales
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Puerto configurable por Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor OnLearn escuchando en el puerto ${PORT}`);
});
