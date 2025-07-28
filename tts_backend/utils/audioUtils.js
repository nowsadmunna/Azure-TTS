import ffmpeg from 'fluent-ffmpeg';
import { config } from '../config/config.js';

// Configure FFmpeg paths
ffmpeg.setFfmpegPath(config.ffmpeg.ffmpegPath);
ffmpeg.setFfprobePath(config.ffmpeg.ffprobePath);

/**
 * Convert audio file to WAV format required by Azure Speech Services
 * @param {string} inputPath - Path to input audio file
 * @param {string} outputPath - Path where WAV file will be saved
 * @returns {Promise<void>}
 */
export async function convertAudioToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('pcm_s16le')
      .audioFrequency(16000)
      .audioChannels(1)
      .format('wav')
      .on('start', (cmd) => console.log('FFmpeg command:', cmd))
      .on('end', () => {
        console.log('✅ Audio conversion successful');
        resolve();
      })
      .on('error', (err) => {
        console.error('❌ FFmpeg error:', err.message);
        reject(new Error('Failed to convert audio to WAV'));
      })
      .save(outputPath);
  });
}

/**
 * Get audio file metadata using FFprobe
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<object>} Audio metadata
 */
export async function getAudioMetadata(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, data) => {
      if (err) {
        console.error('❌ FFprobe error:', err.message);
        reject(new Error(`Invalid audio file: ${err.message}`));
      } else {
        console.log('📊 Audio metadata:', {
          duration: data.format.duration,
          format: data.format.format_name,
          size: data.format.size
        });
        resolve(data);
      }
    });
  });
}

/**
 * Validate audio file duration
 * @param {object} metadata - Audio metadata from FFprobe
 * @param {number} minDuration - Minimum required duration in seconds
 * @throws {Error} If audio is too short
 */
export function validateAudioDuration(metadata, minDuration = 1) {
  if (!metadata.format.duration || metadata.format.duration < minDuration) {
    throw new Error(`Audio must be at least ${minDuration} second(s) long`);
  }
}
