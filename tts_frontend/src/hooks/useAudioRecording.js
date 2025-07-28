import { useState, useRef } from 'react';
import { startRecording, stopRecording, validateAudioFile, createAudioUrl } from '../utils/audioUtils.js';

export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  const startAudioRecording = async () => {
    setError(null);
    
    try {
      setIsRecording(true);
      console.log('🎤 Starting audio recording...');
      
      mediaRecorderRef.current = await startRecording(
        null, // onDataAvailable
        (blob, url) => {
          console.log('✅ Recording completed');
          setAudioBlob(blob);
          setAudioUrl(url);
          setIsRecording(false);
        }
      );
    } catch (err) {
      console.error('❌ Recording failed:', err);
      setError(err.message);
      setIsRecording(false);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current) {
      console.log('⏹️ Stopping recording...');
      stopRecording(mediaRecorderRef.current);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    
    try {
      validateAudioFile(file);
      
      console.log('📁 File uploaded:', file.name);
      const url = createAudioUrl(file);
      
      setAudioBlob(file);
      setAudioUrl(url);
    } catch (err) {
      console.error('❌ File upload failed:', err);
      setError(err.message);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  };

  return {
    isRecording,
    audioBlob,
    audioUrl,
    error,
    fileInputRef,
    startAudioRecording,
    stopAudioRecording,
    handleFileUpload,
    triggerFileUpload,
    clearAudio,
    hasAudio: !!audioBlob
  };
}
