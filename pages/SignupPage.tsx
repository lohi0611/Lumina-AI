
import React, { useState } from 'react';
import { User, INITIAL_ACHIEVEMENTS, APP_LOGO_URL } from '../types';
import { saveUserToDb, logToAudit, findUserByEmail } from '../utils/storage';

interface Props {
  onSignup: (user: User) => void;
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const SignupPage: React.FC<Props> = ({ onSignup, onNavigate, isDarkMode, toggleTheme }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const createUser = async (name: string, mail: string) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: name,
      email: mail,
      hasOnboarded: false,
      preferredLanguage: 'English',
      xp: 0,
      level: 1,
      streak: 0,
      achievements: INITIAL_ACHIEVEMENTS
    };

    await saveUserToDb(newUser.id, newUser);
    await logToAudit(name, mail, 'SIGNUP');
    onSignup(newUser);
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const existing = await findUserByEmail(email);
    if (existing) {
      setError("Email already in use. Please log in.");
      return;
    }
    await createUser(username, email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 transition-colors relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mt-16 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-12 -mb-12 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <button onClick={() => onNavigate('landing')} className="absolute -top-4 -left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
             <span className="text-xl">←</span>
          </button>
          <div className="inline-block p-1 rounded-full mb-6 shadow-xl shadow-indigo-500/20">
            <img src={APP_LOGO_URL} alt="Lumina Logo" className="w-16 h-16 rounded-full" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Join Lumina</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Start your personalized learning journey today.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Username</label>
              <input 
                required
                className="w-full bg-slate-50 dark:bg-slate-800 px-5 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500 outline-none transition dark:text-white font-medium"
                placeholder="e.g. learner123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="mt-10 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
          Already have an account? <button onClick={() => onNavigate('login')} className="text-indigo-600 dark:text-indigo-400 font-black hover:underline ml-1">Log In</button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
