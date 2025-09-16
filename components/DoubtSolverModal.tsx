import React, { useState, useRef, useEffect } from 'react';
import { solveDoubt } from '../services/geminiService';
import { StudyFile } from '../types';
// FIX: Added missing PaperAirplaneIcon import.
import { XMarkIcon, SparklesIcon, PaperAirplaneIcon } from './Icons';

interface DoubtSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  files: StudyFile[];
}

interface Message {
  text: string;
  isUser: boolean;
}

export const DoubtSolverModal: React.FC<DoubtSolverModalProps> = ({ isOpen, onClose, topic, files }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Set initial greeting from Lex
  useEffect(() => {
    if (isOpen) {
        setMessages([{ text: `Got questions about "${topic}"? Ask away! I'll do my best to help.`, isUser: false }]);
        setUserInput('');
        setError(null);
    }
  }, [isOpen, topic]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { text: userInput, isUser: true }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await solveDoubt(topic, files, userInput);
      setMessages([...newMessages, { text: response, isUser: false }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Ask Lex</h2>
            <p className="text-sm text-slate-400">Topic: {topic}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''}`}>
                {!msg.isUser && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 flex-shrink-0"><SparklesIcon className="w-5 h-5 text-cyan-400"/></div>}
                <div className={`max-w-md p-3 rounded-lg ${msg.isUser ? 'bg-violet-600 text-white' : 'bg-slate-800'}`}>
                  <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                </div>
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 flex-shrink-0"><SparklesIcon className="w-5 h-5 text-cyan-400 animate-pulse"/></div>
                <div className="max-w-md p-3 rounded-lg bg-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-150"></div>
                        <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse delay-300"></div>
                    </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <footer className="p-4 border-t border-slate-800">
          {error && (
            <div className="mb-2 p-2 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-xs">
                <strong>Error:</strong> {error}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question here..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
              <PaperAirplaneIcon className="w-5 h-5"/>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
