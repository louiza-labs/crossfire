/**
 * Design Tokens — 2026 Futuristic Minimalist System
 * Subtle, understated elegance with restrained color and refined typography
 */

// =============================================================================
// COLOR PALETTE — Monochromatic with singular accent
// =============================================================================

export const colors = {
  // Primary surface hierarchy (very dark grays, not pure black)
  surface: {
    base: "#050506", // Deepest background
    elevated: "#0a0a0c", // Cards, panels
    overlay: "#0f0f12", // Modals, popovers
    subtle: "#141418", // Hover states
    muted: "#1a1a1f", // Active states
  },

  // Border system (ultra-subtle)
  border: {
    default: "rgba(255, 255, 255, 0.06)",
    subtle: "rgba(255, 255, 255, 0.04)",
    emphasis: "rgba(255, 255, 255, 0.10)",
    focus: "rgba(255, 255, 255, 0.20)",
  },

  // Text hierarchy
  text: {
    primary: "rgba(255, 255, 255, 0.95)",
    secondary: "rgba(255, 255, 255, 0.64)",
    tertiary: "rgba(255, 255, 255, 0.44)",
    muted: "rgba(255, 255, 255, 0.28)",
    disabled: "rgba(255, 255, 255, 0.16)",
  },

  // Singular accent — ice blue/white (futuristic, neutral)
  accent: {
    primary: "#e0f2fe", // Ice blue - primary interactions
    secondary: "#bae6fd", // Slightly deeper
    muted: "rgba(224, 242, 254, 0.12)",
    subtle: "rgba(224, 242, 254, 0.06)",
  },

  // Semantic colors (reserved, used sparingly)
  semantic: {
    positive: "#4ade80", // Softer green
    negative: "#f87171", // Softer red
    warning: "#fbbf24", // Amber
    info: "#93c5fd", // Light blue
  },

  // Risk indicators (for data visualization)
  risk: {
    low: "#4ade80",
    medium: "#fbbf24",
    high: "#fb923c",
    critical: "#f87171",
  },
} as const;

// Chart colors — Monochromatic with subtle variation
export const chartColors: string[] = [
  "#e0f2fe", // Ice blue
  "#a5b4fc", // Lavender
  "#c4b5fd", // Light violet
  "#93c5fd", // Sky
  "#7dd3fc", // Cyan
  "#5eead4", // Teal
  "#86efac", // Mint
  "#fde047", // Yellow
  "#fdba74", // Peach
  "#fca5a5", // Rose
];

// =============================================================================
// TYPOGRAPHY — Refined, light, spacious
// =============================================================================

export const typography = {
  // Display (large headlines)
  display: {
    lg: "text-4xl font-extralight tracking-tight leading-none",
    md: "text-3xl font-extralight tracking-tight leading-none",
    sm: "text-2xl font-light tracking-tight leading-none",
  },

  // Headings
  heading: {
    h1: "text-xl font-light tracking-[-0.02em] leading-snug",
    h2: "text-base font-normal tracking-[-0.01em] leading-snug",
    h3: "text-sm font-medium tracking-normal leading-snug",
  },

  // Data display (tabular numerals, financial data)
  data: {
    xl: "text-3xl font-extralight tabular-nums tracking-tight",
    lg: "text-xl font-light tabular-nums tracking-tight",
    md: "text-base font-normal tabular-nums",
    sm: "text-sm font-normal tabular-nums",
    xs: "text-xs font-normal tabular-nums",
  },

  // Labels (uppercase, widely spaced)
  label: {
    default: "text-[10px] uppercase tracking-[0.12em] font-medium",
    sm: "text-[9px] uppercase tracking-[0.14em] font-medium",
    lg: "text-[11px] uppercase tracking-[0.10em] font-medium",
  },

  // Body text
  body: {
    default: "text-sm font-normal leading-relaxed",
    sm: "text-xs font-normal leading-relaxed",
    lg: "text-base font-normal leading-relaxed",
  },

  // Monospace (tickers, codes, identifiers)
  mono: {
    default: "font-mono text-sm tracking-tight",
    sm: "font-mono text-xs tracking-tight",
    lg: "font-mono text-base tracking-tight",
  },
} as const;

// =============================================================================
// SPACING — Generous, breathing room
// =============================================================================

export const spacing = {
  // Component heights
  height: {
    xs: "h-6", // 24px - tiny buttons
    sm: "h-8", // 32px - small buttons, compact rows
    md: "h-10", // 40px - default buttons
    lg: "h-12", // 48px - large buttons, touch targets
    xl: "h-14", // 56px - hero elements
  },

  // Padding scales
  padding: {
    xs: "p-2", // 8px
    sm: "p-3", // 12px
    md: "p-4", // 16px
    lg: "p-6", // 24px
    xl: "p-8", // 32px
    "2xl": "p-12", // 48px
  },

  // Gap scales
  gap: {
    xs: "gap-1", // 4px
    sm: "gap-2", // 8px
    md: "gap-4", // 16px
    lg: "gap-6", // 24px
    xl: "gap-8", // 32px
    "2xl": "gap-12", // 48px
  },

  // Section spacing
  section: {
    compact: "space-y-4",
    default: "space-y-6",
    relaxed: "space-y-8",
    generous: "space-y-12",
  },
} as const;

// =============================================================================
// COMPONENT STYLES — Subtle, refined
// =============================================================================

export const components = {
  // Cards — Minimal borders, subtle elevation
  card: {
    base: "bg-[#0a0a0c] rounded-xl border border-white/[0.04] backdrop-blur-sm",
    elevated:
      "bg-[#0a0a0c] rounded-xl border border-white/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.5),0_8px_24px_rgba(0,0,0,0.4)]",
    interactive:
      "bg-[#0a0a0c] rounded-xl border border-white/[0.04] hover:border-white/[0.08] hover:bg-[#0f0f12] transition-all duration-300",
    glass: "bg-white/[0.02] rounded-xl border border-white/[0.06] backdrop-blur-xl",
  },

  // Buttons — Ghostly by default, accent on primary
  button: {
    base: "rounded-lg font-medium transition-all duration-200 ease-out",
    primary: "bg-white/[0.08] text-white/90 hover:bg-white/[0.12] active:bg-white/[0.06]",
    secondary: "bg-transparent text-white/60 hover:text-white/90 hover:bg-white/[0.04]",
    ghost: "bg-transparent text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
    accent:
      "bg-[#e0f2fe]/[0.10] text-[#e0f2fe] hover:bg-[#e0f2fe]/[0.15] border border-[#e0f2fe]/[0.20]",
    danger: "bg-[#f87171]/[0.10] text-[#f87171] hover:bg-[#f87171]/[0.15]",
  },

  // Inputs — Ultra minimal
  input: {
    base: "bg-white/[0.03] border border-white/[0.06] rounded-lg text-white/90 placeholder:text-white/30 focus:border-white/[0.12] focus:bg-white/[0.04] focus:outline-none transition-all duration-200",
  },

  // Tables — Clean lines, generous spacing
  table: {
    header:
      "text-[10px] uppercase tracking-[0.12em] font-medium text-white/40 border-b border-white/[0.04]",
    row: "border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors duration-150",
    cell: "text-sm tabular-nums py-3",
  },

  // Badges — Pill-shaped, muted
  badge: {
    base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium tracking-wide",
    default: "bg-white/[0.06] text-white/60",
    accent: "bg-[#e0f2fe]/[0.10] text-[#e0f2fe]",
    positive: "bg-[#4ade80]/[0.10] text-[#4ade80]",
    negative: "bg-[#f87171]/[0.10] text-[#f87171]",
    warning: "bg-[#fbbf24]/[0.10] text-[#fbbf24]",
  },

  // Dividers
  divider: {
    horizontal: "border-t border-white/[0.04]",
    vertical: "border-l border-white/[0.04]",
  },
} as const;

// =============================================================================
// EFFECTS — Subtle glow, refined shadows
// =============================================================================

export const effects = {
  // Glows (for accent elements)
  glow: {
    sm: "shadow-[0_0_12px_rgba(224,242,254,0.15)]",
    md: "shadow-[0_0_24px_rgba(224,242,254,0.20)]",
    lg: "shadow-[0_0_48px_rgba(224,242,254,0.25)]",
  },

  // Focus rings
  focus: {
    default: "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
    accent: "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e0f2fe]/40",
  },

  // Backdrop blur
  blur: {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-xl",
  },
} as const;

// =============================================================================
// ANIMATIONS — Subtle, refined motion
// =============================================================================

export const animations = {
  // Durations
  duration: {
    fast: "duration-150",
    default: "duration-200",
    slow: "duration-300",
    slower: "duration-500",
  },

  // Easings
  ease: {
    default: "ease-out",
    smooth: "ease-[cubic-bezier(0.4,0,0.2,1)]",
    bounce: "ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  },
} as const;

// =============================================================================
// FORMATTERS
// =============================================================================

export const formatters = {
  currency: (value: number, decimals = 1): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
    return `$${value.toFixed(decimals)}`;
  },

  currencyFull: (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  },

  percent: (value: number, decimals = 1): string => `${value.toFixed(decimals)}%`,

  number: (value: number): string => new Intl.NumberFormat("en-US").format(value),

  dateShort: (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  },

  change: (value: number, decimals = 1): { text: string; colorClass: string } => {
    const sign = value > 0 ? "+" : "";
    const text = `${sign}${value.toFixed(decimals)}%`;
    const colorClass =
      value > 0 ? "text-[#4ade80]" : value < 0 ? "text-[#f87171]" : "text-white/40";
    return { text, colorClass };
  },
} as const;

// =============================================================================
// ECHARTS THEME — Refined, minimal
// =============================================================================

export const echartsTheme = {
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    color: "rgba(255, 255, 255, 0.5)",
  },
  title: {
    textStyle: {
      color: "rgba(255, 255, 255, 0.9)",
      fontWeight: 300,
      fontSize: 14,
      letterSpacing: "-0.01em",
    },
  },
  legend: {
    textStyle: {
      color: "rgba(255, 255, 255, 0.5)",
      fontSize: 11,
    },
  },
  tooltip: {
    backgroundColor: "#0f0f12",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    textStyle: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 12,
    },
    extraCssText: "border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);",
  },
  grid: {
    borderColor: "rgba(255, 255, 255, 0.04)",
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.06)" } },
    axisTick: { show: false },
    axisLabel: {
      color: "rgba(255, 255, 255, 0.4)",
      fontSize: 10,
      fontFamily: "var(--font-inter), system-ui, sans-serif",
    },
    splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)", type: "solid" } },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: "rgba(255, 255, 255, 0.4)",
      fontSize: 10,
      fontFamily: "var(--font-inter), system-ui, sans-serif",
    },
    splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.03)", type: "solid" } },
  },
  color: chartColors as unknown as string[],
} as const;
