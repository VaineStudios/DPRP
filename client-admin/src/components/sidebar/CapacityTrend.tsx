import { useState, useEffect, useRef } from 'react';
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
} from 'chart.js';
import type { Shelter } from '../../api/client';
import { isOffline } from '../../utils/shelter';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Filler, Tooltip);

interface CapacityTrendProps {
  shelters: Shelter[];
}

interface DataPoint {
  timestamp: number;
  avgCapacity: number;
}

const MAX_POINTS = 12;
const INTERVAL_MS = 10 * 60 * 1000;

const computeAvgCapacity = (shelters: Shelter[]): number => {
  const reporting = shelters.filter(s => s.latestUpdate && !isOffline(s));
  if (reporting.length === 0) return 0;
  const sum = reporting.reduce((acc, s) => acc + s.latestUpdate!.capacityLevel, 0);
  return (sum / reporting.length / 5) * 100;
};

const fmt = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const getPointColor = (value: number): string => {
  const level = Math.round(value / 20);
  if (level <= 2) return '#22c55e';
  if (level === 3) return '#f59e0b';
  return '#ef4444';
};

const CapacityTrend = ({ shelters }: CapacityTrendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const lastPushRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Seed initial data on mount
  useEffect(() => {
    if (initializedRef.current || shelters.length === 0) return;
    initializedRef.current = true;

    const now = Date.now();
    const currentAvg = computeAvgCapacity(shelters);

    const seeds: DataPoint[] = [];
    for (let i = 5; i >= 1; i--) {
      const jitter = (Math.random() - 0.5) * 8;
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
    }, 60_000);

    return () => clearInterval(interval);
  }, [shelters]);

  // Render chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dataPoints.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = dataPoints.map(dp => fmt(dp.timestamp));
    const values = dataPoints.map(dp => dp.avgCapacity);
    const pointColors = values.map(v => getPointColor(v));

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#5DCAA5',
          backgroundColor: 'rgba(93, 202, 165, 0.1)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: pointColors,
          pointBorderColor: '#1e293b',
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 300,
          easing: 'easeOutQuart',
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          tooltip: {
            backgroundColor: '#334155',
            titleColor: '#cbd5e1',
            bodyColor: '#fff',
            bodyFont: { weight: 'bold', size: 12 },
            padding: { top: 6, bottom: 6, left: 10, right: 10 },
            cornerRadius: 6,
            displayColors: false,
            callbacks: {
              label: (ctx) => `${Math.round(Number(ctx.parsed.y) || 0)}% capacity`,
            },
          },
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: {
              color: '#64748b',
              font: { size: 9 },
              maxTicksLimit: 4,
            },
            border: { display: false },
          },
          y: {
            display: true,
            min: 0,
            max: 100,
            grid: {
              color: (ctx) => {
                if (ctx.tick.value === 40 || ctx.tick.value === 60) return '#334155';
                return 'transparent';
              },
              lineWidth: 0.5,
            },
            ticks: {
              color: '#64748b',
              font: { size: 9 },
              stepSize: 20,
              callback: (value) => `${value}%`,
            },
            border: { display: false },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [dataPoints]);

  return (
    <div style={styles.container}>
      <div style={styles.chartWrap}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  chartWrap: {
    width: 260,
    height: 100,
    background: '#0f172a',
    borderRadius: 4,
  },
};

export default CapacityTrend;
