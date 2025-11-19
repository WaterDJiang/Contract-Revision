import React, { useState, useRef, useEffect } from 'react';
import { Message, Sender } from '../types';
import { IconSend, IconSparkles, IconTerminal, IconX } from './Icons';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isProcessing: boolean;
  attachedContext: string | null;
  onClearContext: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, 
  onSendMessage, 
  isProcessing,
  attachedContext,
  onClearContext
}) => {
  const [inputValue, setInputValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
        <IconSparkles className="w-5 h-5 text-brand-500" />
        <span className="font-semibold text-zinc-100">Legal Aide AI</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-10 text-sm">
            <p>Ask me to add clauses, review terms, or summarize sections.</p>
            <p className="mt-2 text-xs opacity-70">Try: "Add a force majeure clause"</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] p-3 rounded-xl text-sm whitespace-pre-wrap leading-relaxed ${
                msg.sender === Sender.USER
                  ? 'bg-zinc-800 text-zinc-100 rounded-tr-sm'
                  : 'bg-transparent text-zinc-300 border border-zinc-800/50 rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-zinc-600 mt-1 px-1">
              {msg.sender === Sender.AI ? 'AI' : 'You'}
            </span>
          </div>
        ))}
        
        {isProcessing && (
           <div className="flex flex-col items-start">
             <div className="max-w-[90%] p-3 rounded-xl bg-transparent border border-zinc-800/50 rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
             </div>
             <span className="text-[10px] text-zinc-600 mt-1 px-1">Generatin'</span>
           </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900">
        {/* Attached Context Indicator */}
        {attachedContext && (
          <div className="mb-3 bg-zinc-800/50 border border-brand-500/30 rounded-lg p-2 flex items-start gap-3 relative group">
             <div className="p-1.5 bg-brand-500/10 rounded text-brand-500 mt-0.5">
                <IconTerminal className="w-4 h-4" />
             </div>
             <div className="flex-1 overflow-hidden">
               <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Selected Context</div>
               <div className="text-xs text-zinc-300 font-mono line-clamp-3 border-l-2 border-zinc-700 pl-2">
                 {attachedContext}
               </div>
             </div>
             <button 
               onClick={onClearContext}
               className="p-1 text-zinc-500 hover:text-rose-400 transition-colors absolute top-1 right-1"
             >
               <IconX className="w-4 h-4" />
             </button>
          </div>
        )}

        <div className="relative bg-zinc-800/50 rounded-lg border border-zinc-700 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500 transition-all">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedContext ? "Ask about selection or request changes..." : "Describe changes (e.g., 'Change governing law')..."}
            className="w-full bg-transparent text-zinc-200 text-sm p-3 pr-10 focus:outline-none resize-none max-h-32 min-h-[44px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-1.5 text-zinc-400 hover:text-brand-500 disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors"
          >
            <IconSend className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-[10px] text-zinc-500 text-center">
          AI can make mistakes. Please review generated contracts.
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;