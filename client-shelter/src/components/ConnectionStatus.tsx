import { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  queueLength?: number;
  isFlushing?: boolean;
}

const ConnectionStatus = ({ queueLength = 0, isFlushing = false }: ConnectionStatusProps) => {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  let label: string;
  if (online && isFlushing && queueLength > 0) {
    label = `Online — sending ${queueLength} queued update${queueLength !== 1 ? 's' : ''}...`;
  } else if (online && queueLength > 0) {
    label = `Online — ${queueLength} update${queueLength !== 1 ? 's' : ''} queued`;
  } else if (online) {
    label = 'Online';
  } else if (queueLength > 0) {
    label = `Offline — ${queueLength} update${queueLength !== 1 ? 's' : ''} queued`;
  } else {
    label = 'Offline — updates will queue';
  }

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      height: 32,
      padding: '0 16px',
      margin: '0 -16px',
      fontSize: 13,
      fontWeight: 500,
      color: online ? '#15803d' : '#dc2626',
      background: online ? '#f0fdf4' : '#fef2f2',
      borderBottom: `1px solid ${online ? '#bbf7d0' : '#fecaca'}`,
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: online ? '#22c55e' : '#ef4444',
        flexShrink: 0,
      }} />
      {label}
    </div>
  );
};

export default ConnectionStatus;
