import type { Shelter } from '../api/client';
import { getPinColor } from '../utils/shelter';

interface StatusBarProps {
  shelters: Shelter[];
  onLogout: () => void;
}

const StatusBar = ({ shelters, onLogout }: StatusBarProps) => {
  const total = shelters.length;
  const green = shelters.filter(s => getPinColor(s) === '#22c55e').length;
  const amber = shelters.filter(s => getPinColor(s) === '#f59e0b').length;
  const red = shelters.filter(s => getPinColor(s) === '#ef4444').length;
  const gray = shelters.filter(s => getPinColor(s) === '#6b7280').length;

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <h1 style={styles.title}>DPRP</h1>
        <span style={styles.divider} />
        <span style={styles.label}>{total} Shelters</span>
      </div>

      <div style={styles.stats}>
        <Badge color="#22c55e" count={green} label="Good" />
        <Badge color="#f59e0b" count={amber} label="Moderate" />
        <Badge color="#ef4444" count={red} label="Critical" />
        <Badge color="#6b7280" count={gray} label="Offline" />
      </div>

      <button onClick={onLogout} style={styles.logout}>Logout</button>
    </div>
  );
};

const Badge = ({ color, count, label }: { color: string; count: number; label: string }) => (
  <div style={styles.badge}>
    <span style={{ ...styles.dot, background: color }} />
    <span style={styles.badgeText}>{count} {label}</span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    height: 52,
    background: '#1e293b',
    color: '#fff',
    flexShrink: 0,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.5px',
  },
  divider: {
    width: 1,
    height: 24,
    background: '#475569',
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
  },
  stats: {
    display: 'flex',
    gap: 16,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  badgeText: {
    fontSize: 13,
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
