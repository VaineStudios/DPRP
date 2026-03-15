import { useState, useEffect, useCallback } from 'react';
import { getUpdateHistory } from '../api/client';

export interface CachedUpdate {
  shelterId: string;
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  notes: string | null;
  createdAt: string;
  cachedAt: string;
}

export interface LatestUpdate {
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  notes: string | null;
  createdAt: Date;
  isOffline: boolean;
}

const STORAGE_KEY = 'dprp_last_update';

const readCache = (shelterId: string): CachedUpdate | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedUpdate;
    if (
      parsed &&
      parsed.shelterId === shelterId &&
      typeof parsed.capacityLevel === 'number' &&
      typeof parsed.waterLevel === 'number' &&
      typeof parsed.foodLevel === 'number' &&
      typeof parsed.medicalLevel === 'number' &&
      typeof parsed.createdAt === 'string'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

const writeCache = (update: CachedUpdate): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(update));
  } catch {
    // storage full or disabled
  }
};

export const useLatestUpdate = (shelterId: string) => {
  const [latestUpdate, setLatestUpdate] = useState<LatestUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchLatest = async () => {
      setIsLoading(true);

      try {
        const { updates } = await getUpdateHistory(shelterId);
        if (cancelled) return;

        if (updates.length > 0) {
          const u = updates[0];
          setLatestUpdate({
            capacityLevel: u.capacityLevel,
            waterLevel: u.waterLevel,
            foodLevel: u.foodLevel,
            medicalLevel: u.medicalLevel,
            notes: u.notes,
            createdAt: new Date(u.createdAt),
            isOffline: false,
          });
          writeCache({
            shelterId,
            capacityLevel: u.capacityLevel,
            waterLevel: u.waterLevel,
            foodLevel: u.foodLevel,
            medicalLevel: u.medicalLevel,
            notes: u.notes,
            createdAt: u.createdAt,
            cachedAt: new Date().toISOString(),
          });
        } else {
          setLatestUpdate(null);
        }
      } catch {
        if (cancelled) return;

        // Offline fallback — try cache
        const cached = readCache(shelterId);
        if (cached) {
          setLatestUpdate({
            capacityLevel: cached.capacityLevel,
            waterLevel: cached.waterLevel,
            foodLevel: cached.foodLevel,
            medicalLevel: cached.medicalLevel,
            notes: cached.notes,
            createdAt: new Date(cached.createdAt),
            isOffline: true,
          });
        } else {
          setLatestUpdate(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchLatest();
    return () => { cancelled = true; };
  }, [shelterId]);

  const updateAfterSubmit = useCallback(
    (levels: { capacityLevel: number; waterLevel: number; foodLevel: number; medicalLevel: number; notes?: string }) => {
      const now = new Date();
      setLatestUpdate({
        ...levels,
        notes: levels.notes ?? null,
        createdAt: now,
        isOffline: false,
      });
      writeCache({
        shelterId,
        ...levels,
        notes: levels.notes ?? null,
        createdAt: now.toISOString(),
        cachedAt: now.toISOString(),
      });
    },
    [shelterId]
  );

  return { latestUpdate, isLoading, updateAfterSubmit };
};
