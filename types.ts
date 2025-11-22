export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text?: string; // Transcription or text response
  audioUrl?: string; // For user uploaded audio (blob url)
  rawAudio?: string; // For bot generated audio (base64)
  timestamp: Date;
  isLoading?: boolean;
}

export enum RecordingState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
}
