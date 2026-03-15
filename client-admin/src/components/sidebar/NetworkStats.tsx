import { useState, useEffect, useRef } from 'react';
import type { Shelter } from '../../api/client';
import { isOffline } from '../../utils/shelter';

interface NetworkStatsProps {
  shelters: Shelter[];
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
      // ease-out
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

const NetworkStats = ({ shelters }: NetworkStatsProps) => {
  const total = shelters.length;

  const reporting = shelters.filter(s => s.latestUpdate && !isOffline(s));
  const reportingCount = reporting.length;

  const criticalCount = reporting.filter(
    s => s.latestUpdate!.capacityLevel >= 4
  ).length;

  const resourceLowCount = reporting.filter(s => {
    const u = s.latestUpdate!;
    return u.waterLevel <= 2 || u.foodLevel <= 2 || u.medicalLevel <= 2;
  }).length;

  const avgCapacity = reportingCount > 0
    ? Math.round(
        (reporting.reduce((sum, s) => sum + s.latestUpdate!.capacityLevel, 0) /
          reportingCount /
          5) *
          100
      )
    : 0;

  const animatedReporting = useAnimatedValue(reportingCount);
  const animatedCritical = useAnimatedValue(criticalCount);
  const animatedResourceLow = useAnimatedValue(resourceLowCount);
  const animatedAvgCapacity = useAnimatedValue(avgCapacity);

  const cards = [
    {
      label: 'REPORTING',
      value: `${animatedReporting} / ${total}`,
      color: '#5DCAA5',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1v14M4 5v10M12 3v12M1 9v6M15 7v8" stroke="#5DCAA5" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'CRITICAL',
      value: String(animatedCritical),
      color: '#ef4444',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1L15 14H1L8 1z" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 6v4M8 12v0.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'RESOURCES LOW',
      value: String(animatedResourceLow),
      color: '#f59e0b',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="12" height="8" rx="1" stroke="#f59e0b" strokeWidth="1.5" />
          <path d="M5 6V4a3 3 0 016 0v2" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'AVG. CAPACITY',
      value: `${animatedAvgCapacity}%`,
      color: '#3b82f6',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="#3b82f6" strokeWidth="1.5" />
          <path d="M8 4v4l3 2" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div style={styles.grid}>
      {cards.map(card => (
        <div key={card.label} style={styles.card}>
          <div style={styles.cardTop}>
            {card.icon}
            <span style={{ ...styles.cardLabel, color: card.color }}>{card.label}</span>
          </div>
          <div style={{ ...styles.cardValue, color: card.color }}>{card.value}</div>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  card: {
    background: '#1e293b',
    borderRadius: 6,
    padding: '10px 12px',
    minHeight: 72,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1,
    animation: 'countUp 0.4s ease-out',
  },
};

export default NetworkStats;
