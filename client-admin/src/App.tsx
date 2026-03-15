import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const App = () => {
  const { isAuthenticated, isLoading, token, user, login, logout } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p style={{ fontSize: 18, color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || !token) {
    return <Login onLogin={login} />;
  }

  return <Dashboard user={user} token={token} onLogout={logout} />;
};

export default App;
