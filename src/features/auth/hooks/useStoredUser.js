import { useState, useEffect } from 'react';
import { readStoredUser, writeStoredUser } from '../helpers';

export const useStoredUser = () => {
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    writeStoredUser(user);
  }, [user]);

  return [user, setUser];
};
