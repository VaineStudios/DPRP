import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initDB,
  addToQueue,
  getQueuedUpdates,
  removeFromQueue,
  updateRetryCount,
  getQueueLength,
} from '../services/offlineQueue';
import { submitUpdate as apiSubmitUpdate } from '../api/client';
import type { ShelterUpdateData } from '../api/client';

const API_URL = import.meta.env.VITE_API_URL || '';
const MAX_RETRIES = 5;
const FLUSH_DELAY_MS = 500;

export interface FlushResult {
  sent: number;
  failed: number;
}

export const useOfflineQueue = () => {
  const [queueLength, setQueueLength] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);
  const [lastFlushResult, setLastFlushResult] = useState<FlushResult | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const flushingRef = useRef(false);
  const initializedRef = useRef(false);

  // Raw POST for flush — bypasses apiFetch's auto-401-reload
  const postUpdate = useCallback(async (data: ShelterUpdateData): Promise<{ ok: boolean; status: number }> => {
    const token = localStorage.getItem('dprp_token');
    const res = await fetch(`${API_URL}/api/updates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    return { ok: res.ok, status: res.status };
  }, []);

  const flushQueue = useCallback(async () => {
    if (flushingRef.current || !navigator.onLine) return;
    flushingRef.current = true;
    setIsFlushing(true);
    setLastFlushResult(null);
    setNeedsReauth(false);

    let sent = 0;
    let failed = 0;

    try {
      const updates = await getQueuedUpdates();
      if (updates.length === 0) {
        setIsFlushing(false);
        flushingRef.current = false;
        return;
      }

      for (let i = 0; i < updates.length; i++) {
        const update = updates[i];
        try {
          const { ok, status } = await postUpdate({
            shelterId: update.shelterId,
            capacityLevel: update.capacityLevel,
            waterLevel: update.waterLevel,
            foodLevel: update.foodLevel,
            medicalLevel: update.medicalLevel,
            notes: update.notes,
          });

          if (ok) {
            await removeFromQueue(update.id);
            sent++;
            setQueueLength((prev) => Math.max(0, prev - 1));
          } else if (status === 401) {
            setNeedsReauth(true);
            break;
          } else {
            const newRetry = update.retryCount + 1;
            if (newRetry >= MAX_RETRIES) {
              console.warn(`Giving up on queued update ${update.id} after ${MAX_RETRIES} retries`);
              await removeFromQueue(update.id);
              failed++;
              setQueueLength((prev) => Math.max(0, prev - 1));
            } else {
              await updateRetryCount(update.id, newRetry);
            }
          }
        } catch {
          // Network error during individual send — stop flushing
          break;
        }

        if (i < updates.length - 1) {
          await new Promise((r) => setTimeout(r, FLUSH_DELAY_MS));
        }
      }
    } catch (err) {
      console.error('Queue flush error:', err);
    }

    setIsFlushing(false);
    flushingRef.current = false;
    if (sent > 0 || failed > 0) {
      setLastFlushResult({ sent, failed });
    }
  }, [postUpdate]);

  // Initialize DB and auto-flush on mount if needed
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    initDB().then(async () => {
      const count = await getQueueLength();
      setQueueLength(count);
      if (count > 0 && navigator.onLine) {
        flushQueue();
      }
    });
  }, [flushQueue]);

  // Auto-flush when coming back online
  useEffect(() => {
    const handleOnline = () => {
      getQueueLength().then((count) => {
        if (count > 0) flushQueue();
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushQueue]);

  const submitUpdate = useCallback(async (
    update: ShelterUpdateData,
  ): Promise<{ success: boolean; queued: boolean }> => {
    if (navigator.onLine) {
      try {
        await apiSubmitUpdate(update);
        // After successful direct submit, trigger background flush if queue has items
        getQueueLength().then((count) => {
          if (count > 0 && !flushingRef.current) flushQueue();
        });
        return { success: true, queued: false };
      } catch (err) {
        // Only queue on network errors (TypeError from fetch).
        // Server validation errors (Error from apiFetch) should propagate to caller.
        if (!(err instanceof TypeError)) {
          throw err;
        }
      }
    }

    // Offline or network error — queue it
    await addToQueue(update);
    setQueueLength((prev) => prev + 1);
    return { success: true, queued: true };
  }, [flushQueue]);

  return {
    queueLength,
    isFlushing,
    lastFlushResult,
    needsReauth,
    submitUpdate,
    flushQueue,
    clearLastFlushResult: useCallback(() => setLastFlushResult(null), []),
  };
};
