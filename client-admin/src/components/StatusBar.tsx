import type { Shelter, UserResponse } from '../api/client';
import { getPinColor } from '../utils/shelter';

interface StatusBarProps {
  shelters: Shelter[];
  user: UserResponse;
  onLogout: () => void;
}

const StatusBar = ({ shelters, user, onLogout }: StatusBarProps) => {
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
      </div>

      <div style={styles.center}>
        <span style={styles.total}>{total} shelters</span>
        <span style={styles.sep}>&mdash;</span>
        <StatusDot color="#22c55e" count={available} label="available" />
        <StatusDot color="#f59e0b" count={moderate} label="moderate" />
        <StatusDot color="#ef4444" count={critical} label="critical" />
        <StatusDot color="#6b7280" count={offline} label="offline" />
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
    height: 56,
    background: '#1e293b',
    color: '#fff',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
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
    gap: 4,
    marginLeft: 12,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  dotCount: {
    fontSize: 14,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  dotLabel: {
    fontSize: 12,
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
