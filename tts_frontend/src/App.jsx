import { useState, useRef } from 'react';

export default function App() {
  const [text, setText] = useState('Apple');
  const [audioSrc, setAudioSrc] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const getTtsAudio = async () => {
    const res = await fetch('http://localhost:4000/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setAudioSrc(`data:audio/mp3;base64,${data.audioBase64}`);
  };

  const playTts = () => {
    if (audioSrc) new Audio(audioSrc).play();
  };

  const startRecording = async () => {
    setRecording(true);
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedAudioUrl(url);
      setRecordedAudioBlob(blob);
      setRecording(false);
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.includes('audio/')) {
      alert('Please upload an audio file');
      return;
    }

    setUploadedFile(file);
    setRecordedAudioUrl(URL.createObjectURL(file));
    setRecordedAudioBlob(file);
  };

  const uploadForAssessment = async () => {
    const audioBlob = recordedAudioBlob;
    if (!audioBlob) return alert('No recording available');
    
    const formData = new FormData();
    formData.append('audio', audioBlob, audioBlob.name || 'recording.webm');
    formData.append('text', text);

    try {
      const res = await fetch('http://localhost:4000/api/assess', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Assessment failed');
      
      const data = await res.json();
      const score = data.result.AccuracyScore;
      if (score >= 80) alert(`🎉 Well done! Score: ${score}`);
      else alert(`🧸 Try again. Score: ${score}`);
    } catch (error) {
      alert('Error during assessment: ' + error.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🧠 Speech Therapy App</h2>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a word"
        style={{ padding: 8, width: '100%' }}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={getTtsAudio}>Generate TTS</button>
        <button onClick={playTts} disabled={!audioSrc} style={{ marginLeft: 10 }}>
          Play TTS
        </button>
      </div>

      <hr />

      <h3>🎤 Child Repeats</h3>
      {!recording && <button onClick={startRecording}>Start Recording</button>}
      {recording && (
        <button onClick={stopRecording} style={{ backgroundColor: 'red', color: 'white' }}>
          Stop Recording
        </button>
      )}

      <div style={{ marginTop: 10 }}>
        <p>Or upload audio file:</p>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current.click()}>
          Upload Audio File
        </button>
      </div>

      {(recordedAudioUrl || uploadedFile) && (
        <div style={{ marginTop: 10 }}>
          <p>Recorded Audio:</p>
          <audio controls src={recordedAudioUrl}></audio>
          <br />
          <button onClick={uploadForAssessment} style={{ marginTop: 10 }}>
            Send for Assessment
          </button>
        </div>
      )}
    </div>
  );
}