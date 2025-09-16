// NEW: This component was extracted from App.tsx to improve modularity.
// It displays the user's overall progress and provides AI-powered planning tools.
import React, { useState, useEffect } from 'react';
import { Section, UserStats, LearningStyle, OptimizedSchedule } from '../types';
import { getStats } from '../services/statsService';
import { getProgress } from '../services/progressService';
import { estimateCompletionTime, generateOptimizedSchedule } from '../services/geminiService';
import { ScheduleCustomizerModal } from './ScheduleCustomizerModal';
// FIX: Added missing ChatBubbleLeftRightIcon import.
import { SparklesIcon, ChatBubbleLeftRightIcon } from './Icons';

interface ProgressTrackerProps {
  sections: Section[];
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ sections }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('understanding');
  const [timeEstimate, setTimeEstimate] = useState<{ time: string, reasoning: string} | null>(null);
  const [optimizedSchedule, setOptimizedSchedule] = useState<OptimizedSchedule | null>(null);
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [isLoading, setIsLoading] =useState(false);

  // This is a placeholder for user management. In a real app, you'd get the current user.
  const username = 'student';

  useEffect(() => {
    setUserStats(getStats(username));
    setCompletedTopics(getProgress(username).completedTopics);
  }, []);

  const allTopics = sections.flatMap(s => s.topics.flatMap(t => [t.name, ...(t.subTopics || [])]));
  const remainingTopics = allTopics.filter(t => !completedTopics.includes(t));
  const progressPercentage = allTopics.length > 0 ? (completedTopics.length / allTopics.length) * 100 : 0;

  const handleEstimateTime = async () => {
    setIsLoading(true);
    setTimeEstimate(null);
    try {
        const estimate = await estimateCompletionTime(remainingTopics, userStats, learningStyle);
        setTimeEstimate({ time: estimate.timeEstimate, reasoning: estimate.reasoning });
    } catch (error) {
        console.error("Failed to estimate time:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateSchedule = async () => {
    setIsLoading(true);
    setOptimizedSchedule(null);
     try {
        // Simple date inputs for demonstration. A real app would use a date picker.
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 7); // Schedule for the next 7 days

        const schedule = await generateOptimizedSchedule(remainingTopics, userStats, startDate.toISOString(), endDate.toISOString());
        setOptimizedSchedule(schedule);
    } catch (error) {
        console.error("Failed to generate schedule:", error);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6">
      <h3 className="font-bold text-lg text-cyan-300 mb-4">Progress &amp; Planning</h3>
      
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-1 text-sm">
          <span className="font-medium text-slate-300">Syllabus Completion</span>
          <span className="font-bold text-cyan-300">{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div className="bg-gradient-to-r from-cyan-500 to-violet-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <p className="text-xs text-slate-500 mt-1 text-right">{completedTopics.length} / {allTopics.length} topics completed</p>
      </div>

      {/* AI Planning Tools */}
      <div className="mt-6 space-y-4">
        <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select your learning style:</label>
            <select
                value={learningStyle}
                onChange={(e) => setLearningStyle(e.target.value as LearningStyle)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
                <option value="memorization">Quick Memorization</option>
                <option value="understanding">Conceptual Understanding</option>
                <option value="mastery">Deep Mastery</option>
            </select>
        </div>

        <button 
          onClick={handleEstimateTime}
          disabled={isLoading || remainingTopics.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`}/>
          {isLoading ? 'Estimating...' : 'AI Time Estimate'}
        </button>

         {timeEstimate && (
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-lg text-sm animate-fade-in">
              <p><strong>Estimate:</strong> {timeEstimate.time}</p>
              <p className="text-cyan-400/80">{timeEstimate.reasoning}</p>
            </div>
         )}
         
         {timeEstimate && (
            <button
                onClick={handleGenerateSchedule}
                disabled={isLoading || remainingTopics.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                 <SparklesIcon className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`}/>
                 {isLoading ? 'Generating...' : 'Generate My Study Schedule'}
            </button>
         )}

        {optimizedSchedule && (
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-lg text-sm animate-fade-in">
                <p className="font-semibold mb-2">📅 Your AI-Generated Schedule is ready!</p>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                    {optimizedSchedule.schedule.slice(0, 5).map((item, index) => (
                        <div key={index} className="text-xs bg-slate-800/50 p-1.5 rounded-md flex justify-between">
                            <span>{item.date} {item.startTime}</span>
                            <span>{item.activity}</span>
                        </div>
                    ))}
                    {optimizedSchedule.schedule.length > 5 && <p className="text-xs text-center text-slate-400">...and more</p>}
                </div>
                 <button 
                    onClick={() => setScheduleModalOpen(true)}
                    className="w-full mt-3 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold py-1.5 px-3 rounded-lg"
                 >
                    <ChatBubbleLeftRightIcon className="w-4 h-4"/> View & Customize
                 </button>
            </div>
        )}
      </div>
      
      <ScheduleCustomizerModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        currentSchedule={optimizedSchedule!}
        onUpdateSchedule={(newSchedule) => {
            setOptimizedSchedule(newSchedule);
            setScheduleModalOpen(false);
        }}
      />
    </div>
  );
};
