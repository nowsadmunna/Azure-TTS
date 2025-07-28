import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  azure: {
    key: process.env.AZURE_KEY,
    region: process.env.AZURE_REGION,
    ttsUrl: `https://${process.env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    assessUrl: `https://${process.env.AZURE_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US`
  },
  ffmpeg: {
    ffmpegPath: 'D:\\Downloads\\ffmpeg-7.1.1-essentials_build\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe',
    ffprobePath: 'D:\\Downloads\\ffmpeg-7.1.1-essentials_build\\ffmpeg-7.1.1-essentials_build\\bin\\ffprobe.exe'
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: ['.webm', '.ogg', '.wav']
  }
};
