import type { Shelter } from '../api/client';

const OFFLINE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

export const getPinColor = (shelter: Shelter): string => {
  const update = shelter.latestUpdate;

  if (!update) return '#6b7280'; // Gray - no data

  const age = Date.now() - new Date(update.createdAt).getTime();
  if (age > OFFLINE_THRESHOLD_MS) return '#6b7280'; // Gray - offline

  const level = update.capacityLevel;
  if (level <= 2) return '#22c55e'; // Green - operational
  if (level === 3) return '#f59e0b'; // Amber - moderate
  return '#ef4444'; // Red - critical
};

export const isOffline = (shelter: Shelter): boolean => {
  const update = shelter.latestUpdate;
  if (!update) return true;
  return Date.now() - new Date(update.createdAt).getTime() > OFFLINE_THRESHOLD_MS;
};

export const getTimeSince = (dateStr: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};
