import { useState, useRef } from 'react';
import { generateTTS } from '../services/apiService.js';
import { playAudio } from '../utils/audioUtils.js';

export function useTTS() {
  const [audioSrc, setAudioSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateAudio = async (text) => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🎵 Generating TTS for:', text);
      const audioDataUrl = await generateTTS(text);
      setAudioSrc(audioDataUrl);
      console.log('✅ TTS generated successfully');
    } catch (err) {
      console.error('❌ TTS generation failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const playGeneratedAudio = () => {
    if (audioSrc) {
      playAudio(audioSrc);
    }
  };

  return {
    audioSrc,
    isLoading,
    error,
    generateAudio,
    playGeneratedAudio,
    hasAudio: !!audioSrc
  };
}
