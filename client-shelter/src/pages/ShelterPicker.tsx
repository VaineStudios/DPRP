import { useState, useEffect, useMemo } from 'react';
import { getSheltersByParish, getShelterById } from '../api/client';
import type { ShelterSummary } from '../api/client';
import type { SelectedShelter } from '../hooks/useShelter';

const PARISHES = [
  'Clarendon',
  'Hanover',
  'Kingston & St. Andrew',
  'Manchester',
  'Portland',
  'Portmore',
  'St. Ann',
  'St. Catherine',
  'St. Elizabeth',
  'St. James',
  'St. Mary',
  'St. Thomas',
  'Trelawny',
  'Westmoreland',
];

interface ShelterPickerProps {
  onSelect: (shelter: SelectedShelter) => void;
  /** If the user has an assigned shelter, pass its ID to pre-select the parish */
  userShelterId?: string | null;
}

const ShelterPicker = ({ onSelect, userShelterId }: ShelterPickerProps) => {
  const [parish, setParish] = useState('');
  const [shelters, setShelters] = useState<ShelterSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-select parish from user's assigned shelter
  useEffect(() => {
    if (!userShelterId || parish) return;
    getShelterById(userShelterId)
      .then(({ shelter }) => {
        if (shelter.parish && !parish) {
          setParish(shelter.parish);
        }
      })
      .catch(() => {
        // Graceful — user just picks manually
      });
  }, [userShelterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch shelters when parish changes
  useEffect(() => {
    if (!parish) {
      setShelters([]);
      return;
    }

    setLoading(true);
    setError('');
    setSearch('');

    getSheltersByParish(parish)
      .then(({ shelters }) => setShelters(shelters))
      .catch(() => setError('Failed to load shelters. Please try again.'))
      .finally(() => setLoading(false));
  }, [parish]);

  const filtered = useMemo(() => {
    if (!search.trim()) return shelters;
    const q = search.toLowerCase();
    return shelters.filter((s) => s.name.toLowerCase().includes(q));
  }, [shelters, search]);

  const handleSelect = (s: ShelterSummary) => {
    onSelect({
      id: s.id,
      name: s.name,
      parish: s.parish,
      facilityType: s.facilityType,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Select your shelter</h1>
        <p style={styles.subtitle}>Which shelter are you reporting from?</p>
      </div>

      {/* Parish dropdown */}
      <div style={styles.field}>
        <label htmlFor="parish" style={styles.label}>Parish</label>
        <select
          id="parish"
          value={parish}
          onChange={(e) => setParish(e.target.value)}
          style={styles.select}
        >
          <option value="">Choose a parish...</option>
          {PARISHES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Search filter — only show when shelters are loaded */}
      {shelters.length > 0 && (
        <div style={styles.field}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={styles.searchInput}
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <p style={styles.statusText}>Loading shelters...</p>
      )}

      {/* Error */}
      {error && (
        <p style={styles.errorText}>{error}</p>
      )}

      {/* Shelter list */}
      {!loading && filtered.length > 0 && (
        <div style={styles.list}>
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              style={styles.card}
            >
              <span style={styles.cardName}>{s.name}</span>
              <span style={styles.cardMeta}>
                {s.facilityType && <span>{s.facilityType}</span>}
                {s.location && (
                  <span style={styles.cardLocation}>
                    {s.location.length > 50 ? s.location.slice(0, 50) + '...' : s.location}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && parish && !error && shelters.length > 0 && filtered.length === 0 && (
        <p style={styles.statusText}>No shelters match "{search}"</p>
      )}

      {/* Empty parish */}
      {!loading && parish && !error && shelters.length === 0 && (
        <p style={styles.statusText}>No shelters found in {parish}</p>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 6,
  },
  select: {
    width: '100%',
    minHeight: 48,
    padding: '12px',
    fontSize: 16,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#fff',
    color: '#1e293b',
    appearance: 'auto' as const,
  },
  searchInput: {
    width: '100%',
    minHeight: 48,
    padding: '12px',
    fontSize: 16,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#fff',
    color: '#1e293b',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
    minHeight: 48,
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    cursor: 'pointer',
    textAlign: 'left',
    WebkitTapHighlightColor: 'transparent',
  },
  cardName: {
    fontSize: 16,
    fontWeight: 600,
    color: '#1e293b',
    lineHeight: 1.3,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: 13,
    color: '#64748b',
  },
  cardLocation: {
    color: '#94a3b8',
  },
  statusText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    padding: '24px 0',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    padding: '12px',
    background: '#fef2f2',
    borderRadius: 8,
  },
};

export default ShelterPicker;
