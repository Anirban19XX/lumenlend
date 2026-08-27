import React from 'react';
import { Badge } from './Badge.js';

export interface HealthGaugeProps {
  healthFactor: number; // e.g. 1.85, or Infinity
  className?: string;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  healthFactor,
  className = '',
}) => {
  const isInfinite = !isFinite(healthFactor) || healthFactor >= 99;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  let color = 'from-emerald-500 to-teal-400';
  let percentage = 100;

  if (!isInfinite) {
    if (healthFactor < 1.0) {
      status = 'danger';
      color = 'from-rose-600 to-red-500';
      percentage = Math.min(100, Math.max(5, healthFactor * 50));
    } else if (healthFactor < 1.5) {
      status = 'warning';
      color = 'from-amber-500 to-yellow-400';
      percentage = Math.min(100, 50 + (healthFactor - 1.0) * 50);
    } else {
      status = 'safe';
      color = 'from-emerald-500 to-teal-400';
      percentage = Math.min(100, 75 + Math.min(25, (healthFactor - 1.5) * 10));
    }
  }

  return (
    <div className={`p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400">Position Health</span>
        <Badge variant={status}>
          {isInfinite ? '∞ Safe' : healthFactor < 1.0 ? 'Liquidatable' : `${healthFactor.toFixed(2)} HF`}
        </Badge>
      </div>

      <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
        <span>Liquidation: &lt; 1.0</span>
        <span>Target: &gt; 1.5</span>
      </div>
    </div>
  );
};
