import React, { useState } from 'react';
// FIX: Added missing EyeIcon and EyeSlashIcon imports.
import { SparklesIcon, EyeIcon, EyeSlashIcon } from './Icons';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (user: string, pass: string) => Promise<void>;
  onSignup: (user: string, pass: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLogin, onSignup }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('student');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (isLoginView) {
        await onLogin(username, password);
      } else {
        await onSignup(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
            <SparklesIcon className="w-12 h-12 text-cyan-400 mx-auto" />
          <h1 className="text-3xl font-bold text-white mt-2">LEX</h1>
          <p className="text-slate-400">Your AI Sanskrit Tutor</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              required
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="password">Password</label>
             <div className="relative">
                <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
                />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-slate-400 hover:text-white">
                    {showPassword ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                 </button>
             </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:bg-cyan-800/50"
          >
            {isLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Sign Up')}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-1">
            {isLoginView ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};