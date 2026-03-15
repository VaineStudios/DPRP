import { useState, useCallback, useEffect } from 'react';
import Map from '../components/Map';
import type { FlyTarget } from '../components/Map';
import StatusBar from '../components/StatusBar';
import AiPanel from '../components/AiPanel';
import ToastContainer from '../components/Toast';
import type { ToastItem } from '../components/Toast';
import Preparedness from './Preparedness';
import { useShelters } from '../hooks/useShelters';
import { useDisasters } from '../hooks/useDisasters';
import { useSocket } from '../hooks/useSocket';
import type { UserResponse, ShelterUpdateEvent } from '../api/client';

interface DashboardProps {
  user: UserResponse;
  token: string;
  onLogout: () => void;
}

let toastIdCounter = 0;

const Dashboard = ({ user, token, onLogout }: DashboardProps) => {
  const { shelters, loading, error, updateShelter } = useShelters(true);
  const { disasters, activeEvent } = useDisasters(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'response' | 'preparedness'>('response');
  const [showAiPanel, setShowAiPanel] = useState(true);

  // Auto-dismiss expired toasts every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(prev => {
        const now = Date.now();
        const filtered = prev.filter(t => now - t.timestamp < 4000);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleShelterUpdate = useCallback((event: ShelterUpdateEvent) => {
    updateShelter(event.shelterId, event.update);

    const toast: ToastItem = {
      id: String(++toastIdCounter),
      shelterId: event.shelterId,
      shelterName: event.shelter.name,
      capacityLevel: event.update.capacityLevel,
      waterLevel: event.update.waterLevel,
      lat: event.shelter.lat ?? 0,
      lng: event.shelter.lng ?? 0,
      timestamp: Date.now(),
    };
    setToasts(prev => [...prev.slice(-2), toast]); // Max 3
  }, [updateShelter]);

  useSocket(token, handleShelterUpdate);

  const handleToastClick = useCallback((shelterId: string, lat: number, lng: number) => {
    setToasts(prev => prev.filter(t => t.shelterId !== shelterId));
    setFlyTarget({ lat, lng });
    setTimeout(() => {
      setOpenPopupId(shelterId);
      setFlyTarget(null);
      setTimeout(() => setOpenPopupId(null), 1000);
    }, 1200);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleFlyToShelter = useCallback((lat: number, lng: number, shelterId: string) => {
    setFlyTarget({ lat, lng });
    setTimeout(() => {
      setOpenPopupId(shelterId);
      setFlyTarget(null);
      setTimeout(() => setOpenPopupId(null), 1000);
    }, 1200);
  }, []);

  // Toggle AI panel on tablet (768-1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowAiPanel(false);
      } else {
        setShowAiPanel(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.loading}>Loading shelter data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <StatusBar
        shelters={shelters}
        user={user}
        onLogout={onLogout}
        activeEvent={activeEvent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'response' ? (
        <div style={styles.body}>
          <div style={styles.mapWrap}>
            <Map shelters={shelters} flyTarget={flyTarget} openPopupId={openPopupId} />
            {/* Tablet toggle button for AI panel */}
            {window.innerWidth >= 768 && window.innerWidth < 1024 && (
              <button
                style={styles.panelToggle}
                onClick={() => setShowAiPanel(prev => !prev)}
              >
                {showAiPanel ? 'Hide AI' : 'Show AI'}
              </button>
            )}
          </div>
          {showAiPanel && (
            <AiPanel
              activeEvent={activeEvent}
              onFlyToShelter={handleFlyToShelter}
            />
          )}
          <ToastContainer
            toasts={toasts}
            onDismiss={handleDismissToast}
            onClick={handleToastClick}
          />
        </div>
      ) : (
        <Preparedness disasters={disasters} />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  body: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  mapWrap: {
    flex: 1,
    position: 'relative',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  loading: {
    fontSize: 18,
    color: '#64748b',
  },
  error: {
    fontSize: 16,
    color: '#dc2626',
    padding: 24,
    background: '#fef2f2',
    borderRadius: 8,
  },
  panelToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    background: '#3b82f6',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
};

export default Dashboard;
