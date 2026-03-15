import { useState, useEffect, useRef } from 'react';
import type { Shelter } from '../../api/client';
import type { CriticalAlert, AlertType } from './types';
import { isOffline, getTimeSince } from '../../utils/shelter';

interface CriticalAlertsProps {
  shelters: Shelter[];
  onAlertClick: (lat: number, lng: number, shelterId: string) => void;
}

interface PrevShelterState {
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  offline: boolean;
}

const MAX_ALERTS = 20;

const ALERT_COLORS: Record<AlertType, string> = {
  'capacity-critical': '#ef4444',
  'capacity-high': '#f59e0b',
  'water-low': '#ef4444',
  'food-low': '#ef4444',
  'medical-low': '#ef4444',
  'offline': '#6b7280',
};

const makeAlertId = (shelterId: string, type: AlertType) => `${shelterId}:${type}`;

const generateAlerts = (shelter: Shelter, prev: PrevShelterState | undefined): CriticalAlert[] => {
  const u = shelter.latestUpdate;
  const alerts: CriticalAlert[] = [];
  const offline = isOffline(shelter);

  if (u && !offline) {
    // Capacity critical (level 5)
    if (u.capacityLevel === 5 && (!prev || prev.capacityLevel !== 5)) {
      alerts.push({
        id: makeAlertId(shelter.id, 'capacity-critical'),
        shelterId: shelter.id,
        shelterName: shelter.name,
        parish: shelter.parish,
        type: 'capacity-critical',
        message: `${shelter.name} at FULL capacity`,
        color: ALERT_COLORS['capacity-critical'],
        lat: shelter.lat,
        lng: shelter.lng,
        timestamp: Date.now(),
      });
    }

    // Capacity high (level 4)
    if (u.capacityLevel === 4 && (!prev || prev.capacityLevel < 4)) {
      alerts.push({
        id: makeAlertId(shelter.id, 'capacity-high'),
        shelterId: shelter.id,
        shelterName: shelter.name,
        parish: shelter.parish,
        type: 'capacity-high',
        message: `${shelter.name} nearing capacity`,
        color: ALERT_COLORS['capacity-high'],
        lat: shelter.lat,
        lng: shelter.lng,
        timestamp: Date.now(),
      });
    }

    // Water critical
    if (u.waterLevel === 1 && (!prev || prev.waterLevel !== 1)) {
      alerts.push({
        id: makeAlertId(shelter.id, 'water-low'),
        shelterId: shelter.id,
        shelterName: shelter.name,
        parish: shelter.parish,
        type: 'water-low',
        message: `${shelter.name} water supply critical`,
        color: ALERT_COLORS['water-low'],
        lat: shelter.lat,
        lng: shelter.lng,
        timestamp: Date.now(),
      });
    }

    // Food critical
    if (u.foodLevel === 1 && (!prev || prev.foodLevel !== 1)) {
      alerts.push({
        id: makeAlertId(shelter.id, 'food-low'),
        shelterId: shelter.id,
        shelterName: shelter.name,
        parish: shelter.parish,
        type: 'food-low',
        message: `${shelter.name} food supply critical`,
        color: ALERT_COLORS['food-low'],
        lat: shelter.lat,
        lng: shelter.lng,
        timestamp: Date.now(),
      });
    }

    // Medical critical
    if (u.medicalLevel === 1 && (!prev || prev.medicalLevel !== 1)) {
      alerts.push({
        id: makeAlertId(shelter.id, 'medical-low'),
        shelterId: shelter.id,
        shelterName: shelter.name,
        parish: shelter.parish,
        type: 'medical-low',
        message: `${shelter.name} medical supply critical`,
        color: ALERT_COLORS['medical-low'],
        lat: shelter.lat,
        lng: shelter.lng,
        timestamp: Date.now(),
      });
    }
  }

  // Offline detection
  if (offline && prev && !prev.offline) {
    const mins = u
      ? Math.round((Date.now() - new Date(u.createdAt).getTime()) / 60000)
      : 0;
    alerts.push({
      id: makeAlertId(shelter.id, 'offline'),
      shelterId: shelter.id,
      shelterName: shelter.name,
      parish: shelter.parish,
      type: 'offline',
      message: `${shelter.name} offline for ${mins}m`,
      color: ALERT_COLORS['offline'],
      lat: shelter.lat,
      lng: shelter.lng,
      timestamp: Date.now(),
    });
  }

  return alerts;
};

const CriticalAlerts = ({ shelters, onAlertClick }: CriticalAlertsProps) => {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const prevStateRef = useRef<Map<string, PrevShelterState>>(new Map());
  const initializedRef = useRef(false);

  // Initial scan: generate alerts for currently critical shelters
  useEffect(() => {
    if (initializedRef.current || shelters.length === 0) return;
    initializedRef.current = true;

    const initial: CriticalAlert[] = [];
    const stateMap = new Map<string, PrevShelterState>();

    for (const s of shelters) {
      const u = s.latestUpdate;
      const offline = isOffline(s);

      if (u && !offline) {
        stateMap.set(s.id, {
          capacityLevel: u.capacityLevel,
          waterLevel: u.waterLevel,
          foodLevel: u.foodLevel,
          medicalLevel: u.medicalLevel,
          offline: false,
        });

        // Generate alerts for current critical state (pass undefined as prev)
        const newAlerts = generateAlerts(s, undefined);
        initial.push(...newAlerts);
      } else {
        stateMap.set(s.id, {
          capacityLevel: u?.capacityLevel ?? 0,
          waterLevel: u?.waterLevel ?? 0,
          foodLevel: u?.foodLevel ?? 0,
          medicalLevel: u?.medicalLevel ?? 0,
          offline,
        });
      }
    }

    prevStateRef.current = stateMap;
    setAlerts(initial.slice(0, MAX_ALERTS));
  }, [shelters]);

  // Subsequent updates: diff against prev state
  useEffect(() => {
    if (!initializedRef.current) return;

    const newAlerts: CriticalAlert[] = [];

    for (const s of shelters) {
      const u = s.latestUpdate;
      const offline = isOffline(s);
      const prev = prevStateRef.current.get(s.id);

      const generated = generateAlerts(s, prev);
      newAlerts.push(...generated);

      // Update prev state
      prevStateRef.current.set(s.id, {
        capacityLevel: u?.capacityLevel ?? 0,
        waterLevel: u?.waterLevel ?? 0,
        foodLevel: u?.foodLevel ?? 0,
        medicalLevel: u?.medicalLevel ?? 0,
        offline,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const alertMap = new Map(prev.map(a => [a.id, a]));
        // Merge: update existing or add new
        for (const a of newAlerts) {
          alertMap.set(a.id, a);
        }
        // Sort by timestamp desc, cap at MAX_ALERTS
        return Array.from(alertMap.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_ALERTS);
      });
    }
  }, [shelters]);

  const alertCount = alerts.filter(a =>
    a.type !== 'offline'
  ).length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerText}>CRITICAL ALERTS</span>
        {alertCount > 0 && (
          <span style={styles.badge}>{alertCount}</span>
        )}
      </div>
      <div style={styles.list}>
        {alerts.length === 0 && (
          <p style={styles.empty}>No alerts</p>
        )}
        {alerts.map(alert => (
          <div
            key={alert.id}
            style={{
              ...styles.alertCard,
              borderLeftColor: alert.color,
            }}
            onClick={() => onAlertClick(alert.lat, alert.lng, alert.shelterId)}
          >
            <div style={styles.alertRow}>
              <span style={{ ...styles.dot, background: alert.color }} />
              <span style={styles.alertMsg}>{alert.message}</span>
            </div>
            <span style={styles.alertTime}>{getTimeSince(new Date(alert.timestamp).toISOString())}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.5px',
    color: '#94a3b8',
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    color: '#fff',
    background: '#ef4444',
    borderRadius: 8,
    padding: '1px 6px',
    lineHeight: '16px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 260,
    overflowY: 'auto' as const,
  },
  alertCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--sidebar-card)',
    borderRadius: 4,
    padding: '8px 10px',
    minHeight: 40,
    borderLeft: '3px solid',
    cursor: 'pointer',
    animation: 'slideInAlert 0.3s ease-out',
    transition: 'background 0.15s',
  },
  alertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  alertMsg: {
    fontSize: 12,
    color: '#e2e8f0',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  alertTime: {
    fontSize: 10,
    color: '#64748b',
    flexShrink: 0,
    marginLeft: 8,
  },
  empty: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center' as const,
    padding: '16px 0',
  },
};

export default CriticalAlerts;
