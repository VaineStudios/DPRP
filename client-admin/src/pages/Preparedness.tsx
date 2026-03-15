import { useState } from 'react';
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

  const selectedEvent = disasters.find(d => d.id === selectedId) ?? null;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.heading}>
          <h2 style={styles.headingText}>Preparedness analytics</h2>
          <p style={styles.headingSubtext}>
            IRIS-powered intelligence for disaster planning professionals
          </p>
        </div>

        {/* Event selector */}
        <div style={styles.selectorCard}>
          <DisasterSelector
            disasters={preparingEvents}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Event Overview */}
        <EventOverview event={selectedEvent} />

        {/* Historical Comparison */}
        <HistoricalComparison approachingEvent={selectedEvent} />

        {/* Vulnerability Assessment */}
        <VulnerabilityMap
          approachingEvent={selectedEvent}
          onParishClick={onPanToParish}
        />

        {/* Resource Gap Analysis */}
        <ResourceGapAnalysis approachingEvent={selectedEvent} />

        {/* IRIS Forecaster */}
        <IrisForecaster selectedEvent={selectedEvent} />

        {/* Scenario Modeler */}
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
  heading: {
    marginBottom: 4,
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
  selectorCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '16px 20px',
  },
};

export default Preparedness;
