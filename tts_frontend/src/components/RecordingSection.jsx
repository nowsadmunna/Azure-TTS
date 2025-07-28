import PropTypes from 'prop-types';

export function RecordingSection({ 
  isRecording, 
  onStartRecording, 
  onStopRecording, 
  onFileUpload, 
  onTriggerFileUpload,
  fileInputRef,
  error 
}) {
  return (
    <div>
      <h3>🎤 Record Your Voice</h3>
      
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {!isRecording ? (
          <button 
            onClick={onStartRecording}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🎤 Start Recording
          </button>
        ) : (
          <button 
            onClick={onStopRecording}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              animation: 'pulse 1s infinite'
            }}
          >
            ⏹️ Stop Recording
          </button>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <p style={{ margin: '8px 0', color: '#666' }}>Or upload an audio file:</p>
        
        <input
          type="file"
          accept="audio/*"
          onChange={onFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        
        <button 
          onClick={onTriggerFileUpload}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6f42c1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          📁 Upload Audio File
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '8px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

RecordingSection.propTypes = {
  isRecording: PropTypes.bool.isRequired,
  onStartRecording: PropTypes.func.isRequired,
  onStopRecording: PropTypes.func.isRequired,
  onFileUpload: PropTypes.func.isRequired,
  onTriggerFileUpload: PropTypes.func.isRequired,
  fileInputRef: PropTypes.object.isRequired,
  error: PropTypes.string
};
