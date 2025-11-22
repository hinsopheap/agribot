import React, { useState, useRef, useEffect } from 'react';
import { Message, RecordingState } from './types';
import MessageBubble from './components/MessageBubble';
import AudioRecorder from './components/AudioRecorder';
import { processUserAudio, generateSpeech } from './services/gemini';
import { blobToBase64 } from './utils/audio';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'សួស្តី! ខ្ញុំឈ្មោះ អាហ្គ្រីបូត។ តើខ្ញុំអាចជួយអ្នកអំពីបញ្ហាកសិកម្មយ៉ាងដូចម្តេច? (Hello! I am Agribot. How can I help you with agriculture?)',
      timestamp: new Date(),
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    // 1. Add User Audio Message to UI
    const userMsgId = Date.now().toString();
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      audioUrl: URL.createObjectURL(audioBlob),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // 2. Show Loading State for Bot
      const botLoadingId = 'bot-loading-' + Date.now();
      setMessages(prev => [...prev, {
        id: botLoadingId,
        sender: 'bot',
        isLoading: true,
        timestamp: new Date()
      }]);

      // 3. Process Audio with Gemini (STT + Reasoning)
      const base64Audio = await blobToBase64(audioBlob);
      const analysis = await processUserAudio(base64Audio, audioBlob.type);

      // Update user message with transcription (Optional, but good UX)
      setMessages(prev => prev.map(m => 
        m.id === userMsgId ? { ...m, text: analysis.transcription } : m
      ));

      // 4. Generate Speech for the Answer (TTS)
      const audioResponseBase64 = await generateSpeech(analysis.answer);

      // 5. Replace Loading Message with Actual Bot Response
      setMessages(prev => prev.map(m => {
        if (m.id === botLoadingId) {
          return {
            id: Date.now().toString(), // new ID
            sender: 'bot',
            text: analysis.answer,
            rawAudio: audioResponseBase64,
            timestamp: new Date(),
            isLoading: false
          };
        }
        return m;
      }));

    } catch (error) {
      console.error(error);
      // Error Handling UI
      setMessages(prev => prev.filter(m => !m.isLoading).concat({
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Sorry, I could not process that. Please try again.',
        timestamp: new Date()
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-gray-50 shadow-2xl overflow-hidden">
      {/* Header */}
      <header className="bg-green-700 text-white p-4 flex items-center shadow-md z-10">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-green-700 font-bold text-xl mr-3">
          🌾
        </div>
        <div>
          <h1 className="font-bold text-lg">Agribot Cambodia</h1>
          <p className="text-green-200 text-xs">Agricultural AI Assistant</p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide relative bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')]">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <AudioRecorder 
        onRecordingComplete={handleRecordingComplete} 
        disabled={isProcessing} 
      />
    </div>
  );
};

export default App;
