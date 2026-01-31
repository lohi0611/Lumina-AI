
import React, { useState, useEffect, useRef } from 'react';
import { User, StudyGroup, GroupMessage, PerformanceRecord } from '../types';
import { chatWithAI } from '../geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  user: User;
  onBack: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const STATUS_VARIANTS = [
  { label: 'Online', color: 'bg-green-500' },
  { label: 'Away', color: 'bg-amber-500' },
  { label: 'In a Session', color: 'bg-indigo-500 animate-pulse' },
  { label: 'Busy', color: 'bg-rose-500' }
];

const StudyGroups: React.FC<Props> = ({ user, onBack, isDarkMode, toggleTheme }) => {
  const [activeRoom, setActiveRoom] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectCodeInput, setConnectCodeInput] = useState('');
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // My personal connection code
  const [myCode] = useState(() => {
    const saved = localStorage.getItem(`lumina_code_${user.id}`);
    if (saved) return saved;
    const prefix = user.username.substring(0, 3).toUpperCase().padEnd(3, 'X');
    const digits = Math.floor(100 + Math.random() * 900).toString();
    const code = `${prefix}${digits}`;
    localStorage.setItem(`lumina_code_${user.id}`, code);
    return code;
  });

  const [connectedPeers, setConnectedPeers] = useState<{name: string, code: string, status: string}[]>(() => {
    const saved = localStorage.getItem(`lumina_peers_${user.id}`);
    return saved ? JSON.parse(saved) : [
      { name: 'Sarah Miller', code: 'SAR442', status: 'Online' },
      { name: 'Mike Ross', code: 'MIK781', status: 'Away' }
    ];
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Dynamic status simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectedPeers(prev => prev.map(peer => {
        // Only change status 10% of the time for realism
        if (Math.random() > 0.9) {
          const newStatus = STATUS_VARIANTS[Math.floor(Math.random() * STATUS_VARIANTS.length)].label;
          return { ...peer, status: newStatus };
        }
        return peer;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync peers to local storage
  useEffect(() => {
    localStorage.setItem(`lumina_peers_${user.id}`, JSON.stringify(connectedPeers));
  }, [connectedPeers, user.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const myRecords: PerformanceRecord[] = JSON.parse(localStorage.getItem(`lumina_records_${user.id}`) || '[]');
  
  const getPeerRecords = (peerCode: string): PerformanceRecord[] => {
    const stored = localStorage.getItem(`lumina_records_mock_${peerCode}`);
    if (stored) return JSON.parse(stored);
    
    const mock: PerformanceRecord[] = Array.from({ length: 5 }).map((_, i) => ({
      quizId: `mock-${i}`,
      score: Math.floor(Math.random() * 5) + 3,
      totalQuestions: 10,
      timestamp: `Day ${i + 1}`,
      accuracy: 60 + Math.floor(Math.random() * 35)
    }));
    return mock;
  };

  const rooms: StudyGroup[] = [
    { id: '1', name: 'Global React Masterclass', subject: 'Frontend', members: ['Alice', 'Bob', user.username], roomCode: 'RCT-202' },
    { id: '2', name: 'Data Structures Lab', subject: 'Computer Science', members: ['Emma', 'David', user.username], roomCode: 'DSA-990' },
  ];

  const filteredPeers = connectedPeers.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const joinRoom = (room: StudyGroup) => {
    setActiveRoom(room);
    setShowProgressPanel(false);
    setMessages([
      { id: 'm1', sender: 'System', text: `Connection secure. Welcome to ${room.name}.`, timestamp: 'System', isAI: false },
      { id: 'ai1', sender: 'Lumina Moderator', text: `Hi ${user.username}! I'm here to help the group with "${room.subject}". Mention me for intelligence queries.`, timestamp: 'Auto', isAI: true }
    ]);
  };

  const startPeerSession = (peer: any) => {
    const room: StudyGroup = {
      id: `p2p-${peer.code}`,
      name: `Private: ${peer.name}`,
      subject: 'Peer Mentoring',
      members: [user.username, peer.name],
      roomCode: peer.code
    };
    setActiveRoom(room);
    setShowProgressPanel(false);
    setMessages([
      { id: 'm1', sender: 'System', text: `Direct P2P link established with ${peer.name}. Mutual data sharing enabled.`, timestamp: 'System', isAI: false },
      { id: 'peer-hi', sender: peer.name, text: `Hey ${user.username}! Ready to crush some goals together? I've shared my progress charts with you.`, timestamp: 'Just now', isAI: false }
    ]);
  };

  const handleConnectPeer = () => {
    const code = connectCodeInput.trim().toUpperCase();
    if (!code || code.length < 6) return;
    const peerPrefix = code.substring(0, 3);
    const newPeer = { name: `Student_${peerPrefix}`, code: code, status: 'Online' };
    if (connectedPeers.some(p => p.code === code)) {
      alert("Peer already in your connection list.");
      return;
    }
    setConnectedPeers(prev => [newPeer, ...prev]);
    setConnectCodeInput('');
    setShowConnectModal(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeRoom) return;
    const userMsg: GroupMessage = {
      id: Date.now().toString(),
      sender: user.username,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAI: false
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    const lowerInput = inputText.toLowerCase();
    if (lowerInput.includes('lumina') || lowerInput.includes('moderator') || lowerInput.includes('help')) {
      setIsTyping(true);
      try {
        const context = `Moderating study group: ${activeRoom.name}. Members active: ${activeRoom.members.join(', ')}`;
        const aiResponse = await chatWithAI(inputText, context);
        const aiMsg: GroupMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'Lumina Moderator',
          text: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAI: true
        };
        setMessages(prev => [...prev, aiMsg]);
      } catch (e) { console.error(e); } finally { setIsTyping(false); }
    }
  };

  const peerRecords = activeRoom?.id.startsWith('p2p-') ? getPeerRecords(activeRoom.roomCode) : [];
  const comparisonData = myRecords.length > 0 ? myRecords.map((r, i) => ({
    timestamp: r.timestamp,
    me: r.accuracy,
    peer: peerRecords[i]?.accuracy || 0
  })) : peerRecords.map(r => ({ timestamp: r.timestamp, me: 0, peer: r.accuracy }));

  const myAvg = myRecords.length > 0 ? Math.round(myRecords.reduce((a, b) => a + b.accuracy, 0) / myRecords.length) : 0;
  const peerAvg = peerRecords.length > 0 ? Math.round(peerRecords.reduce((a, b) => a + b.accuracy, 0) / peerRecords.length) : 0;

  const getStatusColor = (status: string) => {
    return STATUS_VARIANTS.find(s => s.label === status)?.color || 'bg-slate-300';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-all duration-500 overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
           <button onClick={onBack} className="text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center hover:translate-x-[-4px] transition-transform">
             <span className="mr-2 text-base">←</span> Dashboard
           </button>
           <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:rotate-12 transition-transform shadow-sm">
             {isDarkMode ? '☀️' : '🌙'}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-black tracking-tight">Study Hub</h2>
            
            {/* Search Bar */}
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                type="text"
                placeholder="Search peers or groups..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl outline-none text-xs font-bold transition-all shadow-inner dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col space-y-2">
               <button onClick={() => setShowInviteModal(true)} className="w-full bg-indigo-600 text-white font-black px-4 py-3.5 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 text-sm">
                 <span>👋</span> <span>Invite Friend</span>
               </button>
               <button onClick={() => setShowConnectModal(true)} className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2 text-sm">
                 <span>🆔</span> <span>Add Peer ID</span>
               </button>
            </div>
            
            <div className="pt-4">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1 mb-4">Study Peers</div>
              <div className="space-y-3">
                {filteredPeers.length > 0 ? filteredPeers.map(peer => (
                  <button key={peer.code} onClick={() => startPeerSession(peer)} className={`w-full group flex items-center space-x-3 p-3.5 rounded-2xl border transition-all ${activeRoom?.roomCode === peer.code ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}>
                    <div className="relative w-11 h-11 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg group-hover:bg-indigo-100 transition-colors">
                      {peer.name[0]}
                      <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white dark:border-slate-900 rounded-full ${getStatusColor(peer.status)}`}></div>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-black flex items-center justify-between">
                        <span className="truncate max-w-[120px]">{peer.name}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(peer.status)}`}></div>
                         <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{peer.status}</div>
                      </div>
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-4 px-2 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No peers found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1 mb-4">Discovery Channels</div>
              <div className="space-y-2">
                {filteredRooms.length > 0 ? filteredRooms.map(room => (
                  <button key={room.id} onClick={() => joinRoom(room)} className={`w-full p-4 rounded-2xl text-left border transition-all ${activeRoom?.id === room.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <div className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1">{room.name}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-black px-2 py-0.5 rounded uppercase">{room.subject}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase">{room.members.length} Active</span>
                    </div>
                  </button>
                )) : (
                  <div className="text-center py-4 px-2 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No channels found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex-1 flex flex-col relative h-screen transition-colors">
        {activeRoom ? (
          <>
            <header className="px-8 py-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shadow-sm">
               <div className="flex items-center space-x-4">
                  <div className="relative w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                    {activeRoom.name[0]}
                    {activeRoom.id.startsWith('p2p-') && (
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white dark:border-slate-900 rounded-full ${getStatusColor(connectedPeers.find(p => p.code === activeRoom.roomCode)?.status || 'Online')}`}></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-black leading-tight">{activeRoom.name}</h3>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">
                       {activeRoom.id.startsWith('p2p-') ? (
                         <>
                           <span className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(connectedPeers.find(p => p.code === activeRoom.roomCode)?.status || 'Online')}`}></span>
                           {connectedPeers.find(p => p.code === activeRoom.roomCode)?.status || 'Active'} • Secured link
                         </>
                       ) : (
                         <>
                           <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                           Active Channel • Room: {activeRoom.roomCode}
                         </>
                       )}
                    </div>
                  </div>
               </div>
               
               <div className="flex items-center space-x-3">
                  {activeRoom.id.startsWith('p2p-') && (
                    <button 
                      onClick={() => setShowProgressPanel(!showProgressPanel)}
                      className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${showProgressPanel ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                    >
                      {showProgressPanel ? '💬 Chat' : '📊 Analysis'}
                    </button>
                  )}
                  <button onClick={() => setShowInviteModal(true)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center font-black text-sm hover:scale-110 transition-transform">+</button>
               </div>
            </header>

            {showProgressPanel ? (
              <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar animate-in fade-in zoom-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20">
                     <div className="flex items-center justify-between mb-8">
                        <div>
                          <h4 className="text-xl font-black tracking-tight">Accuracy Tracking</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Comparison</p>
                        </div>
                        <div className="flex items-center space-x-4">
                           <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                              <span className="text-[10px] font-black text-slate-400 uppercase">You</span>
                           </div>
                           <div className="flex items-center space-x-2">
                              <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                              <span className="text-[10px] font-black text-slate-400 uppercase">Peer</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={comparisonData}>
                           <defs>
                             <linearGradient id="colorMe" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                               <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorPeer" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                               <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1e293b" : "#f1f5f9"} />
                           <XAxis dataKey="timestamp" hide />
                           <YAxis domain={[0, 100]} hide />
                           <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: isDarkMode ? '#1e293b' : '#fff' }} />
                           <Area type="monotone" dataKey="me" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorMe)" />
                           <Area type="monotone" dataKey="peer" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorPeer)" />
                         </AreaChart>
                       </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700"></div>
                     <h4 className="text-xl font-black mb-8 tracking-tight">Average Efficiency</h4>
                     <div className="flex items-end justify-around space-x-4 h-52">
                        <div className="flex flex-col items-center flex-1">
                           <div className="text-4xl font-black mb-4 tracking-tighter">{myAvg}%</div>
                           <div className="w-full bg-white/5 rounded-full h-32 relative overflow-hidden">
                              <div 
                                className="absolute bottom-0 w-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                style={{ height: `${myAvg}%` }}
                              ></div>
                           </div>
                           <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-400">You</div>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                           <div className="text-4xl font-black mb-4 tracking-tighter text-rose-400">{peerAvg}%</div>
                           <div className="w-full bg-white/5 rounded-full h-32 relative overflow-hidden">
                              <div 
                                className="absolute bottom-0 w-full bg-rose-500 rounded-full transition-all duration-1000" 
                                style={{ height: `${peerAvg}%` }}
                              ></div>
                           </div>
                           <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-rose-400">Peer</div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800">
                   <h4 className="text-xl font-black mb-8 tracking-tight">Performance Breakdown</h4>
                   <div className="space-y-4">
                      {[
                        { label: 'Total Quizzes Completed', me: myRecords.length, peer: peerRecords.length },
                        { label: 'Highest Accuracy', me: myRecords.length > 0 ? Math.max(...myRecords.map(r => r.accuracy)) + '%' : '0%', peer: Math.max(...peerRecords.map(r => r.accuracy)) + '%' },
                        { label: 'Current Study Streak', me: '5 Days', peer: '3 Days' },
                        { label: 'Course Progress', me: '45%', peer: '38%' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl group hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-transparent hover:border-indigo-100">
                           <span className="text-sm font-black text-slate-500 dark:text-slate-400">{item.label}</span>
                           <div className="flex items-center space-x-12">
                              <div className="text-right w-20">
                                 <div className="text-lg font-black">{item.me}</div>
                                 <div className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">You</div>
                              </div>
                              <div className="text-right w-20">
                                 <div className="text-lg font-black text-rose-500">{item.peer}</div>
                                 <div className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Peer</div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/40 dark:bg-slate-950/40 custom-scrollbar">
                   {messages.map((m) => (
                     <div key={m.id} className={`flex flex-col ${m.sender === user.username ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center space-x-2 mb-1.5 px-2">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${m.sender === user.username ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>{m.sender}</span>
                           <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold">{m.timestamp}</span>
                        </div>
                        <div className={`max-w-[80%] lg:max-w-[65%] px-6 py-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm transition-all ${m.sender === user.username ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/10' : m.isAI ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-bl-none border-l-4 border-indigo-500 font-medium' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-800'}`}>
                           {m.text}
                        </div>
                     </div>
                   ))}
                   {isTyping && (
                     <div className="flex items-center space-x-3 ml-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px] font-black">LM</div>
                        <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex space-x-1.5 shadow-sm">
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                           <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                     </div>
                   )}
                   <div ref={scrollRef} />
                </div>

                <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                   <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-[2.5rem] border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
                      <button className="p-3.5 bg-white dark:bg-slate-800 rounded-full text-xl shadow-sm text-slate-500 hover:scale-110 active:scale-95 transition-all">📎</button>
                      <input 
                        className="flex-1 bg-transparent px-3 py-3 outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-bold tracking-tight"
                        placeholder={`Collaborating as ${user.username}...`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="p-4 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-90 disabled:opacity-50"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                   </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-950 transition-colors">
             <div className="relative mb-12">
               <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-[4rem] shadow-2xl flex items-center justify-center text-7xl border border-slate-100 dark:border-slate-800 animate-float relative z-10">🪐</div>
               <div className="absolute inset-0 bg-indigo-500/20 blur-[80px] rounded-full scale-150 animate-pulse"></div>
             </div>
             <h2 className="text-5xl font-black mb-6 tracking-tighter text-slate-900 dark:text-white">Collaborative Space</h2>
             <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg leading-relaxed mb-12 font-medium">
               Exchange your <span className="text-indigo-600 dark:text-indigo-400 font-bold">Lumina ID</span> to connect with friends and view mutual progress insights.
             </p>
             <button onClick={() => setShowInviteModal(true)} className="group p-10 bg-indigo-600 rounded-[3rem] text-left text-white shadow-2xl shadow-indigo-500/30 hover:scale-[1.03] transition-all cursor-pointer">
                <div className="text-4xl mb-6">👋</div>
                <div className="font-black text-xl mb-3">Invite Friend</div>
                <p className="text-xs text-indigo-100 font-bold uppercase tracking-widest">Share ID: {myCode}</p>
             </button>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-200/20">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">Invite Peer</h3>
                 <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 transition-all p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-[2.5rem] border-4 border-dashed border-indigo-200 dark:border-indigo-900/50 text-center">
                 <div className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-3">Your Sharing ID</div>
                 <div className="text-5xl font-black tracking-[0.2em] text-indigo-600 dark:text-indigo-400 select-all">{myCode}</div>
              </div>
              <button onClick={() => {navigator.clipboard.writeText(myCode); alert("ID copied!")}} className="w-full mt-8 bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg shadow-2xl hover:bg-indigo-700 transition-all active:scale-95">Copy ID</button>
           </div>
        </div>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-slate-200/20">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100">Add Peer</h3>
                 <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-slate-600 transition-all p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800 px-6 py-6 rounded-3xl border-4 border-transparent focus:border-indigo-500 focus:bg-white outline-none text-3xl font-black tracking-[0.4em] text-center uppercase transition-all shadow-inner mb-8 dark:text-white"
                placeholder="ABC123"
                maxLength={6}
                value={connectCodeInput}
                onChange={(e) => setConnectCodeInput(e.target.value.toUpperCase())}
              />
              <button onClick={handleConnectPeer} disabled={connectCodeInput.length < 6} className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-lg hover:bg-indigo-700 transition-all transform disabled:opacity-50 active:scale-95">Establish Connection</button>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default StudyGroups;
