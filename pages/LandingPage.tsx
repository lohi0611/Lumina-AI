
import React from 'react';

interface Props {
  onNavigate: (page: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const LandingPage: React.FC<Props> = ({ onNavigate, isDarkMode, toggleTheme }) => {
  return (
    <div className="bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight transition-colors">Lumina AI</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <button onClick={() => onNavigate('login')} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 font-medium transition">Login</button>
          <button onClick={() => onNavigate('signup')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 dark:text-slate-100 mb-8 leading-tight transition-colors">
          Your Personalized <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI Learning Companion</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed transition-colors">
          Master any subject with custom learning paths, interactive quizzes, and 24/7 AI tutoring. Built to adapt to your unique pace and style.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button onClick={() => onNavigate('signup')} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition transform hover:-translate-y-1 shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40">
            Start Learning for Free
          </button>
          <button 
            onClick={() => onNavigate('about')}
            className="w-full sm:w-auto border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            See How it Works
          </button>
        </div>
      </header>

      {/* Features */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Adaptive Learning Paths',
                desc: 'Gemini AI generates optimized day-by-day plans based on your goals and schedule.',
                icon: '🚀'
              },
              {
                title: 'Intelligent Quizzing',
                desc: 'Get instant feedback and adaptive difficulty levels that challenge you just right.',
                icon: '🎯'
              },
              {
                title: 'Deep Analytics',
                desc: 'Track your progress with visual insights into your strong and weak areas.',
                icon: '📊'
              }
            ].map((f, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition">
                <div className="text-4xl mb-6">{f.icon}</div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600 transition-colors flex flex-col items-center">
        <p className="mb-4">© 2026 Lumina AI Learning Companion. All rights reserved.</p>
        <button 
          onClick={() => onNavigate('presentation')}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline flex items-center"
        >
          <span className="mr-2">📈</span> View Interactive Product Presentation
        </button>
      </footer>
    </div>
  );
};

export default LandingPage;
