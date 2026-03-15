import type { Shelter, UserResponse } from '../api/client';
import { getPinColor } from '../utils/shelter';

interface StatusBarProps {
  shelters: Shelter[];
  user: UserResponse;
  onLogout: () => void;
}

const StatusBar = ({ shelters, user, onLogout }: StatusBarProps) => {
  const total = shelters.length;
  const reporting = shelters.filter(s => s.latestUpdate !== null).length;
  const critical = shelters.filter(s => getPinColor(s) === '#ef4444').length;
  const offline = shelters.filter(s => getPinColor(s) === '#6b7280').length;

  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <h1 style={styles.title}>DPRP</h1>
      </div>

      <div style={styles.center}>
        <span style={styles.summary}>
          {total} shelters — {reporting} reporting, {critical} critical, {offline} offline
        </span>
      </div>

      <div style={styles.right}>
        <span style={styles.userName}>{user.name}</span>
        <button onClick={onLogout} style={styles.logout}>Sign out</button>
      </div>
    </div>
  );
};

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
  },
  summary: {
    fontSize: 14,
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
