import React from 'react';

export interface TokenInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  symbol: string;
  usdValue?: string;
  balance?: string;
  onMaxClick?: () => void;
  onChange?: (value: string) => void;
}

export const TokenInput: React.FC<TokenInputProps> = ({
  symbol,
  usdValue,
  balance,
  value,
  onMaxClick,
  onChange,
  disabled,
  className = '',
  placeholder = '0.0',
}) => {
  return (
    <div className={`p-4 bg-slate-950/70 border border-slate-800 rounded-2xl focus-within:border-cyan-500/60 transition-colors ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-medium">Amount</span>
        {balance !== undefined && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Balance: <span className="text-slate-200 font-semibold">{balance}</span></span>
            {onMaxClick && (
              <button
                type="button"
                onClick={onMaxClick}
                disabled={disabled}
                className="px-1.5 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded uppercase transition-colors"
              >
                MAX
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          inputMode="decimal"
          pattern="^[0-9]*[.,]?[0-9]*$"
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-transparent text-2xl font-bold text-white placeholder-slate-600 focus:outline-none disabled:opacity-50"
        />

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl select-none shrink-0">
          <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-400">
            {symbol.charAt(0)}
          </div>
          <span className="text-sm font-bold text-white">{symbol}</span>
        </div>
      </div>

      {usdValue && (
        <div className="mt-2 text-xs text-slate-500">
          ≈ ${usdValue} USD
        </div>
      )}
    </div>
  );
};
