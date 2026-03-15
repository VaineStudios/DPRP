import { useState, useEffect, useCallback } from 'react';
import type { DisasterEvent, AiRecommendation } from '../api/client';
import { analyzeNetwork, getRecommendations } from '../api/client';
import { getSocket } from '../api/socket';
import { getTimeSince } from '../utils/shelter';

interface AiPanelProps {
  activeEvent: DisasterEvent | null;
  onFlyToShelter: (lat: number, lng: number, shelterId: string) => void;
}

const priorityColors: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#3b82f6',
  LOW: '#6b7280',
};

const AiPanel = ({ activeEvent, onFlyToShelter }: AiPanelProps) => {
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

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

  // Listen for socket AI recommendation events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAiRec = (data: { recommendations: AiRecommendation[]; disasterEventId: string }) => {
      if (activeEvent && data.disasterEventId === activeEvent.id) {
        setRecommendations(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newRecs = data.recommendations.filter(r => !existingIds.has(r.id));
          const ids = new Set(newRecs.map(r => r.id));
          setNewIds(ids);
          // Clear highlight after 3 seconds
          setTimeout(() => setNewIds(new Set()), 3000);
          return [...newRecs, ...prev];
        });
      }
    };

    socket.on('ai:recommendation', handleAiRec);
    return () => { socket.off('ai:recommendation', handleAiRec); };
  }, [activeEvent?.id]);

  const handleAnalyze = useCallback(async () => {
    if (!activeEvent) return;
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeNetwork(activeEvent.id);
      if (!result.cached) {
        // If not from cache, the socket event will handle adding them
        // But let's also set them directly in case socket is slow
        setRecommendations(result.recommendations);
      } else {
        setRecommendations(result.recommendations);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }, [activeEvent]);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>AI recommendations</h3>
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
          {loading ? 'Analyzing...' : 'Analyze network'}
        </button>
      </div>

      {loading && (
        <div style={styles.loadingWrap}>
          <div style={styles.loadingDots}>
            <span style={styles.loadingDot} />
            <span style={{ ...styles.loadingDot, animationDelay: '0.2s' }} />
            <span style={{ ...styles.loadingDot, animationDelay: '0.4s' }} />
          </div>
          <p style={styles.loadingText}>Claude is analyzing the shelter network...</p>
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
              ? 'No recommendations yet. Click "Analyze network" to get AI insights.'
              : 'Select an active disaster event to enable analysis.'}
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
              <span style={{
                ...styles.priorityBadge,
                background: priorityColors[rec.priority] || '#6b7280',
              }}>
                {rec.priority}
              </span>
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
    width: 360,
    flexShrink: 0,
    background: '#f8fafc',
    borderLeft: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '14px 16px 10px',
    borderBottom: '1px solid #e2e8f0',
    background: '#fff',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    color: '#1e293b',
  },
  headerEvent: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    display: 'block',
  },
  actions: {
    padding: '10px 16px',
    borderBottom: '1px solid #e2e8f0',
    background: '#fff',
  },
  btn: {
    width: '100%',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#3b82f6',
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
    background: '#e2e8f0',
    border: 'none',
    borderRadius: 6,
    cursor: 'not-allowed',
  },
  loadingWrap: {
    padding: '24px 16px',
    textAlign: 'center' as const,
  },
  loadingDots: {
    display: 'flex',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  loadingDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#3b82f6',
    animation: 'pulse 1s ease-in-out infinite',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  error: {
    padding: '12px 16px',
    margin: '8px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: 13,
  },
  list: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '8px 16px',
  },
  empty: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center' as const,
    padding: '32px 16px',
    lineHeight: 1.6,
  },
  card: {
    background: '#fff',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 8,
    border: '1px solid #e2e8f0',
    transition: 'box-shadow 0.3s',
  },
  cardNew: {
    boxShadow: '0 0 0 2px #3b82f6',
    animation: 'fadeHighlight 3s ease-out',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    color: '#3b82f6',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default AiPanel;
