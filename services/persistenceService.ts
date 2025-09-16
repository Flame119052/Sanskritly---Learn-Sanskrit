// NEW: This service centralizes all localStorage logic for state persistence.
// It ensures all saved data is user-specific and handles JSON parsing/stringifying.

/**
 * Generates a unique key for localStorage based on the username and a specific state key.
 * @param username The current user's username.
 * @param key The key for the piece of state (e.g., 'sections', 'chatHistory').
 * @returns A namespaced key like 'simply_sanskrit_student_sections'.
 */
const getAppKey = (username: string, key: string) => `simply_sanskrit_${username}_${key}`;

/**
 * Saves a piece of state to localStorage for a specific user.
 * @param username The user's username.
 * @param key The state key.
 * @param state The state value to save.
 */
export const saveState = <T>(username: string, key: string, state: T): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(getAppKey(username, key), serializedState);
  } catch (error) {
    console.error(`Could not save state for key "${key}" to localStorage`, error);
  }
};

/**
 * Loads a piece of state from localStorage for a specific user.
 * @param username The user's username.
 * @param key The state key.
 * @returns The parsed state value or undefined if not found or on error.
 */
export const loadState = <T>(username: string, key: string): T | undefined => {
  try {
    const serializedState = localStorage.getItem(getAppKey(username, key));
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState) as T;
  } catch (error) {
    console.error(`Could not load state for key "${key}" from localStorage`, error);
    return undefined;
  }
};

/**
 * Removes a specific piece of state from localStorage for a user.
 * @param username The user's username.
 * @param key The state key to remove.
 */
export const removeState = (username: string, key: string): void => {
    try {
        localStorage.removeItem(getAppKey(username, key));
    } catch (error) {
        console.error(`Could not remove state for key "${key}" from localStorage`, error);
    }
}

/**
 * Clears multiple pieces of state for a user, typically on logout or syllabus reset.
 * @param username The user's username.
 * @param keys An array of state keys to remove.
 */
export const clearUserState = (username: string, keys: string[]): void => {
    keys.forEach(key => removeState(username, key));
}