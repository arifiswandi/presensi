import React from 'react';
import { PresensiDashboard } from '../features/presensi';

export default function PresensiPage({ user, onLogout }) {
  return <PresensiDashboard user={user} onLogout={onLogout} />;
}
