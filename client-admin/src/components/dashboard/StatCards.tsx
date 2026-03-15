import { useState, useEffect, useRef } from 'react';
import type { NetworkStats } from '../../hooks/useNetworkStats';

interface StatCardsProps {
  stats: NetworkStats;
}

const useAnimatedValue = (target: number): number => {
  const [display, setDisplay] = useState(target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (prevTarget.current === target) return;
    const from = prevTarget.current;
    prevTarget.current = target;
    const start = performance.now();
    const duration = 400;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return display;
};

const StatCards = ({ stats }: StatCardsProps) => {
  const animReporting = useAnimatedValue(stats.reportingShelters);
  const animCritical = useAnimatedValue(stats.criticalCount);
  const animResources = useAnimatedValue(stats.resourceWarningCount);
  const animAvg = useAnimatedValue(stats.avgCapacityPercent);

  const avgAccentColor =
    stats.avgCapacityPercent > 80 ? '#ef4444' :
    stats.avgCapacityPercent > 60 ? '#f59e0b' : '#3b82f6';

  const cards = [
    {
      label: 'Shelters reporting',
      value: `${animReporting} / ${stats.totalShelters}`,
      accent: '#0d9488',
      valueColor: '#1e293b',
    },
    {
      label: 'Critical',
      value: String(animCritical),
      accent: '#ef4444',
      valueColor: stats.criticalCount > 0 ? '#ef4444' : '#1e293b',
    },
    {
      label: 'Resource warnings',
      value: String(animResources),
      accent: '#f59e0b',
      valueColor: '#1e293b',
    },
    {
      label: 'Avg. capacity',
      value: `${animAvg}%`,
      accent: avgAccentColor,
      valueColor: '#1e293b',
    },
  ];

  return (
    <div className="stat-cards-grid" style={styles.grid}>
      {cards.map(card => (
        <div key={card.label} style={styles.card}>
          <div style={{ ...styles.accent, background: card.accent }} />
          <div style={styles.content}>
            <div style={{ ...styles.value, color: card.valueColor }}>{card.value}</div>
            <div style={styles.label}>{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'stretch',
    minHeight: 80,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    borderRadius: '4px 0 0 4px',
    flexShrink: 0,
  },
  content: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  value: {
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1.1,
    animation: 'countUp 0.4s ease-out',
  },
  label: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
};

export default StatCards;
