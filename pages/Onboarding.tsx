
import React, { useState } from 'react';
import { User, Difficulty } from '../types';
import { generateLearningPath } from '../geminiService';

interface Props {
  user: User;
  onComplete: (path: any) => void;
  onCancel?: () => void;
  language: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Onboarding: React.FC<Props> = ({ user, onComplete, onCancel, language, isDarkMode, toggleTheme }) => {
  const [goal, setGoal] = useState('');
  const [topics, setTopics] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.BEGINNER);
  const [time, setTime] = useState('1 hour');
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(false);

  const applyTemplate = (type: 'JAVA_DSA' | 'SQL') => {
    if (type === 'JAVA_DSA') {
      setGoal('Master Java Data Structures & Algorithms');
      setTopics('Basics, Time Complexity, Arrays, Strings, Recursion, Sorting, Searching, Linked Lists, Stacks, Queues, Binary Trees, BST, Heaps, Hashing, Graphs, Dynamic Programming');
      setDifficulty(Difficulty.INTERMEDIATE);
      setDuration(15);
    } else if (type === 'SQL') {
      setGoal('Advanced SQL Mastery');
      setTopics('JOINs, Aggregates, Window Functions, CTEs, Normalization, Query Optimization, Indexing');
      setDifficulty(Difficulty.BEGINNER);
      setDuration(7);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = await generateLearningPath(goal, topics, difficulty, time, duration, language);
      onComplete(path);
    } catch (error) {
      console.error(error);
      alert('Failed to generate path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
        <div className="relative mb-10">
          <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-24 h-24 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 text-center tracking-tight">Crafting Your Future</h2>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm font-medium leading-relaxed">
          Lumina AI is building a bespoke {duration}-day roadmap for "{goal}". Excellence takes a few seconds...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center py-12 px-4 transition-colors">
      <div className="max-w-2xl w-full">
        <div className="mb-12 flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black text-slate-900 dark:text-white mb-3 tracking-tighter">Welcome, {user.username}!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Let's set up your custom learning experience.</p>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="mb-10 flex flex-wrap gap-3">
          <span className="w-full text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-1">Quick-Start Templates</span>
          <button 
            onClick={() => applyTemplate('JAVA_DSA')}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
          >
            ☕ Java DSA Reference
          </button>
          <button 
            onClick={() => applyTemplate('SQL')}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black border border-slate-100 dark:border-slate-700 hover:bg-slate-100 transition-colors"
          >
            📊 SQL Essentials
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Duration Card */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-10 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-800/30">
            <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-400 mb-6 flex items-center">
               Course Duration: {duration} Days
            </h3>
            <div className="flex items-center space-x-6">
              <span className="text-xs font-black text-indigo-400 dark:text-indigo-500 tracking-widest">3D</span>
              <div className="flex-1 relative group">
                <input 
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
              </div>
              <span className="text-xs font-black text-indigo-400 dark:text-indigo-500 tracking-widest">30D</span>
            </div>
            <p className="text-[11px] text-indigo-500/80 mt-6 text-center font-bold italic tracking-wide">
              AI will split your curriculum across these {duration} days.
            </p>
          </div>

          {/* Goals Input Group */}
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">Primary Goal</label>
              <input 
                required
                className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white font-medium shadow-inner"
                placeholder="e.g. Master SQL Database Basics"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">Specific Topics to Focus On</label>
              <textarea 
                className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white font-medium shadow-inner"
                placeholder="e.g. JOINs, Aggregates, Normalization, Indexing"
                rows={3}
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">Skill Level</label>
                <select 
                  className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white font-black text-sm shadow-inner appearance-none cursor-pointer"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                >
                  {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">Time Available</label>
                <select 
                  className="w-full px-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all dark:text-white font-black text-sm shadow-inner appearance-none cursor-pointer"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                >
                  <option value="30 mins">30 Mins Daily</option>
                  <option value="1 hour">1 Hour Daily</option>
                  <option value="2 hours">2 Hours Daily</option>
                  <option value="Deep Dive">Deep Dive (4+ Hours)</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 dark:bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl hover:scale-[1.01] active:scale-[0.98] transition-all shadow-2xl shadow-slate-900/20 dark:shadow-indigo-500/20 mt-10"
          >
            Create Learning Plan
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
