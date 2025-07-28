import express from 'express';
import { handleTTS } from '../controllers/ttsController.js';
import { handleAssessment } from '../controllers/assessmentController.js';
import { handleHealthCheck, handleAzureTest } from '../controllers/healthController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Text-to-Speech endpoint
router.post('/tts', handleTTS);

// Pronunciation Assessment endpoint
router.post('/assess', upload.single('audio'), handleAssessment);

// Health check endpoints
router.get('/health', handleHealthCheck);
router.get('/test-azure', handleAzureTest);

export default router;
