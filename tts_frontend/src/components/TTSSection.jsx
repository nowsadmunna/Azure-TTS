import PropTypes from 'prop-types';

export function TTSSection({ text, onTextChange, onGenerate, onPlay, hasAudio, isLoading, error }) {
  return (
    <div>
      <h2>🧠 Speech Therapy App</h2>
      
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Type a word or phrase"
        style={{ 
          padding: '12px', 
          width: '100%', 
          borderRadius: '8px',
          border: '2px solid #ddd',
          fontSize: '16px'
        }}
      />
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => onGenerate(text)}
          disabled={isLoading || !text.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Generating...' : 'Generate TTS'}
        </button>
        
        <button 
          onClick={onPlay}
          disabled={!hasAudio}
          style={{
            padding: '12px 24px',
            backgroundColor: hasAudio ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: hasAudio ? 'pointer' : 'not-allowed',
            fontSize: '16px'
          }}
        >
          Play TTS
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
    </div>
  );
}

TTSSection.propTypes = {
  text: PropTypes.string.isRequired,
  onTextChange: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  onPlay: PropTypes.func.isRequired,
  hasAudio: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string
};
