import React from 'react';

export default function StatCard({ label, value, meta }) {
  return (
    <div className="stat-card">
      <span className="stat-card__label">{label}</span>
      <p className="stat-card__value">{value}</p>
      <span className="stat-card__meta">{meta}</span>
    </div>
  );
}
