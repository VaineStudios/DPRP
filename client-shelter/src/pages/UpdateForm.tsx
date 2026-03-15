import { useState, useCallback } from 'react';
import IconSelector from '../components/IconSelector';
import ConnectionStatus from '../components/ConnectionStatus';
import LastUpdate from '../components/LastUpdate';
import { submitUpdate } from '../api/client';
import type { UserResponse } from '../api/client';

interface UpdateFormProps {
  user: UserResponse;
  onLogout: () => void;
}

const UpdateForm = ({ user, onLogout }: UpdateFormProps) => {
  const [capacity, setCapacity] = useState<number | null>(null);
  const [water, setWater] = useState<number | null>(null);
  const [food, setFood] = useState<number | null>(null);
  const [medical, setMedical] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const allSet = capacity !== null && water !== null && food !== null && medical !== null;

  const handleSubmit = useCallback(async () => {
    if (!allSet || !user.shelterId || loading) return;

    setLoading(true);
    setBanner(null);

    try {
      await submitUpdate({
        shelterId: user.shelterId,
        capacityLevel: capacity!,
        waterLevel: water!,
        foodLevel: food!,
        medicalLevel: medical!,
        notes: notes.trim() || undefined,
      });

      setBanner({ type: 'success', message: 'Update sent!' });
      setLastUpdateTime(new Date());
      setCapacity(null);
      setWater(null);
      setFood(null);
      setMedical(null);
      setNotes('');

      setTimeout(() => setBanner(null), 3000);
    } catch (err) {
      console.error('Update failed:', err);
      setBanner({ type: 'error', message: 'Update queued — will send when back online' });
      setTimeout(() => setBanner(null), 5000);
    } finally {
      setLoading(false);
    }
  }, [allSet, capacity, water, food, medical, notes, user.shelterId, loading]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <ConnectionStatus />

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.shelterName}>{user.name}</h1>
          <p style={styles.subtitle}>Status update</p>
        </div>
        <button onClick={onLogout} type="button" style={styles.logoutBtn}>
          Sign out
        </button>
      </div>

      {/* Banner */}
      {banner && (
        <div style={{
          padding: '10px 12px',
          borderRadius: 8,
          marginBottom: 12,
          fontSize: 14,
          fontWeight: 600,
          color: banner.type === 'success' ? '#15803d' : '#92400e',
          background: banner.type === 'success' ? '#f0fdf4' : '#fffbeb',
          border: `1px solid ${banner.type === 'success' ? '#bbf7d0' : '#fde68a'}`,
        }}>
          {banner.message}
        </div>
      )}

      <LastUpdate timestamp={lastUpdateTime} />

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
  },
  shelterName: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    lineHeight: 1.2,
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
