import React, { useState, useRef, useEffect } from 'react';
import { Therapist, ChatMessage, AvailabilityStatus } from '../types';
import { DateUtils } from '../utils/dateUtils';

interface ChatProps {
  therapist: Therapist;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onEndChat: () => void;
  onClearHistory: () => void;
  isWaiting: boolean;
  isTyping: boolean;
  availability: AvailabilityStatus;
  error?: string | null;
  onClearError?: () => void;
}

export const Chat: React.FC<ChatProps> = ({
  therapist,
  messages,
  onSendMessage,
  onEndChat,
  onClearHistory,
  isWaiting,
  isTyping,
  availability,
  error,
  onClearError
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focar no input ao montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isWaiting) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    if (message.role === 'system') return null;

    const isUser = message.role === 'user';
    const showTyping = isTyping && !message.content && index === messages.length - 1;

    return (
      <div
        key={index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}
      >
        <div
          className={`max-w-[80%] px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-sky-600 text-white rounded-br-sm'
              : 'bg-slate-700 text-slate-100 rounded-bl-sm'
          } ${showTyping ? 'animate-pulse' : ''}`}
        >
          {showTyping ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed break-words">
              {message.content}
            </p>
          )}
          <div className={`text-[10px] mt-1 ${isUser ? 'text-sky-200' : 'text-slate-400'}`}>
            {message.timestamp && DateUtils.timestampToDate(message.timestamp, 'time')}
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = () => {
    switch (availability.status) {
      case 'online': return 'bg-emerald-500';
      case 'busy': return 'bg-yellow-400';
      case 'offline': return 'bg-slate-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-900/95 flex-none z-10 shadow-md">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-slate-700"
          style={{ backgroundColor: therapist.color }}
        >
          <i className={`fas fa-${therapist.icon}`}></i>
        </div>
        
        <div className="flex-1">
          <p className="font-bold text-white text-sm">{therapist.name}</p>
          <div className="flex items-center mt-1">
            <span className={`status-dot ${getStatusColor()}`}></span>
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider ml-1">
              {availability.text}
            </span>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="w-10 h-10 rounded-full bg-rose-900/50 border border-rose-500 text-rose-300 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors mr-1"
          title="Apagar Histórico"
        >
          <i className="fas fa-trash"></i>
        </button>

        <button
          onClick={onEndChat}
          className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          title="Encerrar Chat"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-800/30">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-8">
            <i className="fas fa-comments text-4xl mb-4 opacity-50"></i>
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-2">Comece a conversa!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center justify-between">
          <p className="text-red-300 text-sm">{error}</p>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-300 ml-2"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-none bg-slate-900 border-t border-slate-700 pb-2">
        {isTyping && (
          <div className="px-4 py-2 text-xs text-sky-400 font-bold bg-slate-800/50 uppercase tracking-widest">
            Escrevendo<span className="animate-pulse">_</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escreva sua mensagem"
              disabled={isWaiting}
              className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              type="button"
              className="w-12 h-12 bg-slate-700 text-slate-400 rounded-xl shadow-lg hover:scale-105 flex items-center justify-center transition-transform hover:bg-slate-600 hover:text-white"
              title="Em desenvolvimento"
              disabled
            >
              <i className="fas fa-microphone text-lg"></i>
            </button>

            <button
              type="submit"
              disabled={!inputValue.trim() || isWaiting}
              className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-xl shadow-lg hover:scale-105 flex items-center justify-center transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isWaiting ? (
                <i className="fas fa-spinner fa-spin text-lg"></i>
              ) : (
                <i className="fas fa-paper-plane text-lg"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
