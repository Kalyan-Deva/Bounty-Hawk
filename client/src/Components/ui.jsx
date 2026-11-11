import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }) {
  return <button type={type} className={`b-btn b-btn-${variant} b-btn-${size} ${className}`} {...props} />;
}

export function IconButton({ label, className = '', ...props }) {
  return <button type="button" className={`b-icon-btn ${className}`} aria-label={label} title={label} {...props} />;
}

export function Badge({ tone = 'neutral', dot = false, children }) {
  return <span className={`b-badge b-badge-${tone}`}>{dot && <i />}{children}</span>;
}

export const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
export function Severity({ value }) {
  const v = String(value || 'info').toLowerCase();
  return <span className={`b-sev b-sev-${SEVERITIES.includes(v) ? v : 'info'}`}>{v}</span>;
}

export function Card({ title, subtitle, action, flush = false, className = '', children }) {
  return (
    <section className={`b-card ${flush ? 'b-card-flush' : ''} ${className}`}>
      {(title || action) && (
        <header className="b-card-head">
          <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
          {action && <div className="b-card-action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="b-page-head">
      <div><h1>{title}</h1>{description && <p>{description}</p>}</div>
      {actions && <div className="b-page-actions">{actions}</div>}
    </div>
  );
}

export function Empty({ icon, title, children, action }) {
  return (
    <div className="b-empty">
      {icon && <div className="b-empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, description, footer, width = 520, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="b-layer" onMouseDown={onClose}>
      <div className="b-modal" style={{ maxWidth: width }} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <header className="b-modal-head">
          <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
          <IconButton label="Close" onClick={onClose}><X size={18} /></IconButton>
        </header>
        <div className="b-modal-body">{children}</div>
        {footer && <footer className="b-modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Segmented({ value, options, onChange }) {
  return (
    <div className="b-seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}{o.count !== undefined && <span>{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, hint, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} className={`b-stat ${onClick ? 'b-stat-link' : ''}`} onClick={onClick}>
      <span className="b-stat-label">{label}</span>
      <strong className="b-stat-value">{value}</strong>
      {hint && <span className="b-stat-hint">{hint}</span>}
    </Tag>
  );
}
