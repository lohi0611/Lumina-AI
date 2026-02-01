
import React from 'react';
import { APP_LOGO_URL } from '../types';

interface Props {
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<Props> = ({ onNavigate, isDarkMode, toggleTheme }) => {
  return (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-300 selection:bg-indigo-100 dark:selection:bg-indigo-900">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src={APP_LOGO_URL} alt="Lumina Logo" className="w-10 h-10 rounded-full shadow-lg ring-2 ring-indigo-50 dark:ring-slate-800" />
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Lumina AI</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => onNavigate('login')} className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-white font-semibold transition px-4">Login</button>
          <button onClick={() => onNavigate('signup')} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold hover:scale-105 transition transform shadow-lg">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 text-center relative">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        
        <h1 className="text-6xl sm:text-8xl font-black text-slate-900 dark:text-slate-100 mb-8 leading-tight transition-colors tracking-tighter">
          Unlock your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 animate-gradient-x">full potential.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed font-medium">
          Lumina isn't just a course platform. It's a personalized AI companion that adapts to your curiosity, schedule, and pace.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={() => onNavigate('signup')} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition transform hover:-translate-y-1 shadow-xl shadow-indigo-500/20">
            Start Your Journey
          </button>
          <button 
            onClick={() => onNavigate('about')}
            className="w-full sm:w-auto bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Our Philosophy
          </button>
        </div>
      </header>

      {/* Features - Floating Cards */}
      <section className="bg-slate-50/50 dark:bg-slate-900/50 py-32 transition-colors relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Adaptive Pathways',
                desc: 'No two brains are alike. Your roadmap evolves daily based on what you actually master.',
                icon: '🌱'
              },
              {
                title: 'Conversational Checks',
                desc: 'Forget boring tests. Prove your skills through natural conversations with our AI tutor.',
                icon: '💬'
              },
              {
                title: 'Growth Visualization',
                desc: 'Watch your knowledge tree grow. Beautiful, motivating analytics that show your real progress.',
                icon: '📈'
              }
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all hover:-translate-y-2 border border-slate-100 dark:border-slate-800">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-8">{f.icon}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 transition-colors flex flex-col items-center bg-white dark:bg-slate-950">
        <p className="mb-4 font-medium">© 2026 Lumina AI. Crafted with ❤️ for learners everywhere.</p>
        <button 
          onClick={() => onNavigate('presentation')}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center"
        >
          <span className="mr-2">✨</span> View Concept Deck
        </button>
      </footer>
    </div>
  );
};

export default LandingPage;
