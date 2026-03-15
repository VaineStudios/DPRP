import type { DisasterEvent } from '../api/client';

interface DisasterSelectorProps {
  disasters: DisasterEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColors: Record<string, string> = {
  PREPARING: '#3b82f6',
  ACTIVE: '#ef4444',
  RECOVERY: '#f59e0b',
  CLOSED: '#6b7280',
};

const DisasterSelector = ({ disasters, selectedId, onSelect }: DisasterSelectorProps) => {
  return (
    <div style={styles.container}>
      <label style={styles.label}>Disaster event</label>
      <div style={styles.selectWrap}>
        <select
          style={styles.select}
          value={selectedId || ''}
          onChange={e => onSelect(e.target.value)}
        >
          <option value="" disabled>Select an event...</option>
          {disasters.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.status})
            </option>
          ))}
        </select>
      </div>
      {selectedId && (() => {
        const event = disasters.find(d => d.id === selectedId);
        if (!event) return null;
        return (
          <div style={styles.detail}>
            <span style={{
              ...styles.badge,
              background: statusColors[event.status] || '#6b7280',
            }}>
              {event.status}
            </span>
            {event.category && <span style={styles.meta}>Cat {event.category}</span>}
            {event.windSpeedMph && <span style={styles.meta}>{event.windSpeedMph} mph</span>}
          </div>
        );
      })()}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0 0 12px',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    color: '#64748b',
    letterSpacing: '0.5px',
    marginBottom: 4,
    display: 'block',
  },
  selectWrap: {
    marginTop: 4,
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: '#fff',
    color: '#1e293b',
    cursor: 'pointer',
  },
  detail: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  badge: {
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
};

export default DisasterSelector;
