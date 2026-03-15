import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import UpdateForm from './pages/UpdateForm';

const App = () => {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

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

  return <UpdateForm user={user} onLogout={logout} />;
};

export default App;
