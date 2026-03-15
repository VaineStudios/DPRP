import { useState, useEffect, useCallback } from 'react';
import { getShelters } from '../api/client';
import type { Shelter, ShelterUpdate } from '../api/client';

export const useShelters = (isAuthenticated: boolean) => {
  const [shelterMap, setShelterMap] = useState<Map<string, Shelter>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const fetchShelters = useCallback(async () => {
    try {
      setError(null);
      const data = await getShelters();
      const map = new Map<string, Shelter>();
      for (const s of data) {
        map.set(s.id, s);
      }
      setShelterMap(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shelters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchShelters();
  }, [isAuthenticated, fetchShelters]);

  // Re-evaluate offline status every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const updateShelter = useCallback((shelterId: string, update: ShelterUpdate) => {
    setShelterMap(prev => {
      const shelter = prev.get(shelterId);
      if (!shelter) return prev;
      const next = new Map(prev);
      next.set(shelterId, { ...shelter, latestUpdate: update });
      return next;
    });
  }, []);

  const shelters = Array.from(shelterMap.values());

  return { shelters, shelterMap, loading, error, updateShelter, refetch: fetchShelters };
};
