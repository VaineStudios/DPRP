import { useState, useEffect } from 'react';
import type { DisasterEvent } from '../../api/client';

interface EventOverviewProps {
  event: DisasterEvent | null;
  onCreateEvent?: () => void;
}

const EventOverview = ({ event, onCreateEvent }: EventOverviewProps) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!event?.landfallDate) {
      setCountdown('');
      return;
    }
    const update = () => {
      const diff = new Date(event.landfallDate!).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('Landfall imminent');
        return;
      }
      const days = Math.floor(diff / 86400_000);
      const hours = Math.floor((diff % 86400_000) / 3600_000);
      const minutes = Math.floor((diff % 3600_000) / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1000);
      setCountdown(`${days > 0 ? `${days}d ` : ''}${hours}h ${minutes}m ${seconds}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [event?.landfallDate]);

  if (!event) {
    return (
      <div style={styles.card}>
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No approaching events in PREPARING status.</p>
          <p style={styles.emptySubtext}>Create one from disaster management to begin preparedness planning.</p>
          {onCreateEvent && (
            <button style={styles.createBtn} onClick={onCreateEvent}>
              Create event
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.eventName}>{event.name}</h2>
          <div style={styles.metaRow}>
            {event.category && (
              <span style={styles.categoryBadge}>Category {event.category}</span>
            )}
            {event.windSpeedMph && (
              <span style={styles.metaItem}>{event.windSpeedMph} mph</span>
            )}
            {event.landfallDate && (
              <span style={styles.metaItem}>
                Landfall: {new Date(event.landfallDate).toLocaleDateString('en-JM', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
        <div style={styles.irisStatusPill}>
          <span style={styles.irisGreenDot} />
          IRIS: Monitoring
        </div>
      </div>

      <div style={styles.parishRow}>
        <span style={styles.parishLabel}>Affected parishes:</span>
        <div style={styles.parishBadges}>
          {event.affectedParishes.map(p => (
            <span key={p} style={styles.parishBadge}>{p}</span>
          ))}
        </div>
      </div>

      {countdown && (
        <div style={styles.countdownWrap}>
          <span style={styles.countdownLabel}>Estimated landfall in</span>
          <span style={styles.countdownValue}>{countdown}</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '20px 24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
  },
  metaRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap' as const,
  },
  categoryBadge: {
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 700,
    background: '#3b82f6',
    color: '#fff',
    borderRadius: 4,
    textTransform: 'uppercase' as const,
  },
  metaItem: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
  },
  irisStatusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#059669',
    background: '#ecfdf5',
    borderRadius: 20,
    border: '1px solid #a7f3d0',
  },
  irisGreenDot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
    animation: 'irisPulse 2s ease-in-out infinite',
  },
  parishRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  parishLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  parishBadges: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
  },
  parishBadge: {
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
    color: '#1e40af',
    background: '#eff6ff',
    borderRadius: 4,
    border: '1px solid #bfdbfe',
  },
  countdownWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: '#fffbeb',
    borderRadius: 8,
    border: '1px solid #fde68a',
  },
  countdownLabel: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: 500,
  },
  countdownValue: {
    fontSize: 20,
    fontWeight: 800,
    color: '#b45309',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.5px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px 0',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#64748b',
    margin: '0 0 4px',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    margin: '0 0 16px',
  },
  createBtn: {
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default EventOverview;
