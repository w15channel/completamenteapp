import React, { useState, useRef, useEffect } from 'react';
import { Therapist, ChatMessage, AvailabilityStatus } from '../types';
import { DateUtils } from '../utils/dateUtils';

interface iOSChatProps {
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

export const iOSChat: React.FC<iOSChatProps> = ({
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ios-fade-in`}
      >
        <div
          className={`max-w-[80%] px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-2xl rounded-bl-sm'
          } ${showTyping ? 'animate-pulse' : ''}`}
        >
          {showTyping ? (
            <div className="flex items-center gap-1 py-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed break-words">
              {message.content}
            </p>
          )}
          <div className={`text-[10px] mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {message.timestamp && DateUtils.timestampToDate(message.timestamp, 'time')}
          </div>
        </div>
      </div>
    );
  };

  const getStatusColor = () => {
    switch (availability.status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* iOS Navigation Header */}
      <div className="ios-navigation-bar">
        <button 
          onClick={onEndChat}
          className="ios-navigation-bar-button"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <div className="ios-navigation-bar-title flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner"
            style={{ backgroundColor: therapist.color }}
          >
            <i className={`fas fa-${therapist.icon} text-xs`}></i>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">{therapist.name}</p>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
              <span className="text-[10px] text-gray-500">
                {availability.text}
              </span>
            </div>
          </div>
        </div>
        <button className="ios-navigation-bar-button">
          <i className="fas fa-ellipsis-v"></i>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <i className="fas fa-comments text-gray-400 text-xl"></i>
            </div>
            <p className="ios-body ios-text-secondary">Nenhuma mensagem ainda.</p>
            <p className="ios-footnote ios-text-tertiary mt-2">Comece a conversa!</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="ios-body text-red-600">{error}</p>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-600 ml-2"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <p className="ios-footnote text-blue-600 font-medium">
            {therapist.name} está digitando<span className="animate-pulse">_</span>
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="flex-none bg-white border-t border-gray-200 pb-2">
        <form onSubmit={handleSubmit} className="p-3">
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors ios-haptic"
              title="Em desenvolvimento"
              disabled
            >
              <i className="fas fa-plus text-lg"></i>
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef as any}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Mensagem"
                disabled={isWaiting}
                rows={1}
                className="ios-textarea resize-none py-3 px-4 pr-12 min-h-[44px] max-h-32"
                style={{
                  background: '#f2f2f7',
                  border: '1px solid #e5e5ea',
                  borderRadius: '20px'
                }}
              />
              
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors ios-haptic absolute right-2 bottom-2"
                title="Em desenvolvimento"
                disabled
              >
                <i className="fas fa-face-smile text-sm"></i>
              </button>
            </div>

            <button
              type="submit"
              disabled={!inputValue.trim() || isWaiting}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ios-haptic ${
                inputValue.trim() && !isWaiting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isWaiting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <i className="fas fa-paper-plane text-sm"></i>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default iOSChat;
