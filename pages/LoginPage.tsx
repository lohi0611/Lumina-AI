import React, { useState } from 'react';
import { User } from '../types';
import { findUserByEmail, logToAudit } from '../utils/storage';

interface Props {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
}

const LoginPage: React.FC<Props> = ({ onLogin, onNavigate }) => {
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
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="text-center mb-10">
          <div className="inline-block bg-indigo-600 p-3 rounded-2xl mb-6 shadow-lg shadow-indigo-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Log in to continue your path to mastery.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <input 
              required
              type="email"
              className="w-full bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition dark:text-white"
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
              className="w-full bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition dark:text-white"
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

        <p className="mt-10 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
          Don't have an account? <button onClick={() => onNavigate('signup')} className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Sign Up</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;