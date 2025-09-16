import { UserProgress } from '../types';

const PROGRESS_KEY_PREFIX = 'simply_sanskrit_progress_';

const getInitialProgress = (): UserProgress => ({
  completedTopics: [],
});

export const getProgress = (username: string): UserProgress => {
  try {
    const progressJson = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${username}`);
    return progressJson ? JSON.parse(progressJson) : getInitialProgress();
  } catch (error) {
    console.error("Failed to retrieve user progress", error);
    return getInitialProgress();
  }
};

const saveProgress = (username: string, progress: UserProgress): void => {
  try {
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}${username}`, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save user progress", error);
  }
};

export const toggleTopicCompletion = (username: string, topicName: string): UserProgress => {
  const progress = getProgress(username);
  const isCompleted = progress.completedTopics.includes(topicName);

  if (isCompleted) {
    progress.completedTopics = progress.completedTopics.filter(t => t !== topicName);
  } else {
    progress.completedTopics.push(topicName);
  }
  
  saveProgress(username, progress);
  return progress;
};

export const clearProgress = (username: string): UserProgress => {
    const initialProgress = getInitialProgress();
    saveProgress(username, initialProgress);
    return initialProgress;
}