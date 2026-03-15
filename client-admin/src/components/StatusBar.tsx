import type { Shelter, UserResponse, DisasterEvent } from '../api/client';
import { getPinColor } from '../utils/shelter';

interface StatusBarProps {
  shelters: Shelter[];
  user: UserResponse;
  onLogout: () => void;
  activeEvent: DisasterEvent | null;
  activeTab: 'response' | 'preparedness';
  onTabChange: (tab: 'response' | 'preparedness') => void;
}

const statusColors: Record<string, string> = {
  PREPARING: '#3b82f6',
  ACTIVE: '#ef4444',
  RECOVERY: '#f59e0b',
  CLOSED: '#6b7280',
};

const StatusBar = ({ shelters, user, onLogout, activeEvent, activeTab, onTabChange }: StatusBarProps) => {
  const total = shelters.length;
  const colors = shelters.map(getPinColor);
  const available = colors.filter(c => c === '#22c55e').length;
  const moderate = colors.filter(c => c === '#f59e0b').length;
  const critical = colors.filter(c => c === '#ef4444').length;
  const offline = colors.filter(c => c === '#6b7280').length;

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <h1 style={styles.title}>DPRP</h1>
        <div style={styles.tabs}>
          <button
            style={activeTab === 'response' ? styles.tabActive : styles.tab}
            onClick={() => onTabChange('response')}
          >
            Live response
          </button>
          <button
            style={activeTab === 'preparedness' ? styles.tabActive : styles.tab}
            onClick={() => onTabChange('preparedness')}
          >
            Preparedness
          </button>
        </div>
      </div>

      <div style={styles.center}>
        {activeEvent ? (
          <div style={styles.eventInfo}>
            <span style={{
              ...styles.eventBadge,
              background: statusColors[activeEvent.status] || '#6b7280',
            }}>
              {activeEvent.status}
            </span>
            <span style={styles.eventName}>
              {activeEvent.name}
              {activeEvent.category ? ` (Cat ${activeEvent.category})` : ''}
            </span>
          </div>
        ) : (
          <span style={styles.noEvent}>No active disaster event</span>
        )}
        <span style={styles.sep}>&mdash;</span>
        <span style={styles.total}>{total} shelters</span>
        <StatusDot color="#22c55e" count={available} label="ok" />
        <StatusDot color="#f59e0b" count={moderate} label="mod" />
        <StatusDot color="#ef4444" count={critical} label="crit" />
        <StatusDot color="#6b7280" count={offline} label="off" />
      </div>

      <div style={styles.right}>
        <span style={styles.userName}>{user.name}</span>
        <button onClick={onLogout} style={styles.logout}>Sign out</button>
      </div>
    </div>
  );
};

const StatusDot = ({ color, count, label }: { color: string; count: number; label: string }) => (
  <span style={styles.dotGroup}>
    <span style={{ ...styles.dot, background: color }} />
    <span style={styles.dotCount}>{count}</span>
    <span style={styles.dotLabel}>{label}</span>
  </span>
);

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 48,
    background: '#1e293b',
    color: '#fff',
    flexShrink: 0,
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  tabs: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '4px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#94a3b8',
    background: 'transparent',
    border: '1px solid #475569',
    borderRadius: 4,
    cursor: 'pointer',
  },
  tabActive: {
    padding: '4px 12px',
    fontSize: 13,
    fontWeight: 600,
    color: '#fff',
    background: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: 4,
    cursor: 'pointer',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  eventInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  eventBadge: {
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 4,
    color: '#fff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  eventName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#e2e8f0',
  },
  noEvent: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  total: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: 600,
  },
  sep: {
    color: '#475569',
    margin: '0 4px',
  },
  dotGroup: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    marginLeft: 8,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  dotCount: {
    fontSize: 13,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  dotLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  logout: {
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    background: 'transparent',
    border: '1px solid #475569',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default StatusBar;
