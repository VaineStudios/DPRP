import { useState, useEffect, useRef } from 'react';

export interface NotificationItem {
  id: string;
  shelterId: string;
  shelterName: string;
  capacityLevel: number;
  waterLevel: number;
  lat: number;
  lng: number;
  timestamp: number;
}

interface NotificationPanelProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onOpen: () => void;
  onClick: (shelterId: string, lat: number, lng: number) => void;
}

const levelLabel = (level: number): string => {
  if (level <= 2) return 'Good';
  if (level === 3) return 'Fair';
  return 'Critical';
};

const levelColor = (level: number): string => {
  if (level <= 2) return '#22c55e';
  if (level === 3) return '#f59e0b';
  return '#ef4444';
};

const formatTime = (ts: number): string => {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
};

const NotificationPanel = ({ notifications, unreadCount, onOpen, onClick }: NotificationPanelProps) => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) onOpen();
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div style={styles.wrapper} ref={panelRef}>
      <button onClick={handleToggle} style={styles.bellBtn} title="Notifications">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <span style={styles.headerTitle}>Notifications</span>
            <span style={styles.headerCount}>{notifications.length} updates</span>
          </div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <p style={styles.empty}>No notifications yet</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  style={styles.item}
                  onClick={() => {
                    onClick(n.shelterId, n.lat, n.lng);
                    setOpen(false);
                  }}
                >
                  <div style={styles.itemTop}>
                    <span style={styles.itemName}>{n.shelterName}</span>
                    <span style={styles.itemTime}>{formatTime(n.timestamp)}</span>
                  </div>
                  <div style={styles.itemMetrics}>
                    <span style={{ ...styles.metric, color: levelColor(n.capacityLevel) }}>
                      Cap: {levelLabel(n.capacityLevel)} ({n.capacityLevel}/5)
                    </span>
                    <span style={{ ...styles.metric, color: levelColor(n.waterLevel) }}>
                      Water: {levelLabel(n.waterLevel)} ({n.waterLevel}/5)
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
  },
  bellBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    color: '#e2e8f0',
    background: 'transparent',
    border: '1px solid #475569',
    borderRadius: 6,
    cursor: 'pointer',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    padding: '0 5px',
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: '#ef4444',
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 340,
    background: 'var(--bg-card)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    zIndex: 100,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  headerCount: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  list: {
    maxHeight: 360,
    overflowY: 'auto' as const,
  },
  empty: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    textAlign: 'center' as const,
    padding: '24px 16px',
    margin: 0,
  },
  item: {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-light)',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  itemTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  itemTime: {
    fontSize: 11,
    color: 'var(--text-secondary)',
  },
  itemMetrics: {
    display: 'flex',
    gap: 12,
  },
  metric: {
    fontSize: 12,
    fontWeight: 500,
  },
};

export default NotificationPanel;
