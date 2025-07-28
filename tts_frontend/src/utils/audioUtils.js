/**
 * Start recording audio from user's microphone
 * @param {function} onDataAvailable - Callback for audio data chunks
 * @param {function} onStop - Callback when recording stops
 * @returns {Promise<MediaRecorder>} MediaRecorder instance
 */
export async function startRecording(onDataAvailable, onStop) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    
    const audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
        onDataAvailable && onDataAvailable(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop all tracks to release microphone
      stream.getTracks().forEach(track => track.stop());
      
      onStop && onStop(audioBlob, audioUrl);
    };
    
    mediaRecorder.start();
    return mediaRecorder;
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Failed to access microphone. Please check permissions.');
  }
}

/**
 * Stop recording audio
 * @param {MediaRecorder} mediaRecorder - MediaRecorder instance to stop
 */
export function stopRecording(mediaRecorder) {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

/**
 * Validate uploaded audio file
 * @param {File} file - File to validate
 * @returns {boolean} True if valid audio file
 */
export function validateAudioFile(file) {
  if (!file) {
    throw new Error('No file selected');
  }
  
  if (!file.type.includes('audio/')) {
    throw new Error('Please upload an audio file');
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }
  
  return true;
}

/**
 * Create audio URL from file
 * @param {File} file - Audio file
 * @returns {string} Object URL for the file
 */
export function createAudioUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * Play audio from data URL
 * @param {string} audioSrc - Audio source URL
 */
export function playAudio(audioSrc) {
  if (audioSrc) {
    const audio = new Audio(audioSrc);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  }
}
