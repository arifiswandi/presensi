import { useState, useEffect } from 'react';
import { SESSION_KEY } from '../constants/storage';

export const useStoredUser = () => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem(SESSION_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  return [user, setUser];
};
