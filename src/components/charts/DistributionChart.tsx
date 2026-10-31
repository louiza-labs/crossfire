"use client";

import { useMemo } from "react";

interface DistributionChartProps {
  data: number[];
  buckets?: number;
  height?: number;
  title?: string;
  color?: string;
  formatBucket?: (min: number, max: number) => string;
}

export function DistributionChart({
  data,
  buckets = 10,
  height = 100,
  title,
  color = "#00d4ff",
  formatBucket,
}: DistributionChartProps) {
  const histogram = useMemo(() => {
    if (data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const bucketSize = range / buckets;

    const counts = new Array(buckets).fill(0);
    data.forEach((value) => {
      const idx = Math.min(Math.floor((value - min) / bucketSize), buckets - 1);
      counts[idx]++;
    });

    return counts.map((count, idx) => ({
      min: min + idx * bucketSize,
      max: min + (idx + 1) * bucketSize,
      count,
    }));
  }, [data, buckets]);

  const maxCount = useMemo(() => Math.max(...histogram.map((h) => h.count), 1), [histogram]);

  if (histogram.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
          {title}
        </h3>
      )}
      <div className="flex items-end gap-1" style={{ height }}>
        {histogram.map((bucket, idx) => {
          const heightPercent = (bucket.count / maxCount) * 100;
          return (
            <div
              key={idx}
              className="flex-1 group relative"
              style={{ height: "100%" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t transition-all duration-300"
                style={{
                  height: `${Math.max(heightPercent, 2)}%`,
                  backgroundColor: color,
                  opacity: 0.7 + (heightPercent / 100) * 0.3,
                }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 rounded text-[10px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {formatBucket
                  ? formatBucket(bucket.min, bucket.max)
                  : `${bucket.min.toFixed(1)} - ${bucket.max.toFixed(1)}`}
                <br />
                <span className="text-zinc-500">{bucket.count} items</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-zinc-600">
        <span>{histogram[0]?.min.toFixed(0)}</span>
        <span>{histogram[histogram.length - 1]?.max.toFixed(0)}</span>
      </div>
    </div>
  );
}
