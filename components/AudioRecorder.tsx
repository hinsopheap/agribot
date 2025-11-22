import React, { useState, useRef } from 'react';
import { RecordingState } from '../types';

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  disabled: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, disabled }) => {
  const [state, setState] = useState<RecordingState>(RecordingState.IDLE);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Most browsers support webm
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop()); // Stop stream
      };

      mediaRecorder.start();
      setState(RecordingState.RECORDING);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Cannot access microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === RecordingState.RECORDING) {
      mediaRecorderRef.current.stop();
      setState(RecordingState.IDLE);
    }
  };

  const handleInteraction = () => {
    if (disabled) return;
    
    if (state === RecordingState.IDLE) {
      startRecording();
    } else if (state === RecordingState.RECORDING) {
      stopRecording();
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-white border-t border-gray-200 safe-area-bottom">
      <button
        onClick={handleInteraction}
        disabled={disabled}
        className={`
          relative group flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-lg
          ${state === RecordingState.RECORDING ? 'bg-red-500 scale-110' : 'bg-green-600 hover:bg-green-700 scale-100'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Ripple Effect when recording */}
        {state === RecordingState.RECORDING && (
          <span className="absolute w-full h-full rounded-full bg-red-500 animate-ping opacity-75"></span>
        )}

        {/* Icon */}
        {state === RecordingState.RECORDING ? (
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white z-10">
              <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
           </svg>
        ) : (
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white z-10">
             <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
             <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
           </svg>
        )}
      </button>
      
      <div className="absolute bottom-2 text-xs text-gray-500 font-medium">
        {state === RecordingState.RECORDING ? 'Tap to Stop' : 'Tap to Speak (Khmer)'}
      </div>
    </div>
  );
};

export default AudioRecorder;
