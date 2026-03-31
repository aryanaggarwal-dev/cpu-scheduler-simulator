import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { removeNotification } from '../../hooks/uiSlice';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: 'var(--green)',
  error: 'var(--red)',
  info: 'var(--accent)',
  warning: 'var(--amber)',
};

function Toast({ id, type = 'info', message }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeNotification(id)), 3500);
    return () => clearTimeout(t);
  }, [id, dispatch]);

  const color = COLORS[type] || COLORS.info;

  return (
    <div style={{
      background: 'var(--bg-3)',
      border: `1px solid ${color}44`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius)',
      padding: '12px 16px',
      fontSize: '13px',
      color: 'var(--text-0)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.2s ease',
      minWidth: '260px',
      maxWidth: '360px',
    }}>
      <span style={{ color, fontSize: '15px', fontWeight: 700, flexShrink: 0 }}>{ICONS[type]}</span>
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button
        onClick={() => dispatch(removeNotification(id))}
        style={{ color: 'var(--text-2)', padding: '0 0 0 8px', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
      >✕</button>
    </div>
  );
}

export default function Notifications() {
  const notifications = useSelector(s => s.ui.notifications);

  if (!notifications.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999,
    }}>
      {notifications.map(n => (
        <Toast key={n.id} {...n} />
      ))}
    </div>
  );
}
