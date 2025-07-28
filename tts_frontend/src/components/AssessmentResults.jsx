import PropTypes from 'prop-types';

export function AssessmentResults({ result, getScoreMessage, formatScore }) {
  if (!result) return null;

  const accuracyScore = formatScore(result.AccuracyScore);
  const { emoji, message } = getScoreMessage(accuracyScore);

  return (
    <div style={{
      marginTop: '16px',
      padding: '16px',
      backgroundColor: accuracyScore >= 80 ? '#d4edda' : '#fff3cd',
      borderRadius: '8px',
      border: `1px solid ${accuracyScore >= 80 ? '#c3e6cb' : '#ffeaa7'}`
    }}>
      <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>{emoji}</span>
        {message}
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {accuracyScore}%
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Accuracy</div>
        </div>
        
        {result.FluencyScore !== undefined && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
              {formatScore(result.FluencyScore)}%
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Fluency</div>
          </div>
        )}
        
        {result.CompletenessScore !== undefined && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fd7e14' }}>
              {formatScore(result.CompletenessScore)}%
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Completeness</div>
          </div>
        )}
        
        {result.PronunciationScore !== undefined && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
              {formatScore(result.PronunciationScore)}%
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Pronunciation</div>
          </div>
        )}
      </div>

      {result.RecognizedText && (
        <div style={{ marginTop: '12px', fontSize: '14px' }}>
          <strong>Recognized Text:</strong> "{result.RecognizedText}"
        </div>
      )}
    </div>
  );
}

AssessmentResults.propTypes = {
  result: PropTypes.object,
  getScoreMessage: PropTypes.func.isRequired,
  formatScore: PropTypes.func.isRequired
};
