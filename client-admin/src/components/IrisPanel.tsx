import { useState, useEffect, useCallback } from 'react';
import type { DisasterEvent, AiRecommendation } from '../api/client';
import { analyzeNetwork, getRecommendations } from '../api/client';
import { getSocket } from '../api/socket';
import { getTimeSince } from '../utils/shelter';

interface IrisPanelProps {
  activeEvent: DisasterEvent | null;
  onFlyToShelter: (lat: number, lng: number, shelterId: string) => void;
  onAnalyzing?: (analyzing: boolean) => void;
}

const priorityColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#6b7280',
};

const directiveLabel = (priority: string): string => {
  switch (priority) {
    case 'CRITICAL': return 'IRIS DIRECTIVE';
    case 'HIGH':
    case 'MEDIUM': return 'IRIS ADVISORY';
    default: return 'IRIS NOTE';
  }
};

/** Inline SVG — stylized radar/pulse icon for IRIS */
const IrisIcon = ({ size = 20, animate = false }: { size?: number; animate?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={animate ? { animation: 'irisPulse 2s ease-in-out infinite' } : undefined}
  >
    <circle cx="12" cy="12" r="3" fill="#0ea5e9" />
    <path d="M12 5a7 7 0 0 1 7 7" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <path d="M12 5a7 7 0 0 0-7 7" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <path d="M12 2a10 10 0 0 0-10 10" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const IrisPanel = ({ activeEvent, onFlyToShelter, onAnalyzing }: IrisPanelProps) => {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // Notify parent of analyzing state
  useEffect(() => {
    onAnalyzing?.(loading);
  }, [loading, onAnalyzing]);

  // Load existing recommendations when event changes
  useEffect(() => {
    if (!activeEvent) {
      setRecommendations([]);
      return;
    }
    getRecommendations(activeEvent.id, 'RESPONSE')
      .then(recs => setRecommendations(recs))
      .catch(() => { /* ignore initial load errors */ });
  }, [activeEvent?.id]);

  // Listen for socket IRIS recommendation events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRec = (data: { recommendations: AiRecommendation[]; disasterEventId: string }) => {
      if (activeEvent && data.disasterEventId === activeEvent.id) {
        setRecommendations(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newRecs = data.recommendations.filter(r => !existingIds.has(r.id));
          const ids = new Set(newRecs.map(r => r.id));
          setNewIds(ids);
          setTimeout(() => setNewIds(new Set()), 3000);
          return [...newRecs, ...prev];
        });
      }
    };

    socket.on('ai:recommendation', handleRec);
    return () => { socket.off('ai:recommendation', handleRec); };
  }, [activeEvent?.id]);

  const handleAnalyze = useCallback(async () => {
    if (!activeEvent) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeNetwork(activeEvent.id);
      setRecommendations(result.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [activeEvent]);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <IrisIcon size={22} />
          <h3 style={styles.headerTitle}>IRIS</h3>
        </div>
        <span style={styles.headerSubtitle}>Intelligent Response &amp; Insight System</span>
        {activeEvent && (
          <span style={styles.headerEvent}>{activeEvent.name}</span>
        )}
      </div>

      <div style={styles.actions}>
        <button
          style={!activeEvent || loading ? styles.btnDisabled : styles.btn}
          disabled={!activeEvent || loading}
          onClick={handleAnalyze}
        >
          {loading ? 'IRIS is analyzing...' : 'Request IRIS analysis'}
        </button>
      </div>

      {loading && (
        <div style={styles.loadingWrap}>
          <IrisIcon size={32} animate />
          <p style={styles.loadingText}>IRIS is analyzing the shelter network...</p>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <p>{error}</p>
        </div>
      )}

      <div style={styles.list}>
        {recommendations.length === 0 && !loading && (
          <p style={styles.empty}>
            {activeEvent
              ? 'IRIS standing by. Request analysis to generate directives.'
              : 'Select an active disaster event to enable IRIS analysis.'}
          </p>
        )}

        {recommendations.map(rec => (
          <div
            key={rec.id}
            style={{
              ...styles.card,
              ...(newIds.has(rec.id) ? styles.cardNew : {}),
            }}
          >
            <div style={styles.cardHeader}>
              <div style={styles.cardBadgeGroup}>
                <span style={{
                  ...styles.priorityBadge,
                  background: priorityColors[rec.priority] || '#6b7280',
                }}>
                  {rec.priority}
                </span>
                <span style={styles.directiveLabel}>{directiveLabel(rec.priority)}</span>
              </div>
              <span style={styles.cardTime}>{getTimeSince(rec.createdAt)}</span>
            </div>
            <p style={styles.cardRec}>{rec.recommendation}</p>
            {rec.reasoning && (
              <p style={styles.cardReasoning}>{rec.reasoning}</p>
            )}
            {rec.shelter && (
              <button
                style={styles.shelterLink}
                onClick={() => {
                  if (rec.shelter?.lat != null && rec.shelter?.lng != null) {
                    onFlyToShelter(rec.shelter.lat, rec.shelter.lng, rec.shelter.id);
                  }
                }}
              >
                {rec.shelter.name} ({rec.shelter.parish})
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    background: '#fff',
  },
  header: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid rgba(14, 165, 233, 0.15)',
    background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.06) 0%, transparent 100%)',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 800,
    margin: 0,
    color: '#0c4a6e',
    letterSpacing: '-0.3px',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#64748b',
    display: 'block',
    marginTop: 2,
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  headerEvent: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    display: 'block',
  },
  actions: {
    padding: '10px 16px',
    borderBottom: '1px solid #f1f5f9',
  },
  btn: {
    width: '100%',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  btnDisabled: {
    width: '100%',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 6,
    cursor: 'not-allowed',
  },
  loadingWrap: {
    padding: '24px 14px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: 500,
  },
  error: {
    padding: '12px 14px',
    margin: '8px 14px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: 13,
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 14px',
  },
  empty: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center' as const,
    padding: '32px 14px',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  card: {
    background: '#f8fafc',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 8,
    border: '1px solid #e2e8f0',
    transition: 'box-shadow 0.3s',
  },
  cardNew: {
    boxShadow: '0 0 0 2px #0ea5e9',
    animation: 'fadeHighlight 3s ease-out',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardBadgeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    color: '#fff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  directiveLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0c4a6e',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  cardTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  cardRec: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    margin: '0 0 6px',
    lineHeight: 1.4,
  },
  cardReasoning: {
    fontSize: 13,
    color: '#64748b',
    margin: '0 0 8px',
    lineHeight: 1.5,
  },
  shelterLink: {
    fontSize: 12,
    fontWeight: 600,
    color: '#0284c7',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default IrisPanel;
