import { useState, useEffect, useCallback } from 'react';
import { getShelters } from '../api/client';
import { getSocket } from '../api/socket';
import type { Shelter, ShelterUpdate } from '../api/client';

export const useShelters = (isAuthenticated: boolean) => {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShelters = useCallback(async () => {
    try {
      setError(null);
      const data = await getShelters();
      setShelters(data);
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

  // Listen for real-time shelter updates via Socket.io
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = (data: { shelterId: string; update: ShelterUpdate }) => {
      setShelters(prev =>
        prev.map(s =>
          s.id === data.shelterId ? { ...s, latestUpdate: data.update } : s
        )
      );
    };

    socket.on('shelter:updated', handleUpdate);
    return () => { socket.off('shelter:updated', handleUpdate); };
  }, [isAuthenticated]);

  return { shelters, loading, error, refetch: fetchShelters };
};
