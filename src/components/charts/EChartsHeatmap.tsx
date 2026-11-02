"use client";

import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { colors, echartsTheme, formatters } from "@/lib/design-tokens";

interface HeatmapData {
  xLabels: string[];
  yLabels: string[];
  values: number[][]; // [y][x] format
}

interface EChartsHeatmapProps {
  data: HeatmapData;
  title?: string;
  height?: number;
  formatValue?: (value: number) => string;
  onCellClick?: (x: string, y: string, value: number) => void;
  showValues?: boolean;
  colorRange?: [string, string, string]; // [min, mid, max]
  className?: string;
}

export function EChartsHeatmap({
  data,
  title,
  height = 400,
  formatValue = formatters.currency,
  onCellClick,
  showValues = false,
  colorRange = ["#27272a", "#3b82f6", "#00d4ff"],
  className,
}: EChartsHeatmapProps) {
  const { seriesData, maxValue, minValue } = useMemo(() => {
    const flatData: [number, number, number][] = [];
    let max = -Infinity;
    let min = Infinity;

    data.values.forEach((row, yIndex) => {
      row.forEach((value, xIndex) => {
        flatData.push([xIndex, yIndex, value]);
        if (value > max) max = value;
        if (value < min && value > 0) min = value;
      });
    });

    return {
      seriesData: flatData,
      maxValue: max === -Infinity ? 0 : max,
      minValue: min === Infinity ? 0 : min,
    };
  }, [data]);

  const option = useMemo(() => {
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
        position: "top",
        formatter: (params: { data: [number, number, number] }) => {
          const [xIndex, yIndex, value] = params.data;
          const xLabel = data.xLabels[xIndex];
          const yLabel = data.yLabels[yIndex];
          return `
            <div style="font-size: 11px; color: ${colors.text.tertiary};">
              ${yLabel}
            </div>
            <div style="font-size: 12px; color: ${colors.text.secondary}; margin-top: 2px;">
              ${xLabel}
            </div>
            <div style="font-size: 14px; font-weight: 300; color: ${colors.text.primary}; margin-top: 4px;">
              ${value > 0 ? formatValue(value) : "—"}
            </div>
          `;
        },
      },
      grid: {
        left: 120,
        right: 60,
        top: title ? 50 : 20,
        bottom: 80,
        containLabel: false,
      },
      xAxis: {
        type: "category",
        data: data.xLabels,
        position: "bottom",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...echartsTheme.categoryAxis.axisLabel,
          rotate: 45,
          interval: 0,
          overflow: "truncate",
          width: 80,
        },
        splitArea: {
          show: false,
        },
      },
      yAxis: {
        type: "category",
        data: data.yLabels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          ...echartsTheme.categoryAxis.axisLabel,
          overflow: "truncate",
          width: 110,
        },
        splitArea: {
          show: false,
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        itemWidth: 12,
        itemHeight: 120,
        textStyle: {
          color: colors.text.tertiary,
          fontSize: 10,
        },
        inRange: {
          color: colorRange,
        },
        formatter: (value: number) => formatValue(value),
      },
      series: [
        {
          type: "heatmap",
          data: seriesData,
          label: {
            show: showValues,
            fontSize: 9,
            color: colors.text.primary,
            formatter: (params: { data: [number, number, number] }) => {
              const value = params.data[2];
              if (value === 0) return "";
              return formatValue(value);
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)",
              borderColor: colors.accent.primary,
              borderWidth: 1,
            },
          },
          itemStyle: {
            borderColor: colors.surface.base,
            borderWidth: 1,
          },
        },
      ],
    };
  }, [data, seriesData, maxValue, title, formatValue, showValues, colorRange]);

  const handleEvents = useMemo(
    () => ({
      click: (params: { data: [number, number, number] }) => {
        if (onCellClick) {
          const [xIndex, yIndex, value] = params.data;
          onCellClick(data.xLabels[xIndex], data.yLabels[yIndex], value);
        }
      },
    }),
    [onCellClick, data]
  );

  return (
    <div className={className}>
      <ReactECharts
        option={option}
        style={{ height }}
        onEvents={onCellClick ? handleEvents : undefined}
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}

// Helper to build heatmap data from fund-industry-exposure structure
interface ExposureItem {
  fundId: string;
  fundTicker: string;
  industry: string;
  exposure: number;
}

export function buildFundIndustryHeatmap(
  exposures: ExposureItem[],
  maxFunds = 10,
  maxIndustries = 10
): HeatmapData {
  // Get top funds by total exposure
  const fundTotals = new Map<string, { ticker: string; total: number }>();
  exposures.forEach((e) => {
    const current = fundTotals.get(e.fundId) || { ticker: e.fundTicker, total: 0 };
    current.total += e.exposure;
    fundTotals.set(e.fundId, current);
  });

  const topFunds = [...fundTotals.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, maxFunds)
    .map(([id, data]) => ({ id, ticker: data.ticker }));

  // Get top industries by total exposure
  const industryTotals = new Map<string, number>();
  exposures.forEach((e) => {
    industryTotals.set(e.industry, (industryTotals.get(e.industry) || 0) + e.exposure);
  });

  const topIndustries = [...industryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxIndustries)
    .map(([name]) => name);

  // Build value matrix
  const fundIdToIndex = new Map(topFunds.map((f, i) => [f.id, i]));
  const industryToIndex = new Map(topIndustries.map((ind, i) => [ind, i]));

  const values: number[][] = Array(topFunds.length)
    .fill(null)
    .map(() => Array(topIndustries.length).fill(0));

  exposures.forEach((e) => {
    const fundIndex = fundIdToIndex.get(e.fundId);
    const industryIndex = industryToIndex.get(e.industry);
    if (fundIndex !== undefined && industryIndex !== undefined) {
      values[fundIndex][industryIndex] += e.exposure;
    }
  });

  return {
    xLabels: topIndustries,
    yLabels: topFunds.map((f) => f.ticker),
    values,
  };
}
