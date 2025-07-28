import PropTypes from 'prop-types';

export function AudioPlayback({ audioUrl, onAssess, isAssessing, onClear }) {
  if (!audioUrl) return null;

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>Recorded Audio:</p>
      
      <audio 
        controls 
        src={audioUrl}
        style={{ width: '100%', marginBottom: '12px' }}
      />
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={onAssess}
          disabled={isAssessing}
          style={{
            padding: '12px 24px',
            backgroundColor: isAssessing ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isAssessing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            flex: 1
          }}
        >
          {isAssessing ? 'Assessing...' : '🔍 Send for Assessment'}
        </button>
        
        <button 
          onClick={onClear}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
}

AudioPlayback.propTypes = {
  audioUrl: PropTypes.string,
  onAssess: PropTypes.func.isRequired,
  isAssessing: PropTypes.bool.isRequired,
  onClear: PropTypes.func.isRequired
};
