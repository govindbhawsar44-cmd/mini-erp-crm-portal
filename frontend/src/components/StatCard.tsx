import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, onClick }) => {
  return (
    <div
      className={`card ${onClick ? 'card-clickable' : ''}`}
      onClick={onClick}
      style={{ display: 'flex', gap: '1.15rem', alignItems: 'center' }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '10px',
          background: 'rgba(2, 132, 199, 0.12)',
          color: '#38bdf8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 600 }}>
          {title}
        </p>
        <p style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0.1rem 0' }}>{value}</p>
        {subtitle && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.725rem' }}>{subtitle}</p>
        )}
      </div>
    </div>
  );
};
