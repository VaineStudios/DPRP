import { useState, useEffect } from 'react';

interface LastUpdateProps {
  timestamp: Date | null;
}

const getRelativeTime = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const LastUpdate = ({ timestamp }: LastUpdateProps) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!timestamp) return;
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, [timestamp]);

  if (!timestamp) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 12px',
      background: '#f0fdf4',
      border: '1px solid #bbf7d0',
      borderRadius: 8,
      marginBottom: 16,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="#22c55e">
        <path d="M8 0a8 8 0 110 16A8 8 0 018 0zm3.3 5.3L7 9.6 4.7 7.3a1 1 0 00-1.4 1.4l3 3a1 1 0 001.4 0l5-5a1 1 0 00-1.4-1.4z" />
      </svg>
      <span style={{ fontSize: 14, color: '#15803d' }}>
        Last update sent {getRelativeTime(timestamp)}
      </span>
    </div>
  );
};

export default LastUpdate;
