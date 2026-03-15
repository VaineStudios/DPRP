import type { Shelter } from '../api/client';
import { getPinColor, getTimeSince, isOffline } from '../utils/shelter';

interface ShelterCardProps {
  shelter: Shelter;
}

const levelLabel = (level: number) => {
  if (level <= 2) return 'Good';
  if (level === 3) return 'Fair';
  return 'Critical';
};

const levelColor = (level: number, invert = false) => {
  const effective = invert ? 6 - level : level;
  if (effective <= 2) return '#22c55e';
  if (effective === 3) return '#f59e0b';
  return '#ef4444';
};

const ShelterCard = ({ shelter }: ShelterCardProps) => {
  const update = shelter.latestUpdate;
  const color = getPinColor(shelter);
  const timeSince = update ? getTimeSince(update.createdAt) : null;
  const offline = isOffline(shelter);

  return (
    <div style={styles.card}>
      <div style={{ ...styles.colorBar, background: color }} />
      <h3 style={styles.name}>{shelter.name}</h3>
      <p style={styles.meta}>{shelter.facilityType} &middot; {shelter.parish}</p>

      {update ? (
        <>
          <div style={styles.grid}>
            <Stat label="Capacity" level={update.capacityLevel} />
            <Stat label="Water" level={update.waterLevel} invert />
            <Stat label="Food" level={update.foodLevel} invert />
            <Stat label="Medical" level={update.medicalLevel} invert />
          </div>
          {update.notes && <p style={styles.notes}>{update.notes}</p>}
          {offline ? (
            <p style={styles.offlineWarning}>OFFLINE — Last seen {timeSince}</p>
          ) : (
            <p style={styles.time}>Updated {timeSince}</p>
          )}
        </>
      ) : (
        <p style={styles.noData}>Awaiting first report</p>
      )}
    </div>
  );
};

const Stat = ({ label, level, invert = false }: { label: string; level: number; invert?: boolean }) => (
  <div style={styles.stat}>
    <span style={styles.statLabel}>{label}</span>
    <span style={{ ...styles.statValue, color: levelColor(level, invert) }}>
      {level}/5 {levelLabel(invert ? 6 - level : level)}
    </span>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: 280,
  },
  colorBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1e293b',
    margin: 0,
    lineHeight: 1.3,
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
    margin: '2px 0 10px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: 700,
  },
  notes: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 8,
  },
  offlineWarning: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: 600,
    marginTop: 8,
    padding: '4px 8px',
    background: '#fef2f2',
    borderRadius: 4,
  },
  noData: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 8,
  },
};

export default ShelterCard;
