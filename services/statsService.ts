import { UserStats } from '../types';

const STATS_KEY_PREFIX = 'simply_sanskrit_stats_';

const getInitialStats = (): UserStats => ({
  totalSessions: 0,
  quizzesTaken: 0,
  totalCorrect: 0,
  totalQuestions: 0,
  streak: 0,
  lastSessionDate: null,
  topicPerformance: {},
});

export const getStats = (username: string): UserStats => {
  try {
    const statsJson = localStorage.getItem(`${STATS_KEY_PREFIX}${username}`);
    return statsJson ? JSON.parse(statsJson) : getInitialStats();
  } catch (error) {
    console.error("Failed to retrieve user stats", error);
    return getInitialStats();
  }
};

const saveStats = (username: string, stats: UserStats): void => {
  try {
    localStorage.setItem(`${STATS_KEY_PREFIX}${username}`, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save user stats", error);
  }
};

export type SessionType = 'quiz' | 'flashcards' | 'learn';
export interface QuizData {
  topic: string;
  score: number;
  total: number;
}

export const recordSession = (username: string, type: SessionType, data?: QuizData): UserStats => {
  const stats = getStats(username);
  const today = new Date();
  const lastDate = stats.lastSessionDate ? new Date(stats.lastSessionDate) : null;

  const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  if (!lastDate || !isSameDay(today, lastDate)) {
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (lastDate && isSameDay(yesterday, lastDate)) {
        stats.streak += 1; // Continued streak
    } else {
        stats.streak = 1; // Broken streak or first session
    }
    stats.lastSessionDate = today.toISOString().split('T')[0];
  }

  stats.totalSessions += 1;

  if (type === 'quiz' && data) {
    stats.quizzesTaken += 1;
    stats.totalCorrect += data.score;
    stats.totalQuestions += data.total;

    const topicStats = stats.topicPerformance[data.topic] || { correct: 0, total: 0 };
    topicStats.correct += data.score;
    topicStats.total += data.total;
    stats.topicPerformance[data.topic] = topicStats;
  }
  
  saveStats(username, stats);
  return stats;
};