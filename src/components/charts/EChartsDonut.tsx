"use client";

import { useMemo, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { colors, chartColors, echartsTheme, formatters } from "@/lib/design-tokens";

interface DonutDataItem {
  label: string;
  value: number;
  color?: string;
}

interface EChartsDonutProps {
  data: DonutDataItem[];
  title?: string;
  height?: number;
  centerLabel?: {
    title: string;
    value: string;
  };
  formatValue?: (value: number) => string;
  showLegend?: boolean;
  onSliceClick?: (item: DonutDataItem, index: number) => void;
  className?: string;
}

export function EChartsDonut({
  data,
  title,
  height = 300,
  centerLabel,
  formatValue = formatters.currency,
  showLegend = true,
  onSliceClick,
  className,
}: EChartsDonutProps) {
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());

  const total = useMemo(() => {
    return data.filter((d) => !hiddenItems.has(d.label)).reduce((sum, d) => sum + d.value, 0);
  }, [data, hiddenItems]);

  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      name: d.label,
      value: hiddenItems.has(d.label) ? 0 : d.value,
      itemStyle: {
        color: d.color || chartColors[i % chartColors.length],
      },
      originalValue: d.value,
    }));
  }, [data, hiddenItems]);

  const handleLegendClick = useCallback((label: string) => {
    setHiddenItems((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }, []);

  const option = useMemo(() => {
    const effectiveCenterLabel = centerLabel || {
      title: "Total",
      value: formatValue(total),
    };

    return {
      ...echartsTheme,
      legend: {
        show: false, // We use custom legend below
      },
      title: title
        ? {
            text: title,
            left: 0,
            top: 0,
            ...echartsTheme.title,
          }
        : undefined,
      tooltip: {
        ...echartsTheme.tooltip,
        trigger: "item",
        formatter: (params: {
          name: string;
          value: number;
          percent: number;
          data: { originalValue: number };
        }) => {
          const displayValue = params.data.originalValue;
          return `
            <div style="font-size: 12px; color: ${colors.text.secondary};">
              ${params.name}
            </div>
            <div style="font-size: 14px; font-weight: 300; color: ${colors.text.primary}; margin-top: 4px;">
              ${formatValue(displayValue)}
            </div>
            <div style="font-size: 11px; color: ${colors.text.tertiary}; margin-top: 2px;">
              ${params.percent.toFixed(1)}% of total
            </div>
          `;
        },
      },
      series: [
        {
          type: "pie",
          radius: ["55%", "80%"],
          center: ["50%", "55%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "center",
            formatter: () => {
              return `{title|${effectiveCenterLabel.title}}\n{value|${effectiveCenterLabel.value}}`;
            },
            rich: {
              title: {
                fontSize: 11,
                fontWeight: 500,
                color: colors.text.tertiary,
                padding: [0, 0, 4, 0],
              },
              value: {
                fontSize: 20,
                fontWeight: 300,
                color: colors.text.primary,
              },
            },
          },
          labelLine: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
            },
            scaleSize: 5,
            itemStyle: {
              shadowBlur: 15,
              shadowColor: "rgba(0, 0, 0, 0.3)",
            },
          },
          data: chartData,
        },
      ],
    };
  }, [chartData, title, centerLabel, total, formatValue]);

  const handleEvents = useMemo(
    () => ({
      click: (params: { dataIndex: number }) => {
        if (onSliceClick && data[params.dataIndex]) {
          onSliceClick(data[params.dataIndex], params.dataIndex);
        }
      },
    }),
    [onSliceClick, data]
  );

  return (
    <div className={className}>
      <ReactECharts
        option={option}
        style={{ height: showLegend ? height - 60 : height }}
        onEvents={onSliceClick ? handleEvents : undefined}
        opts={{ renderer: "canvas" }}
      />
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 mt-3 px-2">
          {data.map((item, index) => {
            const isHidden = hiddenItems.has(item.label);
            const color = item.color || chartColors[index % chartColors.length];
            return (
              <button
                key={item.label}
                onClick={() => handleLegendClick(item.label)}
                className={`flex items-center gap-1.5 text-[11px] transition-opacity text-left ${
                  isHidden ? "opacity-40" : "opacity-100"
                } hover:opacity-80`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-zinc-400 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
