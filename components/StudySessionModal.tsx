import React, { useState, useMemo } from 'react';
import type { Flashcard, QuizQuestion } from '../types';
// FIX: Added missing icon imports for LightbulbIcon and QuestionMarkCircleIcon.
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, LightbulbIcon, QuestionMarkCircleIcon } from './Icons';

interface StudySessionModalProps {
  topic: string;
  mode: 'flashcards' | 'quiz';
  items: Flashcard[] | QuizQuestion[];
  onClose: () => void;
  onQuizComplete?: (topic: string, score: number, total: number) => void;
}

const FlashcardView: React.FC<{ card: Flashcard }> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  return (
    <div className="w-full h-64 perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center p-6 text-center">
          <p className="text-2xl text-slate-200">{card.front}</p>
        </div>
        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-cyan-900/50 border border-cyan-700 rounded-xl flex items-center justify-center p-6 text-center">
          <p className="text-2xl text-cyan-200">{card.back}</p>
        </div>
      </div>
    </div>
  );
};

const QuizView: React.FC<{
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}> = ({ question, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const isAnswered = selectedOption !== null;

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    onAnswer(option === question.correctAnswer);
  };
  
  const getOptionClass = (option: string) => {
    if (!isAnswered) return "hover:bg-slate-700/80";
    if (option === question.correctAnswer) return "bg-green-500/30 border-green-500 text-green-300";
    if (option === selectedOption) return "bg-red-500/30 border-red-500 text-red-300";
    return "opacity-50";
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <p className="text-lg text-slate-200 flex-1">{question.question}</p>
        {question.hint && !showHint && !isAnswered && (
             <button onClick={() => setShowHint(true)} className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300 p-1 rounded-md">
                <LightbulbIcon className="w-4 h-4"/> Hint
            </button>
        )}
      </div>

      {showHint && !isAnswered && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-lg text-sm animate-fade-in">
           💡 {question.hint}
        </div>
      )}

      <div className="space-y-3">
        {question.options.map((option, i) => (
          <button
            key={i}
            onClick={() => handleSelect(option)}
            disabled={isAnswered}
            className={`w-full text-left p-3 rounded-lg border border-slate-700 transition-all ${getOptionClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      {isAnswered && (
        <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm animate-fade-in">
            <p className="font-semibold text-slate-200">Explanation</p>
            <p className="text-slate-300">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};


export const StudySessionModal: React.FC<StudySessionModalProps> = ({ topic, mode, items, onClose, onQuizComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const shuffledItems = useMemo(() => items.slice().sort(() => Math.random() - 0.5), [items]);

  const handleNext = () => {
    if (currentIndex < shuffledItems.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      if (mode === 'quiz') {
        setQuizFinished(true);
        onQuizComplete?.(topic, score, shuffledItems.length);
      } else {
        onClose();
      }
    }
  };

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore(s => s + 1);
    }
    setTimeout(handleNext, 1500); // Auto-advance after 1.5s
  };

  const renderContent = () => {
    if (quizFinished) {
      const accuracy = (score / shuffledItems.length) * 100;
      return (
        <div className="text-center">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white">Quiz Complete!</h3>
          <p className="text-slate-300 mt-2">You scored {score} out of {shuffledItems.length}</p>
          <div className="w-full bg-slate-700 rounded-full h-4 my-4">
            <div className="bg-gradient-to-r from-cyan-500 to-violet-500 h-4 rounded-full" style={{ width: `${accuracy}%` }}></div>
          </div>
           <button onClick={onClose} className="mt-4 px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold">
                Done
            </button>
        </div>
      );
    }

    const currentItem = shuffledItems[currentIndex];
    if (mode === 'flashcards' && currentItem) {
      return <FlashcardView card={currentItem as Flashcard} />;
    }
    if (mode === 'quiz' && currentItem) {
      return <QuizView question={currentItem as QuizQuestion} onAnswer={handleAnswer} />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 capitalize">{mode} Session</h2>
            <p className="text-sm text-slate-400">{topic}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto flex-1 flex items-center justify-center">
          {renderContent()}
        </main>
        {!quizFinished && (
            <footer className="p-4 border-t border-slate-800">
                {mode === 'flashcards' ? (
                <div className="flex justify-between items-center">
                    <button onClick={handlePrev} disabled={currentIndex === 0} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeftIcon /></button>
                    <p className="font-mono text-sm">{currentIndex + 1} / {shuffledItems.length}</p>
                    <button onClick={handleNext} className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold">
                        {currentIndex < shuffledItems.length - 1 ? 'Next' : 'Finish'}
                    </button>
                </div>
                ) : (
                <div className="flex justify-center items-center">
                     <p className="font-mono text-sm text-slate-500"><QuestionMarkCircleIcon className="w-4 h-4 inline-block -mt-1 mr-1" />Question {currentIndex + 1} of {shuffledItems.length}</p>
                </div>
                )}
            </footer>
        )}
      </div>
    </div>
  );
};
