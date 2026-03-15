import { useState, useEffect, useRef } from 'react';

export interface TrendPoint {
  timestamp: number;
  value: number; // 0-100
}

const MAX_POINTS = 12;
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export const useCapacityTrend = (avgCapacityPercent: number): TrendPoint[] => {
  const [dataPoints, setDataPoints] = useState<TrendPoint[]>([]);
  const lastPushRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Seed initial data
  useEffect(() => {
    if (initializedRef.current || avgCapacityPercent === 0) return;
    initializedRef.current = true;

    const now = Date.now();
    const seeds: TrendPoint[] = [];
    for (let i = 5; i >= 1; i--) {
      const jitter = (Math.random() - 0.5) * 8;
      seeds.push({
        timestamp: now - i * INTERVAL_MS,
        value: Math.max(0, Math.min(100, avgCapacityPercent + jitter)),
      });
    }
    seeds.push({ timestamp: now, value: avgCapacityPercent });

    setDataPoints(seeds);
    lastPushRef.current = now;
  }, [avgCapacityPercent]);

  // Push new data point every 60 seconds (check if 10 min has elapsed)
  useEffect(() => {
    if (!initializedRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastPushRef.current >= INTERVAL_MS) {
        setDataPoints(prev => {
          const next = [...prev, { timestamp: now, value: avgCapacityPercent }];
          return next.slice(-MAX_POINTS);
        });
        lastPushRef.current = now;
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [avgCapacityPercent]);

  // Update latest point in real-time when avgCapacity changes between intervals
  useEffect(() => {
    if (!initializedRef.current || dataPoints.length === 0) return;

    setDataPoints(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        value: avgCapacityPercent,
      };
      return updated;
    });
  }, [avgCapacityPercent]);

  return dataPoints;
};
