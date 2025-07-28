import express from 'express';
import cors from 'cors';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

// Configure upload directory
const uploadDir = path.resolve('uploads');
await fs.mkdir(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, ['.webm', '.ogg', '.wav'].includes(ext));
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 4000;
const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_REGION = process.env.AZURE_REGION;
const AZURE_TTS_URL = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const AZURE_ASSESS_URL = `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

const createSsml = (text) => `
<speak version='1.0' xml:lang='en-US'>
  <voice xml:lang='en-US' name='en-US-AriaNeural'>${text}</voice>
</speak>
`;

async function convertAudioToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    let ffmpegCommand;
    
    const cleanup = () => {
      if (ffmpegCommand) {
        ffmpegCommand.kill('SIGKILL');
      }
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Audio conversion timed out'));
    }, 30000);

    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        clearTimeout(timeout);
        return reject(new Error(`Invalid audio file: ${err.message}`));
      }

      const inputFormat = metadata.format.format_name.includes('webm') ? 'webm' : 
                         metadata.format.format_name.includes('ogg') ? 'ogg' : 
                         'wav';

      console.log(`Converting ${path.basename(inputPath)} (${inputFormat}) to WAV`);

      ffmpegCommand = ffmpeg(inputPath)
        .inputFormat(inputFormat)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .outputOptions([
          '-ar 16000',
          '-ac 1',
          '-f wav',
          '-y'
        ])
        .on('start', (cmd) => console.log('FFmpeg command:', cmd))
        .on('error', (err) => {
          clearTimeout(timeout);
          cleanup();
          console.error('FFmpeg error:', err.message);
          reject(new Error('Failed to process audio. Please try recording again.'));
        })
        .on('end', () => {
          clearTimeout(timeout);
          console.log('Conversion successful');
          resolve();
        })
        .save(outputPath);
    });
  });
}

app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const response = await axios.post(AZURE_TTS_URL, createSsml(text), {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      responseType: 'arraybuffer',
    });

    const base64Audio = Buffer.from(response.data).toString('base64');
    res.json({ audioBase64: base64Audio });
  } catch (error) {
    console.error('TTS Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

app.post('/api/assess', upload.single('audio'), async (req, res) => {
  const { text } = req.body;
  if (!text || !req.file) {
    return res.status(400).json({ error: 'Text and audio file are required' });
  }

  const audioPath = path.resolve(req.file.path);
  const wavPath = path.join(os.tmpdir(), `${Date.now()}.wav`);

  try {
    // Verify audio duration
    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, data) => {
        if (err) reject(new Error('Invalid audio file'));
        else resolve(data);
      });
    });

    if (!metadata.format.duration || metadata.format.duration < 1) {
      throw new Error('Audio must be at least 1 second long');
    }

    await convertAudioToWav(audioPath, wavPath);

    // Verify output file
    const wavStats = await fs.stat(wavPath);
    if (wavStats.size === 0) throw new Error('Conversion failed - empty file');

    const wavBuffer = await fs.readFile(wavPath);

    const headers = {
      'Ocp-Apim-Subscription-Key': AZURE_KEY,
      'Content-Type': 'audio/wav; codec=audio/pcm; samplerate=16000',
      'Pronunciation-Assessment': JSON.stringify({
        ReferenceText: text,
        GradingSystem: 'HundredMark',
        Granularity: 'Word',
        Dimension: 'Comprehensive',
        EnableMiscue: 'True'
      })
    };

    console.log('Sending to Azure...');
    const response = await axios.post(AZURE_ASSESS_URL, wavBuffer, {
      headers,
      timeout: 20000,
      validateStatus: () => true
    });

    if (response.status !== 200) {
      console.error('Azure Error:', {
        status: response.status,
        data: response.data,
        headers: response.headers
      });
      throw new Error(`Azure service error: ${response.status}`);
    }

    if (!response.data.NBest?.[0]?.PronunciationAssessment) {
      throw new Error('Invalid assessment response format');
    }

    res.json({ result: response.data.NBest[0].PronunciationAssessment });
  } catch (error) {
    console.error('Assessment Error:', error.message);
    
    res.status(500).json({ 
      error: 'Assessment failed',
      details: error.message,
      suggestion: 'Please try recording again in a quiet environment'
    });
  } finally {
    await Promise.all([
      fs.unlink(audioPath).catch(() => {}),
      fs.unlink(wavPath).catch(() => {})
    ]);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
  console.log('✅ FFmpeg ready');
});