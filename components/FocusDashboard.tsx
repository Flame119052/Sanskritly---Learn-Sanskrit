import React, { useState, useRef, useEffect } from 'react';
// FIX: Imported StudyMode to be used in the component's props interface.
import { User, UserStats, Section, AIResponse, StudyMode } from '../types';
import { chatWithAssistant } from '../services/geminiService';
// FIX: Added missing icon imports.
import { UserCircleIcon, SparklesIcon, PaperAirplaneIcon } from './Icons';
import { ProgressTracker } from './ProgressTracker';

interface FocusDashboardProps {
  user: User | null;
  stats: UserStats | null;
  sections: Section[];
  isSyllabusCustom: boolean;
  onGenerate: (mode: StudyMode, topic: string, customInstructions: string) => void;
  onNavigate: (sectionId: string) => void;
}

interface Message {
    text: string;
    isUser: boolean;
    isCommand?: boolean;
}

const FocusDashboard: React.FC<FocusDashboardProps> = ({ user, stats, sections, isSyllabusCustom, onGenerate, onNavigate }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([{ text: `Hey ${user?.username || 'there'}! I'm Lex. What's our focus today? You can ask me to create a quiz, explain a topic, or just ask a question.`, isUser: false }]);
    }, [user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { text: userInput, isUser: true }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const response: AIResponse = await chatWithAssistant(userInput, sections);
            const { responseText, command } = response;
            
            const newAiMessage: Message = { text: responseText, isUser: false };
            setMessages(prev => [...prev, newAiMessage]);

            // Handle command
            if (command.name === 'generate' && command.studyMode && command.topic) {
                onGenerate(command.studyMode, command.topic, '');
            } else if (command.name === 'navigate' && command.sectionId) {
                onNavigate(command.sectionId);
            } // 'open_modal' and 'answer_only' are handled by displaying text

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = error instanceof Error ? `Sorry, something went wrong: ${error.message}` : "An unexpected error occurred.";
            setMessages(prev => [...prev, { text: errorMessage, isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const dailyGoal = stats?.streak && stats.streak > 0 
        ? `Keep up your ${stats.streak}-day streak! Let's complete one more topic today.`
        : "Let's kick off a new study streak by tackling one topic today!";

    return (
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">
            {/* Left Column: Welcome & Progress */}
            <div className="xl:col-span-1 space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-white">{getGreeting()}, {user?.username || 'Student'}!</h2>
                    <p className="text-slate-400">Welcome back to your Sanskrit study space.</p>
                </div>
                <div className="bg-slate-800/50 border border-violet-500/30 rounded-xl p-6">
                    <h3 className="font-bold text-lg text-violet-300">Today's Goal</h3>
                    <p className="text-slate-300">{dailyGoal}</p>
                </div>
                {isSyllabusCustom && <ProgressTracker sections={sections} />}
            </div>

            {/* Right Column: Chat with Lex */}
            <div className="xl:col-span-2 bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl flex flex-col h-full max-h-[calc(100vh-4rem)]">
                <header className="p-4 border-b border-slate-800">
                    <h3 className="font-bold text-white text-lg">Chat with Lex</h3>
                </header>
                <main className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.isUser ? 'justify-end' : ''}`}>
                            {!msg.isUser && <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 flex-shrink-0"><SparklesIcon className="w-5 h-5 text-cyan-400"/></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.isUser ? 'bg-violet-600 text-white' : 'bg-slate-800'}`}>
                            <p className="text-sm" style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                            </div>
                             {msg.isUser && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 flex-shrink-0"><UserCircleIcon className="w-5 h-5 text-slate-400"/></div>}
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
                    <div className="flex items-center gap-2">
                        <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="e.g., 'Quiz me on Sandhi'"
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

export default FocusDashboard;