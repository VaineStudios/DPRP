import { useState, useEffect, useRef } from 'react';
import type { Shelter } from '../api/client';
import { isOffline } from '../utils/shelter';

export type AlertType =
  | 'capacity-critical'
  | 'capacity-high'
  | 'water-low'
  | 'food-low'
  | 'medical-low'
  | 'offline';

export interface Alert {
  id: string;
  shelterId: string;
  shelterName: string;
  type: AlertType;
  severity: 'red' | 'amber' | 'gray';
  message: string;
  timestamp: number;
  lat: number;
  lng: number;
}

interface PrevState {
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  offline: boolean;
}

const MAX_ALERTS = 15;

const makeId = (shelterId: string, type: AlertType) => `${shelterId}:${type}`;

const generateAlerts = (shelter: Shelter, prev: PrevState | undefined): Alert[] => {
  const u = shelter.latestUpdate;
  const alerts: Alert[] = [];
  const offline = isOffline(shelter);
  const base = { shelterId: shelter.id, shelterName: shelter.name, lat: shelter.lat, lng: shelter.lng, timestamp: Date.now() };

  if (u && !offline) {
    if (u.capacityLevel === 5 && (!prev || prev.capacityLevel !== 5)) {
      alerts.push({ ...base, id: makeId(shelter.id, 'capacity-critical'), type: 'capacity-critical', severity: 'red', message: `${shelter.name} at full capacity` });
    }
    if (u.capacityLevel === 4 && (!prev || prev.capacityLevel < 4)) {
      alerts.push({ ...base, id: makeId(shelter.id, 'capacity-high'), type: 'capacity-high', severity: 'amber', message: `${shelter.name} approaching capacity` });
    }
    if (u.waterLevel === 1 && (!prev || prev.waterLevel !== 1)) {
      alerts.push({ ...base, id: makeId(shelter.id, 'water-low'), type: 'water-low', severity: 'red', message: `${shelter.name} water supply critical` });
    }
    if (u.foodLevel === 1 && (!prev || prev.foodLevel !== 1)) {
      alerts.push({ ...base, id: makeId(shelter.id, 'food-low'), type: 'food-low', severity: 'red', message: `${shelter.name} food supply critical` });
    }
    if (u.medicalLevel === 1 && (!prev || prev.medicalLevel !== 1)) {
      alerts.push({ ...base, id: makeId(shelter.id, 'medical-low'), type: 'medical-low', severity: 'red', message: `${shelter.name} medical supply critical` });
    }
  }

  if (offline && prev && !prev.offline) {
    const mins = u ? Math.round((Date.now() - new Date(u.createdAt).getTime()) / 60000) : 0;
    alerts.push({ ...base, id: makeId(shelter.id, 'offline'), type: 'offline', severity: 'gray', message: `${shelter.name} offline for ${mins}m` });
  }

  return alerts;
};

export const useAlerts = (shelters: Shelter[]): Alert[] => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const prevStateRef = useRef<Map<string, PrevState>>(new Map());
  const initializedRef = useRef(false);

  // Initial scan
  useEffect(() => {
    if (initializedRef.current || shelters.length === 0) return;
    initializedRef.current = true;

    const initial: Alert[] = [];
    const stateMap = new Map<string, PrevState>();

    for (const s of shelters) {
      const u = s.latestUpdate;
      const offline = isOffline(s);

      if (u && !offline) {
        stateMap.set(s.id, { capacityLevel: u.capacityLevel, waterLevel: u.waterLevel, foodLevel: u.foodLevel, medicalLevel: u.medicalLevel, offline: false });
        initial.push(...generateAlerts(s, undefined));
      } else {
        stateMap.set(s.id, { capacityLevel: u?.capacityLevel ?? 0, waterLevel: u?.waterLevel ?? 0, foodLevel: u?.foodLevel ?? 0, medicalLevel: u?.medicalLevel ?? 0, offline });
      }
    }

    prevStateRef.current = stateMap;
    setAlerts(initial.slice(0, MAX_ALERTS));
  }, [shelters]);

  // Subsequent updates
  useEffect(() => {
    if (!initializedRef.current) return;

    const newAlerts: Alert[] = [];

    for (const s of shelters) {
      const u = s.latestUpdate;
      const offline = isOffline(s);
      const prev = prevStateRef.current.get(s.id);

      newAlerts.push(...generateAlerts(s, prev));

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
        for (const a of newAlerts) {
          alertMap.set(a.id, a);
        }
        return Array.from(alertMap.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, MAX_ALERTS);
      });
    }
  }, [shelters]);

  return alerts;
};
