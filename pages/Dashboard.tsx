
import React, { useState, useEffect, useRef } from 'react';
import { User, LearningPath, PerformanceRecord, Achievement } from '../types';
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

  // UI Translation Logic
  const translations: any = {
    English: {
      welcome: "Welcome",
      dashboard: "Dashboard",
      groups: "Study Groups",
      myPaths: "My Learning Paths",
      newPath: "New Learning Path",
      logout: "Logout",
      activePath: "Active Learning Path",
      completion: "Completion",
      curriculum: "Weekly Curriculum",
      analytics: "Skill Progression",
      report: "Daily Report",
      tutor: "Lumina AI Tutor",
      askMe: "Ask me anything...",
      thinking: "Thinking Deeply...",
      langLabel: "AI Language",
      level: "Level",
      streak: "Streak",
      achievements: "Achievements",
      unlocked: "Unlocked",
      locked: "Locked"
    },
    Hindi: {
      welcome: "स्वागत है",
      dashboard: "डैशबोर्ड",
      groups: "अध्ययन समूह",
      myPaths: "मेरे सीखने के पथ",
      newPath: "नया सीखने का पथ",
      logout: "लॉगआउट",
      activePath: "सक्रिय शिक्षण पथ",
      completion: "पूर्णता",
      curriculum: "साप्ताहिक पाठ्यक्रम",
      analytics: "कौशल प्रगति",
      report: "दैनिक रिपोर्ट",
      tutor: "ल्यूमिना एआई ट्यूटर",
      askMe: "मुझसे कुछ भी पूछें...",
      thinking: "गहराई से सोच रहा हूँ...",
      langLabel: "एआई भाषा",
      level: "स्तर",
      streak: "सिलसिला",
      achievements: "उपलब्धियां",
      unlocked: "खुला",
      locked: "बंद"
    },
    Telugu: {
      welcome: "స్వాగతం",
      dashboard: "డ్యాష్‌బోర్డ్",
      groups: "అభ్యయన సమూహాలు",
      myPaths: "నా అభ్యాస మార్గాలు",
      newPath: "కొత్త అభ్యాస మార్గం",
      logout: "లాగ్అవుట్",
      activePath: "క్రియాశీల అభ్యాస మార్గం",
      completion: "పూర్తి",
      curriculum: "వారపు పాఠ్యాంశాలు",
      analytics: "నైపుణ్య పురోగతి",
      report: "రోజువారీ నివేదిక",
      tutor: "ల్యుమినా AI ట్యూటర్",
      askMe: "నన్ను ఏదైనా అడగండి...",
      thinking: "లోతుగా ఆలోచిస్తున్నాను...",
      langLabel: "AI భాష",
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
      setMessages(prev => [...prev, { role: 'ai', text: "Connection issues. Let's try again.", timestamp: errNow }]);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col sticky top-0 h-screen transition-colors duration-300">
        <div className="p-6 flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-xl">Lumina AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-xl font-bold transition text-left">
            <span>🏠</span> <span>{t.dashboard}</span>
          </button>
          
          <button 
            onClick={() => onNavigate('study-groups')}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-bold transition text-left"
          >
            <span>👥</span> <span>{t.groups}</span>
          </button>

          <div className="px-4 pb-2 pt-6 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.myPaths}</div>
          {paths.map(p => (
            <button 
              key={p.id}
              onClick={() => onSelectPath(p.id)}
              className={`w-full flex flex-col px-4 py-3 rounded-2xl transition-all text-left ${activePathId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'}`}
            >
              <span className="font-bold text-sm truncate">{p.goal}</span>
              <span className="text-[10px] opacity-70 uppercase tracking-tighter">{p.days.length} Days Plan</span>
            </button>
          ))}
          
          <button 
            onClick={() => onNavigate('onboarding')}
            className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 rounded-2xl transition-all font-bold text-sm"
          >
            <span>+</span> <span>{t.newPath}</span>
          </button>

          {/* Language Switcher */}
          <div className="px-4 pb-2 pt-8 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.langLabel}</div>
          <div className="px-2 space-y-2">
            {[
              { id: 'English', label: 'English' },
              { id: 'Hindi', label: 'हिंदी (Hindi)' },
              { id: 'Telugu', label: 'తెలుగు (Telugu)' }
            ].map((lang) => (
              <button 
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${language === lang.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm">
            <span>{isDarkMode ? '🌙 Dark' : '☀️ Light'}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'left-4.5' : 'left-0.5'}`}></div>
            </div>
          </button>
          <button onClick={onLogout} className="w-full px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition text-xs text-center border border-red-100 dark:border-red-900/30">
            {t.logout}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 transition-colors duration-300">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.welcome}, {user.username}!</h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className="flex items-center text-rose-500 font-black text-xs uppercase tracking-widest">
                  <span className="text-xl mr-1">🔥</span> {user.streak} Day {t.streak}
                </span>
                <span className="flex items-center text-amber-500 font-black text-xs uppercase tracking-widest">
                  <span className="text-xl mr-1">⭐</span> {t.level} {user.level}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Level Progress Bar in Header */}
            <div className="hidden md:flex flex-col w-48 mr-4">
               <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  <span>Level {user.level}</span>
                  <span>{xpInCurrentLevel} / {xpNeededForNextLevel} XP</span>
               </div>
               <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700 shadow-inner">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${xpProgressPercentage}%` }}></div>
               </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onNavigate('onboarding')}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {t.newPath}
              </button>
              <button onClick={() => setChatOpen(!chatOpen)} 
                className={`p-3 rounded-xl transition-all ${chatOpen ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <span className="text-xl">💬</span>
              </button>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-10 overflow-y-auto max-h-[calc(100vh-88px)] custom-scrollbar">
          {activePath ? (
            <>
              {/* Path Spotlight */}
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 transition-transform group-hover:scale-110 duration-700"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-400/10 rounded-full -ml-20 -mb-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex-1">
                    <span className="bg-white/20 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-6 inline-block backdrop-blur-md border border-white/10">
                      Current Quest
                    </span>
                    <h2 className="text-5xl font-black mb-4 tracking-tighter leading-none">{activePath.goal}</h2>
                    <p className="text-indigo-100/70 mb-10 text-lg max-w-lg font-medium leading-relaxed">
                      {activePath.difficulty} path • Day {records.filter(r => r.quizId.includes(activePath.id)).length + 1} of {activePath.days.length}
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => { onSelectPath(activePath.id); onNavigate('path-detail'); }}
                        className="bg-white text-indigo-700 px-10 py-4 rounded-2xl font-black hover:bg-indigo-50 transition shadow-2xl shadow-white/10 active:scale-95 text-lg"
                      >
                        Keep Going
                      </button>
                      <button className="bg-indigo-500/30 text-white px-6 py-4 rounded-2xl font-black border border-white/10 backdrop-blur-md hover:bg-white/10 transition">
                         View Map
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-64 bg-black/20 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex flex-col items-center">
                     <div className="relative mb-6">
                        <svg className="w-32 h-32 transform -rotate-90">
                           <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                           <circle 
                              cx="64" 
                              cy="64" 
                              r="58" 
                              stroke="currentColor" 
                              strokeWidth="8" 
                              fill="transparent" 
                              strokeDasharray={364.4} 
                              strokeDashoffset={364.4 - (364.4 * (records.filter(r => r.quizId.includes(activePath.id)).length / activePath.days.length))}
                              className="text-indigo-300 transition-all duration-1000"
                           />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-3xl font-black leading-none">{(records.filter(r => r.quizId.includes(activePath.id)).length / activePath.days.length * 100).toFixed(0)}%</span>
                           <span className="text-[10px] font-black uppercase opacity-60 tracking-widest mt-1">Done</span>
                        </div>
                     </div>
                     <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest text-center leading-relaxed">
                        Mastery Progress
                     </p>
                  </div>
                </div>
              </div>

              {/* Achievements Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.achievements}</h3>
                  <button className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {user.achievements.map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`p-6 rounded-[2rem] border transition-all text-center flex flex-col items-center group cursor-default ${ach.unlockedAt ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm' : 'bg-slate-100/50 dark:bg-slate-900/30 border-transparent opacity-40 grayscale'}`}
                    >
                      <div className={`text-4xl mb-4 transition-transform ${ach.unlockedAt ? 'group-hover:scale-125' : ''}`}>
                        {ach.icon}
                      </div>
                      <h4 className="font-black text-xs text-slate-800 dark:text-slate-100 mb-1">{ach.title}</h4>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 line-clamp-2 leading-tight">
                        {ach.description}
                      </p>
                      {ach.unlockedAt && (
                        <div className="mt-3 text-[8px] font-black text-green-500 uppercase tracking-widest">
                          {t.unlocked}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Daywise Plan */}
              <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 px-1">{t.curriculum}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activePath.days.map((day, idx) => {
                    const isCompleted = idx < records.filter(r => r.quizId.includes(activePath.id)).length;
                    const isCurrent = idx === records.filter(r => r.quizId.includes(activePath.id)).length;
                    
                    return (
                      <button 
                        key={idx}
                        onClick={() => { onSelectPath(activePath.id); onNavigate('path-detail'); }}
                        className={`group p-8 rounded-[2.5rem] border transition-all text-left relative overflow-hidden ${isCompleted ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm opacity-60' : isCurrent ? 'bg-white dark:bg-slate-900 border-indigo-400 dark:border-indigo-600 shadow-xl shadow-indigo-500/5 scale-105' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest ${isCompleted ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600'}`}>
                            Day {day.day}
                          </span>
                          {isCompleted && (
                            <span className="text-green-500 font-black text-lg">✓</span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-slate-100 mb-3 line-clamp-2 text-sm leading-tight group-hover:text-indigo-600 transition-colors">{day.objective}</h4>
                        <div className="flex items-center space-x-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                           <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                            {day.topics.length} Nodes
                           </p>
                        </div>
                        {isCurrent && (
                          <div className="absolute top-0 right-0 p-2">
                             <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping absolute top-3 right-3"></span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-10">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.analytics}</h2>
                    <div className="flex items-center space-x-2">
                       <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accuracy %</span>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={records.length > 0 ? records : [{ accuracy: 0, timestamp: 'Start' }]}>
                        <defs>
                          <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: isDarkMode ? '#1e293b' : 'white' }} />
                        <Area type="monotone" dataKey="accuracy" stroke="#4f46e5" strokeWidth={5} fillOpacity={1} fill="url(#colorAcc)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[3rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                   <div className="relative z-10">
                      <div className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] mb-8">{t.report}</div>
                      <div className="space-y-10">
                        <div>
                          <div className="text-6xl font-black tracking-tighter mb-2">{stats.avgScore}<span className="text-3xl text-indigo-500">%</span></div>
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Avg Mastery Score</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <div className="text-2xl font-black mb-1">{stats.totalQuizzes}</div>
                              <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Quizzes</div>
                           </div>
                           <div>
                              <div className="text-2xl font-black text-amber-400 mb-1">{stats.totalXP}</div>
                              <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Total XP</div>
                           </div>
                        </div>
                      </div>
                   </div>
                   <button className="w-full bg-white/10 hover:bg-white/20 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition mt-10 active:scale-95 border border-white/5">
                      Export Transcript
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

      {/* AI Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800 transition-all duration-300 animate-in slide-in-from-right duration-500">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/30">L</div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.tutor}</h3>
                <span className="text-[10px] text-green-500 font-black flex items-center tracking-widest uppercase">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span> Intelligence Active
                </span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full text-2xl">×</button>
          </div>

          <div className="px-8 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
             <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Enhanced Thinking</span>
                <button 
                  onClick={() => setUseThinking(!useThinking)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${useThinking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${useThinking ? 'left-6' : 'left-1'}`}></div>
                </button>
             </div>
             <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest italic">{language} Mode</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 dark:bg-slate-950/20 scroll-smooth custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-24 px-8">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm border border-slate-100 dark:border-slate-800">👋</div>
                <p className="text-slate-500 font-black text-sm uppercase tracking-widest mb-4">Hello!</p>
                <p className="text-slate-400 text-sm leading-relaxed font-medium">I'm your AI tutor. Ask me anything about {activePath?.goal || 'learning'} or get deep explanations for your current curriculum.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
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
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-600 mt-2.5 uppercase tracking-widest">
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
            <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-[2.5rem] border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
              <input 
                className="flex-1 bg-transparent px-5 py-3 outline-none text-sm text-slate-800 dark:text-slate-100 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder={t.askMe}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage}
                disabled={sending || !chatInput.trim()}
                className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-xl shadow-indigo-500/20 active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
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
