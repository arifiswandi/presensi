import { SESSION_KEY } from '../constants/storage';

export const readStoredUser = () => {
  try {
    const storedUser = sessionStorage.getItem(SESSION_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
};

export const writeStoredUser = (user) => {
  if (user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return;
  }

  sessionStorage.removeItem(SESSION_KEY);
};

export const clearStoredUser = () => {
  sessionStorage.removeItem(SESSION_KEY);
};
