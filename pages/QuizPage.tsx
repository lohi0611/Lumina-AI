
import React, { useState, useEffect } from 'react';
import { LearningPath, Quiz, QuizQuestion, PerformanceRecord } from '../types';
import { generateQuiz } from '../geminiService';

interface Props {
  path: LearningPath;
  onComplete: (record: PerformanceRecord) => void;
  onCancel: () => void;
  language: string;
}

const QuizPage: React.FC<Props> = ({ path, onComplete, onCancel, language }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [shortAnswerInput, setShortAnswerInput] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const q = await generateQuiz(path, 0, language); // Default to first day for now
        setQuiz(q);
      } catch (error) {
        console.error(error);
        alert('Failed to load quiz.');
        onCancel();
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [path, language]);

  const handleAnswer = (answer: string) => {
    if (!quiz) return;
    const q = quiz.questions[currentQuestionIndex];
    setUserAnswers(prev => ({ ...prev, [q.id]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShortAnswerInput('');
    } else {
      setShowResult(true);
    }
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let score = 0;
    quiz.questions.forEach(q => {
      const userAnswer = userAnswers[q.id]?.toLowerCase().trim();
      const correctAnswer = q.correctAnswer.toLowerCase().trim();
      if (userAnswer === correctAnswer) score++;
    });
    return score;
  };

  const handleDownloadReport = () => {
    if (!quiz) return;
    const score = calculateScore();
    const accuracy = Math.round((score / quiz.questions.length) * 100);

    let content = `QUIZ PERFORMANCE REPORT\n`;
    content += `================================================\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Subject: ${path.goal}\n`;
    content += `Module: Day ${quiz.day} Quiz\n`;
    content += `Score: ${score} / ${quiz.questions.length} (${accuracy}%)\n`;
    content += `================================================\n\n`;

    quiz.questions.forEach((q, i) => {
      const isCorrect = userAnswers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase();
      content += `Question ${i + 1}: ${q.question}\n`;
      content += `Your Answer: ${userAnswers[q.id] || 'N/A'}\n`;
      content += `Correct Answer: ${q.correctAnswer}\n`;
      content += `Status: ${isCorrect ? 'CORRECT' : 'INCORRECT'}\n`;
      content += `Explanation: ${q.explanation}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Quiz_Report_Day_${quiz.day}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full border-t-indigo-600 animate-spin mb-6"></div>
        <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest text-xs">Assembling Mastery Evaluation...</p>
      </div>
    );
  }

  if (showResult && quiz) {
    const score = calculateScore();
    const accuracy = Math.round((score / quiz.questions.length) * 100);
    const xpEarned = 100 + (accuracy * 2);
    
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 md:p-14 text-center border border-slate-100 dark:border-slate-800 transition-all">
          <div className="relative inline-block mb-10">
            <div className="text-8xl animate-bounce">🏆</div>
            <div className="absolute -top-4 -right-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg">+{xpEarned} XP</div>
          </div>
          
          <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Quiz Complete!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Your understanding of Day {quiz.day} is confirmed.</p>
          
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">Final Score</div>
              <div className="text-4xl font-black text-slate-900 dark:text-white">{score}<span className="text-xl opacity-30">/{quiz.questions.length}</span></div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-800">
              <div className="text-[10px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-[0.2em] mb-2">Accuracy</div>
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">{accuracy}<span className="text-xl opacity-50">%</span></div>
            </div>
          </div>

          <div className="space-y-4 text-left max-h-60 overflow-y-auto mb-12 px-4 custom-scrollbar">
            {quiz.questions.map((q, i) => (
              <div key={q.id} className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 transition-all">
                <div className="text-sm font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center">
                   <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] mr-3 font-black">Q{i+1}</span>
                   {q.question}
                </div>
                <div className={`text-xs font-bold uppercase tracking-widest ${userAnswers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase() ? 'text-green-500' : 'text-rose-500'}`}>
                  {userAnswers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase() ? '✓ CORRECT' : `✗ MISSED: ${userAnswers[q.id] || "No Answer"}`}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => onComplete({
                quizId: quiz.id,
                score,
                totalQuestions: quiz.questions.length,
                accuracy,
                timestamp: new Date().toLocaleDateString(),
                xpEarned
              })}
              className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl hover:bg-indigo-700 transition shadow-2xl shadow-indigo-500/20 active:scale-95"
            >
              Collect Rewards
            </button>
            <button 
              onClick={handleDownloadReport}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition active:scale-95"
            >
              📊 Save Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = quiz!.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-indigo-600 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors">
      <div className="max-w-2xl w-full mb-8 flex justify-between items-center text-white/80">
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black">D{quiz?.day}</div>
           <span className="font-black tracking-widest uppercase text-[10px]">Mastery Evaluation</span>
        </div>
        <button onClick={onCancel} className="bg-white/10 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition-all">Abort Quest</button>
      </div>

      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10">
        <div className="h-3 bg-slate-100 dark:bg-slate-800">
          <div 
            className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all duration-700"
            style={{ width: `${((currentQuestionIndex + 1) / quiz!.questions.length) * 100}%` }}
          />
        </div>

        <div className="p-10 md:p-16">
          <div className="flex items-center justify-between mb-8">
             <div className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">Objective {currentQuestionIndex + 1} of {quiz!.questions.length}</div>
             <div className="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest">Type: {q.type}</div>
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-12 tracking-tight leading-tight">{q.question}</h2>

          <div className="space-y-4">
            {q.type === 'MCQ' && q.options?.map((opt, i) => (
              <button 
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`w-full text-left px-8 py-5 rounded-2xl border-2 transition-all font-bold group flex items-center ${userAnswers[q.id] === opt ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-xs font-black transition-all ${userAnswers[q.id] === opt ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                   {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            ))}

            {q.type === 'TF' && (
              <div className="grid grid-cols-2 gap-6">
                {['True', 'False'].map((opt) => (
                  <button 
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className={`px-6 py-12 rounded-[2rem] border-2 text-2xl font-black transition-all ${userAnswers[q.id] === opt ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-600 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {q.type === 'SHORT' && (
              <div className="relative group">
                <input 
                  autoFocus
                  className="w-full px-8 py-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all dark:text-white font-black text-lg shadow-inner"
                  placeholder="Finalize your answer..."
                  value={shortAnswerInput}
                  onChange={(e) => {
                    setShortAnswerInput(e.target.value);
                    handleAnswer(e.target.value);
                  }}
                />
              </div>
            )}
          </div>

          <div className="mt-16 flex justify-end">
            <button 
              onClick={nextQuestion}
              disabled={!userAnswers[q.id]}
              className="bg-indigo-600 text-white px-14 py-5 rounded-3xl font-black text-xl hover:bg-indigo-700 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/30 disabled:opacity-50 active:scale-95"
            >
              {currentQuestionIndex === quiz!.questions.length - 1 ? 'Unlock Rewards' : 'Continue Journey'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default QuizPage;
