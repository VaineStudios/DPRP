import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useShelter } from './hooks/useShelter';
import { joinShelter } from './api/socket';
import Login from './pages/Login';
import ShelterPicker from './pages/ShelterPicker';
import UpdateForm from './pages/UpdateForm';

const App = () => {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();
  const { selectedShelter, selectShelter, clearShelter } = useShelter();

  // Join shelter socket room when shelter is selected
  useEffect(() => {
    if (selectedShelter && isAuthenticated) {
      joinShelter(selectedShelter.id);
    }
  }, [selectedShelter, isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh' }}>
        <p style={{ fontSize: 18, color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login onLogin={login} />;
  }

  if (!selectedShelter) {
    return <ShelterPicker onSelect={selectShelter} userShelterId={user.shelterId} />;
  }

  return <UpdateForm shelter={selectedShelter} onClearShelter={clearShelter} onLogout={logout} />;
};

export default App;
