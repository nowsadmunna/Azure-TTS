import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { convertAudioToWav, getAudioMetadata, validateAudioDuration } from '../utils/audioUtils.js';
import { assessPronunciation } from '../services/azureService.js';
import { cleanupFiles } from '../middleware/uploadMiddleware.js';

/**
 * Handle pronunciation assessment requests
 */
export async function handleAssessment(req, res) {
  const { text } = req.body;
  
  console.log('🎤 Assessment request received:');
  console.log('- Text:', text);
  console.log('- File:', req.file ? {
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  } : 'No file');

  if (!text || !req.file) {
    console.log('❌ Validation failed - missing text or file');
    return res.status(400).json({ error: 'Text and audio file are required' });
  }

  const audioPath = path.resolve(req.file.path);
  const wavPath = path.join(os.tmpdir(), `${Date.now()}.wav`);

  try {
    // Verify uploaded file exists
    await fs.access(audioPath);
    console.log('✅ Uploaded file found');

    // Get and validate audio metadata
    const metadata = await getAudioMetadata(audioPath);
    validateAudioDuration(metadata);

    // Convert audio to WAV format
    console.log('🔄 Converting audio to WAV...');
    await convertAudioToWav(audioPath, wavPath);

    // Verify converted file
    const wavStats = await fs.stat(wavPath);
    console.log('📊 WAV file size:', wavStats.size);
    
    if (wavStats.size === 0) {
      throw new Error('Audio conversion failed - empty file');
    }

    // Read audio buffer for assessment
    const audioBuffer = await fs.readFile(wavPath);
    console.log('📦 Audio buffer size:', audioBuffer.length);

    // Assess pronunciation
    const result = await assessPronunciation(audioBuffer, text);
    
    res.json({ result });
    
  } catch (error) {
    console.error('❌ Assessment Error:', {
      message: error.message,
      stack: error.stack.split('\n')[0] // Only first line of stack
    });
    
    res.status(500).json({ 
      error: 'Assessment failed',
      details: error.message,
      suggestion: 'Please try recording again in a quiet environment'
    });
  } finally {
    // Clean up temporary files
    await cleanupFiles([audioPath, wavPath]);
  }
}
