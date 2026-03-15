import { useState, useEffect } from 'react';

const ConnectionStatus = () => {
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
      {online ? 'Online' : 'Offline — updates will queue'}
    </div>
  );
};

export default ConnectionStatus;
