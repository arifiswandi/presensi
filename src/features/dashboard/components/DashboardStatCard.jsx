import React from 'react';

export default function DashboardStatCard({ label, value, subtitle }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '18px',
        padding: '20px 22px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
      }}
    >
      <p
        style={{
          margin: 0,
          color: '#64748b',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
        }}
      >
        {label}
      </p>
      <h3 style={{ margin: '8px 0 0', fontSize: '1.75rem' }}>{value}</h3>
      <p style={{ margin: '6px 0 0', color: '#475569' }}>{subtitle}</p>
    </div>
  );
}
