export interface ToastItem {
  id: string;
  shelterId: string;
  shelterName: string;
  capacityLevel: number;
  waterLevel: number;
  lat: number;
  lng: number;
  timestamp: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onClick: (shelterId: string, lat: number, lng: number) => void;
}

const levelText = (level: number) => {
  if (level <= 2) return 'Good';
  if (level === 3) return 'Fair';
  return 'Critical';
};

const ToastContainer = ({ toasts, onDismiss, onClick }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={styles.toast}
          onClick={() => onClick(toast.shelterId, toast.lat, toast.lng)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onClick(toast.shelterId, toast.lat, toast.lng); }}
        >
          <div style={styles.header}>
            <span style={styles.name}>{toast.shelterName}</span>
            <button
              style={styles.close}
              onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
            >
              x
            </button>
          </div>
          <p style={styles.body}>
            Capacity {levelText(toast.capacityLevel)} ({toast.capacityLevel}/5),{' '}
            Water {levelText(toast.waterLevel)} ({toast.waterLevel}/5)
          </p>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxWidth: 360,
  },
  toast: {
    background: '#1e293b',
    color: '#e2e8f0',
    padding: '12px 16px',
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    cursor: 'pointer',
    animation: 'slideInToast 0.3s ease-out',
    borderLeft: '4px solid #3b82f6',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: 700,
    color: '#f1f5f9',
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 18,
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  },
  body: {
    fontSize: 12,
    color: '#94a3b8',
    margin: 0,
  },
};

export default ToastContainer;
