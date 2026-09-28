import React from 'react';

export default function ExportButton({
  label,
  onClick,
  variant = 'default',
  loading = false,
  disabled = false,
}) {
  const resolvedLabel = typeof label === 'string' ? { text: label } : label;
  const className = `export-button export-button--${
    variant === 'excel'
      ? 'excel'
      : variant === 'pdf'
        ? 'pdf'
        : variant === 'import'
          ? 'import'
          : 'default'
  }`;

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : 'false'}
    >
      <span className="export-button__content">
        <span className={`export-button__icon ${loading ? 'export-button__icon--loading' : ''}`} aria-hidden="true">
          {loading ? '⏳' : resolvedLabel.icon || '•'}
        </span>
        <span>{loading ? resolvedLabel.loadingText || 'Memproses...' : resolvedLabel.text}</span>
      </span>
    </button>
  );
}
