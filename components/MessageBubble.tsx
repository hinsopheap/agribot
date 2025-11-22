import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { AudioPlayer } from '../utils/audio';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer] = useState(() => new AudioPlayer(24000));

  useEffect(() => {
    return () => {
      audioPlayer.stop();
    };
  }, [audioPlayer]);

  const handlePlay = async () => {
    if (isPlaying) {
      audioPlayer.stop();
      setIsPlaying(false);
      return;
    }

    if (message.rawAudio) {
      setIsPlaying(true);
      await audioPlayer.play(message.rawAudio);
      setIsPlaying(false);
    } else if (message.audioUrl) {
       // Fallback for standard blob URLs (user recordings)
       const audio = new Audio(message.audioUrl);
       setIsPlaying(true);
       audio.onended = () => setIsPlaying(false);
       audio.play();
    }
  };

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? 'bg-green-600 text-white rounded-tr-none'
            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
        }`}
      >
        {/* Header Name */}
        <div className={`text-xs mb-1 font-bold ${isUser ? 'text-green-100' : 'text-green-700'}`}>
          {isUser ? 'You' : 'Agribot 🌾'}
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Text Content */}
          {message.isLoading ? (
            <div className="flex items-center space-x-1 h-6">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <>
              {(message.audioUrl || message.rawAudio) && (
                <button
                  onClick={handlePlay}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                    isUser 
                      ? 'bg-green-500 hover:bg-green-400 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-green-700'
                  }`}
                >
                  {isPlaying ? (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                     </svg>
                  ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                       <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                     </svg>
                  )}
                  <span className="text-sm font-medium">
                    {isPlaying ? 'Playing...' : (message.rawAudio ? 'Play Answer' : 'Play Message')}
                  </span>
                </button>
              )}
              
              {message.text && (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {message.text}
                </p>
              )}
            </>
          )}
        </div>

        {/* Timestamp */}
        <div className={`text-[10px] text-right mt-2 ${isUser ? 'text-green-200' : 'text-gray-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
