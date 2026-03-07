"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { useChart } from "./chart-context";

export interface YAxisProps {
  /** Number of ticks. Default: 5 */
  numTicks?: number;
}

function getTicks(domain: [number, number], numTicks: number): number[] {
  const [min, max] = domain;
  if (max <= min) return [min];
  const ticks: number[] = [];
  for (let i = 0; i <= numTicks; i++) {
    const t = i / numTicks;
    const value = min + t * (max - min);
    ticks.push(Number(value.toFixed(0)));
  }
  return [...new Set(ticks)];
}

export function YAxis({ numTicks = 5 }: YAxisProps) {
  const { yScale, margin, containerRef } = useChart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ticks = useMemo(() => {
    const d = (yScale as unknown as { domain?: () => number[] }).domain?.();
    const domain: [number, number] =
      d && d.length >= 2 ? [d[0], d[1]] : [0, 100];
    return getTicks(domain, numTicks);
  }, [yScale, numTicks]);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none absolute inset-0">
      {ticks.map((value) => {
        const yPx = (yScale as (v: number) => number)(value);
        const top = margin.top + (yPx ?? 0);
        return (
          <div
            key={value}
            className="absolute text-[10px] text-chart-label tabular-nums"
            style={{
              left: 0,
              top: top - 6,
              transform: "translateY(-50%)",
              textAlign: "end",
              width: margin.left - 4,
            }}
          >
            {value}
          </div>
        );
      })}
    </div>,
    container
  );
}

YAxis.displayName = "YAxis";
export default YAxis;
