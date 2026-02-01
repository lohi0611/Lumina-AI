
import React, { useState } from 'react';
import { User, APP_LOGO_URL } from '../types';
import { findUserByEmail, logToAudit } from '../utils/storage';

interface Props {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LoginPage: React.FC<Props> = ({ onLogin, onNavigate, isDarkMode, toggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate network delay
    setTimeout(async () => {
      const user = await findUserByEmail(email);
      if (user && password === 'password') { // Simplified local auth logic
        await logToAudit(user.username, email, 'LOGIN');
        onLogin(user);
      } else if (user) {
        setError('Incorrect password. (Try "password")');
      } else {
        setError('User not found. Please sign up first.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full -ml-12 -mb-12 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <button onClick={() => onNavigate('landing')} className="absolute -top-4 -left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
             <span className="text-xl">←</span>
          </button>
          <div className="inline-block p-1 rounded-full mb-6 shadow-xl shadow-indigo-500/20">
            <img src={APP_LOGO_URL} alt="Lumina Logo" className="w-16 h-16 rounded-full" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Log in to continue your path to mastery.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                required
                type="email"
                className="w-full bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition dark:text-white font-medium"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                required
                type="password"
                className="w-full bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition dark:text-white font-medium"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
          Don't have an account? <button onClick={() => onNavigate('signup')} className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Sign Up</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
