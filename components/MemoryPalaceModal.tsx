// NEW: This component provides the UI for the step-by-step "Memory Palace" learning mode.
import React, { useState } from 'react';
import type { MemoryPalaceStep, QuizQuestion } from '../types';
// FIX: Added missing KeyIcon import to resolve rendering error.
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, LightbulbIcon, CheckCircleIcon, KeyIcon } from './Icons';

interface MemoryPalaceModalProps {
  topic: string;
  items: MemoryPalaceStep[];
  onClose: () => void;
  onLearnComplete?: () => void;
}

const StepContent: React.FC<{ step: MemoryPalaceStep }> = ({ step }) => {
    switch(step.stepType) {
        case 'introduction':
        case 'pattern':
        case 'review':
            return (
                <div className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700">
                    {step.stepType === 'pattern' && <LightbulbIcon className="w-12 h-12 mx-auto text-yellow-400 mb-4" />}
                    <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-2">{step.title}</h3>
                    <p className="text-slate-300 whitespace-pre-wrap">{step.explanation}</p>
                </div>
            );
        case 'chunk':
            return (
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-slate-400 mb-4 whitespace-pre-wrap">{step.explanation}</p>
                    {step.tableChunk && (
                        <div className="overflow-x-auto bg-slate-800/50 rounded-lg border border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-900/70 text-xs uppercase text-slate-400">
                                    <tr>
                                        {step.tableChunk.headers.map((header, i) => (
                                            <th key={i} className="px-4 py-2">{header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {step.tableChunk.rows.map((row, i) => (
                                        <tr key={i} className="border-t border-slate-700 hover:bg-slate-800">
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-4 py-2 text-slate-200 font-mono">{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        case 'recall':
            return <RecallStep question={step.recallQuestion!} />;
        default:
            return null;
    }
};

const RecallStep: React.FC<{ question: QuizQuestion }> = ({ question }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const handleSelect = (option: string) => {
        if (selectedOption) return; // Prevent changing answer
        setSelectedOption(option);
        setIsCorrect(option === question.correctAnswer);
    };

    const getOptionClass = (option: string) => {
        if (!selectedOption) return "hover:bg-slate-700";
        if (option === question.correctAnswer) return "bg-green-500/30 border-green-500 text-green-300";
        if (option === selectedOption) return "bg-red-500/30 border-red-500 text-red-300";
        return "opacity-50";
    };

    return (
         <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Quick Recall</h3>
            <p className="text-lg text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-slate-700">{question.question}</p>
            <div className="space-y-2">
                {question.options.map((option, i) => (
                    <button
                        key={i}
                        onClick={() => handleSelect(option)}
                        disabled={selectedOption !== null}
                        className={`w-full text-left p-3 rounded-lg border border-slate-700 transition-all ${getOptionClass(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {selectedOption && (
                <div className={`p-3 rounded-lg text-sm animate-fade-in ${isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    <p><strong>{isCorrect ? 'Correct!' : 'Not quite.'}</strong> {question.explanation}</p>
                </div>
            )}
        </div>
    )
}

export const MemoryPalaceModal: React.FC<MemoryPalaceModalProps> = ({ topic, items, onClose, onLearnComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStep = items[currentIndex];

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onLearnComplete?.();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 flex items-center gap-2">
                <KeyIcon className="w-6 h-6" />
                Memory Palace
            </h2>
            <p className="text-sm text-slate-400">{topic}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-1">
            <StepContent step={currentStep} />
        </main>
        <footer className="p-4 border-t border-slate-800">
          <div className="flex justify-between items-center">
            <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeftIcon />
            </button>
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