import React from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnekdotPage from './pages/AnekdotPage';
import { PresensiDashboard } from './features/presensi';
import { postToGas } from './services/gasAnekdotService';
import { useStoredUser } from './hooks/useStoredUser';

export default function App() {
  const [user, setUser] = useStoredUser();

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={setUser} postToGas={postToGas} />}
        />
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/presensi"
          element={user ? <PresensiDashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/anekdot"
          element={user ? <AnekdotPage user={user} onLogout={() => setUser(null)} postToGas={postToGas} /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </HashRouter>
  );
}
