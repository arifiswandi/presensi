import React from 'react';
import DashboardStatCard from './components/DashboardStatCard';
import DashboardFeatureCard from './components/DashboardFeatureCard';
import './Dashboard.css';

const features = [
  {
    to: '/presensi',
    title: 'Presensi',
    description: 'Kelola data kehadiran dan monitor status siswa secara cepat.',
    accent: '#2563eb',
    badge: 'Attendance',
  },
  {
    to: '/anekdot',
    title: 'Anekdot',
    description: 'Catat kejadian siswa, penanganan, dan rekam data perilaku secara lengkap.',
    accent: '#7c3aed',
    badge: 'Behavior',
  },
];

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <header className="dashboard-topbar">
          <div className="dashboard-brand">
            <div className="dashboard-logo">BK</div>
            <div className="dashboard-brand-copy">
              <p className="dashboard-kicker">Admin panel</p>
              <h1 className="dashboard-title">Dashboard BK</h1>
            </div>
          </div>

          <div className="dashboard-actions">
            <span className="dashboard-user">
              {user?.username || 'Admin'} · {user?.role || 'User'}
            </span>
            <button type="button" className="dashboard-logout" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="dashboard-stats" aria-label="Ringkasan dashboard">
          <DashboardStatCard label="Akses" value="2" subtitle="Fitur utama" />
          <DashboardStatCard label="Status" value="Aktif" subtitle="Sistem berjalan normal" />
          <DashboardStatCard label="Role" value={user?.role || 'User'} subtitle="Hak akses saat ini" />
        </section>

        <section className="dashboard-section-header">
          <h2>Navigasi fitur</h2>
        </section>

        <section className="dashboard-feature-grid">
          {features.map((feature) => (
            <DashboardFeatureCard key={feature.to} feature={feature} />
          ))}
        </section>
      </div>
    </div>
  );
}
