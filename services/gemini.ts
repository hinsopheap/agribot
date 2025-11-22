import { GoogleGenAI, Modality, Type } from "@google/genai";

// Initialize the Gemini API client
// The API key is automatically injected into process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ProcessAudioResponse {
  transcription: string;
  answer: string;
}

/**
 * 1. Sends user audio to Gemini 2.5 Flash.
 * 2. Requests a JSON response containing the transcription (Khmer) and the answer (Khmer).
 */
export const processUserAudio = async (audioBase64: string, mimeType: string): Promise<ProcessAudioResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: `
            You are "Agribot", a friendly and knowledgeable agricultural expert for Cambodian farmers.
            The user is sending a voice message in Khmer.
            
            Task:
            1. Listen to the audio.
            2. Transcribe exactly what the user said in Khmer.
            3. Provide a helpful, practical answer to their question or comment in Khmer. Keep it concise and easy to understand.
            
            Output JSON format:
            {
              "transcription": "The Khmer transcription of the user's audio",
              "answer": "Your helpful answer in Khmer"
            }
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcription: { type: Type.STRING },
            answer: { type: Type.STRING }
          },
          required: ["transcription", "answer"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");
    
    return JSON.parse(jsonText) as ProcessAudioResponse;

  } catch (error) {
    console.error("Error processing audio:", error);
    throw error;
  }
};

/**
 * Generates speech from text using Gemini 2.5 Flash TTS.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' is usually a good default, or 'Fenrir'
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from TTS");
    }
    return base64Audio;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};
