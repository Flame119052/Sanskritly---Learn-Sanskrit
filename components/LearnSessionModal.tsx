// FIX: Moved this React component to a .tsx file to fix JSX parsing errors.
import React, { useState } from 'react';
import type { LearningStep } from '../types';
// FIX: Removed unused ArrowPathIcon import.
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface LearnSessionModalProps {
  topic: string;
  items: LearningStep[];
  onClose: () => void;
  onLearnComplete?: () => void;
}

export const LearnSessionModal: React.FC<LearnSessionModalProps> = ({ topic, items, onClose, onLearnComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = items[currentIndex];

  const handlePrev = () => setCurrentIndex(i => (i - 1 + items.length) % items.length);
  const handleNext = () => {
    if (currentIndex < items.length - 1) {
        setCurrentIndex(i => i + 1);
    } else {
        onLearnComplete?.();
        onClose(); // Close modal on the last step
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Learn &amp; Memorize</h2>
            <p className="text-sm text-slate-400">{topic}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-1">
            <div className="space-y-5">
                <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-1">Concept</h3>
                    <p className="text-lg text-slate-200">{currentStep.concept}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-1">Sanskrit Example</h3>
                    <p className="text-lg font-mono bg-slate-800/50 p-3 rounded-md text-yellow-300 border border-slate-700">{currentStep.sanskritExample}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 mb-1">Explanation</h3>
                    <p className="text-lg text-slate-300">{currentStep.englishExplanation}</p>
                </div>
                 <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-green-400 mb-1">💡 Memory Trick</h3>
                    <p className="text-lg bg-green-500/10 p-3 rounded-md text-green-300 border border-green-500/20">{currentStep.mnemonic}</p>
                </div>
            </div>
        </main>
        <footer className="p-4 border-t border-slate-800">
             <div className="flex justify-between items-center">
                <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeftIcon /></button>
                <p className="font-mono text-sm">Step {currentIndex + 1} / {items.length}</p>
                <button onClick={handleNext} className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold">
                    {currentIndex < items.length - 1 ? 'Next' : 'Finish'}
                </button>
            </div>
        </footer>
      </div>
    </div>
  );
};