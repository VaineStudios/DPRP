import { useState, useCallback, useEffect } from 'react';
import Map from '../components/Map';
import type { FlyTarget } from '../components/Map';
import StatusBar from '../components/StatusBar';
import ToastContainer from '../components/Toast';
import type { ToastItem } from '../components/Toast';
import { useShelters } from '../hooks/useShelters';
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
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);

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
    // Remove toasts for this shelter
    setToasts(prev => prev.filter(t => t.shelterId !== shelterId));
    // Fly to shelter
    setFlyTarget({ lat, lng });
    // Open popup after fly animation completes (~1s)
    setTimeout(() => {
      setOpenPopupId(shelterId);
      setFlyTarget(null);
      setTimeout(() => setOpenPopupId(null), 1000);
    }, 1200);
  }, []);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
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
      <StatusBar shelters={shelters} user={user} onLogout={onLogout} />
      <div style={styles.map}>
        <Map shelters={shelters} flyTarget={flyTarget} openPopupId={openPopupId} />
      </div>
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onClick={handleToastClick}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  map: {
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
};

export default Dashboard;
