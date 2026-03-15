import { useState, useCallback, useEffect } from 'react';
import IconSelector from '../components/IconSelector';
import ConnectionStatus from '../components/ConnectionStatus';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { useLatestUpdate } from '../hooks/useLatestUpdate';
import type { SelectedShelter } from '../hooks/useShelter';

interface UpdateFormProps {
  shelter: SelectedShelter;
  onClearShelter: () => void;
  onLogout: () => void;
}

const getLevelColor = (level: number, invert: boolean): string => {
  if (invert) {
    if (level <= 2) return '#ef4444';
    if (level === 3) return '#f59e0b';
    return '#22c55e';
  }
  if (level <= 2) return '#22c55e';
  if (level === 3) return '#f59e0b';
  return '#ef4444';
};

const UpdateForm = ({ shelter, onClearShelter, onLogout }: UpdateFormProps) => {
  const { latestUpdate, isLoading: loadingLatest, updateAfterSubmit } = useLatestUpdate(shelter.id);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [water, setWater] = useState<number | null>(null);
  const [food, setFood] = useState<number | null>(null);
  const [medical, setMedical] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const {
    submitUpdate: sendUpdate, queueLength, isFlushing,
    lastFlushResult, needsReauth, clearLastFlushResult,
  } = useOfflineQueue();

  // Show banner when flush completes
  useEffect(() => {
    if (!lastFlushResult) return;
    const { sent, failed } = lastFlushResult;
    if (sent > 0 && failed === 0) {
      setBanner({ type: 'success', message: `${sent} queued update${sent !== 1 ? 's' : ''} sent successfully!` });
    } else if (sent > 0) {
      setBanner({ type: 'warning', message: `${sent} of ${sent + failed} queued updates sent. ${failed} failed after 5 retries.` });
    } else if (failed > 0) {
      setBanner({ type: 'warning', message: `${failed} queued update${failed !== 1 ? 's' : ''} failed after 5 retries.` });
    }
    clearLastFlushResult();
    const timer = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(timer);
  }, [lastFlushResult, clearLastFlushResult]);

  // Pre-fill selectors when latest update loads (only once per shelter)
  useEffect(() => {
    if (latestUpdate && !prefilled) {
      setCapacity(latestUpdate.capacityLevel);
      setWater(latestUpdate.waterLevel);
      setFood(latestUpdate.foodLevel);
      setMedical(latestUpdate.medicalLevel);
      setPrefilled(true);
    }
  }, [latestUpdate, prefilled]);

  // Reset prefilled flag when shelter changes
  useEffect(() => {
    setPrefilled(false);
    setCapacity(null);
    setWater(null);
    setFood(null);
    setMedical(null);
    setNotes('');
  }, [shelter.id]);

  const allSet = capacity !== null && water !== null && food !== null && medical !== null;

  const handleSubmit = useCallback(async () => {
    if (!allSet || loading) return;

    setLoading(true);
    setBanner(null);

    try {
      const result = await sendUpdate({
        shelterId: shelter.id,
        capacityLevel: capacity!,
        waterLevel: water!,
        foodLevel: food!,
        medicalLevel: medical!,
        notes: notes.trim() || undefined,
      });

      if (result.queued) {
        setBanner({ type: 'warning', message: 'Update saved — will send when back online' });
      } else {
        setBanner({ type: 'success', message: 'Update sent!' });
      }

      updateAfterSubmit({
        capacityLevel: capacity!,
        waterLevel: water!,
        foodLevel: food!,
        medicalLevel: medical!,
        notes: notes.trim() || undefined,
      });

      setNotes('');
      setTimeout(() => setBanner(null), 5000);
    } catch (err) {
      console.error('Update failed:', err);
      setBanner({ type: 'error', message: err instanceof Error ? err.message : 'Update failed' });
      setTimeout(() => setBanner(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [allSet, capacity, water, food, medical, notes, shelter.id, loading, updateAfterSubmit, sendUpdate]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ConnectionStatus queueLength={queueLength} isFlushing={isFlushing} />

      {/* Header */}
      <div style={styles.header}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.shelterRow}>
            <h1 style={styles.shelterName}>{shelter.name}</h1>
            <button onClick={onClearShelter} type="button" style={styles.changeBtn}>
              Change
            </button>
          </div>
          <p style={styles.subtitle}>Status update</p>
        </div>
        <button onClick={onLogout} type="button" style={styles.logoutBtn}>
          Sign out
        </button>
      </div>

      {/* Reauth banner (persistent, takes priority) */}
      {needsReauth && (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 600,
          color: '#dc2626',
          background: '#fef2f2',
          border: '1px solid #fecaca',
        }}>
          Session expired — sign in again to send queued updates
        </div>
      )}

      {/* Banner */}
      {banner && !needsReauth && (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 600,
          color: banner.type === 'success' ? '#15803d' : banner.type === 'warning' ? '#92400e' : '#dc2626',
          background: banner.type === 'success' ? '#f0fdf4' : banner.type === 'warning' ? '#fffbeb' : '#fef2f2',
          border: `1px solid ${banner.type === 'success' ? '#bbf7d0' : banner.type === 'warning' ? '#fde68a' : '#fecaca'}`,
        }}>
          {banner.message}
        </div>
      )}

      {/* Current status */}
      <CurrentStatus update={latestUpdate} loading={loadingLatest} />

      {/* Icon selectors */}
      <div style={{ flex: 1 }}>
        <IconSelector
          label="How full is the shelter?"
          icon="people"
          value={capacity}
          onChange={setCapacity}
        />
        <IconSelector
          label="Water supply"
          icon="water"
          value={water}
          onChange={setWater}
          invertColors
        />
        <IconSelector
          label="Food supply"
          icon="food"
          value={food}
          onChange={setFood}
          invertColors
        />
        <IconSelector
          label="Medical supplies"
          icon="medical"
          value={medical}
          onChange={setMedical}
          invertColors
        />
      </div>

      {/* Notes */}
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value.slice(0, 280))}
        placeholder="Any urgent notes..."
        maxLength={280}
        rows={2}
        style={styles.notes}
      />

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allSet || loading}
        style={{
          ...styles.submitBtn,
          background: allSet && !loading ? '#2563eb' : '#94a3b8',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Spinner /> Sending...
          </span>
        ) : (
          'Send update'
        )}
      </button>
    </div>
  );
};

/* ── Current status bar ─────────────────────────────────── */

interface CurrentStatusProps {
  update: { capacityLevel: number; waterLevel: number; foodLevel: number; medicalLevel: number; createdAt: Date; isOffline: boolean } | null;
  loading: boolean;
}

const CurrentStatus = ({ update, loading }: CurrentStatusProps) => {
  // Re-render every 15s to update relative time
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!update) return;
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, [update]);

  if (loading) return null;

  if (!update) {
    return (
      <div style={statusStyles.container}>
        <span style={statusStyles.noData}>No previous reports for this shelter</span>
      </div>
    );
  }

  const timeLabel = update.isOffline
    ? `Last known status (offline)`
    : `Last reported ${getRelativeTime(update.createdAt)}`;

  const indicators: { label: string; level: number; invert: boolean }[] = [
    { label: 'Cap', level: update.capacityLevel, invert: false },
    { label: 'H₂O', level: update.waterLevel, invert: true },
    { label: 'Food', level: update.foodLevel, invert: true },
    { label: 'Med', level: update.medicalLevel, invert: true },
  ];

  return (
    <div style={statusStyles.container}>
      <div style={statusStyles.row}>
        <span style={statusStyles.timeLabel}>{timeLabel}</span>
        <div style={statusStyles.indicators}>
          {indicators.map((ind) => (
            <span key={ind.label} style={statusStyles.indicator}>
              <span
                style={{
                  ...statusStyles.dot,
                  background: getLevelColor(ind.level, ind.invert),
                }}
              />
              <span style={statusStyles.indicatorLabel}>{ind.label}</span>
              <span style={statusStyles.indicatorValue}>{ind.level}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const getRelativeTime = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const statusStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: '10px 12px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  timeLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
  },
  indicators: {
    display: 'flex',
    gap: 12,
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 13,
  },
  dot: {
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  indicatorLabel: {
    color: '#94a3b8',
    fontWeight: 500,
  },
  indicatorValue: {
    color: '#1e293b',
    fontWeight: 600,
  },
  noData: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};

/* ── Helpers ─────────────────────────────────────────────── */

const Spinner = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'spin 0.8s linear infinite' }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.3)" strokeWidth="3" fill="none" />
    <path d="M10 2a8 8 0 016.93 4" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 0 12px',
    gap: 8,
  },
  shelterRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  shelterName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  changeBtn: {
    minHeight: 'auto',
    padding: 0,
    fontSize: 13,
    fontWeight: 500,
    color: '#2563eb',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  logoutBtn: {
    minHeight: 36,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    background: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    flexShrink: 0,
  },
  notes: {
    marginBottom: 12,
    resize: 'none' as const,
  },
  submitBtn: {
    width: '100%',
    minHeight: 56,
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    marginBottom: 24,
  },
};

export default UpdateForm;
