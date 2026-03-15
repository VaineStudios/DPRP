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
          gridTemplateColumns: isWide ? '1fr 1fr' : '1fr',
        }}>
          <EventOverview event={selectedEvent} />
          <ResourceGapAnalysis approachingEvent={selectedEvent} />
        </div>

        {/* Full width: Vulnerability Assessment */}
        <VulnerabilityMap
          approachingEvent={selectedEvent}
          onParishClick={onPanToParish}
        />

        {/* Row 2: Historical Comparison + IRIS Forecaster */}
        <div style={{
          ...styles.twoCol,
          gridTemplateColumns: isWide ? '1fr 1fr' : '1fr',
        }}>
          <HistoricalComparison approachingEvent={selectedEvent} />
          <IrisForecaster selectedEvent={selectedEvent} />
        </div>

        {/* Full width: Scenario Modeler */}
        <ScenarioModeler />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    background: '#f1f5f9',
  },
  content: {
    maxWidth: 1100,
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
    color: '#1e293b',
    margin: '0 0 2px',
  },
  headingSubtext: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
  },
  selectorInline: {
    background: '#fff',
    borderRadius: 10,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '10px 16px',
    minWidth: 220,
  },
  twoCol: {
    display: 'grid',
    gap: 16,
  },
};

export default Preparedness;
