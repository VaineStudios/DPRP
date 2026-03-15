import { useState, useCallback } from 'react';

export interface SelectedShelter {
  id: string;
  name: string;
  parish: string;
  facilityType: string | null;
}

const STORAGE_KEY = 'dprp_selected_shelter';

const readFromStorage = (): SelectedShelter | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.id === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.parish === 'string'
    ) {
      return parsed as SelectedShelter;
    }
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const useShelter = () => {
  const [selectedShelter, setSelectedShelter] = useState<SelectedShelter | null>(
    () => readFromStorage()
  );

  const selectShelter = useCallback((shelter: SelectedShelter) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shelter));
    } catch {
      // storage full or disabled — continue with in-memory state
    }
    setSelectedShelter(shelter);
  }, []);

  const clearShelter = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSelectedShelter(null);
  }, []);

  return { selectedShelter, selectShelter, clearShelter };
};
