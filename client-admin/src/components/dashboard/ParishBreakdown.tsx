import { useState } from 'react';
import type { ParishStat } from '../../hooks/useNetworkStats';

interface ParishBreakdownProps {
  parishStats: ParishStat[];
  onParishClick: (parish: string) => void;
}

const getBarColor = (avgCap: number): string => {
  if (avgCap > 3.5) return '#ef4444';
  if (avgCap >= 2.5) return '#f59e0b';
  return '#22c55e';
};

const ParishBreakdown = ({ parishStats, onParishClick }: ParishBreakdownProps) => {
  const [hoveredParish, setHoveredParish] = useState<string | null>(null);

  if (parishStats.length === 0) {
    return (
      <div style={styles.card}>
        <div style={styles.header}>
          <h3 style={styles.title}>Parish breakdown</h3>
          <p style={styles.subtitle}>Affected parishes ranked by severity</p>
        </div>
        <p style={styles.empty}>No affected parishes</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Parish breakdown</h3>
        <p style={styles.subtitle}>Affected parishes ranked by severity</p>
      </div>
      <div style={styles.list}>
        {parishStats.map((p, i) => (
          <div
            key={p.parish}
            style={{
              ...styles.row,
              background: hoveredParish === p.parish ? 'var(--bg-card-hover)' : 'transparent',
              borderBottom: i < parishStats.length - 1 ? '1px solid var(--border-light)' : 'none',
            }}
            onClick={() => onParishClick(p.parish)}
            onMouseEnter={() => setHoveredParish(p.parish)}
            onMouseLeave={() => setHoveredParish(null)}
          >
            <div style={styles.rowTop}>
              <span style={styles.parishName}>{p.parish}</span>
              {p.criticalCount > 0 && (
                <span style={styles.critBadge}>{p.criticalCount}</span>
              )}
            </div>
            <div style={styles.barBg}>
              <div
                style={{
                  ...styles.barFill,
                  width: `${Math.max((p.avgCapacity / 5) * 100, 2)}%`,
                  background: getBarColor(p.avgCapacity),
                }}
              />
            </div>
            <span style={styles.rowSub}>
              {p.shelterCount} shelters &middot; {p.criticalCount} critical &middot; {p.offlineCount} offline
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    boxShadow: 'var(--shadow)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px 12px',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: '2px 0 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 420,
    overflowY: 'auto' as const,
  },
  row: {
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  rowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  parishName: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  critBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    background: '#ef4444',
    borderRadius: 8,
    padding: '1px 7px',
    lineHeight: '18px',
  },
  barBg: {
    width: '100%',
    height: 6,
    background: 'var(--border-light)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  rowSub: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  empty: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '24px 20px',
  },
};

export default ParishBreakdown;
