interface Props {
  value: number;
  max: number;
  color?: string;
  label?: string;
  emoji?: string;
  showValue?: boolean;
}

export function ProgressBar({ value, max, color = '#765fde', label, emoji, showValue }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-body-sm font-bold text-text flex items-center gap-1">
            {emoji && <span>{emoji}</span>}
            {label}
          </span>
          {showValue && (
            <span className="text-caption font-bold" style={{ color }}>{Math.round(pct)}%</span>
          )}
        </div>
      )}
      <div className="need-bar">
        <div
          className="need-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
