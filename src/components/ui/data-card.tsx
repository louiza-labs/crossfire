'use client';

import { cn } from 'cn';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface DataCardProps {
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'flat';
  };
  icon?: LucideIcon;
  variant?: 'default' | 'positive' | 'negative' | 'warning';
  className?: string;
  onClick?: () => void;
}

export function DataCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  className,
  onClick,
}: DataCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'data-card',
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      <div className="data-card-header">
        <span className="data-card-label">{label}</span>
        {Icon && (
          <Icon
            className={cn('h-4 w-4', {
              'text-zinc-500': variant === 'default',
              'text-emerald-400': variant === 'positive',
              'text-red-400': variant === 'negative',
              'text-amber-400': variant === 'warning',
            })}
          />
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div
            className={cn('data-card-value', {
              'text-emerald-400': variant === 'positive',
              'text-red-400': variant === 'negative',
              'text-amber-400': variant === 'warning',
            })}
          >
            {value}
          </div>
          {subtitle && <div className="data-card-subtitle">{subtitle}</div>}
        </div>
        {trend && (
          <div
            className={cn('flex items-center gap-1 text-sm font-medium tabular-nums', {
              'text-emerald-400': trend.direction === 'up',
              'text-red-400': trend.direction === 'down',
              'text-zinc-500': trend.direction === 'flat',
            })}
          >
            {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {trend.direction === 'flat' && <Minus className="h-3.5 w-3.5" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Grid container for data cards
interface DataCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

export function DataCardGrid({ children, columns = 4, className }: DataCardGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
          'grid-cols-5': columns === 5,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

// Compact version for inline stats
interface CompactStatProps {
  label: string;
  value: string;
  className?: string;
}

export function CompactStat({ label, value, className }: CompactStatProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
        {label}
      </span>
      <span className="text-sm font-medium tabular-nums text-zinc-200">{value}</span>
    </div>
  );
}

// Horizontal stat row
interface StatRowProps {
  stats: Array<{ label: string; value: string }>;
  className?: string;
}

export function StatRow({ stats, className }: StatRowProps) {
  return (
    <div className={cn('flex items-center gap-6', className)}>
      {stats.map((stat, index) => (
        <CompactStat key={index} label={stat.label} value={stat.value} />
      ))}
    </div>
  );
}
