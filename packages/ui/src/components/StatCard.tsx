import React from 'react';
import { Card } from './Card.js';

export interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  change,
  isPositive,
  icon,
}) => {
  return (
    <Card variant="glass" padding="md" className="relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {icon && <div className="text-slate-400 group-hover:text-cyan-400 transition-colors">{icon}</div>}
      </div>

      <div className="mt-3">
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        {subValue && <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>}
      </div>

      {change && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '↑' : '↓'} {change}
          </span>
          <span className="text-slate-500">vs last week</span>
        </div>
      )}
    </Card>
  );
};
