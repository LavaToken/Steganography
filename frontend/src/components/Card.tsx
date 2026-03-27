import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export default function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
