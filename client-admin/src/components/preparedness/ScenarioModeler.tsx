import { useState, useCallback } from 'react';
import type { AiPredictions, ScenarioParams } from '../../api/client';
import { predictScenario } from '../../api/client';
import { PARISH_CENTROIDS } from '../../constants/parishes';

const ALL_PARISHES = Object.keys(PARISH_CENTROIDS);

const categoryWindDefaults: Record<number, number> = {
  1: 80,
  2: 100,
  3: 120,
  4: 140,
  5: 165,
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

const severityColors: Record<string, string> = {
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
};

const ScenarioModeler = () => {
  const [category, setCategory] = useState(3);
  const [windSpeed, setWindSpeed] = useState(120);
  const [selectedParishes, setSelectedParishes] = useState<string[]>([
    'St. Thomas', 'Portland', 'St. Mary',
  ]);
  const [predictions, setPredictions] = useState<AiPredictions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCategoryChange = (newCat: number) => {
    setCategory(newCat);
    setWindSpeed(categoryWindDefaults[newCat] || 100);
  };

  const toggleParish = (parish: string) => {
    setSelectedParishes(prev =>
      prev.includes(parish)
        ? prev.filter(p => p !== parish)
        : [...prev, parish]
    );
  };

  const handleRunScenario = useCallback(async () => {
    if (selectedParishes.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const scenario: ScenarioParams = {
        category,
        windSpeedMph: windSpeed,
        affectedParishes: selectedParishes,
        name: `What-if Scenario (Cat ${category})`,
      };
      const result = await predictScenario(scenario);
      setPredictions(result.predictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'IRIS scenario analysis failed');
    } finally {
      setLoading(false);
    }
  }, [category, windSpeed, selectedParishes]);

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>IRIS scenario modeler</h3>
      <p style={styles.subtitle}>What-if analysis for planning</p>

      {/* Controls */}
      <div style={styles.controls}>
        {/* Category slider */}
        <div style={styles.controlGroup}>
          <label style={styles.controlLabel}>Category</label>
          <div style={styles.sliderRow}>
            {[1, 2, 3, 4, 5].map(c => (
              <button
                key={c}
                style={c === category ? styles.catBtnActive : styles.catBtn}
                onClick={() => handleCategoryChange(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Wind speed */}
        <div style={styles.controlGroup}>
          <label style={styles.controlLabel}>Wind speed (mph)</label>
          <input
            type="number"
            style={styles.input}
            value={windSpeed}
            onChange={e => setWindSpeed(Number(e.target.value))}
            min={39}
            max={200}
          />
        </div>

        {/* Parish checkboxes */}
        <div style={styles.controlGroup}>
          <label style={styles.controlLabel}>Affected parishes</label>
          <div style={styles.parishGrid}>
            {ALL_PARISHES.map(p => (
              <label key={p} style={styles.parishCheck}>
                <input
                  type="checkbox"
                  checked={selectedParishes.includes(p)}
                  onChange={() => toggleParish(p)}
                />
                <span style={styles.parishCheckLabel}>{p}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          style={loading || selectedParishes.length === 0 ? styles.btnDisabled : styles.btn}
          disabled={loading || selectedParishes.length === 0}
          onClick={handleRunScenario}
        >
          {loading ? 'Running scenario...' : 'Run IRIS scenario'}
        </button>
      </div>

      {loading && (
        <div style={styles.loadingWrap}>
          <IrisIcon size={32} animate />
          <p style={styles.loadingText}>
            IRIS is modeling Category {category} scenario for {selectedParishes.length} parishes...
          </p>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {/* Results */}
      {predictions && !loading && (
        <div style={styles.results}>
          <div style={styles.scenarioBanner}>
            IRIS scenario: Category {category} | {windSpeed} mph | {selectedParishes.length} parishes affected
          </div>

          {predictions.predictions.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>Capacity forecast</h4>
              <div style={styles.predList}>
                {predictions.predictions.map((p, i) => (
                  <div key={i} style={styles.predRow}>
                    <span style={styles.predRank}>#{i + 1}</span>
                    <div style={styles.predInfo}>
                      <span style={styles.predName}>{p.shelterName}</span>
                      <span style={styles.predTime}>{p.estimatedCapacityReachTime}</span>
                    </div>
                    <span style={styles.predConfidence}>{p.confidence}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {predictions.prePositioning.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>Pre-positioning directives</h4>
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

          {predictions.timeline?.milestones && predictions.timeline.milestones.length > 0 && (
            <section style={styles.section}>
              <h4 style={styles.sectionTitle}>Projected timeline</h4>
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
            </section>
          )}

          {predictions.timeline?.summary && (
            <p style={styles.summaryText}>{String(predictions.timeline.summary)}</p>
          )}
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
    border: '1px solid #e0e7ff',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e293b',
    margin: '0 0 2px',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    margin: '0 0 16px',
  },
  controls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
    padding: '16px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    marginBottom: 16,
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  sliderRow: {
    display: 'flex',
    gap: 4,
  },
  catBtn: {
    width: 40,
    height: 36,
    fontSize: 16,
    fontWeight: 700,
    color: '#64748b',
    background: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
  },
  catBtnActive: {
    width: 40,
    height: 36,
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: '#0284c7',
    border: '2px solid #0284c7',
    borderRadius: 6,
    cursor: 'pointer',
  },
  input: {
    width: 100,
    padding: '6px 10px',
    fontSize: 14,
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    background: '#fff',
    color: '#1e293b',
  },
  parishGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 4,
  },
  parishCheck: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  parishCheckLabel: {
    fontSize: 12,
    color: '#475569',
  },
  btn: {
    padding: '10px 24px',
    fontSize: 14,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    alignSelf: 'flex-start' as const,
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
    alignSelf: 'flex-start' as const,
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
    gap: 12,
  },
  scenarioBanner: {
    padding: '8px 14px',
    background: '#eef2ff',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#4338ca',
    textAlign: 'center' as const,
  },
  section: {
    padding: '14px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0c4a6e',
    margin: '0 0 10px',
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
    color: '#7c3aed',
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
    marginBottom: 4,
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
    color: '#7c3aed',
  },
  directiveRationale: {
    fontSize: 13,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
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
  summaryText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center' as const,
    margin: 0,
  },
};

export default ScenarioModeler;
