/**
 * Design Tokens for Professional Financial Platform
 * Following Bloomberg/TradingView patterns
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

export const colors = {
  // Directional colors (reserved semantics)
  positive: '#10b981', // Green - ONLY for gains/up
  negative: '#ef4444', // Red - ONLY for losses/down
  neutral: '#71717a', // Gray - flat/no change

  // Accent colors (non-directional)
  cyan: '#00d4ff', // Primary accent, funds
  purple: '#a855f7', // Secondary accent
  amber: '#f59e0b', // Warnings, attention
  blue: '#3b82f6', // Info, links

  // Surface hierarchy
  bg0: '#000000', // Deepest background
  bg1: '#09090b', // Card background
  bg2: '#18181b', // Elevated surfaces
  bg3: '#27272a', // Hover states

  // Border colors
  border: '#27272a',
  borderSubtle: '#1f1f23',
  borderHover: '#3f3f46',

  // Text hierarchy
  textPrimary: '#fafafa',
  textSecondary: '#a1a1aa',
  textTertiary: '#71717a',
  textMuted: '#52525b',

  // Risk levels
  riskLow: '#10b981',
  riskMedium: '#f59e0b',
  riskHigh: '#ef4444',
  riskCritical: '#dc2626',
} as const;

// Chart color palette (for series, non-directional)
export const chartColors: string[] = [
  '#00d4ff', // Cyan
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#06b6d4', // Cyan dark
  '#84cc16', // Lime
];

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  // Data display (tabular numerals)
  dataXl: 'text-2xl font-semibold tabular-nums tracking-tight',
  dataLg: 'text-lg font-medium tabular-nums',
  dataMd: 'text-sm font-medium tabular-nums',
  dataSm: 'text-xs font-medium tabular-nums',

  // Labels
  label: 'text-[10px] uppercase tracking-wider text-zinc-500 font-medium',
  labelSm: 'text-[9px] uppercase tracking-widest text-zinc-600 font-medium',

  // Headers
  h1: 'text-2xl font-semibold tracking-tight',
  h2: 'text-lg font-semibold tracking-tight',
  h3: 'text-sm font-semibold tracking-tight',

  // Body
  body: 'text-sm text-zinc-300',
  bodySm: 'text-xs text-zinc-400',

  // Monospace (tickers, rates, identifiers)
  mono: 'font-mono text-sm',
  monoSm: 'font-mono text-xs',
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
  // Table row heights
  rowCompact: 'h-8', // 32px
  rowDefault: 'h-10', // 40px
  rowRelaxed: 'h-12', // 48px

  // Card padding
  cardPadding: 'p-4',
  cardPaddingSm: 'p-3',
  cardPaddingLg: 'p-6',

  // Section gaps
  sectionGap: 'gap-6',
  itemGap: 'gap-4',
  tightGap: 'gap-2',
} as const;

// =============================================================================
// COMPONENT STYLES
// =============================================================================

export const components = {
  // Cards
  card: 'bg-zinc-900/80 border border-zinc-800 rounded-lg',
  cardHover: 'hover:border-zinc-700 transition-colors',
  cardElevated: 'bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg',

  // Tables
  tableHeader: 'text-[10px] uppercase tracking-wider text-zinc-500 font-medium',
  tableCell: 'text-sm tabular-nums',
  tableRow: 'border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors',

  // Buttons
  buttonGhost: 'hover:bg-zinc-800/50 transition-colors rounded px-2 py-1',
  buttonPrimary: 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors rounded px-3 py-1.5',

  // Badges
  badge: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
  badgePositive: 'bg-emerald-500/20 text-emerald-400',
  badgeNegative: 'bg-red-500/20 text-red-400',
  badgeNeutral: 'bg-zinc-500/20 text-zinc-400',
  badgeWarning: 'bg-amber-500/20 text-amber-400',
} as const;

// =============================================================================
// FORMATTERS
// =============================================================================

export const formatters = {
  /**
   * Format currency with appropriate suffix (B, M, K)
   */
  currency: (value: number, decimals = 1): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  },

  /**
   * Format currency with full precision (for tables)
   */
  currencyFull: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  },

  /**
   * Format percentage
   */
  percent: (value: number, decimals = 1): string => {
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Format large numbers with commas
   */
  number: (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  },

  /**
   * Format date to short form
   */
  dateShort: (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  },

  /**
   * Format change with sign and color class
   */
  change: (value: number, decimals = 1): { text: string; colorClass: string } => {
    const sign = value > 0 ? '+' : '';
    const text = `${sign}${value.toFixed(decimals)}%`;
    const colorClass = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-zinc-400';
    return { text, colorClass };
  },
} as const;

// =============================================================================
// ECHARTS THEME
// =============================================================================

export const echartsTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: 'Inter, system-ui, sans-serif',
    color: colors.textSecondary,
  },
  title: {
    textStyle: {
      color: colors.textPrimary,
      fontWeight: 600,
      fontSize: 14,
    },
  },
  legend: {
    textStyle: {
      color: colors.textSecondary,
      fontSize: 11,
    },
  },
  tooltip: {
    backgroundColor: colors.bg2,
    borderColor: colors.border,
    textStyle: {
      color: colors.textPrimary,
      fontSize: 12,
    },
  },
  grid: {
    borderColor: colors.borderSubtle,
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: colors.borderSubtle } },
    axisTick: { lineStyle: { color: colors.borderSubtle } },
    axisLabel: { color: colors.textTertiary, fontSize: 10 },
    splitLine: { lineStyle: { color: colors.borderSubtle, type: 'dashed' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: colors.borderSubtle } },
    axisTick: { lineStyle: { color: colors.borderSubtle } },
    axisLabel: { color: colors.textTertiary, fontSize: 10 },
    splitLine: { lineStyle: { color: colors.borderSubtle, type: 'dashed' } },
  },
  color: chartColors as unknown as string[],
} as const;
