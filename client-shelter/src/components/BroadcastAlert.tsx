import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../api/socket';

interface BroadcastPayload {
  id: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetParishes: string[];
  sentBy: string;
  createdAt: string;
}

interface StoredBroadcast extends BroadcastPayload {
  dismissed: boolean;
}

const STORAGE_KEY = 'dprp_broadcasts';
const MAX_STORED = 20;

const readBroadcasts = (): StoredBroadcast[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeBroadcasts = (broadcasts: StoredBroadcast[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(broadcasts.slice(0, MAX_STORED)));
  } catch { /* ignore */ }
};

const BroadcastAlert = () => {
  const [broadcasts, setBroadcasts] = useState<StoredBroadcast[]>(readBroadcasts);

  // Listen for incoming broadcasts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleBroadcast = (payload: BroadcastPayload) => {
      setBroadcasts(prev => {
        const updated = [
          { ...payload, dismissed: false },
          ...prev.filter(b => b.id !== payload.id),
        ];
        writeBroadcasts(updated);
        return updated;
      });
    };

    socket.on('broadcast:message', handleBroadcast);
    return () => { socket.off('broadcast:message', handleBroadcast); };
  }, []);

  // Auto-dismiss HIGH priority after 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBroadcasts(prev => {
        let changed = false;
        const updated = prev.map(b => {
          if (
            !b.dismissed &&
            b.priority !== 'CRITICAL' &&
            now - new Date(b.createdAt).getTime() > 5 * 60 * 1000
          ) {
            changed = true;
            return { ...b, dismissed: true };
          }
          return b;
        });
        if (changed) writeBroadcasts(updated);
        return changed ? updated : prev;
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = useCallback((id: string) => {
    setBroadcasts(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, dismissed: true } : b);
      writeBroadcasts(updated);
      return updated;
    });
  }, []);

  const visible = broadcasts.filter(b => !b.dismissed);
  const shown = visible.slice(0, 3);
  const remaining = visible.length - 3;

  if (shown.length === 0) return null;

  return (
    <div style={styles.container}>
      {shown.map(b => {
        const isCritical = b.priority === 'CRITICAL';
        return (
          <div
            key={b.id}
            style={{
              ...styles.alert,
              background: isCritical ? '#fef2f2' : '#fffbeb',
              border: `1px solid ${isCritical ? '#fecaca' : '#fde68a'}`,
              ...(isCritical ? { animation: 'broadcastPulse 2s ease-in-out infinite' } : {}),
            }}
          >
            <style>{`
              @keyframes broadcastPulse {
                0%, 100% { border-color: #fecaca; }
                50% { border-color: #ef4444; }
              }
            `}</style>
            <div style={styles.alertHeader}>
              <span style={{
                ...styles.badge,
                background: isCritical ? '#dc2626' : '#f59e0b',
                color: '#fff',
              }}>
                {b.priority}
              </span>
              <span style={styles.time}>{formatTime(b.createdAt)}</span>
              <button
                onClick={() => dismiss(b.id)}
                style={styles.dismissBtn}
                aria-label="Dismiss"
              >
                &times;
              </button>
            </div>
            <p style={{
              ...styles.message,
              color: isCritical ? '#991b1b' : '#92400e',
            }}>
              {b.message}
            </p>
          </div>
        );
      })}
      {remaining > 0 && (
        <p style={styles.more}>{remaining} more broadcast{remaining !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 12,
  },
  alert: {
    borderRadius: 8,
    padding: '10px 12px',
  },
  alertHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  badge: {
    padding: '1px 6px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  time: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
  },
  dismissBtn: {
    fontSize: 20,
    color: '#94a3b8',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 2px',
    lineHeight: 1,
  },
  message: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.4,
  },
  more: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center' as const,
    margin: 0,
  },
};

export default BroadcastAlert;
