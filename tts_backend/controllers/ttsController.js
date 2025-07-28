import { textToSpeech } from '../services/azureService.js';

/**
 * Handle text-to-speech conversion requests
 */
export async function handleTTS(req, res) {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    console.log('🎵 Processing TTS request for:', text);
    const audioBase64 = await textToSpeech(text);
    
    res.json({ audioBase64 });
  } catch (error) {
    console.error('❌ TTS request failed:', error.message);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
}
