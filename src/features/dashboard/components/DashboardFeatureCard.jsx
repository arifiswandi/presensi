import React from 'react';
import { Link } from 'react-router-dom';

export default function DashboardFeatureCard({ feature }) {
  return (
    <Link
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
        <span
          style={{
            background: '#eef2ff',
            color: '#3730a3',
            borderRadius: '999px',
            padding: '6px 10px',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {feature.badge}
        </span>
      </div>

      <h3 style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>{feature.title}</h3>
      <p style={{ margin: 0, lineHeight: 1.6, color: '#475569' }}>{feature.description}</p>
    </Link>
  );
}
