const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Generate text-to-speech audio
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Base64 audio data URL
 */
export async function generateTTS(text) {
  const response = await fetch(`${API_BASE_URL}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate TTS');
  }
  
  const data = await response.json();
  return `data:audio/mp3;base64,${data.audioBase64}`;
}

/**
 * Send audio for pronunciation assessment
 * @param {Blob} audioBlob - Audio blob to assess
 * @param {string} referenceText - Reference text for comparison
 * @returns {Promise<object>} Assessment results
 */
export async function assessPronunciation(audioBlob, referenceText) {
  const formData = new FormData();
  formData.append('audio', audioBlob, audioBlob.name || 'recording.webm');
  formData.append('text', referenceText);

  const response = await fetch(`${API_BASE_URL}/assess`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Assessment error:', errorData);
    throw new Error(errorData.details || 'Assessment failed');
  }

  return response.json();
}

/**
 * Test server connectivity
 * @returns {Promise<object>} Health check results
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

/**
 * Test Azure connectivity
 * @returns {Promise<object>} Azure connection test results
 */
export async function testAzureConnection() {
  const response = await fetch(`${API_BASE_URL}/test-azure`);
  return response.json();
}
