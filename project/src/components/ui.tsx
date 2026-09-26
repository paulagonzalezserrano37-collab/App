import { type LucideIcon } from 'lucide-react';

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  children,
}: {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(22,163,74,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#mf-gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
        <defs>
          <linearGradient id="mf-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: 'pending' | 'loaded' | 'delivered' }) {
  const colors = {
    pending: 'bg-stone-300',
    loaded: 'bg-amber-400',
    delivered: 'bg-green-500',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[status]} ring-2 ring-white/60`} />
  );
}

export function IconCircle({
  icon: Icon,
  size = 'md',
  color = 'green',
}: {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  color?: 'green' | 'orange' | 'blue' | 'amber' | 'red' | 'stone';
}) {
  const sizes = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-2xl',
  };
  const iconSizes = { sm: 18, md: 24, lg: 32 };
  const colors = {
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    stone: 'bg-stone-100 text-stone-600',
  };
  return (
    <div className={`${sizes[size]} ${colors[color]} flex items-center justify-center shrink-0`}>
      <Icon size={iconSizes[size]} />
    </div>
  );
}

export function PillButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition active:scale-95 ${
        active
          ? 'bg-green-600 text-white shadow-md shadow-green-600/20'
          : 'bg-white/70 text-stone-500 border border-white/60'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
