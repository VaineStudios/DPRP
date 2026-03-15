import { useRef, useEffect } from 'react';
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
import type { TrendPoint } from '../../hooks/useCapacityTrend';

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Filler, Tooltip);

interface CapacityTrendProps {
  dataPoints: TrendPoint[];
}

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

const CapacityTrend = ({ dataPoints }: CapacityTrendProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labels = dataPoints.map(dp => fmt(dp.timestamp));
    const values = dataPoints.map(dp => dp.value);
    const pointColors = values.map(v => getPointColor(v));

    chartRef.current = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13, 148, 136, 0.08)',
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: pointColors,
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400,
          easing: 'easeOutQuart',
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#e2e8f0',
            bodyColor: '#fff',
            bodyFont: { weight: 'bold', size: 14 },
            padding: { top: 8, bottom: 8, left: 12, right: 12 },
            cornerRadius: 8,
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
              color: '#94a3b8',
              font: { size: 11 },
              maxTicksLimit: 6,
            },
            border: { display: false },
          },
          y: {
            display: true,
            min: 0,
            max: 100,
            grid: {
              color: (ctx) => {
                if (ctx.tick.value === 40 || ctx.tick.value === 60) return '#e2e8f0';
                return 'transparent';
              },
              lineWidth: 0.5,
            },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              stepSize: 20,
              callback: (value) => `${value}%`,
            },
            border: { display: false, dash: [6, 4] },
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
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Network capacity trend</h3>
        <p style={styles.subtitle}>Average across reporting shelters — last 2 hours</p>
      </div>
      <div style={styles.chartWrap}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px 8px',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    margin: '2px 0 0',
  },
  chartWrap: {
    padding: '4px 16px 16px',
    height: 180,
  },
};

export default CapacityTrend;
