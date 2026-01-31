
import React from 'react';

interface Props {
  onBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const AboutPage: React.FC<Props> = ({ onBack, isDarkMode, toggleTheme }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest hover:-translate-x-1 transition-transform">
          <span className="mr-2 text-xl">←</span> Back to Home
        </button>
        <button onClick={toggleTheme} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-800">
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-24">
        {/* Vision Section */}
        <section className="text-center space-y-6">
          <div className="inline-block bg-indigo-600/10 text-indigo-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">
            The Lumina Philosophy
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
            Learning Should Be <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-500">Tailored, Not Uniform</span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Lumina AI uses advanced Large Language Models to decompose complex subjects into bite-sized, digestible daily milestones specifically for you.
          </p>
        </section>

        {/* Step by Step */}
        <section className="space-y-12">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-center">How It Works</h2>
          <div className="grid gap-8">
            {[
              {
                step: '01',
                title: 'Define Your Goal',
                desc: 'Input what you want to learn, from Quantum Physics to Baking. Tell us your available time and current skill level.',
                icon: '🎯'
              },
              {
                step: '02',
                title: 'AI Synthesis',
                desc: 'Gemini 3 Pro analyzes the domain and creates a custom curriculum, distributing topics across your chosen duration to prevent burnout.',
                icon: '🧠'
              },
              {
                step: '03',
                title: 'Interactive Study',
                desc: 'Each day features detailed explanations, key concepts, and practical examples. Use the AI Tutor for real-time clarification.',
                icon: '📖'
              },
              {
                step: '04',
                title: 'Mastery Verification',
                desc: 'Take adaptive quizzes at the end of each module. We track your accuracy and adjust future explanations based on your weak points.',
                icon: '🏆'
              }
            ].map((s, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center gap-8 p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:scale-[1.01] transition-transform">
                <div className="text-5xl font-black text-indigo-600/20 dark:text-indigo-400/10 md:w-32 text-center md:text-left">{s.step}</div>
                <div className="text-4xl shrink-0">{s.icon}</div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical Highlights */}
        <section className="grid md:grid-cols-2 gap-12">
          <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">Intelligence Layer</h3>
            <p className="text-indigo-200/70 mb-8 leading-relaxed font-medium">
              Powered by the <span className="text-white font-bold underline decoration-indigo-500 underline-offset-4">Gemini 3 Pro</span> model, our engine provides multi-modal reasoning. Whether you need a text summary, a complex technical explanation, or a simulated conversation for language learning, the model adapts in real-time.
            </p>
            <div className="flex gap-4">
              <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">JSON Schema Control</span>
              <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">Multi-Modal TTS</span>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full -ml-20 -mb-20 group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-3xl font-black mb-6 tracking-tight">Social Learning</h3>
            <p className="text-indigo-100/80 mb-8 leading-relaxed font-medium">
              Education shouldn't be lonely. Share your unique Lumina ID with peers to compare progress charts, join global study groups, and engage in collaborative AI-moderated discussions.
            </p>
            <div className="flex gap-4">
              <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">P2P Progress Sharing</span>
              <span className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5">AI Moderation</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24 text-center">
           <h2 className="text-4xl font-black mb-10 text-slate-900 dark:text-white tracking-tighter">Ready to redefine your growth?</h2>
           <button 
             onClick={onBack}
             className="bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-black text-xl hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30 active:scale-95"
           >
             Get Started Now
           </button>
        </section>
      </main>

      <footer className="py-12 border-t border-slate-100 dark:border-slate-800 text-center text-slate-400 dark:text-slate-600">
        <p>© 2026 Lumina AI Learning Companion. Designed for the future of education.</p>
      </footer>
    </div>
  );
};

export default AboutPage;
