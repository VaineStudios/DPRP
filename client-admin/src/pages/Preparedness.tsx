import { useState, useEffect } from 'react';
import type { DisasterEvent } from '../api/client';
import DisasterSelector from '../components/DisasterSelector';
import EventOverview from '../components/preparedness/EventOverview';
import HistoricalComparison from '../components/preparedness/HistoricalComparison';
import VulnerabilityMap from '../components/preparedness/VulnerabilityMap';
import ResourceGapAnalysis from '../components/preparedness/ResourceGapAnalysis';
import IrisForecaster from '../components/preparedness/IrisForecaster';
import ScenarioModeler from '../components/preparedness/ScenarioModeler';

interface PreparednessProps {
  disasters: DisasterEvent[];
  onPanToParish?: (parish: string) => void;
}

const Preparedness = ({ disasters, onPanToParish }: PreparednessProps) => {
  const preparingEvents = disasters.filter(d => d.status === 'PREPARING');
  const [selectedId, setSelectedId] = useState<string | null>(
    preparingEvents[0]?.id ?? null
  );
  const [isWide, setIsWide] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const selectedEvent = disasters.find(d => d.id === selectedId) ?? null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Heading + inline event selector */}
        <div style={styles.headingRow}>
          <div>
            <h2 style={styles.headingText}>Preparedness analytics</h2>
            <p style={styles.headingSubtext}>
              IRIS-powered intelligence for disaster planning professionals
            </p>
          </div>
          <div style={styles.selectorInline}>
            <DisasterSelector
              disasters={preparingEvents}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>

        {/* Row 1: Event Overview + Resource Gap Analysis */}
        <div style={{
          ...styles.twoCol,
          gridTemplateColumns: isWide ? '2fr 3fr' : '1fr',
        }}>
          <EventOverview event={selectedEvent} />
          <ResourceGapAnalysis approachingEvent={selectedEvent} />
        </div>

        {/* Row 2: Vulnerability + Historical */}
        <div style={{
          ...styles.twoCol,
          gridTemplateColumns: isWide ? '3fr 2fr' : '1fr',
        }}>
          <VulnerabilityMap
            approachingEvent={selectedEvent}
            onParishClick={onPanToParish}
          />
          <HistoricalComparison approachingEvent={selectedEvent} />
        </div>

        {/* Row 3: IRIS Forecaster + Scenario Modeler */}
        <div style={{
          ...styles.twoCol,
          gridTemplateColumns: isWide ? '1fr 1fr' : '1fr',
        }}>
          <IrisForecaster selectedEvent={selectedEvent} />
          <ScenarioModeler />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    background: 'var(--bg-page)',
  },
  content: {
    maxWidth: 1400,
    margin: '0 auto',
    padding: '16px 24px 48px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  headingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  headingText: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 2px',
  },
  headingSubtext: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: 0,
  },
  selectorInline: {
    background: 'var(--bg-card)',
    borderRadius: 10,
    boxShadow: 'var(--shadow)',
    padding: '10px 16px',
    minWidth: 220,
  },
  twoCol: {
    display: 'grid',
    gap: 16,
    alignItems: 'start',
  },
};

export default Preparedness;
