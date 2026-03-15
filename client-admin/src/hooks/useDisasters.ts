import { useState, useEffect, useCallback } from 'react';
import { getDisasters } from '../api/client';
import type { DisasterEvent } from '../api/client';

export const useDisasters = (isAuthenticated: boolean) => {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisasters = useCallback(async () => {
    try {
      setError(null);
      const data = await getDisasters();
      setDisasters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disasters');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDisasters();
  }, [isAuthenticated, fetchDisasters]);

  const activeEvent = disasters.find(d => d.status === 'ACTIVE') ?? null;
  const preparingEvents = disasters.filter(d => d.status === 'PREPARING');

  return { disasters, activeEvent, preparingEvents, loading, error, refetch: fetchDisasters };
};
