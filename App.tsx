
import React, { useState, useEffect } from 'react';
import { User, LearningPath, PerformanceRecord, Achievement, INITIAL_ACHIEVEMENTS } from './types';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import QuizPage from './pages/QuizPage';
import PathDetail from './pages/PathDetail';
import StudyGroups from './pages/StudyGroups';
import AboutPage from './pages/AboutPage';
import Presentation from './pages/Presentation';
import { getUserFromDb, getLearningPaths, getQuizRecords, saveUserToDb, saveLearningPath, saveQuizRecord } from './utils/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<string>(() => {
    return localStorage.getItem('lumina_preferred_lang') || 'English';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('lumina_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lumina_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lumina_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('lumina_preferred_lang', language);
  }, [language]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Local Session Check
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      const activeUserId = localStorage.getItem('lumina_active_user_id');
      if (activeUserId) {
        const userData = await getUserFromDb(activeUserId);
        if (userData) {
          await loadUserEnvironment(userData as User);
        } else {
          setCurrentPage('landing');
        }
      } else {
        setCurrentPage('landing');
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const unlockAchievement = (u: User, id: string) => {
    const achIndex = u.achievements.findIndex(a => a.id === id);
    if (achIndex !== -1 && !u.achievements[achIndex].unlockedAt) {
      u.achievements[achIndex].unlockedAt = new Date().toISOString();
      u.xp += 100;
      u.level = Math.floor(u.xp / 500) + 1;
    }
  };

  const loadUserEnvironment = async (u: User) => {
    const paths = await getLearningPaths(u.id);
    setLearningPaths(paths);
    
    const records = await getQuizRecords(u.id);
    setPerformanceRecords(records);

    const today = new Date().toLocaleDateString();
    let updatedUser = { ...u };
    
    if (u.lastActiveDate !== today) {
      updatedUser.xp = (updatedUser.xp || 0) + 10;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (u.lastActiveDate === yesterday.toLocaleDateString()) {
        updatedUser.streak = (updatedUser.streak || 0) + 1;
      } else {
        updatedUser.streak = 1;
      }
      
      updatedUser.lastActiveDate = today;
      updatedUser.level = Math.floor(updatedUser.xp / 500) + 1;
      
      if (updatedUser.streak >= 3) {
        unlockAchievement(updatedUser, 'streaker');
      }
      await saveUserToDb(updatedUser.id, updatedUser);
    }

    setUser(updatedUser);
    if (updatedUser.preferredLanguage) setLanguage(updatedUser.preferredLanguage);

    if (paths.length > 0) {
      const lastPath = paths[paths.length - 1];
      setActivePathId(lastPath.id);
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('onboarding');
    }
  };

  const handleLogin = async (loggedUser: User) => {
    localStorage.setItem('lumina_active_user_id', loggedUser.id);
    await loadUserEnvironment(loggedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('lumina_active_user_id');
    setUser(null);
    setLearningPaths([]);
    setPerformanceRecords([]);
    setActivePathId(null);
    setCurrentPage('landing');
  };

  const handleOnboardingComplete = async (path: LearningPath) => {
    if (!user) return;
    await saveLearningPath(user.id, path);
    setLearningPaths(prev => [...prev, path]);
    
    let updatedUser = { ...user, hasOnboarded: true };
    unlockAchievement(updatedUser, 'first_path');
    
    setUser(updatedUser);
    await saveUserToDb(user.id, updatedUser);
    
    setActivePathId(path.id);
    setCurrentPage('dashboard');
  };

  const addPerformanceRecord = async (record: PerformanceRecord) => {
    if (!user) return;
    const xpEarned = 100 + (record.accuracy * 2); 
    const updatedRecord = { ...record, xpEarned };
    
    await saveQuizRecord(user.id, updatedRecord);
    setPerformanceRecords(prev => [...prev, updatedRecord]);
    
    const updatedUser = { ...user };
    updatedUser.xp += xpEarned;
    updatedUser.level = Math.floor(updatedUser.xp / 500) + 1;
    
    if (record.accuracy === 100) unlockAchievement(updatedUser, 'mastery');
    if (updatedUser.level >= 5) unlockAchievement(updatedUser, 'level_5');

    setUser(updatedUser);
    await saveUserToDb(user.id, updatedUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activePath = learningPaths.find(p => p.id === activePathId) || (learningPaths.length > 0 ? learningPaths[learningPaths.length - 1] : null);

  const renderPage = () => {
    const commonProps = { isDarkMode, toggleTheme };

    switch (currentPage) {
      case 'presentation': return <Presentation onExit={() => setCurrentPage('landing')} />;
      case 'landing': return <LandingPage onNavigate={setCurrentPage} {...commonProps} />;
      case 'about': return <AboutPage onBack={() => setCurrentPage('landing')} {...commonProps} />;
      case 'login': return <LoginPage onLogin={handleLogin} onNavigate={setCurrentPage} {...commonProps} />;
      case 'signup': return <SignupPage onSignup={handleLogin} onNavigate={setCurrentPage} {...commonProps} />;
      case 'onboarding': return (
        <Onboarding 
          user={user!} 
          onComplete={handleOnboardingComplete} 
          onCancel={learningPaths.length > 0 ? () => setCurrentPage('dashboard') : undefined}
          language={language} 
          {...commonProps} 
        />
      );
      case 'dashboard': return (
        <Dashboard 
          user={user!} 
          paths={learningPaths} 
          records={performanceRecords} 
          onNavigate={setCurrentPage} 
          onLogout={handleLogout}
          language={language}
          setLanguage={setLanguage}
          onSelectPath={(id) => setActivePathId(id)}
          activePathId={activePathId}
          {...commonProps}
        />
      );
      case 'path-detail': return (
        <PathDetail 
          path={activePath!} 
          onBack={() => setCurrentPage('dashboard')} 
          onStartQuiz={() => setCurrentPage('quiz')}
          language={language}
          {...commonProps}
        />
      );
      case 'study-groups': return (
        <StudyGroups 
          user={user!} 
          onBack={() => setCurrentPage('dashboard')} 
          {...commonProps} 
        />
      );
      case 'quiz': return (
        <QuizPage 
          path={activePath!} 
          onComplete={(record) => {
            addPerformanceRecord(record);
            setCurrentPage('dashboard');
          }}
          onCancel={() => setCurrentPage('dashboard')}
          language={language}
          {...commonProps}
        />
      );
      default: return <LandingPage onNavigate={setCurrentPage} {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {renderPage()}
    </div>
  );
};

export default App;
