import React from 'react';
import { AnekdotsDashboard } from '../features/anekdots';

export default function AnekdotPage({ user, onLogout, postToGas }) {
  return <AnekdotsDashboard user={user} onLogout={onLogout} postToGas={postToGas} />;
}
