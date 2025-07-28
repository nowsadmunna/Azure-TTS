import express from 'express';
import cors from 'cors';
import axios from 'axios';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import dotenv from 'dotenv';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import { Readable } from 'stream';
dotenv.config();

// Set FFmpeg paths
const ffmpegPath = 'D:\\Downloads\\ffmpeg-7.1.1-essentials_build\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe';
const ffprobePath = 'D:\\Downloads\\ffmpeg-7.1.1-essentials_build\\ffmpeg-7.1.1-essentials_build\\bin\\ffprobe.exe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 4000;
const AZURE_KEY = process.env.AZURE_KEY;
const AZURE_REGION = process.env.AZURE_REGION;
const AZURE_TTS_URL = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
const AZURE_ASSESS_URL = `https://${AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`;

// Upload setup
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

// SSML helper
const createSsml = (text) => `
<speak version='1.0' xml:lang='en-US'>
  <voice xml:lang='en-US' name='en-US-AriaNeural'>${text}</voice>
</speak>
`;

// Convert audio to WAV format
async function convertAudioToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .on('start', (cmd) => console.log('FFmpeg command:', cmd))
      .on('end', () => {
        console.log('Conversion successful');
        resolve();
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err.message);
        reject(new Error('Failed to convert audio to WAV'));
      })
      .save(outputPath);
  });
}

// TTS Endpoint
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
    res.status(500).json({ error: 'TTS failed' });
  }
});

// Pronunciation Assessment
app.post('/api/assess', upload.single('audio'), async (req, res) => {
  const { text } = req.body;

  if (!text || !req.file) {
    return res.status(400).json({ error: 'Text and audio file are required' });
  }

  const audioPath = path.resolve(req.file.path);
  const wavPath = path.join(os.tmpdir(), `${Date.now()}.wav`);

  try {
    await fs.access(audioPath);
    console.log('✅ Uploaded file found');

    const metadata = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    if (!metadata.format.duration || metadata.format.duration < 1) {
      throw new Error('Audio must be at least 1 second long');
    }

    console.log('Converting to WAV...');
    await convertAudioToWav(audioPath, wavPath);

    const audioBuffer = await fs.readFile(wavPath);
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();

    const speechConfig = sdk.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    speechConfig.speechRecognitionLanguage = 'en-US';

    // 👇 Enable Pronunciation Assessment
    const pronConfig = new sdk.PronunciationAssessmentConfig(
      text,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Word,
      true // enable miscue calculation
    );

    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    pronConfig.applyTo(recognizer);

    console.log('🔍 Sending audio to Azure SDK...');
    recognizer.recognizeOnceAsync(result => {
      console.log('🧠 Recognition Result:', result);

      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        const assessmentResult = sdk.PronunciationAssessmentResult.fromResult(result);
        const output = {
          AccuracyScore: assessmentResult.accuracyScore,
          FluencyScore: assessmentResult.fluencyScore,
          CompletenessScore: assessmentResult.completenessScore,
          PronunciationScore: assessmentResult.pronunciationScore,
        };

        res.json({ result: output });
      } else {
        console.error('❌ Recognition failed:', result.errorDetails);
        res.status(500).json({ error: 'Recognition failed', details: result.errorDetails });
      }
    });

  } catch (err) {
    console.error('Assessment Error:', err.message);
    res.status(500).json({ error: 'Assessment failed', details: err.message });
  } finally {
    await Promise.all([
      fs.unlink(audioPath).catch(() => {}),
      fs.unlink(wavPath).catch(() => {})
    ]);
  }
});

// Azure Health Check
app.get('/test-azure', async (req, res) => {
  try {
    const response = await axios.post(AZURE_TTS_URL, createSsml('test'), {
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      responseType: 'arraybuffer',
    });

    res.json({ status: 'Azure TTS OK', length: response.data.byteLength });
  } catch (err) {
    res.status(500).json({ status: 'Azure TTS FAILED', error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
