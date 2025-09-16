import React from 'react';
import { UserStats } from '../types';
import { XMarkIcon } from './Icons';

interface StatsModalProps {
  stats: UserStats | null;
  onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
  <div className={`bg-slate-800/50 border border-slate-800 p-4 rounded-lg text-center ${className}`}>
    <p className="text-sm text-slate-400">{label}</p>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  if (!stats) return null;

  const accuracy = stats.totalQuestions > 0 ? ((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(0) : 'N/A';

  const sortedTopics = Object.entries(stats.topicPerformance)
    .map(([topic, data]) => ({
      topic,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      questions: data.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy); // Sort ascending by accuracy

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">Your Learning Journey</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Overall Accuracy" value={accuracy === 'N/A' ? 'N/A' : `${accuracy}%`} className="text-cyan-300"/>
            <StatCard label="Study Streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} className="text-green-400" />
            <StatCard label="Total Sessions" value={stats.totalSessions} />
            <StatCard label="Quizzes Taken" value={stats.quizzesTaken} />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Topic Performance</h3>
            {sortedTopics.length > 0 ? (
              <div className="space-y-3">
                {sortedTopics.map(({ topic, accuracy, questions }) => (
                  <div key={topic} className="bg-slate-800/50 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-slate-200">{topic}</p>
                      <p className={`font-bold ${accuracy >= 75 ? 'text-green-400' : accuracy >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {accuracy.toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                      <div className="bg-gradient-to-r from-cyan-500 to-violet-500 h-2.5 rounded-full" style={{ width: `${accuracy}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 text-right">{questions} questions</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-slate-800">
                <p className="text-slate-400">Complete some quizzes to see your topic performance.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};