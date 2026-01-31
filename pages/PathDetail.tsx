
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { LearningPath, DayPlan, Topic } from '../types';
import { generateSpeech, decodeBase64, decodeAudioData, chatWithAI, fetchTopicResources } from '../geminiService';

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
  const [extraInfo, setExtraInfo] = useState<Record<string, string>>({});
  const [topicResources, setTopicResources] = useState<Record<string, {text: string, links: Resource[]}>>({});
  const activeDay = path.days.find(d => d.day === selectedDay) || path.days[0];
  const audioContextRef = useRef<AudioContext | null>(null);
  const scrollRequestRef = useRef<{ title: string; day: number } | null>(null);

  // Map all topic titles to their day number for cross-linking
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

  // Handle auto-scroll after day change
  useEffect(() => {
    if (scrollRequestRef.current && scrollRequestRef.current.day === selectedDay) {
      const { title } = scrollRequestRef.current;
      const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const element = document.getElementById(`topic-${slug}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Flash effect
        element.classList.add('ring-4', 'ring-indigo-500', 'ring-opacity-50');
        setTimeout(() => element.classList.remove('ring-4', 'ring-indigo-500', 'ring-opacity-50'), 2000);
      }
      scrollRequestRef.current = null;
    }
  }, [selectedDay]);

  const handleLinkClick = (title: string) => {
    const info = topicMap[title];
    if (!info) return;

    if (info.day === selectedDay) {
      const element = document.getElementById(`topic-${info.slug}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('ring-4', 'ring-indigo-500', 'ring-opacity-50');
        setTimeout(() => element.classList.remove('ring-4', 'ring-indigo-500', 'ring-opacity-50'), 2000);
      }
    } else {
      scrollRequestRef.current = { title, day: info.day };
      setSelectedDay(info.day);
    }
  };

  const cleanText = (text: string) => {
    return text.replace(/[`]{1,3}/g, '').replace(/[*]{1,2}/g, '').trim();
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
        result.push(
          <button
            key={i}
            onClick={() => handleLinkClick(matchedTitle)}
            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4 decoration-indigo-300 dark:decoration-indigo-700 transition-all"
          >
            {part}
          </button>
        );
      } else {
        result.push(part);
      }
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
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingTopic(null);
    }
  };

  const handleResearch = async (topicTitle: string) => {
    if (researchingTopic === topicTitle) return;
    setResearchingTopic(topicTitle);

    try {
      const resources = await fetchTopicResources(topicTitle, path.goal, language);
      setTopicResources(prev => ({ ...prev, [topicTitle]: resources }));
    } catch (err) {
      console.error(err);
    } finally {
      setResearchingTopic(null);
    }
  };

  const generatePathContent = () => {
    let content = `FULL LEARNING CURRICULUM: ${path.goal.toUpperCase()}\n`;
    content += `Difficulty: ${path.difficulty}\n`;
    content += `Total Duration: ${path.days.length} Days\n`;
    content += `Generated on ${new Date(path.createdAt).toLocaleDateString()}\n`;
    content += `====================================================\n\n`;

    path.days.forEach(d => {
      content += `DAY ${d.day}: ${d.objective.toUpperCase()}\n`;
      content += `----------------------------------------------------\n`;
      d.topics.forEach(t => {
        content += `TOPIC: ${t.title}\n`;
        content += `SUMMARY: ${cleanText(t.explanation)}\n\n`;
        content += `KEY CONCEPTS:\n${t.keyConcepts.map(c => `  • ${cleanText(c)}`).join('\n')}\n\n`;
        content += `EXAMPLES:\n${t.examples.map(ex => `  - ${cleanText(ex)}`).join('\n')}\n\n`;
        content += `PRACTICE TASK: ${cleanText(t.practiceFocus)}\n`;
        content += `\n`;
      });
      content += `\n`;
    });
    return content;
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveAsPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Interactive Header - Hidden on Print */}
      <header className="bg-slate-900 dark:bg-slate-900 text-white py-12 px-4 print:hidden border-b dark:border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button onClick={onBack} className="flex items-center text-slate-400 hover:text-white transition group font-bold text-sm">
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span> Return to Dashboard
            </button>
            <button onClick={toggleTheme} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all shadow-xl">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <span className="text-indigo-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2 block">Comprehensive Curriculum</span>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">{path.goal}</h1>
              <div className="flex flex-wrap items-center gap-4">
                <span className="px-4 py-1.5 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                  {path.difficulty}
                </span>
                <span className="text-slate-400 text-xs font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">Plan Start: {new Date(path.createdAt).toLocaleDateString()}</span>
                <span className="text-indigo-400 text-xs font-black bg-indigo-500/10 px-3 py-1.5 rounded-lg">{path.days.length} Days Journey</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => downloadFile(generatePathContent(), `Plan_${path.goal.replace(/\s+/g, '_')}.txt`)} 
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold transition text-sm flex items-center border border-white/10 backdrop-blur-sm"
              >
                <span className="mr-2">📥</span> Download Text
              </button>
              <button 
                onClick={handleSaveAsPDF} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition text-sm flex items-center shadow-xl shadow-indigo-500/20"
              >
                <span className="mr-2">📄</span> Save as PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col md:flex-row gap-12 print:hidden">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-72 shrink-0 sticky top-36 h-fit">
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-6 px-2">Program Breakdown</h3>
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

        {/* Content Area */}
        <div className="flex-1 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6 bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-[0.2em] mb-2 block">Currently Studying</span>
                <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">Day {activeDay.day}: {activeDay.objective}</h2>
              </div>
              <button 
                onClick={onStartQuiz}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition shadow-2xl shadow-indigo-500/20 text-xs uppercase tracking-widest active:scale-95"
              >
                Take Day {activeDay.day} Quiz
              </button>
            </div>

            <div className="space-y-12">
              {activeDay.topics.map((topic, i) => {
                const slug = topic.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
                return (
                  <div 
                    key={i} 
                    id={`topic-${slug}`}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 transition-all shadow-sm relative group"
                  >
                    <div className="absolute top-8 left-0 w-1 h-12 bg-indigo-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-start justify-between mb-8">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center">
                        <span className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mr-4 text-sm font-black">{i + 1}</span>
                        {topic.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                         <button 
                           onClick={() => handleSpeak(topic.explanation, `${topic.title}-${i}`)}
                           className={`p-3 rounded-xl transition-all ${speakingTopic === `${topic.title}-${i}` ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                           title="Listen to Explanation"
                         >
                           {speakingTopic === `${topic.title}-${i}` ? (
                             <div className="flex space-x-0.5 items-end h-3">
                               <div className="w-0.5 h-1.5 bg-white animate-pulse"></div>
                               <div className="w-0.5 h-3 bg-white animate-pulse delay-75"></div>
                               <div className="w-0.5 h-2 bg-white animate-pulse delay-150"></div>
                             </div>
                           ) : '🔊'}
                         </button>
                         <button 
                           onClick={() => handleExplainFurther(topic.title, topic.explanation)}
                           className={`p-3 rounded-xl transition-all ${analyzingTopic === topic.title ? 'bg-indigo-600 animate-pulse text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                           title="AI Deep Analysis"
                         >
                           {analyzingTopic === topic.title ? '✨' : '🧠'}
                         </button>
                         <button 
                           onClick={() => handleResearch(topic.title)}
                           className={`p-3 rounded-xl transition-all ${researchingTopic === topic.title ? 'bg-indigo-600 animate-pulse text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-600'}`}
                           title="Verified Web Resources"
                         >
                           {researchingTopic === topic.title ? '🔍' : '🌐'}
                         </button>
                      </div>
                    </div>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 mb-12 leading-relaxed text-lg">
                      {renderLinkedText(topic.explanation, topic.title)}
                    </div>

                    {extraInfo[topic.title] && (
                      <div className="mb-10 p-8 bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                         <h4 className="font-black text-indigo-900 dark:text-indigo-300 text-[10px] uppercase tracking-widest mb-4 flex items-center">
                           <span className="mr-2">🧠</span> AI Deep Dive
                         </h4>
                         <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                           {renderLinkedText(extraInfo[topic.title], topic.title)}
                         </div>
                      </div>
                    )}

                    {topicResources[topic.title] && (
                      <div className="mb-10 p-8 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="font-black text-slate-900 dark:text-slate-200 text-[10px] uppercase tracking-widest mb-4 flex items-center">
                          <span className="mr-2">🌐</span> Verified Resources
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 italic">{topicResources[topic.title].text}</p>
                        <div className="space-y-3">
                          {topicResources[topic.title].links.map((link, idx) => (
                            <a 
                              key={idx} 
                              href={link.uri} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-400 transition shadow-sm group"
                            >
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">{link.title}</span>
                              <span className="text-indigo-500">↗</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-10 mb-10">
                      <div className="bg-slate-50 dark:bg-slate-950/40 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                        <h4 className="font-black text-slate-900 dark:text-slate-200 mb-6 flex items-center text-[10px] uppercase tracking-[0.2em]">
                          Key Concepts
                        </h4>
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
                        <h4 className="font-black text-slate-900 dark:text-slate-200 mb-6 flex items-center text-[10px] uppercase tracking-[0.2em]">
                          Practical Examples
                        </h4>
                        <div className="space-y-4">
                          {topic.examples.map((ex, ei) => (
                            <div key={ei} className="p-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm italic text-slate-500 dark:text-slate-400 shadow-sm leading-relaxed">
                              "{renderLinkedText(ex, topic.title)}"
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="font-black text-slate-900 dark:text-slate-200 mb-4 text-[10px] uppercase tracking-[0.2em] flex items-center">
                        Practice Directive
                      </h4>
                      <p className="text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed">
                        {renderLinkedText(topic.practiceFocus, topic.title)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>

      {/* FULL CURRICULUM PRINT VIEW - Optimized for PDF Generation */}
      <div id="full-curriculum-print" className="hidden print:block bg-white text-slate-900 p-0 m-0 w-full">
        <div className="h-screen flex flex-col items-center justify-center text-center p-20 border-[16px] border-slate-900 page-break-after-always">
          <div className="bg-slate-900 text-white p-6 rounded-3xl mb-12">
            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-7xl font-black uppercase tracking-tighter mb-6 leading-none">{path.goal}</h1>
          <div className="h-2 w-48 bg-indigo-600 mb-10"></div>
          <p className="text-2xl font-bold text-slate-500 uppercase tracking-widest mb-20">Comprehensive Learning Roadmap</p>
          <div className="grid grid-cols-2 gap-12 w-full max-w-2xl text-left border-t-4 border-slate-100 pt-12">
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2">Complexity</div>
              <div className="text-2xl font-black text-indigo-700">{path.difficulty}</div>
            </div>
            <div>
              <div className="text-xs font-black text-slate-400 uppercase mb-2">Duration</div>
              <div className="text-2xl font-black text-indigo-700">{path.days.length} Day Intensive</div>
            </div>
          </div>
        </div>

        {path.days.map((day) => (
          <div key={day.day} className="p-20 page-break-after-always min-h-screen">
            <header className="flex items-center justify-between mb-16 border-b-4 border-slate-900 pb-8">
              <div>
                <div className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-1">Module {day.day} of {path.days.length}</div>
                <h2 className="text-5xl font-black uppercase tracking-tighter">{day.objective}</h2>
              </div>
              <div className="text-8xl font-black text-slate-100">{day.day}</div>
            </header>
            <div className="space-y-20">
              {day.topics.map((topic, i) => (
                <div key={i} className="space-y-8">
                  <div className="flex items-center">
                    <span className="text-4xl font-black text-indigo-600 mr-6">0{i + 1}</span>
                    <h3 className="text-3xl font-black text-slate-900 border-l-8 border-slate-900 pl-6 uppercase tracking-tight">{topic.title}</h3>
                  </div>
                  <div className="text-xl text-slate-700 leading-relaxed text-justify pl-16">
                    {topic.explanation}
                  </div>
                  <div className="grid grid-cols-2 gap-10 pl-16">
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                      <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-indigo-700 underline underline-offset-8 decoration-2">Essential Concepts</h4>
                      <ul className="space-y-4">
                        {topic.keyConcepts.map((c, ci) => (
                          <li key={ci} className="flex items-start font-bold text-slate-800">
                            <span className="mr-3 text-indigo-600">•</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media screen {
          #full-curriculum-print { display: none !important; }
        }
        @media print {
          body * { visibility: hidden; }
          #full-curriculum-print, #full-curriculum-print * { visibility: visible; }
          #full-curriculum-print { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            display: block !important; 
          }
          
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          @page { size: auto; margin: 0; }
          .page-break-after-always { page-break-after: always; }
          
          .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
          .bg-indigo-600 { background-color: #4f46e5 !important; color: white !important; }
          .bg-slate-50 { background-color: #f8fafc !important; }
          .bg-indigo-50 { background-color: #eef2ff !important; }
          .text-indigo-600 { color: #4f46e5 !important; }
          .text-indigo-700 { color: #4338ca !important; }
          .border-slate-900 { border-color: #0f172a !important; }
          .border-indigo-600 { border-color: #4f46e5 !important; }
        }
      `}</style>
    </div>
  );
};

export default PathDetail;
