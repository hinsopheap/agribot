// Base64 string to ArrayBuffer
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decode raw PCM data into an AudioBuffer
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Convert Blob to Base64 string
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Player class to handle raw audio playback
export class AudioPlayer {
  private audioContext: AudioContext;
  private source: AudioBufferSourceNode | null = null;

  constructor(sampleRate: number = 24000) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  }

  async play(base64Audio: string) {
    this.stop(); // Stop any current playback

    try {
      // Ensure context is running (mobile browsers sometimes suspend it)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const bytes = decode(base64Audio);
      const audioBuffer = await decodeAudioData(bytes, this.audioContext);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.onended = () => {
        this.source = null;
      };
      source.start(0);
      this.source = source;
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  }

  stop() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      this.source = null;
    }
  }
}
