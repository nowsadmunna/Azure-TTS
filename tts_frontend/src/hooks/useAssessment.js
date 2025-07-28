import { useState } from 'react';
import { assessPronunciation } from '../services/apiService.js';

export function useAssessment() {
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const performAssessment = async (audioBlob, referenceText) => {
    if (!audioBlob) {
      setError('No audio available for assessment');
      return;
    }

    if (!referenceText.trim()) {
      setError('Please enter reference text');
      return;
    }

    setIsAssessing(true);
    setError(null);
    
    try {
      console.log('🔍 Starting pronunciation assessment...');
      console.log('- Reference text:', referenceText);
      console.log('- Audio blob size:', audioBlob.size);
      
      const result = await assessPronunciation(audioBlob, referenceText);
      
      console.log('✅ Assessment completed:', result);
      setLastResult(result.result);
      
      return result.result;
    } catch (err) {
      console.error('❌ Assessment failed:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsAssessing(false);
    }
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return { emoji: '🌟', message: 'Excellent!' };
    if (score >= 80) return { emoji: '🎉', message: 'Well done!' };
    if (score >= 70) return { emoji: '👍', message: 'Good job!' };
    if (score >= 60) return { emoji: '👌', message: 'Not bad!' };
    return { emoji: '🧸', message: 'Try again!' };
  };

  const formatScore = (score) => {
    return Math.round(score || 0);
  };

  return {
    isAssessing,
    lastResult,
    error,
    performAssessment,
    getScoreMessage,
    formatScore
  };
}
