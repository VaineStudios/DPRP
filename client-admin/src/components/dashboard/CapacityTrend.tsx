import { useMemo } from 'react';
import type { TrendPoint } from '../../hooks/useCapacityTrend';

interface CapacityTrendProps {
  dataPoints: TrendPoint[];
}

const VIEWBOX_W = 800;
const VIEWBOX_H = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_LEFT = 10;
const PAD_RIGHT = 10;
const PLOT_W = VIEWBOX_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VIEWBOX_H - PAD_TOP - PAD_BOTTOM;

const CapacityTrend = ({ dataPoints }: CapacityTrendProps) => {
  const { linePath, areaPath, circles, timeLabels, currentLabel } = useMemo(() => {
    if (dataPoints.length === 0) {
      return { linePath: '', areaPath: '', circles: [] as { cx: number; cy: number }[], timeLabels: [] as { x: number; text: string }[], currentLabel: null as null | { x: number; y: number; text: string } };
    }

    const xStep = dataPoints.length > 1
      ? PLOT_W / (dataPoints.length - 1)
      : 0;

    const points = dataPoints.map((dp, i) => {
      const x = PAD_LEFT + (dataPoints.length > 1 ? i * xStep : PLOT_W / 2);
      const y = PAD_TOP + PLOT_H - (dp.value / 100) * PLOT_H;
      return { x, y };
    });

    // Build smooth cubic bezier path
    let line = '';
    if (points.length === 1) {
      line = `M${points[0].x},${points[0].y}`;
    } else {
      line = `M${points[0].x},${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const tension = xStep * 0.3;
        line += ` C${prev.x + tension},${prev.y} ${curr.x - tension},${curr.y} ${curr.x},${curr.y}`;
      }
    }

    // Area path
    const last = points[points.length - 1];
    const first = points[0];
    const area = `${line} L${last.x},${PAD_TOP + PLOT_H} L${first.x},${PAD_TOP + PLOT_H} Z`;

    // Circles at each data point
    const circs = points.map(p => ({ cx: p.x, cy: p.y }));

    // Time labels (first and last)
    const fmt = (ts: number) => {
      const d = new Date(ts);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };
    const labels: { x: number; text: string }[] = [
      { x: points[0].x, text: fmt(dataPoints[0].timestamp) },
    ];
    if (dataPoints.length > 1) {
      labels.push({ x: last.x, text: fmt(dataPoints[dataPoints.length - 1].timestamp) });
    }

    // Current value label at last point
    const curLabel = {
      x: last.x,
      y: last.y - 10,
      text: `${Math.round(dataPoints[dataPoints.length - 1].value)}%`,
    };

    return { linePath: line, areaPath: area, circles: circs, timeLabels: labels, currentLabel: curLabel };
  }, [dataPoints]);

  // Zone boundaries
  const greenY = PAD_TOP + PLOT_H * 0.6;
  const amberY = PAD_TOP + PLOT_H * 0.4;
  const redY = PAD_TOP;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Network capacity trend</h3>
        <p style={styles.subtitle}>Average across reporting shelters — last 2 hours</p>
      </div>
      <div style={styles.chartWrap}>
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width="100%"
          height={160}
          preserveAspectRatio="none"
          style={styles.svg}
        >
          {/* Background zones */}
          <rect x={PAD_LEFT} y={redY} width={PLOT_W} height={amberY - redY} fill="#ef4444" opacity={0.05} />
          <rect x={PAD_LEFT} y={amberY} width={PLOT_W} height={greenY - amberY} fill="#f59e0b" opacity={0.05} />
          <rect x={PAD_LEFT} y={greenY} width={PLOT_W} height={PAD_TOP + PLOT_H - greenY} fill="#22c55e" opacity={0.05} />

          {/* Zone dividers */}
          <line x1={PAD_LEFT} y1={amberY} x2={PAD_LEFT + PLOT_W} y2={amberY} stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="6,4" />
          <line x1={PAD_LEFT} y1={greenY} x2={PAD_LEFT + PLOT_W} y2={greenY} stroke="#e2e8f0" strokeWidth={0.5} strokeDasharray="6,4" />

          {/* Zone labels */}
          <text x={PAD_LEFT + 4} y={redY + 12} fill="#ef4444" fontSize={9} opacity={0.6}>Critical</text>
          <text x={PAD_LEFT + 4} y={amberY + 12} fill="#f59e0b" fontSize={9} opacity={0.6}>Moderate</text>
          <text x={PAD_LEFT + 4} y={greenY + 12} fill="#22c55e" fontSize={9} opacity={0.6}>Good</text>

          {/* Area fill */}
          {areaPath && <path d={areaPath} fill="#0d9488" opacity={0.08} />}

          {/* Trend line */}
          {linePath && (
            <path d={linePath} fill="none" stroke="#0d9488" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Data point circles */}
          {circles.map((c, i) => (
            <circle key={i} cx={c.cx} cy={c.cy} r={3.5} fill="#0d9488" stroke="#fff" strokeWidth={1.5} />
          ))}

          {/* Current value label */}
          {currentLabel && (
            <text x={currentLabel.x} y={currentLabel.y} fill="#0d9488" fontSize={12} fontWeight={700} textAnchor="end">
              {currentLabel.text}
            </text>
          )}

          {/* Time labels */}
          {timeLabels.map((label, i) => (
            <text
              key={i}
              x={label.x}
              y={VIEWBOX_H - 4}
              fill="#94a3b8"
              fontSize={10}
              textAnchor={i === 0 ? 'start' : 'end'}
            >
              {label.text}
            </text>
          ))}
        </svg>
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
    padding: '8px 16px 16px',
  },
  svg: {
    display: 'block',
  },
};

export default CapacityTrend;
