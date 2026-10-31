'use client';

import { cn } from 'cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricProps {
  label: string;
  value: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'flat';
  };
  variant?: 'default' | 'warning' | 'danger';
  className?: string;
}

function Metric({ label, value, trend, variant = 'default', className }: MetricProps) {
  return (
    <div className={cn('metric-item', className)}>
      <span className="metric-label">{label}</span>
      <div className="flex items-baseline gap-2">
        <span
          className={cn('metric-value', {
            'text-amber-400': variant === 'warning',
            'text-red-400': variant === 'danger',
          })}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn('metric-trend flex items-center gap-0.5', {
              up: trend.direction === 'up',
              down: trend.direction === 'down',
              flat: trend.direction === 'flat',
            })}
          >
            {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
            {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
            {trend.direction === 'flat' && <Minus className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}

interface MetricStripProps {
  metrics: MetricProps[];
  className?: string;
}

export function MetricStrip({ metrics, className }: MetricStripProps) {
  return (
    <div className={cn('metric-strip', className)}>
      {metrics.map((metric, index) => (
        <Metric key={index} {...metric} />
      ))}
    </div>
  );
}

interface MetricDividerProps {
  className?: string;
}

export function MetricDivider({ className }: MetricDividerProps) {
  return <div className={cn('h-8 w-px bg-zinc-800', className)} />;
}

// Convenience wrapper for common portfolio metrics
interface PortfolioMetricStripProps {
  totalExposure: number;
  fundCount: number;
  borrowerCount: number;
  avgRate: number;
  atRiskAmount?: number;
  className?: string;
}

export function PortfolioMetricStrip({
  totalExposure,
  fundCount,
  borrowerCount,
  avgRate,
  atRiskAmount,
  className,
}: PortfolioMetricStripProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return `$${value.toFixed(0)}`;
  };

  const metrics: MetricProps[] = [
    {
      label: 'Total Exposure',
      value: formatCurrency(totalExposure),
    },
    {
      label: 'Funds',
      value: fundCount.toString(),
    },
    {
      label: 'Borrowers',
      value: borrowerCount.toLocaleString(),
    },
    {
      label: 'Avg Rate',
      value: `${avgRate.toFixed(1)}%`,
    },
  ];

  if (atRiskAmount !== undefined && atRiskAmount > 0) {
    metrics.push({
      label: 'At Risk',
      value: formatCurrency(atRiskAmount),
      variant: 'warning',
    });
  }

  return <MetricStrip metrics={metrics} className={className} />;
}

export { Metric };
