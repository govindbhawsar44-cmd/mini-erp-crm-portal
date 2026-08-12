import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Mini ERP + CRM Operations Portal</h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Logged in as: <strong>{user.email}</strong>
            </span>
            <Badge type={user.role} />
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Logout"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
