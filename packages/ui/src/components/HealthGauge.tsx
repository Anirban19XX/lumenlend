import React from 'react';
import { Badge } from './Badge.js';

type HealthFactorStatus = 'safe' | 'warning' | 'danger' | 'liquidatable' | 'infinite';

export interface HealthGaugeProps {
  healthFactor: number; // e.g. 1.85, or Infinity
  healthFactorStatus?: HealthFactorStatus;
  className?: string;
}

export const HealthGauge: React.FC<HealthGaugeProps> = ({
  healthFactor,
  healthFactorStatus,
  className = '',
}) => {
  const isInfinite = !isFinite(healthFactor) || healthFactor >= 99;

  let status: HealthFactorStatus = healthFactorStatus || (isInfinite ? 'infinite' : 'safe');
  let color = 'from-emerald-500 to-teal-400';
  let percentage = 100;

  if (!healthFactorStatus && !isInfinite) {
    if (healthFactor < 1.0) {
      status = 'liquidatable';
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

  if (status === 'liquidatable') {
    color = 'from-rose-700 to-red-500';
    percentage = Math.min(100, Math.max(5, healthFactor * 50));
  } else if (status === 'danger') {
    color = 'from-orange-500 to-amber-400';
    percentage = Math.min(100, Math.max(50, healthFactor * 50));
  } else if (status === 'warning') {
    color = 'from-amber-500 to-yellow-300';
    percentage = Math.min(100, Math.max(60, 50 + (healthFactor - 1) * 50));
  } else if (status === 'safe' || status === 'infinite') {
    color = 'from-emerald-500 to-teal-400';
    percentage = status === 'infinite' ? 100 : Math.min(100, Math.max(75, 75 + (healthFactor - 1.5) * 10));
  }

  const statusLabel = {
    safe: 'Safe',
    warning: 'Warning',
    danger: 'Danger',
    liquidatable: 'Liquidatable',
    infinite: 'No debt',
  }[status];
  const numericLabel = isInfinite || status === 'infinite' ? '∞' : healthFactor.toFixed(2);
  const badgeVariant = status === 'safe' || status === 'infinite' ? 'safe' : status === 'warning' ? 'warning' : 'danger';

  return (
    <div className={`p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-400">Position Health</span>
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
      </div>

      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight text-white">{numericLabel}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Health factor</span>
      </div>

      <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5" aria-label={`${statusLabel}: health factor ${numericLabel}`}>
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
        <span className={status === 'liquidatable' ? 'text-rose-400' : undefined}>Liquidation: &lt; 1.0</span>
        <span className={status === 'safe' || status === 'infinite' ? 'text-emerald-400' : undefined}>Target: &gt; 1.5</span>
      </div>
    </div>
  );
};
