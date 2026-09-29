import React from 'react';
import { Link } from 'react-router-dom';

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

export default function DashboardPage({ user, onLogout }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '32px 20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0f172a',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      <div style={{
        maxWidth: '1280px',
        width: 'min(1280px, calc(100vw - 64px))',
        margin: '0 auto',
      }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '28px',
          padding: '22px 28px',
          background: 'rgba(15, 23, 42, 0.96)',
          borderRadius: '20px',
          boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
          color: '#f8fafc',
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#cbd5e1' }}>
              Admin panel
            </p>
            <h1 style={{ margin: '10px 0 0', fontSize: '2rem', fontWeight: 700 }}>Dashboard BK</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>
              {user?.username || 'Admin'} · {user?.role || 'User'}
            </span>
            <button
              type="button"
              onClick={onLogout}
              style={{
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: '10px',
                background: 'transparent',
                color: '#f8fafc',
                padding: '10px 16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
          marginBottom: '28px',
        }}>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Akses</p>
            <h3 style={{ margin: '8px 0 0', fontSize: '1.75rem' }}>2</h3>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>Fitur utama</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status</p>
            <h3 style={{ margin: '8px 0 0', fontSize: '1.75rem' }}>Aktif</h3>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>Sistem berjalan normal</p>
          </div>
          <div style={{ background: '#ffffff', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Role</p>
            <h3 style={{ margin: '8px 0 0', fontSize: '1.75rem' }}>{user?.role || 'User'}</h3>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>Hak akses saat ini</p>
          </div>
        </section>

        <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Navigasi fitur</h2>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {features.map((feature) => (
            <Link
              key={feature.to}
              to={feature.to}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                display: 'block',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    background: `${feature.accent}1a`,
                    color: feature.accent,
                    fontWeight: 800,
                    fontSize: '1.2rem',
                  }}
                >
                  {feature.title.charAt(0)}
                </div>
                <span style={{
                  background: '#eef2ff',
                  color: '#3730a3',
                  borderRadius: '999px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}>
                  {feature.badge}
                </span>
              </div>

              <h3 style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>{feature.title}</h3>
              <p style={{ margin: 0, lineHeight: 1.6, color: '#475569' }}>{feature.description}</p>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
