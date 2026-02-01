import { User, LearningPath, PerformanceRecord } from '../types';

/**
 * Local Storage Mock for Users
 */
export const logToAudit = async (username: string, email: string, action: 'SIGNUP' | 'LOGIN' | 'SIGNUP_VIA_GOOGLE' | 'LOGIN_SIMULATION') => {
  console.log(`[AUDIT] User: ${username} (${email}), Action: ${action}, Time: ${new Date().toISOString()}`);
};

export const saveUserToDb = async (userId: string, data: User) => {
  const usersJson = localStorage.getItem('lumina_users') || '[]';
  const users = JSON.parse(usersJson);
  const index = users.findIndex((u: User) => u.id === userId);
  
  if (index !== -1) {
    users[index] = { ...users[index], ...data };
  } else {
    users.push(data);
  }
  
  localStorage.setItem('lumina_users', JSON.stringify(users));
};

export const getUserFromDb = async (userId: string): Promise<User | null> => {
  const usersJson = localStorage.getItem('lumina_users') || '[]';
  const users = JSON.parse(usersJson);
  return users.find((u: User) => u.id === userId) || null;
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  const usersJson = localStorage.getItem('lumina_users') || '[]';
  const users = JSON.parse(usersJson);
  return users.find((u: User) => u.email === email) || null;
};

export const saveLearningPath = async (userId: string, path: LearningPath) => {
  const key = `lumina_paths_${userId}`;
  const pathsJson = localStorage.getItem(key) || '[]';
  const paths = JSON.parse(pathsJson);
  paths.push(path);
  localStorage.setItem(key, JSON.stringify(paths));
};

export const getLearningPaths = async (userId: string): Promise<LearningPath[]> => {
  const key = `lumina_paths_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};

export const saveQuizRecord = async (userId: string, record: PerformanceRecord) => {
  const key = `lumina_records_${userId}`;
  const recordsJson = localStorage.getItem(key) || '[]';
  const records = JSON.parse(recordsJson);
  records.push(record);
  localStorage.setItem(key, JSON.stringify(records));
};

export const getQuizRecords = async (userId: string): Promise<PerformanceRecord[]> => {
  const key = `lumina_records_${userId}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
};