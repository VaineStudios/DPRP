import type { Alert } from '../../hooks/useAlerts';
import { getTimeSince } from '../../utils/shelter';

interface CriticalAlertsProps {
  alerts: Alert[];
  onAlertClick: (lat: number, lng: number, shelterId: string) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  red: '#ef4444',
  amber: '#f59e0b',
  gray: '#6b7280',
};

const CriticalAlerts = ({ alerts, onAlertClick }: CriticalAlertsProps) => {
  const alertCount = alerts.filter(a => a.type !== 'offline').length;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h3 style={styles.title}>Critical alerts</h3>
          {alertCount > 0 && (
            <span style={styles.badge}>{alertCount}</span>
          )}
        </div>
      </div>
      <div style={styles.list}>
        {alerts.length === 0 && (
          <p style={styles.empty}>No alerts</p>
        )}
        {alerts.map(alert => (
          <div
            key={alert.id}
            style={styles.alertRow}
            onClick={() => onAlertClick(alert.lat, alert.lng, alert.shelterId)}
          >
            <span
              style={{
                ...styles.dot,
                background: SEVERITY_COLORS[alert.severity],
              }}
            />
            <span style={styles.alertMsg}>{alert.message}</span>
            <span style={styles.alertTime}>
              {getTimeSince(new Date(alert.timestamp).toISOString())}
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
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px 20px 12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  badge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#fff',
    background: '#ef4444',
    borderRadius: '50%',
    width: 22,
    height: 22,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 340,
    overflowY: 'auto' as const,
    padding: '0 8px 8px',
  },
  alertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background 0.15s',
    animation: 'slideInAlert 0.3s ease-out',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  alertMsg: {
    fontSize: 13,
    color: 'var(--text-muted)',
    flex: 1,
    minWidth: 0,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  alertTime: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  empty: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '24px 20px',
  },
};

export default CriticalAlerts;
