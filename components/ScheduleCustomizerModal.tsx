import React, { useState, useRef, useEffect } from 'react';
import { customizeSchedule } from '../services/geminiService';
import { OptimizedSchedule, OptimizedScheduleItem } from '../types';
import { XMarkIcon, SparklesIcon } from './Icons';

interface ScheduleCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSchedule: OptimizedSchedule;
  onUpdateSchedule: (newSchedule: OptimizedSchedule) => void;
}

interface Message {
  text: string;
  sender: 'user' | 'ai';
  schedule?: OptimizedScheduleItem[];
}

export const ScheduleCustomizerModal: React.FC<ScheduleCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentSchedule,
  onUpdateSchedule,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestSchedule, setLatestSchedule] = useState<OptimizedSchedule>(currentSchedule);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          text: "Here is your current schedule. How would you like to change it? (e.g., 'Add a break on Saturday afternoon' or 'I can't study before 10 AM')",
          sender: 'ai',
          schedule: currentSchedule.schedule,
        },
      ]);
      setLatestSchedule(currentSchedule);
    }
  }, [isOpen, currentSchedule]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: Message = { text: userInput, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const updatedSchedule = await customizeSchedule(latestSchedule, userInput);
      setLatestSchedule(updatedSchedule);
      const newAiMessage: Message = {
        text: updatedSchedule.reasoning || "Here's the updated plan:",
        sender: 'ai',
        schedule: updatedSchedule.schedule,
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not update the schedule.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Customize Your Schedule</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-800'}`}>
                  <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                </div>
                {msg.schedule && (
                  <div className="mt-2 w-full max-w-xl space-y-2 max-h-60 overflow-y-auto bg-slate-800/50 p-2 rounded-lg border border-slate-700">
                    {msg.schedule.map((item, itemIndex) => (
                       <div key={itemIndex} className="p-2 bg-slate-800/70 rounded-md flex items-center justify-between gap-2 text-xs">
                           <p className="font-semibold text-cyan-400">{item.date}</p>
                           <p className="text-slate-300">{item.startTime} - {item.endTime}</p>
                           <p className="flex-1 text-right text-slate-200">{item.activity}</p>
                       </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-md p-3 rounded-lg bg-slate-800 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5 animate-pulse text-cyan-400" />
                  <span className="text-sm text-slate-400">Updating schedule...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>
        <footer className="p-4 border-t border-slate-800 flex-shrink-0">
          {error && (
            <div className="mb-2 p-2 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-xs">
              <strong>Error:</strong> {error}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder="Tell me how to change the schedule..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={isLoading}
            />
            <button
                onClick={() => onUpdateSchedule(latestSchedule)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                Apply
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};