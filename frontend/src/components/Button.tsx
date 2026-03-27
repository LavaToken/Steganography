import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variants = {
  primary:
    'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed',
  secondary:
    'bg-[var(--surface-muted)] text-[var(--text)] hover:bg-[var(--border)] border border-[var(--border)] disabled:opacity-40 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-[var(--radius)] transition-colors duration-[var(--transition)] select-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" />
          {children}
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
}
