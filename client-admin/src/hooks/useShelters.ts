import { useState, useEffect, useCallback } from 'react';
import { getShelters } from '../api/client';
import type { Shelter, ShelterUpdate } from '../api/client';

export const useShelters = (isAuthenticated: boolean, eventId?: string | null) => {
  const [shelterMap, setShelterMap] = useState<Map<string, Shelter>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [newlyActivatedIds, setNewlyActivatedIds] = useState<Set<string>>(new Set());

  const fetchShelters = useCallback(async () => {
    try {
      setError(null);
      const data = await getShelters(eventId ?? undefined);
      const map = new Map<string, Shelter>();
      for (const s of data) {
        map.set(s.id, s);
      }
      setShelterMap(map);
      setNewlyActivatedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shelters');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

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

      const wasInactive = shelter.latestUpdate === null;
      const next = new Map(prev);
      next.set(shelterId, { ...shelter, latestUpdate: update });

      if (wasInactive) {
        setTimeout(() => {
          setNewlyActivatedIds(ids => new Set([...ids, shelterId]));
        }, 0);
      }

      return next;
    });
  }, []);

  const clearNewlyActivated = useCallback((shelterId: string) => {
    setNewlyActivatedIds(ids => {
      const next = new Set(ids);
      next.delete(shelterId);
      return next;
    });
  }, []);

  const shelters = Array.from(shelterMap.values());

  return {
    shelters,
    shelterMap,
    loading,
    error,
    updateShelter,
    refetch: fetchShelters,
    newlyActivatedIds,
    clearNewlyActivated,
  };
};
