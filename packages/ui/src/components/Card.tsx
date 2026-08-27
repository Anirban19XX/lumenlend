import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'solid' | 'neon' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200';

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }[padding];

  const variantStyles = {
    glass: 'bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-xl shadow-black/40',
    solid: 'bg-slate-900 border border-slate-800 shadow-lg',
    neon: 'bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/10',
    glow: 'bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-2xl',
  }[variant];

  return (
    <div className={`${baseStyles} ${paddingStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
