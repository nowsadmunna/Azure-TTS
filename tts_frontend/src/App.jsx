import { useState } from 'react';
import './App.css';
import { useTTS } from './hooks/useTTS.js';
import { useAudioRecording } from './hooks/useAudioRecording.js';
import { useAssessment } from './hooks/useAssessment.js';
import { TTSSection } from './components/TTSSection.jsx';
import { RecordingSection } from './components/RecordingSection.jsx';
import { AudioPlayback } from './components/AudioPlayback.jsx';
import { AssessmentResults } from './components/AssessmentResults.jsx';

export default function App() {
  const [text, setText] = useState('Apple');
  
  // Custom hooks for different functionalities
  const tts = useTTS();
  const recording = useAudioRecording();
  const assessment = useAssessment();

  const handleAssessment = async () => {
    try {
      const result = await assessment.performAssessment(recording.audioBlob, text);
      const score = assessment.formatScore(result.AccuracyScore);
      const { emoji, message } = assessment.getScoreMessage(score);
      
      // Show user-friendly alert
      alert(`${emoji} ${message} Score: ${score}%`);
    } catch (error) {
      alert(`Assessment failed: ${error.message}`);
    }
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Text-to-Speech Section */}
      <TTSSection
        text={text}
        onTextChange={setText}
        onGenerate={tts.generateAudio}
        onPlay={tts.playGeneratedAudio}
        hasAudio={tts.hasAudio}
        isLoading={tts.isLoading}
        error={tts.error}
      />

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '2px solid #eee' }} />

      {/* Recording Section */}
      <RecordingSection
        isRecording={recording.isRecording}
        onStartRecording={recording.startAudioRecording}
        onStopRecording={recording.stopAudioRecording}
        onFileUpload={recording.handleFileUpload}
        onTriggerFileUpload={recording.triggerFileUpload}
        fileInputRef={recording.fileInputRef}
        error={recording.error}
      />

      {/* Audio Playback and Assessment */}
      <AudioPlayback
        audioUrl={recording.audioUrl}
        onAssess={handleAssessment}
        isAssessing={assessment.isAssessing}
        onClear={recording.clearAudio}
      />

      {/* Assessment Error Display */}
      {assessment.error && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          Assessment Error: {assessment.error}
        </div>
      )}

      {/* Assessment Results */}
      <AssessmentResults
        result={assessment.lastResult}
        getScoreMessage={assessment.getScoreMessage}
        formatScore={assessment.formatScore}
      />
    </div>
  );
}