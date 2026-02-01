
import React, { useState, useEffect, useRef } from 'react';
import { User, LearningPath, PerformanceRecord, Achievement, APP_LOGO_URL } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { chatWithAI, generateSpeech, decodeBase64, decodeAudioData } from '../geminiService';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
  audioData?: string;
}

interface Props {
  user: User;
  paths: LearningPath[];
  records: PerformanceRecord[];
  onNavigate: (page: string) => void;
  onLogout: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  onSelectPath: (id: string) => void;
  activePathId: string | null;
}

const Dashboard: React.FC<Props> = ({ user, paths, records, onNavigate, onLogout, language, setLanguage, isDarkMode, toggleTheme, onSelectPath, activePathId }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const activePath = paths.find(p => p.id === activePathId) || paths[paths.length - 1];
  
  // Time-based greeting logic
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const stats = records.length > 0 ? {
    avgScore: Math.round(records.reduce((acc, r) => acc + r.accuracy, 0) / records.length),
    totalQuizzes: records.length,
    totalXP: records.reduce((acc, r) => acc + (r.xpEarned || 0), 0)
  } : { avgScore: 0, totalQuizzes: 0, totalXP: 0 };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (chatOpen) scrollToBottom();
  }, [messages, sending, chatOpen]);

  // XP Progress Calculation
  const nextLevelXP = user.level * 500;
  const currentLevelXP = (user.level - 1) * 500;
  const xpInCurrentLevel = user.xp - currentLevelXP;
  const xpNeededForNextLevel = 500;
  const xpProgressPercentage = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNextLevel) * 100));

  // UI Translation Logic (Humanized)
  const translations: any = {
    English: {
      welcome: timeGreeting,
      dashboard: "My Home",
      groups: "Community & Peers",
      myPaths: "Your Journeys",
      newPath: "Start New Adventure",
      logout: "Sign Out",
      activePath: "Current Focus",
      completion: "Progress",
      curriculum: "Weekly Roadmap",
      analytics: "Growth Insights",
      report: "Daily Summary",
      tutor: "Lumina Companion",
      askMe: "What's on your mind?",
      thinking: "Deep thought in progress...",
      langLabel: "Conversation Language",
      level: "Level",
      streak: "Day Streak",
      achievements: "Trophies",
      unlocked: "Unlocked",
      locked: "Locked"
    },
    Hindi: {
      welcome: "स्वागत है",
      dashboard: "मेरा घर",
      groups: "समुदाय",
      myPaths: "मेरी यात्राएँ",
      newPath: "नई शुरुआत",
      logout: "लॉगआउट",
      activePath: "वर्तमान लक्ष्य",
      completion: "पूर्णता",
      curriculum: "साप्ताहिक योजना",
      analytics: "विकास",
      report: "दैनिक रिपोर्ट",
      tutor: "ल्यूमिना साथी",
      askMe: "मुझसे कुछ भी पूछें...",
      thinking: "गहराई से सोच रहा हूँ...",
      langLabel: "भाषा",
      level: "स्तर",
      streak: "सिलसिला",
      achievements: "उपलब्धियां",
      unlocked: "खुला",
      locked: "बंद"
    },
    Telugu: {
      welcome: "స్వాగతం",
      dashboard: "నా ఇల్లు",
      groups: "కమ్యూనిటీ",
      myPaths: "నా ప్రయాణాలు",
      newPath: "కొత్త ఆరంభం",
      logout: "లాగ్అవుట్",
      activePath: "ప్రస్తుత లక్ష్యం",
      completion: "పూర్తి",
      curriculum: "వారపు ప్రణాళిక",
      analytics: "వృద్ది",
      report: "రోజువారీ నివేదిక",
      tutor: "ల్యుమినా మిత్రుడు",
      askMe: "నన్ను ఏదైనా అడగండి...",
      thinking: "లోతుగా ఆలోచిస్తున్నాను...",
      langLabel: "భాష",
      level: "స్థాయి",
      streak: "క్రమం",
      achievements: "విజయాలు",
      unlocked: "అన్‌లాక్ చేయబడింది",
      locked: "లాక్ చేయబడింది"
    }
  };

  const t = translations[language] || translations.English;

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: now }]);
    setChatInput('');
    setSending(true);
    
    try {
      const response = await chatWithAI(userMsg, activePath?.goal || "General Learning", useThinking, language);
      const aiNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'ai', text: response, timestamp: aiNow }]);
    } catch (error) {
      const errNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having a little trouble connecting. Could we try that again?", timestamp: errNow }]);
    } finally {
      setSending(false);
    }
  };

  const playAudio = async (text: string, msgIndex: number) => {
    if (speakingMsgId === msgIndex) return;
    setSpeakingMsgId(msgIndex);

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const ctx = audioContextRef.current;
      const base64 = await generateSpeech(text);
      if (!base64) throw new Error("Audio generation failed");

      const uint8 = decodeBase64(base64);
      const buffer = await decodeAudioData(uint8, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setSpeakingMsgId(null);
      source.start();
    } catch (err) {
      console.error("Speech error:", err);
      setSpeakingMsgId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300 overflow-hidden relative">
      
      {/* Organic Background Blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 dark:bg-indigo-900/10 blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/20 dark:bg-purple-900/10 blur-[120px] pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside className="w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col sticky top-0 h-screen transition-colors duration-300 z-10">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-100 dark:border-slate-800/50">
          <img src={APP_LOGO_URL} alt="Logo" className="w-9 h-9 rounded-full shadow-lg ring-2 ring-white dark:ring-slate-800" />
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xl tracking-tight">Lumina AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <button className="w-full flex items-center space-x-3 px-4 py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-2xl font-bold transition-all hover:scale-[1.02] text-left shadow-sm shadow-indigo-100 dark:shadow-none">
            <span className="text-lg">🏠</span> <span>{t.dashboard}</span>
          </button>
          
          <button 
            onClick={() => onNavigate('study-groups')}
            className="w-full flex items-center space-x-3 px-4 py-3.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl font-medium transition text-left hover:text-slate-800 dark:hover:text-slate-200"
          >
            <span className="text-lg">👥</span> <span>{t.groups}</span>
          </button>

          <div className="px-4 pb-2 pt-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-80">{t.myPaths}</div>
          {paths.map(p => (
            <button 
              key={p.id}
              onClick={() => onSelectPath(p.id)}
              className={`w-full flex flex-col px-4 py-3 rounded-2xl transition-all text-left group ${activePathId === p.id ? 'bg-white dark:bg-slate-800 border-l-4 border-indigo-500 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-transparent'}`}
            >
              <span className={`font-bold text-sm truncate ${activePathId === p.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200'}`}>{p.goal}</span>
              <span className="text-[10px] opacity-60 font-medium mt-0.5">{p.days.length} Days • {p.difficulty}</span>
            </button>
          ))}
          
          <button 
            onClick={() => onNavigate('onboarding')}
            className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 rounded-2xl transition-all font-bold text-sm group"
          >
            <span className="group-hover:scale-110 transition-transform">✨</span> <span>{t.newPath}</span>
          </button>

          {/* Language Switcher */}
          <div className="px-4 pb-2 pt-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest opacity-80">{t.langLabel}</div>
          <div className="px-2 space-y-2">
            {[
              { id: 'English', label: 'English' },
              { id: 'Hindi', label: 'हिंदी (Hindi)' },
              { id: 'Telugu', label: 'తెలుగు (Telugu)' }
            ].map((lang) => (
              <button 
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${language === lang.id ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800/50 space-y-3">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <span>{isDarkMode ? '🌙 Night Mode' : '☀️ Day Mode'}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${isDarkMode ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
          </button>
          <button onClick={onLogout} className="w-full px-4 py-3 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl font-bold transition text-xs text-center border border-transparent hover:border-rose-100">
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 transition-colors duration-300 relative z-10">
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
                 {t.welcome}, <span className="text-indigo-600 dark:text-indigo-400 ml-2">{user.username}</span>! <span className="text-2xl ml-2 animate-bounce">🌱</span>
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center text-rose-500 font-bold text-xs uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                  <span className="text-base mr-1.5">🔥</span> {user.streak} {t.streak}
                </span>
                <span className="flex items-center text-amber-500 font-bold text-xs uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                  <span className="text-base mr-1.5">⭐</span> {t.level} {user.level}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Level Progress Bar in Header */}
            <div className="hidden md:flex flex-col w-48">
               <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  <span>Level Progress</span>
                  <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
               </div>
               <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{ width: `${xpProgressPercentage}%` }}></div>
               </div>
            </div>

            <div className="flex items-center space-x-3">
              <button onClick={() => setChatOpen(!chatOpen)} 
                className={`p-3 rounded-2xl transition-all relative group ${chatOpen ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:scale-105 shadow-sm border border-slate-100 dark:border-slate-700'}`}
              >
                <span className="text-xl">💬</span>
                {!chatOpen && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-12 overflow-y-auto max-h-[calc(100vh-88px)] custom-scrollbar">
          {activePath ? (
            <>
              {/* Path Spotlight */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 rounded-[3rem] shadow-2xl shadow-indigo-900/20 text-white relative overflow-hidden group transition-all hover:shadow-indigo-900/30">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 transition-transform group-hover:scale-110 duration-1000 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/20 rounded-full -ml-20 -mb-20 blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex-1">
                    <span className="bg-white/20 text-white text-[11px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] mb-6 inline-block backdrop-blur-md border border-white/10 shadow-lg">
                      {t.activePath}
                    </span>
                    <h2 className="text-5xl font-black mb-4 tracking-tight leading-[1.1] text-shadow-sm">{activePath.goal}</h2>
                    <p className="text-indigo-100/90 mb-10 text-lg max-w-lg font-medium leading-relaxed">
                       You're crushing it! Day {records.filter(r => r.quizId?.includes(activePath.id)).length + 1} of {activePath.days.length} is waiting for you.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => { onSelectPath(activePath.id); onNavigate('path-detail'); }}
                        className="bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black hover:bg-indigo-50 transition shadow-2xl shadow-black/10 active:scale-95 text-base flex items-center"
                      >
                        Continue Journey <span className="ml-2">→</span>
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-64 bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center shadow-inner">
                     <div className="relative mb-6">
                        <svg className="w-32 h-32 transform -rotate-90 drop-shadow-lg">
                           <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/10" />
                           <circle 
                              cx="64" 
                              cy="64" 
                              r="58" 
                              stroke="currentColor" 
                              strokeWidth="8" 
                              fill="transparent" 
                              strokeDasharray={364.4} 
                              strokeDashoffset={364.4 - (364.4 * (records.filter(r => r.quizId?.includes(activePath.id)).length / activePath.days.length))}
                              className="text-white transition-all duration-1000"
                              strokeLinecap="round"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                           <span className="text-3xl font-black leading-none tracking-tight">{(records.filter(r => r.quizId?.includes(activePath.id)).length / activePath.days.length * 100).toFixed(0)}%</span>
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest text-center leading-relaxed opacity-80">
                        {t.completion}
                     </p>
                  </div>
                </div>
              </div>

              {/* Achievements Section - Softer Look */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center">
                    {t.achievements} <span className="ml-2 text-lg">🏆</span>
                  </h3>
                  <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors">View All</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {user.achievements.map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`p-6 rounded-[2.5rem] border transition-all text-center flex flex-col items-center group cursor-default relative overflow-hidden ${ach.unlockedAt ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-1' : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-60 grayscale'}`}
                    >
                      {ach.unlockedAt && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>}
                      <div className={`text-4xl mb-4 transition-transform duration-300 ${ach.unlockedAt ? 'group-hover:scale-110 drop-shadow-md' : ''}`}>
                        {ach.icon}
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1 leading-tight">{ach.title}</h4>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 line-clamp-2 leading-tight px-2">
                        {ach.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daywise Plan - More Organic Cards */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 px-2 flex items-center">
                  {t.curriculum} <span className="ml-2 text-lg">🗺️</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {activePath.days.map((day, idx) => {
                    const isCompleted = idx < records.filter(r => r.quizId?.includes(activePath.id)).length;
                    const isCurrent = idx === records.filter(r => r.quizId?.includes(activePath.id)).length;
                    
                    return (
                      <button 
                        key={idx}
                        onClick={() => { onSelectPath(activePath.id); onNavigate('path-detail'); }}
                        className={`group p-8 rounded-[2.5rem] border-2 transition-all text-left relative overflow-hidden flex flex-col justify-between min-h-[180px] ${isCompleted ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-70' : isCurrent ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg'}`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              Day {day.day}
                            </span>
                            {isCompleted && (
                              <span className="text-emerald-500 font-black text-lg bg-emerald-50 rounded-full w-8 h-8 flex items-center justify-center">✓</span>
                            )}
                          </div>
                          <h4 className={`font-bold mb-3 line-clamp-3 text-sm leading-relaxed ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{day.objective}</h4>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                           <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-indigo-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                            {day.topics.length} Nodes
                           </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analytics - Clean & Soft */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.analytics}</h2>
                    <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                       <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                       <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Mastery Curve</span>
                    </div>
                  </div>
                  <div className="h-72 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={records.length > 0 ? records : [{ accuracy: 0, timestamp: 'Start' }]}>
                        <defs>
                          <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: isDarkMode ? '#1e293b' : 'white', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorAcc)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[3rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 blur-xl"></div>
                   <div className="relative z-10">
                      <div className="text-indigo-300 font-black text-[10px] uppercase tracking-[0.2em] mb-8">{t.report}</div>
                      <div className="space-y-10">
                        <div>
                          <div className="text-6xl font-black tracking-tighter mb-2">{stats.avgScore}<span className="text-3xl text-indigo-500">%</span></div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Avg Mastery Score</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/5 p-4 rounded-2xl">
                              <div className="text-2xl font-black mb-1">{stats.totalQuizzes}</div>
                              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Quizzes Taken</div>
                           </div>
                           <div className="bg-white/5 p-4 rounded-2xl">
                              <div className="text-2xl font-black text-amber-400 mb-1">{stats.totalXP}</div>
                              <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">XP Earned</div>
                           </div>
                        </div>
                      </div>
                   </div>
                   <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition mt-10 active:scale-95 shadow-lg shadow-indigo-900/50">
                      View Full Transcript
                   </button>
                </div>
              </div>
            </>
          ) : (
             <div className="flex flex-col items-center justify-center py-32 text-center max-w-lg mx-auto">
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-4xl mb-8 animate-bounce">✨</div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4 tracking-tight">Your Future Starts Here</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">Tell Lumina AI what you want to learn, and we'll build a roadmap specifically for your level.</p>
                <button 
                  onClick={() => onNavigate('onboarding')}
                  className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-500/30 hover:scale-105 transition-all active:scale-95"
                >
                  Create My First Path
                </button>
             </div>
          )}
        </div>
      </main>

      {/* AI Chat Drawer - Friendly Vibe */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800 transition-all duration-300 animate-in slide-in-from-right duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-2xl shadow-sm">🤖</div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.tutor}</h3>
                <span className="text-[10px] text-green-500 font-black flex items-center tracking-widest uppercase">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Online
                </span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full text-2xl">×</button>
          </div>

          <div className="px-8 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
             <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Deep Reasoning</span>
                <button 
                  onClick={() => setUseThinking(!useThinking)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${useThinking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${useThinking ? 'left-6' : 'left-1'}`}></div>
                </button>
             </div>
             <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest italic">{language}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 scroll-smooth custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-24 px-8 opacity-60">
                <div className="text-6xl mb-6">👋</div>
                <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-4">I'm listening!</p>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">I can clarify confusing topics, quiz you, or just chat about {activePath?.goal || 'your goals'}.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-sm leading-relaxed relative group shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'}`}>
                  {m.text}
                  {m.role === 'ai' && (
                    <button 
                      onClick={() => playAudio(m.text, i)}
                      className={`absolute -right-12 top-2 p-3 bg-white dark:bg-slate-800 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all border border-slate-100 dark:border-slate-700 shadow-sm opacity-0 group-hover:opacity-100 ${speakingMsgId === i ? 'opacity-100 text-indigo-600 ring-4 ring-indigo-500/10' : 'text-slate-400'}`}
                    >
                      {speakingMsgId === i ? (
                        <div className="flex space-x-0.5 items-end h-3">
                          <div className="w-0.5 h-2 bg-indigo-600 animate-pulse"></div>
                          <div className="w-0.5 h-3.5 bg-indigo-600 animate-pulse delay-75"></div>
                          <div className="w-0.5 h-2.5 bg-indigo-600 animate-pulse delay-150"></div>
                        </div>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 011 1v12a1 1 0 01-1 1H7.414l-3.707 3.707A1 1 0 012 17V3a1 1 0 011-1h8zm0 2H4v10.586l2.293-2.293A1 1 0 017 13h4V5zM15 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm3 3a1 1 0 011 1v4a1 1 0 11-2 0V8a1 1 0 011-1z" /></svg>
                      )}
                    </button>
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-2.5 uppercase tracking-widest px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}
            {sending && (
              <div className="flex flex-col items-start">
                <div className="bg-white dark:bg-slate-800 px-6 py-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex space-x-2 items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300"></div>
                  {useThinking && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] ml-4 animate-pulse">{t.thinking}</span>}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-[2rem] border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
              <input 
                className="flex-1 bg-transparent px-6 py-3 outline-none text-sm text-slate-800 dark:text-slate-100 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder={t.askMe}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={sending || !chatInput.trim()}
                className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-lg shadow-indigo-500/20 active:scale-90"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
};

export default Dashboard;
