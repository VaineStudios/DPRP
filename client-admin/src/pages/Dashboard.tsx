import { useState, useCallback, useEffect, useRef } from 'react';
import Map from '../components/Map';
import type { FlyTarget } from '../components/Map';
import StatusBar from '../components/StatusBar';
import IrisPanel from '../components/IrisPanel';
import StatCards from '../components/dashboard/StatCards';
import ParishBreakdown from '../components/dashboard/ParishBreakdown';
import CriticalAlerts from '../components/dashboard/CriticalAlerts';
import CapacityTrend from '../components/dashboard/CapacityTrend';
import ToastContainer from '../components/Toast';
import type { ToastItem } from '../components/Toast';
import Preparedness from './Preparedness';
import { useShelters } from '../hooks/useShelters';
import { useDisasters } from '../hooks/useDisasters';
import { useSocket } from '../hooks/useSocket';
import { useNetworkStats } from '../hooks/useNetworkStats';
import { useAlerts } from '../hooks/useAlerts';
import { useCapacityTrend } from '../hooks/useCapacityTrend';
import { PARISH_CENTROIDS } from '../constants/parishes';
import type { NotificationItem } from '../components/NotificationPanel';
import type { UserResponse, ShelterUpdateEvent } from '../api/client';

interface DashboardProps {
  user: UserResponse;
  token: string;
  onLogout: () => void;
}

let toastIdCounter = 0;

const Dashboard = ({ user, token, onLogout }: DashboardProps) => {
  const { disasters, activeEvent } = useDisasters(true);
  const { shelters, loading, error, updateShelter, newlyActivatedIds, clearNewlyActivated } =
    useShelters(true, activeEvent?.id);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [openPopupId, setOpenPopupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'response' | 'preparedness'>('response');
  const [irisAnalyzing, setIrisAnalyzing] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  const stats = useNetworkStats(shelters, activeEvent);
  const alerts = useAlerts(shelters);
  const trendData = useCapacityTrend(stats.avgCapacityPercent);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    // Only process updates for the current active event
    if (activeEvent && event.disasterEventId !== activeEvent.id) return;

    updateShelter(event.shelterId, event.update);

    const now = Date.now();
    const id = String(++toastIdCounter);
    const item = {
      id,
      shelterId: event.shelterId,
      shelterName: event.shelter.name,
      capacityLevel: event.update.capacityLevel,
      waterLevel: event.update.waterLevel,
      lat: event.shelter.lat ?? 0,
      lng: event.shelter.lng ?? 0,
      timestamp: now,
    };
    setToasts(prev => [...prev.slice(-2), item]);
    setNotifications(prev => [item, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
  }, [updateShelter, activeEvent]);

  useSocket(token, handleShelterUpdate);

  const scrollToMapAndAct = useCallback((action: () => void) => {
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      setTimeout(action, 350);
    } else {
      action();
    }
  }, []);

  const handleFlyToShelter = useCallback((lat: number, lng: number, shelterId: string) => {
    const doFly = () => {
      setFlyTarget({ lat, lng });
      setTimeout(() => {
        setOpenPopupId(shelterId);
        setFlyTarget(null);
        setTimeout(() => setOpenPopupId(null), 1000);
      }, 1200);
    };
    scrollToMapAndAct(doFly);
  }, [scrollToMapAndAct]);

  const handleToastClick = useCallback((shelterId: string, lat: number, lng: number) => {
    setToasts(prev => prev.filter(t => t.shelterId !== shelterId));
    handleFlyToShelter(lat, lng, shelterId);
  }, [handleFlyToShelter]);

  const handleDismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleNotificationsOpen = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const handleNotificationClick = useCallback((shelterId: string, lat: number, lng: number) => {
    handleFlyToShelter(lat, lng, shelterId);
  }, [handleFlyToShelter]);

  const handlePanToParish = useCallback((parish: string) => {
    const centroid = PARISH_CENTROIDS[parish];
    if (centroid) {
      const doFly = () => {
        setFlyTarget({ lat: centroid.lat, lng: centroid.lng, zoom: 11 });
        setTimeout(() => setFlyTarget(null), 1200);
      };
      scrollToMapAndAct(doFly);
    }
  }, [scrollToMapAndAct]);

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

  const isTablet = windowWidth < 1024;
  const activeShelters = shelters.filter(s => s.latestUpdate !== null);

  return (
    <div style={styles.page}>
      <StatusBar
        shelters={shelters}
        user={user}
        onLogout={onLogout}
        activeEvent={activeEvent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        irisAnalyzing={irisAnalyzing}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotificationsOpen={handleNotificationsOpen}
        onNotificationClick={handleNotificationClick}
      />

      {activeTab === 'response' ? (
        <div style={styles.scrollArea}>
          <div style={styles.content}>
            {/* Stat Cards Row */}
            <StatCards stats={stats} />

            {/* Map + IRIS Panel */}
            <div
              ref={mapSectionRef}
              id="map-section"
              style={{
                ...styles.mapAiCard,
                flexDirection: isTablet ? 'column' : 'row',
              }}
            >
              <div style={{
                ...styles.mapWrap,
                height: isTablet ? '50vh' : '60vh',
                minHeight: 400,
              }}>
                <Map
                  shelters={activeShelters}
                  flyTarget={flyTarget}
                  openPopupId={openPopupId}
                  newlyActivatedIds={newlyActivatedIds}
                  onActivationAnimationDone={clearNewlyActivated}
                />
              </div>
              <div style={{
                ...styles.aiWrap,
                width: isTablet ? '100%' : 320,
                height: isTablet ? 'auto' : '60vh',
                maxHeight: isTablet ? 400 : undefined,
                borderLeft: isTablet ? 'none' : '1px solid #e2e8f0',
                borderTop: isTablet ? '1px solid #e2e8f0' : 'none',
              }}>
                <IrisPanel
                  activeEvent={activeEvent}
                  onFlyToShelter={handleFlyToShelter}
                  onAnalyzing={setIrisAnalyzing}
                />
              </div>
            </div>

            {/* Parish Breakdown + Critical Alerts */}
            <div style={{
              ...styles.twoCol,
              gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr',
            }}>
              <ParishBreakdown
                parishStats={stats.parishStats}
                onParishClick={handlePanToParish}
              />
              <CriticalAlerts
                alerts={alerts}
                onAlertClick={handleFlyToShelter}
              />
            </div>

            {/* Capacity Trend Chart */}
            <CapacityTrend dataPoints={trendData} />
          </div>
        </div>
      ) : (
        <div style={styles.scrollArea}>
          <Preparedness
            disasters={disasters}
            onPanToParish={(parish: string) => {
              setActiveTab('response');
              setTimeout(() => handlePanToParish(parish), 300);
            }}
          />
        </div>
      )}

      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onClick={handleToastClick}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#f1f5f9',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto' as const,
    overflowX: 'hidden',
  },
  content: {
    maxWidth: 1440,
    margin: '0 auto',
    padding: '16px 24px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  mapAiCard: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    display: 'flex',
  },
  mapWrap: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  aiWrap: {
    flexShrink: 0,
    overflow: 'auto' as const,
  },
  twoCol: {
    display: 'grid',
    gap: 16,
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
