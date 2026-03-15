import { useState, useEffect, useCallback, useRef } from 'react';
import { sendBroadcast, getBroadcasts } from '../api/client';
import type { DisasterEvent, BroadcastMessage } from '../api/client';

interface BroadcastComposerProps {
  activeEvent: DisasterEvent | null;
}

const BroadcastComposer = ({ activeEvent }: BroadcastComposerProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'HIGH' | 'CRITICAL'>('HIGH');
  const [allShelters, setAllShelters] = useState(true);
  const [selectedParishes, setSelectedParishes] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState<BroadcastMessage[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const parishes = activeEvent?.affectedParishes ?? [];

  // Fetch recent broadcasts when composer opens
  useEffect(() => {
    if (!open) return;
    getBroadcasts(5).then(setRecentBroadcasts).catch(() => {});
  }, [open]);

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

  const toggleParish = useCallback((parish: string) => {
    setSelectedParishes(prev => {
      const next = new Set(prev);
      if (next.has(parish)) next.delete(parish);
      else next.add(parish);
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!message.trim() || sending) return;

    const targetParishes = allShelters ? [] : Array.from(selectedParishes);
    if (!allShelters && targetParishes.length === 0) return;

    setSending(true);
    setResult(null);

    try {
      const broadcast = await sendBroadcast({
        message: message.trim(),
        targetParishes,
        priority,
        disasterEventId: activeEvent?.id,
      });

      setResult({ type: 'success', text: `Broadcast sent${targetParishes.length ? ` to ${targetParishes.join(', ')}` : ' to all shelters'}` });
      setMessage('');
      setRecentBroadcasts(prev => [broadcast, ...prev].slice(0, 5));
      setTimeout(() => {
        setResult(null);
        setOpen(false);
      }, 2500);
    } catch (err) {
      setResult({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send' });
    } finally {
      setSending(false);
    }
  }, [message, sending, allShelters, selectedParishes, priority, activeEvent?.id]);

  return (
    <div style={styles.wrapper} ref={panelRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        style={styles.triggerBtn}
        title="Send broadcast"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 1 0 8" />
          <path d="M21 5a10 10 0 0 1 0 14" />
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
        </svg>
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <h3 style={styles.title}>Broadcast message</h3>
            <button onClick={() => setOpen(false)} style={styles.closeBtn}>&times;</button>
          </div>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 500))}
            placeholder="Type your message to shelter managers..."
            rows={3}
            style={styles.textarea}
          />
          <div style={styles.charCount}>{message.length}/500</div>

          {/* Priority toggle */}
          <div style={styles.row}>
            <span style={styles.label}>Priority:</span>
            <button
              onClick={() => setPriority('HIGH')}
              style={priority === 'HIGH' ? styles.priorityActive : styles.priorityBtn}
            >
              HIGH
            </button>
            <button
              onClick={() => setPriority('CRITICAL')}
              style={{
                ...(priority === 'CRITICAL' ? styles.priorityActive : styles.priorityBtn),
                ...(priority === 'CRITICAL' ? { background: '#dc2626', borderColor: '#dc2626' } : {}),
              }}
            >
              CRITICAL
            </button>
          </div>

          {/* Parish targeting */}
          <div style={styles.row}>
            <span style={styles.label}>Target:</span>
            <button
              onClick={() => setAllShelters(true)}
              style={allShelters ? styles.priorityActive : styles.priorityBtn}
            >
              All shelters
            </button>
            <button
              onClick={() => setAllShelters(false)}
              style={!allShelters ? styles.priorityActive : styles.priorityBtn}
            >
              Select parishes
            </button>
          </div>

          {!allShelters && parishes.length > 0 && (
            <div style={styles.parishGrid}>
              {parishes.map(p => (
                <label key={p} style={styles.parishLabel}>
                  <input
                    type="checkbox"
                    checked={selectedParishes.has(p)}
                    onChange={() => toggleParish(p)}
                  />
                  <span style={{ marginLeft: 4 }}>{p}</span>
                </label>
              ))}
            </div>
          )}

          {/* Result banner */}
          {result && (
            <div style={{
              ...styles.resultBanner,
              color: result.type === 'success' ? '#15803d' : '#dc2626',
              background: result.type === 'success' ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            }}>
              {result.text}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending || (!allShelters && selectedParishes.size === 0)}
            style={{
              ...styles.sendBtn,
              opacity: !message.trim() || sending ? 0.5 : 1,
            }}
          >
            {sending ? 'Sending...' : 'Send broadcast'}
          </button>

          {/* Recent broadcasts */}
          {recentBroadcasts.length > 0 && (
            <div style={styles.recentSection}>
              <p style={styles.recentTitle}>Recent broadcasts</p>
              {recentBroadcasts.map(b => (
                <div key={b.id} style={styles.recentItem}>
                  <span style={{
                    ...styles.recentPriority,
                    background: b.priority === 'CRITICAL' ? '#fef2f2' : '#fffbeb',
                    color: b.priority === 'CRITICAL' ? '#dc2626' : '#92400e',
                  }}>
                    {b.priority}
                  </span>
                  <span style={styles.recentMsg}>{b.message.slice(0, 80)}{b.message.length > 80 ? '...' : ''}</span>
                  <span style={styles.recentTime}>{formatTime(b.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const now = Date.now();
  const diffMin = Math.floor((now - d.getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return d.toLocaleDateString();
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
  },
  triggerBtn: {
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
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 380,
    background: 'var(--bg-card)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-lg)',
    padding: 16,
    zIndex: 10000,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
  closeBtn: {
    fontSize: 20,
    color: 'var(--text-secondary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid var(--border)',
    borderRadius: 8,
    resize: 'none' as const,
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
  },
  charCount: {
    textAlign: 'right' as const,
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 2,
    marginBottom: 8,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    minWidth: 60,
  },
  priorityBtn: {
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    background: 'var(--bg-card-alt)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    cursor: 'pointer',
  },
  priorityActive: {
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: 4,
    cursor: 'pointer',
  },
  parishGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginBottom: 12,
    padding: '8px 12px',
    background: 'var(--bg-card-alt)',
    borderRadius: 8,
  },
  parishLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 13,
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  resultBanner: {
    padding: '8px 12px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  sendBtn: {
    width: '100%',
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 700,
    color: '#fff',
    background: '#1e293b',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  recentSection: {
    marginTop: 12,
    borderTop: '1px solid var(--border)',
    paddingTop: 10,
  },
  recentTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 6px',
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 0',
    fontSize: 13,
    borderBottom: '1px solid var(--border-light)',
  },
  recentPriority: {
    padding: '1px 6px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    flexShrink: 0,
  },
  recentMsg: {
    flex: 1,
    color: 'var(--text-primary)',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  recentTime: {
    color: 'var(--text-secondary)',
    fontSize: 12,
    flexShrink: 0,
  },
};

export default BroadcastComposer;
