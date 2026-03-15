import { useState, useEffect } from 'react';
import type { DisasterEvent } from '../../api/client';
import { getShelters, getDisasters, getEventTimeline } from '../../api/client';

interface ResourceGapAnalysisProps {
  approachingEvent: DisasterEvent | null;
}

interface GapData {
  projectedDemand: number;
  availableCapacity: number;
  shelterCount: number;
  waterHours: number;
  foodHours: number;
  medicalHours: number;
}

const ResourceGapAnalysis = ({ approachingEvent }: ResourceGapAnalysisProps) => {
  const [gapData, setGapData] = useState<GapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!approachingEvent) {
      setGapData(null);
      setLoading(false);
      return;
    }

    const compute = async () => {
      setLoading(true);
      try {
        const [shelters, allEvents] = await Promise.all([
          getShelters(),
          getDisasters(),
        ]);

        // Filter shelters in affected parishes
        const affectedShelters = shelters.filter(s =>
          approachingEvent.affectedParishes.includes(s.parish)
        );

        // Estimate capacity per shelter (use maxCapacity or default ~100)
        const avgCapPerShelter = affectedShelters.reduce((sum, s) => sum + (s.maxCapacity || 100), 0) / Math.max(affectedShelters.length, 1);
        const availableCapacity = Math.round(affectedShelters.length * avgCapPerShelter);

        // Project demand based on historical data from similar events
        const closedEvents = allEvents.filter(e => e.status === 'CLOSED');
        let demandMultiplier = 0.7; // default: 70% of capacity used
        let waterBurnRate = 24; // hours until depletion
        let foodBurnRate = 36;
        let medicalBurnRate = 48;

        for (const past of closedEvents) {
          // Look for similar category events
          if (past.category && approachingEvent.category &&
              Math.abs(past.category - approachingEvent.category) <= 1) {
            try {
              const timeline = await getEventTimeline(past.id);
              const peak = timeline.summary.peakAvgCapacity / 5;
              if (peak > demandMultiplier) demandMultiplier = peak;

              // Estimate resource burn from timeline
              const critHour = timeline.timeline.find(t => t.avgWater <= 2)?.hour;
              if (critHour != null && critHour < waterBurnRate) waterBurnRate = critHour;

              const foodHour = timeline.timeline.find(t => t.avgFood <= 2)?.hour;
              if (foodHour != null && foodHour < foodBurnRate) foodBurnRate = foodHour;

              const medHour = timeline.timeline.find(t => t.avgMedical <= 2)?.hour;
              if (medHour != null && medHour < medicalBurnRate) medicalBurnRate = medHour;
            } catch {
              // ignore
            }
          }
        }

        // Scale demand by category
        const catMultiplier = approachingEvent.category
          ? 0.4 + (approachingEvent.category / 5) * 0.6
          : 0.6;

        const projectedDemand = Math.round(availableCapacity * Math.max(demandMultiplier, catMultiplier) * 1.1);

        setGapData({
          projectedDemand,
          availableCapacity,
          shelterCount: affectedShelters.length,
          waterHours: Math.round(waterBurnRate),
          foodHours: Math.round(foodBurnRate),
          medicalHours: Math.round(medicalBurnRate),
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    compute();
  }, [approachingEvent?.id]);

  if (!approachingEvent) return null;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>Resource gap analysis</h3>
      <p style={styles.subtitle}>Projections based on IRIS historical modeling</p>

      {loading ? (
        <p style={styles.loadingText}>Calculating resource projections...</p>
      ) : gapData ? (
        <div style={styles.content}>
          {/* Capacity Projection */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>CAPACITY PROJECTION</h4>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Projected demand:</span>
              <span style={styles.metricValue}>~{gapData.projectedDemand.toLocaleString()} people</span>
            </div>
            <div style={styles.metricRow}>
              <span style={styles.metricLabel}>Available capacity:</span>
              <span style={styles.metricValue}>
                ~{gapData.availableCapacity.toLocaleString()} (based on {gapData.shelterCount} shelters in affected parishes)
              </span>
            </div>

            {/* Gap bar */}
            <div style={styles.barWrap}>
              <div style={styles.barTrack}>
                <div style={{
                  ...styles.barFill,
                  width: `${Math.min((gapData.availableCapacity / gapData.projectedDemand) * 100, 100)}%`,
                  background: gapData.projectedDemand > gapData.availableCapacity ? '#f59e0b' : '#22c55e',
                }} />
              </div>
              {gapData.projectedDemand > gapData.availableCapacity ? (
                <span style={styles.gapHighlight}>
                  Gap: ~{(gapData.projectedDemand - gapData.availableCapacity).toLocaleString()} people
                </span>
              ) : (
                <span style={styles.gapOk}>
                  Surplus: ~{(gapData.availableCapacity - gapData.projectedDemand).toLocaleString()} capacity
                </span>
              )}
            </div>
          </div>

          {/* Resource Timeline */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>RESOURCE TIMELINE</h4>
            <ResourceBar label="Water supply" hours={gapData.waterHours} maxHours={48} />
            <ResourceBar label="Food supply" hours={gapData.foodHours} maxHours={48} />
            <ResourceBar label="Medical supply" hours={gapData.medicalHours} maxHours={48} />
          </div>

          <p style={styles.basisText}>
            Based on Category {approachingEvent.category || 'N/A'} historical patterns
          </p>
        </div>
      ) : (
        <p style={styles.emptyText}>Unable to compute resource projections.</p>
      )}
    </div>
  );
};

const ResourceBar = ({ label, hours, maxHours }: { label: string; hours: number; maxHours: number }) => {
  const pct = Math.min((hours / maxHours) * 100, 100);
  const color = hours >= 24 ? '#22c55e' : hours >= 12 ? '#f59e0b' : '#ef4444';

  return (
    <div style={styles.resourceRow}>
      <span style={styles.resourceLabel}>{label}:</span>
      <div style={styles.resourceBarTrack}>
        <div style={{ ...styles.resourceBarFill, width: `${pct}%`, background: color }} />
      </div>
      <span style={{ ...styles.resourceHours, color }}>~{hours} hours</span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '20px 24px',
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
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center' as const,
    padding: '20px 0',
  },
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  section: {
    padding: '16px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.5px',
    margin: '0 0 12px',
    textTransform: 'uppercase' as const,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap' as const,
  },
  metricLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 600,
    color: '#1e293b',
  },
  barWrap: {
    marginTop: 10,
  },
  barTrack: {
    height: 20,
    background: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.5s',
  },
  gapHighlight: {
    fontSize: 14,
    fontWeight: 700,
    color: '#ef4444',
  },
  gapOk: {
    fontSize: 14,
    fontWeight: 600,
    color: '#22c55e',
  },
  resourceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  resourceLabel: {
    fontSize: 13,
    color: '#64748b',
    width: 110,
    flexShrink: 0,
  },
  resourceBarTrack: {
    flex: 1,
    height: 14,
    background: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  resourceBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s',
  },
  resourceHours: {
    fontSize: 13,
    fontWeight: 600,
    width: 80,
    textAlign: 'right' as const,
    flexShrink: 0,
  },
  basisText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center' as const,
    fontStyle: 'italic',
    margin: 0,
  },
};

export default ResourceGapAnalysis;
