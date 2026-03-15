import { useState, useEffect, useCallback } from 'react';
import type { DisasterEvent, AiPredictions, AiRecommendation } from '../../api/client';
import { predictPreparedness, getRecommendations } from '../../api/client';

interface IrisForecasterProps {
  selectedEvent: DisasterEvent | null;
}

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

const severityColors: Record<string, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

const IrisForecaster = ({ selectedEvent }: IrisForecasterProps) => {
  const [predictions, setPredictions] = useState<AiPredictions | null>(null);
  const [storedRecs, setStoredRecs] = useState<AiRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing predictions on event change
  useEffect(() => {
    if (!selectedEvent) return;
    getRecommendations(selectedEvent.id, 'PREPAREDNESS')
      .then(recs => setStoredRecs(recs))
      .catch(() => { /* ignore */ });
  }, [selectedEvent?.id]);

  const handleForecast = useCallback(async () => {
    if (!selectedEvent) return;
    setLoading(true);
    setError(null);
    try {
      const result = await predictPreparedness(selectedEvent.id);
      setPredictions(result.predictions);
      setStoredRecs(result.stored);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'IRIS forecast failed');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent]);

  if (!selectedEvent) return null;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>IRIS forecaster</h3>
          <p style={styles.subtitle}>IRIS-powered preparedness intelligence</p>
        </div>
        <button
          style={loading ? styles.btnDisabled : styles.btn}
          disabled={loading}
          onClick={handleForecast}
        >
          {predictions ? 'Re-run IRIS forecast' : 'Request IRIS forecast'}
        </button>
      </div>

      {loading && (
        <div style={styles.loadingWrap}>
          <IrisIcon size={32} animate />
          <p style={styles.loadingText}>
            IRIS is generating forecast based on historical data points...
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
          {/* Section A: Capacity Forecast */}
          {predictions.predictions.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>IRIS predicts these shelters will reach capacity first:</h4>
              <div style={styles.predList}>
                {predictions.predictions.map((p, i) => (
                  <div key={i} style={styles.predRow}>
                    <span style={styles.predRank}>#{i + 1}</span>
                    <div style={styles.predInfo}>
                      <span style={styles.predName}>{p.shelterName}</span>
                      <span style={styles.predTime}>Estimated: {p.estimatedCapacityReachTime}</span>
                    </div>
                    <span style={styles.predConfidence}>{p.confidence}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section B: Pre-positioning directives */}
          {predictions.prePositioning.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>IRIS recommends the following supply pre-positioning:</h4>
              <div style={styles.directiveList}>
                {predictions.prePositioning.map((p, i) => (
                  <div key={i} style={styles.directiveCard}>
                    <div style={styles.directiveHeader}>
                      <span style={styles.directiveResource}>{p.resource}</span>
                      <span style={styles.directiveQty}>{p.quantity}</span>
                    </div>
                    <p style={styles.directiveRationale}>{p.rationale}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section C: Timeline Projection */}
          {predictions.timeline?.milestones && predictions.timeline.milestones.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>IRIS projected response timeline:</h4>
              <div style={styles.timeline}>
                {predictions.timeline.milestones.map((m, i) => (
                  <div key={i} style={styles.timelineRow}>
                    <span style={{
                      ...styles.timelineDot,
                      background: severityColors[m.severity] || '#6b7280',
                    }} />
                    <span style={styles.timelineHour}>T+{m.hour}h</span>
                    <span style={styles.timelineEvent}>{m.event}</span>
                  </div>
                ))}
              </div>
              {predictions.timeline.summary && (
                <p style={styles.timelineSummary}>{predictions.timeline.summary}</p>
              )}
            </section>
          )}

          {/* Fallback: if no milestones but legacy timeline keys */}
          {predictions.timeline && !predictions.timeline.milestones && Object.keys(predictions.timeline).length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>IRIS projected timeline:</h4>
              <div style={styles.legacyTimeline}>
                {Object.entries(predictions.timeline)
                  .filter(([key]) => key !== 'summary')
                  .map(([key, val]) => (
                    <div key={key} style={styles.legacyRow}>
                      <span style={styles.legacyKey}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span style={styles.legacyVal}>{String(val)}</span>
                    </div>
                  ))}
                {predictions.timeline.summary && (
                  <p style={styles.timelineSummary}>{String(predictions.timeline.summary)}</p>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Show stored recommendations if no fresh predictions */}
      {!predictions && storedRecs.length > 0 && (
        <div style={styles.results}>
          <section style={styles.section}>
            <h4 style={styles.sectionTitle}>Previous IRIS forecast</h4>
            <p style={styles.sectionSubtext}>Stored from earlier analysis</p>
            <div style={styles.directiveList}>
              {storedRecs.map(rec => (
                <div key={rec.id} style={styles.directiveCard}>
                  <div style={styles.directiveHeader}>
                    <span style={{
                      ...styles.priorityBadge,
                      background: rec.priority === 'CRITICAL' ? '#ef4444'
                        : rec.priority === 'HIGH' ? '#f59e0b'
                        : rec.priority === 'MEDIUM' ? '#3b82f6' : '#6b7280',
                    }}>
                      {rec.priority}
                    </span>
                  </div>
                  <p style={styles.directiveRationale}>{rec.recommendation}</p>
                  {rec.reasoning && (
                    <p style={{ ...styles.directiveRationale, color: '#94a3b8' }}>{rec.reasoning}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '20px 24px',
    borderTop: '3px solid #0ea5e9',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0c4a6e',
    margin: '0 0 2px',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    margin: 0,
  },
  btn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  btnDisabled: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#94a3b8',
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 6,
    cursor: 'not-allowed',
    whiteSpace: 'nowrap' as const,
  },
  loadingWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    padding: '32px 0',
  },
  loadingText: {
    fontSize: 14,
    color: '#0284c7',
    fontWeight: 500,
  },
  error: {
    padding: '12px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 12,
  },
  results: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  section: {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0c4a6e',
    margin: '0 0 12px',
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    margin: '0 0 12px',
  },
  predList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  predRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
  },
  predRank: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0284c7',
    width: 28,
    flexShrink: 0,
  },
  predInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  predName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1e293b',
  },
  predTime: {
    fontSize: 12,
    color: '#64748b',
  },
  predConfidence: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  directiveList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  directiveCard: {
    padding: '10px 14px',
    background: '#fff',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
  },
  directiveHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  directiveResource: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1e293b',
    textTransform: 'capitalize' as const,
  },
  directiveQty: {
    fontSize: 13,
    fontWeight: 600,
    color: '#0284c7',
  },
  directiveRationale: {
    fontSize: 13,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  priorityBadge: {
    padding: '2px 8px',
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 3,
    color: '#fff',
    textTransform: 'uppercase' as const,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
    position: 'relative' as const,
    paddingLeft: 20,
  },
  timelineRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '8px 0',
    borderLeft: '2px solid #e2e8f0',
    paddingLeft: 16,
    position: 'relative' as const,
    marginLeft: -20,
  },
  timelineDot: {
    position: 'absolute' as const,
    left: -6,
    top: 12,
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '2px solid #fff',
  },
  timelineHour: {
    fontSize: 13,
    fontWeight: 700,
    color: '#1e293b',
    width: 50,
    flexShrink: 0,
  },
  timelineEvent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.4,
  },
  timelineSummary: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 8,
    margin: '8px 0 0',
  },
  legacyTimeline: {
    padding: '8px 0',
  },
  legacyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  legacyKey: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize' as const,
  },
  legacyVal: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
  },
};

export default IrisForecaster;
