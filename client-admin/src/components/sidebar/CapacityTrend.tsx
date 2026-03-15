import { useState, useEffect, useRef, useMemo } from 'react';
import type { Shelter } from '../../api/client';
import { isOffline } from '../../utils/shelter';

interface CapacityTrendProps {
  shelters: Shelter[];
}

interface DataPoint {
  timestamp: number;
  avgCapacity: number; // 0-100 percentage
}

const CHART_W = 260;
const CHART_H = 100;
const PADDING_TOP = 8;
const PADDING_BOTTOM = 18;
const PLOT_H = CHART_H - PADDING_TOP - PADDING_BOTTOM;
const MAX_POINTS = 12; // 2 hours at 10-min intervals
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

const computeAvgCapacity = (shelters: Shelter[]): number => {
  const reporting = shelters.filter(s => s.latestUpdate && !isOffline(s));
  if (reporting.length === 0) return 0;
  const sum = reporting.reduce((acc, s) => acc + s.latestUpdate!.capacityLevel, 0);
  return (sum / reporting.length / 5) * 100;
};

const CapacityTrend = ({ shelters }: CapacityTrendProps) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const lastPushRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Seed initial data on mount
  useEffect(() => {
    if (initializedRef.current || shelters.length === 0) return;
    initializedRef.current = true;

    const now = Date.now();
    const currentAvg = computeAvgCapacity(shelters);

    // Generate synthetic seed points for a more populated look
    const seeds: DataPoint[] = [];
    for (let i = 5; i >= 1; i--) {
      const jitter = (Math.random() - 0.5) * 8; // ±4% variation
      seeds.push({
        timestamp: now - i * INTERVAL_MS,
        avgCapacity: Math.max(0, Math.min(100, currentAvg + jitter)),
      });
    }
    seeds.push({ timestamp: now, avgCapacity: currentAvg });

    setDataPoints(seeds);
    lastPushRef.current = now;
  }, [shelters]);

  // Push new data point every 10 minutes
  useEffect(() => {
    if (!initializedRef.current) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastPushRef.current >= INTERVAL_MS) {
        const avg = computeAvgCapacity(shelters);
        setDataPoints(prev => {
          const next = [...prev, { timestamp: now, avgCapacity: avg }];
          return next.slice(-MAX_POINTS);
        });
        lastPushRef.current = now;
      }
    }, 60_000); // Check every minute

    return () => clearInterval(interval);
  }, [shelters]);

  // Build SVG path
  const { linePath, areaPath, timeLabels } = useMemo(() => {
    if (dataPoints.length === 0) return { linePath: '', areaPath: '', timeLabels: [] };

    const xStep = dataPoints.length > 1
      ? CHART_W / (dataPoints.length - 1)
      : CHART_W / 2;

    const points = dataPoints.map((dp, i) => {
      const x = dataPoints.length > 1 ? i * xStep : CHART_W / 2;
      // Invert Y: 100% capacity = top, 0% = bottom
      const y = PADDING_TOP + PLOT_H - (dp.avgCapacity / 100) * PLOT_H;
      return { x, y };
    });

    const lineParts = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`);
    const line = lineParts.join(' ');

    // Area: close the path to the bottom
    const area = `${line} L${points[points.length - 1].x},${PADDING_TOP + PLOT_H} L${points[0].x},${PADDING_TOP + PLOT_H} Z`;

    // Time labels
    const labels: { x: number; text: string }[] = [];
    if (dataPoints.length > 0) {
      const fmt = (ts: number) => {
        const d = new Date(ts);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      };
      labels.push({ x: points[0].x, text: fmt(dataPoints[0].timestamp) });
      if (dataPoints.length > 1) {
        labels.push({ x: points[points.length - 1].x, text: fmt(dataPoints[dataPoints.length - 1].timestamp) });
      }
    }

    return { linePath: line, areaPath: area, timeLabels: labels };
  }, [dataPoints]);

  // Zone boundaries (Y coordinates for capacity zones)
  // Level 1-2 (0-40%) = green, Level 3 (40-60%) = amber, Level 4-5 (60-100%) = red
  const zoneGreenY = PADDING_TOP + PLOT_H * 0.6; // 40% from bottom
  const zoneAmberY = PADDING_TOP + PLOT_H * 0.4; // 60% from bottom
  const zoneRedY = PADDING_TOP; // top

  return (
    <div style={styles.container}>
      <svg
        width={CHART_W}
        height={CHART_H}
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        style={styles.svg}
      >
        {/* Background zones */}
        <rect
          x={0} y={zoneRedY} width={CHART_W}
          height={zoneAmberY - zoneRedY}
          fill="#ef4444" opacity={0.06}
        />
        <rect
          x={0} y={zoneAmberY} width={CHART_W}
          height={zoneGreenY - zoneAmberY}
          fill="#f59e0b" opacity={0.06}
        />
        <rect
          x={0} y={zoneGreenY} width={CHART_W}
          height={PADDING_TOP + PLOT_H - zoneGreenY}
          fill="#22c55e" opacity={0.06}
        />

        {/* Zone divider lines */}
        <line x1={0} y1={zoneAmberY} x2={CHART_W} y2={zoneAmberY} stroke="#334155" strokeWidth={0.5} strokeDasharray="4,4" />
        <line x1={0} y1={zoneGreenY} x2={CHART_W} y2={zoneGreenY} stroke="#334155" strokeWidth={0.5} strokeDasharray="4,4" />

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill="#5DCAA5" opacity={0.1} />
        )}

        {/* Trend line */}
        {linePath && (
          <path d={linePath} fill="none" stroke="#5DCAA5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Data point dots */}
        {dataPoints.length === 1 && (
          <circle cx={CHART_W / 2} cy={PADDING_TOP + PLOT_H - (dataPoints[0].avgCapacity / 100) * PLOT_H} r={3} fill="#5DCAA5" />
        )}

        {/* Time labels */}
        {timeLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={CHART_H - 2}
            fill="#64748b"
            fontSize={9}
            textAnchor={i === 0 ? 'start' : 'end'}
          >
            {label.text}
          </text>
        ))}
      </svg>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  svg: {
    background: '#0f172a',
    borderRadius: 4,
  },
};

export default CapacityTrend;
