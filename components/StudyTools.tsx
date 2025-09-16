import React from 'react';
import { StudyMode } from '../types';
// FIX: Replaced missing BrainIcon and ClipboardDocumentListIcon with existing BookOpenIcon and QuestionMarkCircleIcon to resolve import errors.
import { BookOpenIcon, LightbulbIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, KeyIcon } from './Icons';

interface StudyToolsProps {
  selectedTopic: string | null;
  onGenerate: (mode: StudyMode, topic: string) => void;
  onDoubtSolverOpen: () => void;
}

const ToolButton: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled: boolean;
}> = ({ icon, title, description, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800/50 flex items-start space-x-4"
  >
    <div className="bg-slate-900 p-2 rounded-lg border border-slate-700">{icon}</div>
    <div>
      <h4 className="font-bold text-white">{title}</h4>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  </button>
);

export const StudyTools: React.FC<StudyToolsProps> = ({ selectedTopic, onGenerate, onDoubtSolverOpen }) => {
  const handleGenerate = (mode: StudyMode) => {
    if (selectedTopic) {
      onGenerate(mode, selectedTopic);
    }
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 h-full">
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-6">AI Study Tools</h3>
      
      {!selectedTopic && (
        <div className="flex items-center justify-center h-48 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
          <p className="text-slate-500">Select a topic from your library to begin.</p>
        </div>
      )}

      {selectedTopic && (
        <div className="space-y-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Primary Learning Paths</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ToolButton
                icon={<LightbulbIcon className="w-6 h-6 text-yellow-400" />}
                title="Learn & Memorize"
                description="Break down concepts into simple, memorable steps."
                onClick={() => handleGenerate('learn')}
                disabled={!selectedTopic}
              />
               <ToolButton
                icon={<KeyIcon className="w-6 h-6 text-green-400" />}
                title="Memory Palace"
                description="AI-guided steps to memorize complex tables & rules."
                onClick={() => handleGenerate('memory_palace')}
                disabled={!selectedTopic}
              />
              <ToolButton
                icon={<ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" />}
                title="Ask Lex"
                description="Get instant answers to your specific questions."
                onClick={onDoubtSolverOpen}
                disabled={!selectedTopic}
              />
            </div>
          </div>
          
          <div>
            <p className="text-sm text-slate-400 mb-2">Assess Yourself</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <ToolButton
                icon={<BookOpenIcon className="w-6 h-6 text-cyan-400" />}
                title="Generate Flashcards"
                description="Quickly test your recall of key terms and concepts."
                onClick={() => handleGenerate('flashcards')}
                disabled={!selectedTopic}
              />
              <ToolButton
                icon={<QuestionMarkCircleIcon className="w-6 h-6 text-violet-400" />}
                title="Generate Quiz"
                description="Challenge yourself with multiple-choice questions."
                onClick={() => handleGenerate('quiz')}
                disabled={!selectedTopic}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};