
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { LearningPath, DayPlan, Topic } from '../types';
import { generateSpeech, decodeBase64, decodeAudioData, chatWithAI, fetchTopicResources, simulateCodeExecution, quickAnalyze } from '../geminiService';

interface Props {
  path: LearningPath;
  onBack: () => void;
  onStartQuiz: () => void;
  language: string;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface Resource {
  title: string;
  uri: string;
}

const PathDetail: React.FC<Props> = ({ path, onBack, onStartQuiz, language, isDarkMode, toggleTheme }) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [speakingTopic, setSpeakingTopic] = useState<string | null>(null);
  const [analyzingTopic, setAnalyzingTopic] = useState<string | null>(null);
  const [researchingTopic, setResearchingTopic] = useState<string | null>(null);
  const [simplifyingTopic, setSimplifyingTopic] = useState<string | null>(null);
  const [extraInfo, setExtraInfo] = useState<Record<string, string>>({});
  const [simplifiedInfo, setSimplifiedInfo] = useState<Record<string, string>>({});
  const [topicResources, setTopicResources] = useState<Record<string, {text: string, links: Resource[]}>>({});
  
  // Code Editor State
  const [codeSnippets, setCodeSnippets] = useState<Record<string, string>>({});
  const [codeOutputs, setCodeOutputs] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});
  const [editorLanguages, setEditorLanguages] = useState<Record<string, string>>({});

  const activeDay = path.days.find(d => d.day === selectedDay) || path.days[0];
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRequestRef = useRef<{ title: string; day: number } | null>(null);

  // Inferred language from path goal
  const detectedLanguage = useMemo(() => {
    const goal = path.goal.toLowerCase();
    if (goal.includes('python')) return 'Python';
    if (goal.includes('java') && !goal.includes('script')) return 'Java';
    if (goal.includes('cpp') || goal.includes('c++')) return 'C++';
    if (goal.includes('c#') || goal.includes('csharp')) return 'C#';
    if (goal.includes('sql')) return 'SQL';
    if (goal.includes('ruby')) return 'Ruby';
    if (goal.includes('go') || goal.includes('golang')) return 'Go';
    if (goal.includes('rust')) return 'Rust';
    if (goal.includes('swift')) return 'Swift';
    if (goal.includes('kotlin')) return 'Kotlin';
    if (goal.includes('php')) return 'PHP';
    if (goal.includes('html') || goal.includes('css')) return 'HTML';
    if (goal.includes('javascript') || goal.includes('react') || goal.includes('node') || goal.includes('frontend') || goal.includes('web')) return 'JavaScript';
    if (goal.includes('typescript')) return 'TypeScript';
    return 'JavaScript'; // Default
  }, [path.goal]);

  const topicMap = useMemo(() => {
    const map: Record<string, { day: number; slug: string }> = {};
    path.days.forEach(d => {
      d.topics.forEach(t => {
        const slug = t.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        map[t.title] = { day: d.day, slug };
      });
    });
    return map;
  }, [path]);

  useEffect(() => {
    if (scrollRequestRef.current && scrollRequestRef.current.day === selectedDay) {
      const { title } = scrollRequestRef.current;
      const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const element = document.getElementById(`topic-${slug}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('ring-4', 'ring-indigo-500', 'ring-opacity-50');
        setTimeout(() => element.classList.remove('ring-4', 'ring-indigo-500', 'ring-opacity-50'), 2000);
      }
      scrollRequestRef.current = null;
    }
  }, [selectedDay]);

  // Handle clicking on linked topic titles
  const handleLinkClick = (title: string) => {
    const info = topicMap[title];
    if (info) {
      if (info.day === selectedDay) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const element = document.getElementById(`topic-${slug}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('ring-4', 'ring-indigo-500', 'ring-opacity-50');
          setTimeout(() => element.classList.remove('ring-4', 'ring-indigo-500', 'ring-opacity-50'), 2000);
        }
      } else {
        scrollRequestRef.current = { title, day: info.day };
        setSelectedDay(info.day);
      }
    }
  };

  const runCode = async (topicTitle: string) => {
    const code = codeSnippets[topicTitle] || "";
    const lang = editorLanguages[topicTitle] || detectedLanguage;
    
    setIsRunning(prev => ({ ...prev, [topicTitle]: true }));
    setCodeOutputs(prev => ({ ...prev, [topicTitle]: "> Warming up the engines..." }));
    
    try {
      const output = await simulateCodeExecution(code, lang, `Topic: ${topicTitle}, Part of ${path.goal} curriculum`);
      setCodeOutputs(prev => ({ ...prev, [topicTitle]: output }));
    } catch (err: any) {
      setCodeOutputs(prev => ({ ...prev, [topicTitle]: `Oops! Something went wrong: ${err.message}` }));
    } finally {
      setIsRunning(prev => ({ ...prev, [topicTitle]: false }));
    }
  };

  const renderLinkedText = (text: string, currentTopicTitle: string) => {
    const otherTopicTitles = Object.keys(topicMap)
      .filter(t => t !== currentTopicTitle && t.length > 3)
      .sort((a, b) => b.length - a.length);
    if (otherTopicTitles.length === 0) return text;
    const escapedTitles = otherTopicTitles.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`\\b(${escapedTitles.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    const result: React.ReactNode[] = [];
    parts.forEach((part, i) => {
      const matchedTitle = otherTopicTitles.find(t => t.toLowerCase() === part.toLowerCase());
      if (matchedTitle) {
        result.push(<button key={i} onClick={() => handleLinkClick(matchedTitle)} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4 decoration-indigo-300 dark:decoration-indigo-700 transition-all">{part}</button>);
      } else { result.push(part); }
    });
    return result;
  };

  const handleSpeak = async (text: string, id: string) => {
    if (speakingTopic === id) return;
    setSpeakingTopic(id);
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
      source.onended = () => setSpeakingTopic(null);
      source.start();
    } catch (err) {
      console.error(err);
      setSpeakingTopic(null);
    }
  };

  const handleExplainFurther = async (topicTitle: string, currentExplanation: string) => {
    if (analyzingTopic === topicTitle) return;
    setAnalyzingTopic(topicTitle);
    try {
      const prompt = `Provide a more detailed and deep explanation for the topic "${topicTitle}" based on this summary: ${currentExplanation}. Use thinking if it helps clarify difficult parts.`;
      const deepExplanation = await chatWithAI(prompt, `Deep dive into: ${topicTitle}`, true);
      setExtraInfo(prev => ({ ...prev, [topicTitle]: deepExplanation }));
    } catch (err) { console.error(err); } finally { setAnalyzingTopic(null); }
  };

  const handleSimplify = async (topicTitle: string, currentExplanation: string) => {
    if (simplifyingTopic === topicTitle) return;
    setSimplifyingTopic(topicTitle);
    try {
      const result = await quickAnalyze(currentExplanation, 'simplify', language);
      setSimplifiedInfo(prev => ({ ...prev, [topicTitle]: result }));
    } catch (err) { console.error(err); } finally { setSimplifyingTopic(null); }
  };

  const handleResearch = async (topicTitle: string) => {
    if (researchingTopic === topicTitle) return;
    setResearchingTopic(topicTitle);
    try {
      const resources = await fetchTopicResources(topicTitle, path.goal, language);
      setTopicResources(prev => ({ ...prev, [topicTitle]: resources }));
    } catch (err) { console.error(err); } finally { setResearchingTopic(null); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <header className="bg-slate-900 dark:bg-slate-900 text-white py-12 px-4 print:hidden border-b dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition group font-bold text-sm">
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Return Home
            </button>
            <button onClick={toggleTheme} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all shadow-xl">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">Your Personal Roadmap</span>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{path.goal}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-4 py-1.5 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">{path.difficulty}</span>
                <span className="text-slate-400 text-xs font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">{new Date(path.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-400 text-xs font-black bg-indigo-500/10 px-3 py-1.5 rounded-lg">{path.days.length} Days Journey</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition text-sm flex items-center shadow-xl shadow-indigo-500/20">
                <span className="mr-2">📄</span> Save as PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 print:hidden">
        <aside className="w-full md:w-72 shrink-0 sticky top-36 h-fit">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 px-2">Your Journey</h3>
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {path.days.map((d) => (
              <button 
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`w-full text-left px-5 py-4 rounded-3xl transition-all border ${selectedDay === d.day ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 shadow-xl shadow-indigo-500/5' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
              >
                <div className="text-[9px] font-black opacity-60 mb-1 uppercase tracking-tighter">Day {d.day}</div>
                <div className="font-black text-sm truncate leading-tight">{d.objective}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6 bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-2 block">Today's Focus</span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">Day {activeDay.day}: {activeDay.objective}</h2>
              </div>
              <button onClick={onStartQuiz} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-2xl shadow-indigo-500/20 text-xs uppercase tracking-widest active:scale-95">
                Take Knowledge Check
              </button>
            </div>

            <div className="space-y-12">
              {activeDay.topics.map((topic, i) => {
                const slug = topic.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                const isCodeRelated = path.goal.toLowerCase().includes('java') || 
                                    path.goal.toLowerCase().includes('dsa') || 
                                    path.goal.toLowerCase().includes('coding') || 
                                    path.goal.toLowerCase().includes('programming') || 
                                    path.goal.toLowerCase().includes('developer') || 
                                    path.goal.toLowerCase().includes('sql') ||
                                    path.goal.toLowerCase().includes('python') ||
                                    path.goal.toLowerCase().includes('script') ||
                                    path.goal.toLowerCase().includes('analysis') ||
                                    topic.title.toLowerCase().includes('code') ||
                                    topic.title.toLowerCase().includes('script') ||
                                    topic.title.toLowerCase().includes('algorithm') ||
                                    topic.title.toLowerCase().includes('implementation') ||
                                    topic.practiceFocus.toLowerCase().includes('implement');

                const currentLang = editorLanguages[topic.title] || detectedLanguage;

                return (
                  <div key={i} id={`topic-${slug}`} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 transition-all shadow-sm relative group">
                    <div className="absolute top-8 left-0 w-1 h-12 bg-indigo-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-start justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center">
                        <span className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mr-4 text-sm font-black">{i + 1}</span>
                        {topic.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                         <button onClick={() => handleSpeak(topic.explanation, `${topic.title}-${i}`)} className={`p-3 rounded-xl transition-all ${speakingTopic === `${topic.title}-${i}` ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}>
                           {speakingTopic === `${topic.title}-${i}` ? '🔊' : '🔊'}
                         </button>
                         <button onClick={() => handleExplainFurther(topic.title, topic.explanation)} className={`p-3 rounded-xl transition-all ${analyzingTopic === topic.title ? 'bg-indigo-600 animate-pulse text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}>
                           🧠
                         </button>
                         <button onClick={() => handleSimplify(topic.title, topic.explanation)} className={`p-3 rounded-xl transition-all ${simplifyingTopic === topic.title ? 'bg-indigo-600 animate-pulse text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}>
                           ⚡
                         </button>
                         <button onClick={() => handleResearch(topic.title)} className={`p-3 rounded-xl transition-all ${researchingTopic === topic.title ? 'bg-indigo-600 animate-pulse text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}>
                           🌐
                         </button>
                      </div>
                    </div>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 mb-6 leading-relaxed text-lg">
                      {renderLinkedText(topic.explanation, topic.title)}
                    </div>

                    {simplifiedInfo[topic.title] && (
                        <div className="mb-10 p-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 rounded-r-2xl animate-in fade-in slide-in-from-left-4 duration-500">
                            <h4 className="font-black text-amber-700 dark:text-amber-400 text-[10px] uppercase tracking-widest mb-2 flex items-center">
                            <span className="mr-2">⚡</span> Quick Simplification
                            </h4>
                            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed italic">
                            {simplifiedInfo[topic.title]}
                            </div>
                        </div>
                    )}

                    {isCodeRelated && (
                      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center space-x-3">
                              <h4 className="font-black text-indigo-600 dark:text-indigo-400 text-[10px] uppercase tracking-widest flex items-center">
                                <span className="mr-2">⚡</span> Interactive Playground
                              </h4>
                              <select 
                                className="bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-none outline-none text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                                value={currentLang}
                                onChange={(e) => setEditorLanguages(prev => ({ ...prev, [topic.title]: e.target.value }))}
                              >
                                <option value="JavaScript">JavaScript</option>
                                <option value="Python">Python</option>
                                <option value="Java">Java</option>
                                <option value="C++">C++</option>
                                <option value="C#">C#</option>
                                <option value="SQL">SQL</option>
                                <option value="Ruby">Ruby</option>
                                <option value="Go">Go</option>
                                <option value="Rust">Rust</option>
                                <option value="TypeScript">TypeScript</option>
                                <option value="HTML">HTML</option>
                              </select>
                           </div>
                        </div>
                        <div className="bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 shadow-2xl">
                           <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                              <div className="flex space-x-1.5">
                                 <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                 <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                 <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                 <span className="ml-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                   Experiment.{currentLang === 'Python' ? 'py' : currentLang === 'Java' ? 'java' : currentLang === 'SQL' ? 'sql' : 'txt'}
                                 </span>
                              </div>
                              <button 
                                onClick={() => runCode(topic.title)}
                                disabled={isRunning[topic.title]}
                                className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${isRunning[topic.title] ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-500/20'}`}
                              >
                                {isRunning[topic.title] ? 'Running Experiment...' : 'Run Experiment'}
                              </button>
                           </div>
                           <div className="relative">
                              <textarea
                                className="w-full h-64 bg-transparent p-6 text-indigo-100 font-mono text-sm outline-none resize-none leading-relaxed"
                                spellCheck={false}
                                placeholder={`// Type your ${currentLang} experiment here and hit run...`}
                                value={codeSnippets[topic.title] || ""}
                                onChange={(e) => setCodeSnippets(prev => ({ ...prev, [topic.title]: e.target.value }))}
                              />
                           </div>
                           <div className="bg-slate-950 p-6 border-t border-slate-800">
                              <div className="flex items-center justify-between mb-3">
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Output Log</div>
                                {isRunning[topic.title] && <span className="text-[8px] font-black text-indigo-500 uppercase animate-pulse">Running Simulation...</span>}
                              </div>
                              <div className="font-mono text-xs text-emerald-400 min-h-[60px] whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5">
                                {codeOutputs[topic.title] || "> Ready to run your code."}
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {extraInfo[topic.title] && (
                      <div className="mb-10 p-8 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 rounded-2xl animate-in fade-in slide-in-from-left-4 duration-500">
                         <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-[10px] uppercase tracking-widest mb-4 flex items-center">
                           <span className="mr-2">🧠</span> Deep Dive Exploration
                         </h4>
                         <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert">
                           {renderLinkedText(extraInfo[topic.title], topic.title)}
                         </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-10">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-900 dark:text-slate-200 mb-6 text-[10px] uppercase tracking-[0.2em]">Concepts to Master</h4>
                        <ul className="space-y-4">
                          {topic.keyConcepts.map((c, ci) => (
                            <li key={ci} className="text-slate-600 dark:text-slate-400 text-sm flex items-start">
                              <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 mr-3 shrink-0 text-[10px]">✓</span>
                              <span className="font-medium">{renderLinkedText(c, topic.title)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-indigo-50/20 dark:bg-indigo-900/10 p-8 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/30">
                        <h4 className="font-black text-slate-900 dark:text-slate-200 mb-6 text-[10px] uppercase tracking-[0.2em]">Real-World Examples</h4>
                        <div className="space-y-4">
                          {topic.examples.map((ex, ei) => (
                            <div key={ei} className="p-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm italic text-slate-500 dark:text-slate-400 shadow-sm leading-relaxed group-hover:border-indigo-200 transition-colors">
                              "{renderLinkedText(ex, topic.title)}"
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      <style>{`
        @page { size: auto; margin: 0; }
        .page-break-after-always { page-break-after: always; }
        textarea::-webkit-scrollbar { width: 4px; }
        textarea::-webkit-scrollbar-track { background: transparent; }
        textarea::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .dark textarea::-webkit-scrollbar-thumb { background: #444; }
      `}</style>
    </div>
  );
};

export default PathDetail;
