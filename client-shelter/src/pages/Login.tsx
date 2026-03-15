import { useState, type FormEvent } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
}

const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>DPRP</h1>
        <p style={styles.subtitle}>Shelter Manager</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="manager@dprp.gov.jm"
            required
            autoComplete="email"
          />
        </div>

        <div style={styles.field}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            autoComplete="current-password"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '100dvh',
    padding: '24px 0',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: 800,
    color: '#1d4ed8',
    letterSpacing: '-1px',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    padding: '8px 12px',
    background: '#fef2f2',
    borderRadius: 8,
  },
  button: {
    width: '100%',
    minHeight: 56,
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    background: '#1d4ed8',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 8,
  },
};

export default Login;
