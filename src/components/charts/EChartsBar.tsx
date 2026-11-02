"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { colors, echartsTheme, formatters } from "@/lib/design-tokens";

interface BarDataItem {
  label: string;
  value: number;
  color?: string;
}

interface EChartsBarProps {
  data: BarDataItem[];
  title?: string;
  height?: number;
  maxBars?: number;
  formatValue?: (value: number) => string;
  onBarClick?: (item: BarDataItem, index: number) => void;
  showGrid?: boolean;
  className?: string;
}

export function EChartsBar({
  data,
  title,
  height = 300,
  maxBars = 10,
  formatValue = formatters.currency,
  onBarClick,
  showGrid = true,
  className,
}: EChartsBarProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    return sorted.slice(0, maxBars);
  }, [data, maxBars]);

  const option = useMemo(() => {
    const categories = chartData.map((d) => d.label);
    const values = chartData.map((d) => d.value);
    const barColors = chartData.map((d, i) => d.color || colors.accent.primary);

    return {
      ...echartsTheme,
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
        trigger: "axis",
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(0, 212, 255, 0.05)",
          },
        },
        formatter: (params: { name: string; value: number }[]) => {
          const item = params[0];
          if (!item) return "";
          return `
            <div style="font-size: 12px; color: ${colors.text.secondary};">
              ${item.name}
            </div>
            <div style="font-size: 14px; font-weight: 300; color: ${colors.text.primary}; margin-top: 4px;">
              ${formatValue(item.value)}
            </div>
          `;
        },
      },
      grid: {
        left: 0,
        right: 60,
        top: title ? 40 : 10,
        bottom: 10,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        show: showGrid,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...echartsTheme.categoryAxis.axisLabel,
          formatter: (value: number) => formatValue(value),
        },
        splitLine: {
          ...echartsTheme.valueAxis.splitLine,
          show: showGrid,
        },
      },
      yAxis: {
        type: "category",
        data: categories,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...echartsTheme.categoryAxis.axisLabel,
          width: 120,
          overflow: "truncate",
          ellipsis: "...",
        },
      },
      series: [
        {
          type: "bar",
          data: values.map((value, index) => ({
            value,
            itemStyle: {
              color: barColors[index],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: "60%",
          label: {
            show: true,
            position: "right",
            formatter: (params: { value: number }) => formatValue(params.value),
            color: colors.text.secondary,
            fontSize: 11,
            fontFamily: "Inter, system-ui, sans-serif",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 212, 255, 0.3)",
            },
          },
        },
      ],
    };
  }, [chartData, title, formatValue, showGrid]);

  const handleEvents = useMemo(
    () => ({
      click: (params: { dataIndex: number }) => {
        if (onBarClick && chartData[params.dataIndex]) {
          onBarClick(chartData[params.dataIndex], params.dataIndex);
        }
      },
    }),
    [onBarClick, chartData]
  );

  return (
    <div className={className}>
      <ReactECharts
        option={option}
        style={{ height }}
        onEvents={onBarClick ? handleEvents : undefined}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
