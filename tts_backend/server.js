import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import apiRoutes from './routes/apiRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api', apiRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
  console.log('✅ FFmpeg configured');
  console.log('✅ Azure Speech Services ready');
  console.log('📁 Upload directory configured');
});
