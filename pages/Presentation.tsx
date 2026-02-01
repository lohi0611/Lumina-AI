
import React, { useState, useEffect } from 'react';
import { APP_LOGO_URL } from '../types';

const SLIDES = [
  {
    id: 'intro',
    title: 'Lumina AI',
    subtitle: 'The Future of Personalized Education',
    content: 'An intelligent companion that transforms static curricula into dynamic, adaptive learning journeys.',
    accent: 'from-indigo-600 to-purple-600',
    icon: '✨'
  },
  {
    id: 'problem',
    title: 'The Challenge',
    subtitle: 'One-Size-Fits-All Fails',
    content: 'Traditional education is linear and rigid. Learners struggle with information overload, lack of structure, and no immediate feedback loops.',
    accent: 'from-rose-600 to-orange-600',
    icon: '🧱'
  },
  {
    id: 'solution',
    title: 'The Solution',
    subtitle: 'Generative Intelligence',
    content: 'Lumina AI uses Gemini 3 Pro to synthesize custom-tailored roadmaps that adapt to a user’s specific goals, prior knowledge, and schedule.',
    accent: 'from-emerald-600 to-teal-600',
    icon: '🧠'
  },
  {
    id: 'curriculum',
    title: 'Structured Mastery',
    subtitle: 'Java DSA & Beyond',
    content: 'Deep integration with industry-standard curricula like StudyMasth. Logical progression from time complexity to advanced dynamic programming.',
    accent: 'from-blue-600 to-indigo-600',
    icon: '☕'
  },
  {
    id: 'tech',
    title: 'Tech Stack',
    subtitle: 'Built for Performance',
    content: 'React 19, Tailwind CSS, Recharts for analytics, and the Google Gemini API for real-time multi-modal intelligence.',
    accent: 'from-slate-700 to-slate-900',
    icon: '💻'
  },
  {
    id: 'features',
    title: 'Core Ecosystem',
    subtitle: 'Adaptive Features',
    points: [
      'Dynamic Path Generation',
      'AI-Powered Audio Tutoring',
      'Mastery Verification Quizzes',
      'P2P Progress Sharing'
    ],
    accent: 'from-violet-600 to-purple-600',
    icon: '🎯'
  },
  {
    id: 'ai-layer',
    title: 'The AI Tutor',
    subtitle: 'Lumina "Thinking" Mode',
    content: 'Our tutor utilizes Gemini 3 Pro’s internal reasoning (Thinking Config) to provide deep, first-principles explanations for complex topics.',
    accent: 'from-cyan-600 to-blue-600',
    icon: '⚡'
  },
  {
    id: 'vision',
    title: 'The Vision',
    subtitle: 'Growth Without Limits',
    content: 'Scaling human potential by providing a world-class personal tutor to every learner on the planet.',
    accent: 'from-indigo-600 to-purple-700',
    icon: '🌍'
  }
];

interface Props {
  onExit: () => void;
}

const Presentation: React.FC<Props> = ({ onExit }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => setCurrentSlide(prev => Math.min(prev + 1, SLIDES.length - 1));
  const prev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 bg-slate-950 text-white flex flex-col items-center justify-center z-[200] overflow-hidden select-none">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${slide.accent} rounded-full blur-[120px] opacity-20 transition-all duration-1000`}></div>
        <div className={`absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr ${slide.accent} rounded-full blur-[120px] opacity-10 transition-all duration-1000`}></div>
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-white/10 p-1.5 rounded-xl shadow-lg border border-white/10">
            <img src={APP_LOGO_URL} alt="Lumina Logo" className="w-8 h-8 rounded-full" />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase opacity-80">Lumina Presentation</span>
        </div>
        <button 
          onClick={onExit}
          className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest border border-white/10 transition-all"
        >
          Exit Deck
        </button>
      </div>

      {/* Slide Content */}
      <div className="max-w-5xl w-full px-12 relative animate-in fade-in slide-in-from-bottom-8 duration-700" key={currentSlide}>
        <div className="text-8xl mb-8 animate-bounce">{slide.icon}</div>
        <h2 className={`text-2xl font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r ${slide.accent} mb-4`}>
          {slide.subtitle}
        </h2>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-12 leading-[0.9]">
          {slide.title}
        </h1>
        {slide.content && (
          <p className="text-2xl md:text-3xl text-slate-400 font-medium leading-relaxed max-w-3xl">
            {slide.content}
          </p>
        )}
        {slide.points && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slide.points.map((p, i) => (
              <div key={i} className="flex items-center space-x-4 bg-white/5 border border-white/10 p-6 rounded-3xl">
                <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black">0{i+1}</span>
                <span className="text-xl font-bold">{p}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex items-center justify-between">
        <div className="flex space-x-2">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 transition-all duration-500 rounded-full ${i === currentSlide ? `w-12 bg-indigo-500` : 'w-4 bg-white/10'}`}
            />
          ))}
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={prev}
            disabled={currentSlide === 0}
            className="p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition disabled:opacity-20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={next}
            disabled={currentSlide === SLIDES.length - 1}
            className="px-10 py-4 bg-indigo-600 rounded-full hover:bg-indigo-700 transition font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-500/30 disabled:opacity-20 flex items-center"
          >
            Next Slide <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 w-full text-center text-[10px] font-black text-slate-700 uppercase tracking-widest">
        Slide {currentSlide + 1} of {SLIDES.length} • Use Arrow Keys to Navigate
      </div>
    </div>
  );
};

export default Presentation;
