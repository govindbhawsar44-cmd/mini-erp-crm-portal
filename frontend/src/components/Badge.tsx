import React from 'react';

interface BadgeProps {
  type: string;
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label }) => {
  const getBadgeClass = (val: string) => {
    switch (val.toUpperCase()) {
      case 'LEAD':
        return 'badge-lead';
      case 'ACTIVE':
        return 'badge-active';
      case 'INACTIVE':
        return 'badge-inactive';
      case 'DRAFT':
        return 'badge-draft';
      case 'CONFIRMED':
        return 'badge-confirmed';
      case 'CANCELLED':
        return 'badge-cancelled';
      case 'ADMIN':
      case 'SALES':
      case 'WAREHOUSE':
      case 'ACCOUNTS':
        return 'badge-role';
      default:
        return 'badge-secondary';
    }
  };

  return <span className={`badge ${getBadgeClass(type)}`}>{label || type}</span>;
};
