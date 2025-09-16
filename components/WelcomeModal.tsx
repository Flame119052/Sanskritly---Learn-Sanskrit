import React from 'react';
// FIX: Added missing icon imports to resolve rendering errors.
import { XMarkIcon, SparklesIcon, BookOpenIcon, Cog6ToothIcon, ChartBarIcon } from './Icons';

interface WelcomeModalProps {
  onClose: () => void;
}

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 text-cyan-400">{icon}</div>
        <div>
            <h3 className="font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
        </div>
    </div>
)

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-cyan-400"/>
                <h2 className="text-xl font-bold text-white">Welcome to LEX</h2>
            </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6">
          <p className="text-slate-300 mb-6">
            I'm Lex, your AI study buddy. My job is to make learning Sanskrit less stressful and more effective. Here's how we can get started:
          </p>
          <div className="space-y-5">
            <Feature 
                icon={<BookOpenIcon />}
                title="Start with the Default Syllabus"
                description="I've pre-loaded a standard syllabus. Just pick a section and a topic to start generating study aids."
            />
            <Feature 
                icon={<Cog6ToothIcon />}
                title="Customize Your Syllabus"
                description="Click 'My Syllabus' in the sidebar to upload your own materials. I'll analyze them and structure the app just for you."
            />
             <Feature 
                icon={<ChartBarIcon />}
                title="Track Your Progress"
                description="As you complete quizzes and mark topics as done, check 'My Stats' to see your performance and learning streak."
            />
          </div>
        </main>
        <footer className="p-4">
             <button
              onClick={onClose}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors"
            >
              Let's Get Started
            </button>
        </footer>
      </div>
    </div>
  );
};
