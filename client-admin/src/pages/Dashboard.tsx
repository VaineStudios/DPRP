import Map from '../components/Map';
import StatusBar from '../components/StatusBar';
import { useShelters } from '../hooks/useShelters';
import type { UserResponse } from '../api/client';

interface DashboardProps {
  user: UserResponse;
  onLogout: () => void;
}

const Dashboard = ({ user: _user, onLogout }: DashboardProps) => {
  const { shelters, loading, error } = useShelters(true);

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.loading}>Loading shelter data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <p style={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <StatusBar shelters={shelters} onLogout={onLogout} />
      <div style={styles.map}>
        <Map shelters={shelters} />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  map: {
    flex: 1,
    position: 'relative',
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  loading: {
    fontSize: 18,
    color: '#64748b',
  },
  error: {
    fontSize: 16,
    color: '#dc2626',
    padding: 24,
    background: '#fef2f2',
    borderRadius: 8,
  },
};

export default Dashboard;
