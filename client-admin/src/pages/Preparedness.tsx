import { useState, useEffect, useCallback } from 'react';
import type { DisasterEvent, AiPredictions, AiRecommendation } from '../api/client';
import { predictPreparedness, getRecommendations } from '../api/client';
import DisasterSelector from '../components/DisasterSelector';

interface PreparednessProps {
  disasters: DisasterEvent[];
}

const Preparedness = ({ disasters }: PreparednessProps) => {
  const preparingEvents = disasters.filter(d => d.status === 'PREPARING');
  const [selectedId, setSelectedId] = useState<string | null>(
    preparingEvents[0]?.id ?? null
  );
  const [predictions, setPredictions] = useState<AiPredictions | null>(null);
  const [storedRecs, setStoredRecs] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing predictions on event change
  useEffect(() => {
    if (!selectedId) return;
    getRecommendations(selectedId, 'PREPAREDNESS')
      .then(recs => setStoredRecs(recs))
      .catch(() => { /* ignore */ });
  }, [selectedId]);

  const handlePredict = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await predictPreparedness(selectedId);
      setPredictions(result.predictions);
      setStoredRecs(result.stored);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  const selectedEvent = disasters.find(d => d.id === selectedId);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.heading}>Preparedness analysis</h2>
        <p style={styles.subtext}>
          Select an approaching event to run AI-powered predictions based on historical disaster data.
        </p>

        <DisasterSelector
          disasters={preparingEvents}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedEvent && (
          <div style={styles.eventDetail}>
            <div style={styles.eventMeta}>
              <span>Category {selectedEvent.category ?? 'N/A'}</span>
              <span>{selectedEvent.windSpeedMph ?? '?'} mph</span>
              <span>Parishes: {selectedEvent.affectedParishes.join(', ')}</span>
              {selectedEvent.landfallDate && (
                <span>Landfall: {new Date(selectedEvent.landfallDate).toLocaleDateString()}</span>
              )}
            </div>

            <button
              style={loading ? styles.btnDisabled : styles.btn}
              disabled={loading}
              onClick={handlePredict}
            >
              {loading ? 'Running predictions...' : 'Run predictions'}
            </button>
          </div>
        )}

        {loading && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>
              Claude is analyzing historical patterns and generating predictions...
            </p>
          </div>
        )}

        {error && (
          <div style={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {predictions && (
          <div style={styles.results}>
            {/* Capacity predictions */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Capacity predictions</h3>
              <p style={styles.sectionDesc}>Which shelters will reach capacity first</p>
              {predictions.predictions.length > 0 ? (
                <div style={styles.cards}>
                  {predictions.predictions.map((p, i) => (
                    <div key={i} style={styles.predCard}>
                      <div style={styles.predHeader}>
                        <span style={styles.predName}>{p.shelterName}</span>
                        <span style={styles.predConfidence}>
                          {p.confidence} confidence
                        </span>
                      </div>
                      <p style={styles.predTime}>
                        Estimated capacity reached: {p.estimatedCapacityReachTime}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noData}>No capacity predictions available.</p>
              )}
            </section>

            {/* Resource predictions */}
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Pre-positioning recommendations</h3>
              <p style={styles.sectionDesc}>Where to send supplies before landfall</p>
              {predictions.prePositioning.length > 0 ? (
                <div style={styles.cards}>
                  {predictions.prePositioning.map((p, i) => (
                    <div key={i} style={styles.predCard}>
                      <div style={styles.predHeader}>
                        <span style={styles.predResource}>{p.resource}</span>
                        <span style={styles.predQty}>{p.quantity}</span>
                      </div>
                      <p style={styles.predRationale}>{p.rationale}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noData}>No pre-positioning recommendations available.</p>
              )}
            </section>

            {/* Timeline */}
            {predictions.timeline && Object.keys(predictions.timeline).length > 0 && (
              <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Timeline</h3>
                <div style={styles.timeline}>
                  {Object.entries(predictions.timeline).map(([key, val]) => (
                    <div key={key} style={styles.timelineRow}>
                      <span style={styles.timelineKey}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={styles.timelineVal}>{String(val)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Show stored recommendations if no fresh predictions */}
        {!predictions && storedRecs.length > 0 && (
          <div style={styles.results}>
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Previous predictions</h3>
              <p style={styles.sectionDesc}>Stored from earlier analysis</p>
              <div style={styles.cards}>
                {storedRecs.map(rec => (
                  <div key={rec.id} style={styles.predCard}>
                    <div style={styles.predHeader}>
                      <span style={{
                        ...styles.priorityBadge,
                        background: rec.priority === 'HIGH' ? '#f59e0b'
                          : rec.priority === 'CRITICAL' ? '#ef4444'
                          : rec.priority === 'MEDIUM' ? '#3b82f6' : '#6b7280',
                      }}>
                        {rec.priority}
                      </span>
                    </div>
                    <p style={styles.predName}>{rec.recommendation}</p>
                    {rec.reasoning && (
                      <p style={styles.predRationale}>{rec.reasoning}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {!selectedId && preparingEvents.length === 0 && (
          <div style={styles.emptyState}>
            <p>No approaching events in PREPARING status.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    overflowY: 'auto' as const,
    background: '#f8fafc',
  },
  content: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '24px 32px',
  },
  heading: {
    fontSize: 24,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  },
  subtext: {
    fontSize: 14,
    color: '#64748b',
    margin: '0 0 20px',
  },
  eventDetail: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  eventMeta: {
    display: 'flex',
    gap: 16,
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    flexWrap: 'wrap' as const,
  },
  btn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  btnDisabled: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    background: '#e2e8f0',
    border: 'none',
    borderRadius: 6,
    cursor: 'not-allowed',
  },
  loadingWrap: {
    textAlign: 'center' as const,
    padding: '40px 0',
  },
  spinner: {
    width: 32,
    height: 32,
    border: '3px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  error: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 16,
  },
  results: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 4px',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#94a3b8',
    margin: '0 0 12px',
  },
  cards: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  predCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '12px 14px',
  },
  predHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  predName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    margin: 0,
  },
  predConfidence: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
  },
  predTime: {
    fontSize: 13,
    color: '#64748b',
    margin: 0,
  },
  predResource: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
    textTransform: 'capitalize' as const,
  },
  predQty: {
    fontSize: 13,
    fontWeight: 600,
    color: '#3b82f6',
  },
  predRationale: {
    fontSize: 13,
    color: '#64748b',
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
  timeline: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '12px 14px',
  },
  timelineRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  timelineKey: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize' as const,
  },
  timelineVal: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
  },
  priorityBadge: {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  noData: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 0',
    color: '#94a3b8',
    fontSize: 14,
  },
};

export default Preparedness;
