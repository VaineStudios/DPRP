import { useState, useMemo } from 'react';
import type { Shelter, DisasterEvent } from '../../api/client';
import { isOffline } from '../../utils/shelter';

interface ParishBreakdownProps {
  shelters: Shelter[];
  activeEvent: DisasterEvent | null;
  onParishClick: (parish: string) => void;
}

interface ParishRow {
  name: string;
  shelterCount: number;
  criticalCount: number;
  reportingCount: number;
  avgCapacity: number; // 0-100
  severityScore: number;
}

const ParishBreakdown = ({ shelters, activeEvent, onParishClick }: ParishBreakdownProps) => {
  const [hoveredParish, setHoveredParish] = useState<string | null>(null);

  const parishes = useMemo((): ParishRow[] => {
    if (!activeEvent) return [];

    const affected = activeEvent.affectedParishes;
    return affected.map(parish => {
      const parishShelters = shelters.filter(s => s.parish === parish);
      const reporting = parishShelters.filter(s => s.latestUpdate && !isOffline(s));
      const critical = reporting.filter(s => s.latestUpdate!.capacityLevel >= 4);
      const avgCap = reporting.length > 0
        ? (reporting.reduce((sum, s) => sum + s.latestUpdate!.capacityLevel, 0) / reporting.length / 5) * 100
        : 0;
      const reportingRatio = parishShelters.length > 0
        ? reporting.length / parishShelters.length
        : 0;
      const severity = (critical.length * 3) + (avgCap / 20) + ((1 - reportingRatio) * 2);

      return {
        name: parish,
        shelterCount: parishShelters.length,
        criticalCount: critical.length,
        reportingCount: reporting.length,
        avgCapacity: Math.round(avgCap),
        severityScore: severity,
      };
    }).sort((a, b) => b.severityScore - a.severityScore);
  }, [shelters, activeEvent]);

  if (!activeEvent) {
    return <p style={styles.empty}>No active event</p>;
  }

  if (parishes.length === 0) {
    return <p style={styles.empty}>No affected parishes</p>;
  }

  const getBarColor = (pct: number): string => {
    if (pct >= 70) return '#ef4444';
    if (pct >= 40) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div style={styles.list}>
      {parishes.map(p => (
        <div
          key={p.name}
          style={{
            ...styles.row,
            background: hoveredParish === p.name ? '#1e293b' : 'transparent',
          }}
          onClick={() => onParishClick(p.name)}
          onMouseEnter={() => setHoveredParish(p.name)}
          onMouseLeave={() => setHoveredParish(null)}
        >
          <div style={styles.rowTop}>
            <span style={styles.parishName}>{p.name}</span>
            {p.criticalCount > 0 && (
              <span style={styles.critBadge}>{p.criticalCount}</span>
            )}
          </div>
          <div style={styles.barBg}>
            <div
              style={{
                ...styles.barFill,
                width: `${Math.max(p.avgCapacity, 2)}%`,
                background: getBarColor(p.avgCapacity),
              }}
            />
          </div>
          <span style={styles.rowSub}>
            {p.shelterCount} shelters, {p.criticalCount} critical
          </span>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 240,
    overflowY: 'auto' as const,
  },
  row: {
    padding: '8px 4px',
    borderBottom: '1px solid #1e293b',
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background 0.15s',
  },
  rowTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  parishName: {
    fontSize: 13,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  critBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: '#ef4444',
    borderRadius: 8,
    padding: '1px 6px',
    lineHeight: '16px',
  },
  barBg: {
    width: '100%',
    height: 4,
    background: '#334155',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  rowSub: {
    fontSize: 11,
    color: '#94a3b8',
  },
  empty: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center' as const,
    padding: '16px 0',
  },
};

export default ParishBreakdown;
