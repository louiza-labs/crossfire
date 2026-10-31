"use client";

import { useMemo } from "react";

interface DonutChartProps {
  data: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  size?: number;
  thickness?: number;
  title?: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 24,
  title,
}: DonutChartProps) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const segments = useMemo(() => {
    let currentAngle = -90; // Start from top
    return data.map((item) => {
      const angle = (item.value / total) * 360;
      const segment = {
        ...item,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: (item.value / total) * 100,
      };
      currentAngle += angle;
      return segment;
    });
  }, [data, total]);

  const radius = size / 2;
  const innerRadius = radius - thickness;

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(radius, radius, radius - 2, endAngle);
    const end = polarToCartesian(radius, radius, radius - 2, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const innerStart = polarToCartesian(radius, radius, innerRadius + 2, endAngle);
    const innerEnd = polarToCartesian(radius, radius, innerRadius + 2, startAngle);

    return [
      "M", start.x, start.y,
      "A", radius - 2, radius - 2, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius + 2, innerRadius + 2, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z",
    ].join(" ");
  };

  return (
    <div>
      {title && (
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className="flex items-center gap-6">
        <svg width={size} height={size} className="flex-shrink-0">
          {segments.map((segment, idx) => (
            <path
              key={idx}
              d={describeArc(segment.startAngle, segment.endAngle)}
              fill={segment.color}
              className="transition-all duration-300 hover:opacity-80"
              style={{ filter: `drop-shadow(0 0 4px ${segment.color}40)` }}
            />
          ))}
          <circle
            cx={radius}
            cy={radius}
            r={innerRadius - 8}
            fill="transparent"
          />
        </svg>
        <div className="flex-1 space-y-1.5">
          {segments.slice(0, 6).map((segment, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-zinc-400 truncate flex-1">
                {segment.label}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">
                {segment.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
          {segments.length > 6 && (
            <div className="text-[10px] text-zinc-600">
              +{segments.length - 6} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians),
  };
}
