import { useState, useEffect } from 'react';
import type { DisasterEvent, EventTimelineResponse } from '../../api/client';
import { getDisasters, getEventTimeline } from '../../api/client';

interface HistoricalComparisonProps {
  approachingEvent: DisasterEvent | null;
}

interface EventStats {
  event: DisasterEvent;
  timeline: EventTimelineResponse;
}

const HistoricalComparison = ({ approachingEvent }: HistoricalComparisonProps) => {
  const [eventStats, setEventStats] = useState<EventStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const allEvents = await getDisasters();
        const closedEvents = allEvents.filter(e => e.status === 'CLOSED');

        const stats = await Promise.all(
          closedEvents.map(async (event) => {
            try {
              const timeline = await getEventTimeline(event.id);
              return { event, timeline };
            } catch {
              return null;
            }
          })
        );

        setEventStats(stats.filter((s): s is EventStats => s !== null));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const isSimilar = (past: DisasterEvent) => {
    if (!approachingEvent) return false;
    const catMatch = past.category && approachingEvent.category &&
      Math.abs(past.category - approachingEvent.category) <= 1;
    const parishOverlap = past.affectedParishes.some(p =>
      approachingEvent.affectedParishes.includes(p)
    );
    return catMatch && parishOverlap;
  };

  if (loading) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Historical reference</h3>
        <p style={styles.subtitle}>Past events in the IRIS database</p>
        <p style={styles.loadingText}>Loading historical data...</p>
      </div>
    );
  }

  if (eventStats.length === 0) {
    return (
      <div style={styles.card}>
        <h3 style={styles.title}>Historical reference</h3>
        <p style={styles.subtitle}>Past events in the IRIS database</p>
        <p style={styles.emptyText}>No closed events with historical data available.</p>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Historical reference</h3>
      <p style={styles.subtitle}>Past events in the IRIS database</p>

      <div style={styles.grid}>
        {eventStats.map(({ event, timeline }) => {
          const similar = isSimilar(event);
          const s = timeline.summary;
          const duration = event.endDate && event.startDate
            ? Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / 3600_000)
            : null;

          return (
            <div
              key={event.id}
              style={{
                ...styles.eventCard,
                ...(similar ? styles.similarCard : {}),
              }}
            >
              {similar && (
                <span style={styles.similarBadge}>Most similar to approaching event</span>
              )}
              <h4 style={styles.eventName}>{event.name}</h4>
              <div style={styles.eventMeta}>
                {event.category && <span>Category {event.category}</span>}
                {event.windSpeedMph && <span>{event.windSpeedMph} mph</span>}
              </div>

              <div style={styles.statsGrid}>
                <StatRow label="Duration" value={duration ? `${duration} hrs` : 'N/A'} />
                <StatRow label="Shelters affected" value={String(s.sheltersReporting)} />
                <StatRow label="Peak avg capacity" value={`${Math.round(s.peakAvgCapacity / 5 * 100)}%`} />
                <StatRow label="Critical capacity" value={String(s.criticalCount)} highlight={s.criticalCount > 0} />
                <StatRow label="Critical resources" value={String(s.criticalResourceCount)} highlight={s.criticalResourceCount > 0} />
                <StatRow label="Time to 50% cap" value={s.timeToFiftyPercent != null ? `${s.timeToFiftyPercent}h` : 'N/A'} />
                <StatRow label="Time to 80% cap" value={s.timeToEightyPercent != null ? `${s.timeToEightyPercent}h` : 'N/A'} />
                <StatRow label="Most affected" value={s.mostAffectedParish || 'N/A'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div style={styles.statRow}>
    <span style={styles.statLabel}>{label}</span>
    <span style={{ ...styles.statValue, ...(highlight ? { color: '#ef4444', fontWeight: 700 } : {}) }}>
      {value}
    </span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    boxShadow: 'var(--shadow)',
    padding: '20px 24px',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 2px',
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    margin: '0 0 16px',
  },
  loadingText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  emptyText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '20px 0',
    fontStyle: 'italic',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 12,
  },
  eventCard: {
    background: 'var(--bg-card-alt)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '14px 16px',
  },
  similarCard: {
    border: '2px solid #3b82f6',
    background: 'var(--bg-card-hover)',
  },
  similarBadge: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 700,
    color: '#1d4ed8',
    background: '#dbeafe',
    padding: '2px 8px',
    borderRadius: 3,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  eventName: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 4px',
  },
  eventMeta: {
    display: 'flex',
    gap: 10,
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 10,
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid var(--border-light)',
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
};

export default HistoricalComparison;
