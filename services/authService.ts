import { User } from '../types';

const USERS_DB_KEY = 'simply_sanskrit_users_db';
const USER_SESSION_KEY = 'simply_sanskrit_user_session';

// A default "database" of users to ensure data is never completely lost on a refresh/environment reset.
const DEFAULT_USERS_DB: Record<string, string> = {
  'student': 'password123',
  'learner': 'sanskrit',
};

// Helper function to get the users database from localStorage, with a hardcoded fallback.
const getUsers = (): Record<string, string> => {
  try {
    const usersJson = localStorage.getItem(USERS_DB_KEY);
    // If localStorage has users, use them.
    if (usersJson && Object.keys(JSON.parse(usersJson)).length > 0) {
      return JSON.parse(usersJson);
    } else {
      // Otherwise, initialize localStorage with the default users and return them.
      // This handles the first run or cases where localStorage is cleared.
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(DEFAULT_USERS_DB));
      return DEFAULT_USERS_DB;
    }
  } catch (error) {
    console.error("Could not read or initialize users database in localStorage", error);
    // As a final fallback, return the in-memory default database.
    return DEFAULT_USERS_DB;
  }
};

// Helper function to save the users database to localStorage
const saveUsers = (users: Record<string, string>): void => {
  try {
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
  } catch (error)
    {
    console.error("Could not save users database to localStorage", error);
  }
};

/**
 * Registers a new user if the username is not already taken.
 * @param username The desired username.
 * @param password The desired password.
 * @returns A promise that resolves with the new User object on success.
 */
export const signup = async (username: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
  const users = getUsers();
  
  if (users[username]) {
    throw new Error('Username already exists. Please choose another one.');
  }

  users[username] = password; // In a real app, you MUST hash the password
  saveUsers(users);

  const newUser: User = { username };
  return newUser;
};

/**
 * Logs in a user by verifying their username and password.
 * @param username The user's username.
 * @param password The user's password.
 * @returns A promise that resolves with the User object on successful login.
 */
export const login = async (username: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  const users = getUsers();
  
  if (!users[username] || users[username] !== password) {
    throw new Error('Invalid username or password.');
  }

  const user: User = { username };
  // On successful login, create the session
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Could not save user session to localStorage", error);
  }
  return user;
};


/**
 * Checks for a persisted user session in localStorage.
 * @returns The User object if a session exists, otherwise null.
 */
export const checkAuthStatus = (): User | null => {
  try {
    const session = localStorage.getItem(USER_SESSION_KEY);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  } catch (error) {
    console.error("Could not read user session from localStorage", error);
    return null;
  }
};

/**
 * Clears the user session from localStorage.
 */
export const logout = (): void => {
  try {
    localStorage.removeItem(USER_SESSION_KEY);
  } catch (error) {
    console.error("Could not remove user session from localStorage", error);
  }
};