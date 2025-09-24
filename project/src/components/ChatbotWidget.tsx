import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { chatbotAdapter } from '../adapters/chatbotAdapter';
import clsx from 'clsx';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
}

interface ChatbotWidgetProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export function ChatbotWidget({ isOpen, onToggle }: ChatbotWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your Dialife assistant. How can I help you today?',
      sender: 'bot',
      timestamp: Date.now(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await chatbotAdapter.sendMessage(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble right now. Please try again later.',
        sender: 'bot',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => onToggle(true)}
        className={clsx(
          'fixed right-6 z-50 w-12 h-12',
          'bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg',
          'flex items-center justify-center transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-primary-200',
          'hover:scale-105 active:scale-95'
        )}
        style={{
          bottom: 'max(96px, calc(env(safe-area-inset-bottom) + 24px))'
        }}
        aria-label="Open chat"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </button>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => onToggle(false)} />
      
      {/* Chat panel */}
      <div
        className={clsx(
          'fixed z-50 bg-card rounded-2xl shadow-2xl border border-border',
          'flex flex-col overflow-hidden',
          // Mobile: full screen
          'md:w-[520px] md:h-[600px] md:right-6',
          'inset-0 md:inset-auto'
        )}
        style={{
          bottom: 'max(24px, env(safe-area-inset-bottom))'
        }}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-100 to-transparent p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-text">Dialife Assistant</h3>
                <p className="text-xs text-text-muted">Online</p>
              </div>
            </div>
            <button
              onClick={() => onToggle(false)}
              className="p-1 text-text-muted hover:text-text rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Close chat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx(
                'flex',
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={clsx(
                  'max-w-[80%] px-3 py-2 rounded-lg text-sm',
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white ml-12'
                    : 'bg-bg-soft text-text mr-12'
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                <time className={clsx(
                  'text-xs mt-1 block',
                  message.sender === 'user' ? 'text-primary-100' : 'text-text-muted'
                )}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </time>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-bg-soft text-text px-3 py-2 rounded-lg mr-12">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isTyping}
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="px-3"
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-text-muted mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}