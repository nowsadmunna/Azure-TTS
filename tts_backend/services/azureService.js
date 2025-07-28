import axios from 'axios';
import sdk from 'microsoft-cognitiveservices-speech-sdk';
import { config } from '../config/config.js';

/**
 * Create SSML markup for text-to-speech
 * @param {string} text - Text to convert to speech
 * @returns {string} SSML markup
 */
export function createSsml(text) {
  return `
<speak version='1.0' xml:lang='en-US'>
  <voice xml:lang='en-US' name='en-US-AriaNeural'>${text}</voice>
</speak>
`;
}

/**
 * Convert text to speech using Azure TTS service
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Base64 encoded audio data
 */
export async function textToSpeech(text) {
  try {
    const response = await axios.post(config.azure.ttsUrl, createSsml(text), {
      headers: {
        'Ocp-Apim-Subscription-Key': config.azure.key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      responseType: 'arraybuffer',
    });

    const base64Audio = Buffer.from(response.data).toString('base64');
    console.log('✅ TTS conversion successful');
    return base64Audio;
  } catch (error) {
    console.error('❌ TTS Error:', error.response?.data || error.message);
    throw new Error('Failed to generate speech');
  }
}

/**
 * Assess pronunciation using Azure Speech SDK
 * @param {Buffer} audioBuffer - WAV audio buffer
 * @param {string} referenceText - Text that was supposed to be spoken
 * @returns {Promise<object>} Pronunciation assessment results
 */
export async function assessPronunciation(audioBuffer, referenceText) {
  return new Promise((resolve, reject) => {
    try {
      // Create audio input stream
      const pushStream = sdk.AudioInputStream.createPushStream();
      pushStream.write(audioBuffer);
      pushStream.close();

      // Configure speech recognition
      const speechConfig = sdk.SpeechConfig.fromSubscription(config.azure.key, config.azure.region);
      speechConfig.speechRecognitionLanguage = 'en-US';

      // Configure pronunciation assessment
      const pronConfig = new sdk.PronunciationAssessmentConfig(
        referenceText,
        sdk.PronunciationAssessmentGradingSystem.HundredMark,
        sdk.PronunciationAssessmentGranularity.Word,
        true // enable miscue calculation
      );

      const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
      const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      pronConfig.applyTo(recognizer);

      console.log('🔍 Sending audio to Azure Speech SDK...');
      
      recognizer.recognizeOnceAsync(result => {
        console.log('🧠 Recognition result received');

        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          const assessmentResult = sdk.PronunciationAssessmentResult.fromResult(result);
          
          const output = {
            AccuracyScore: assessmentResult.accuracyScore,
            FluencyScore: assessmentResult.fluencyScore,
            CompletenessScore: assessmentResult.completenessScore,
            PronunciationScore: assessmentResult.pronunciationScore,
            RecognizedText: result.text
          };

          console.log('✅ Assessment successful:', output);
          resolve(output);
        } else {
          console.error('❌ Recognition failed:', result.errorDetails);
          reject(new Error(`Recognition failed: ${result.errorDetails}`));
        }
      });

    } catch (error) {
      console.error('❌ Assessment setup error:', error.message);
      reject(new Error(`Assessment failed: ${error.message}`));
    }
  });
}

/**
 * Test Azure TTS service connectivity
 * @returns {Promise<object>} Connection test results
 */
export async function testAzureConnection() {
  try {
    const response = await axios.post(config.azure.ttsUrl, createSsml('test'), {
      headers: {
        'Ocp-Apim-Subscription-Key': config.azure.key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
      },
      responseType: 'arraybuffer',
    });
    
    return { 
      status: 'Azure connection successful',
      region: config.azure.region,
      keyLength: config.azure.key ? config.azure.key.length : 0,
      responseSize: response.data.byteLength
    };
  } catch (error) {
    throw new Error(`Azure connection failed: ${error.message}`);
  }
}
