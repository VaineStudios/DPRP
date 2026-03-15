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
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>DPRP</h1>
          <p style={styles.subtitle}>Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dprp.gov.jm"
              required
              autoComplete="email"
              style={styles.input}
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
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'var(--bg-page)',
  },
  card: {
    width: 400,
    padding: 40,
    background: 'var(--bg-card)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-md)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-1px',
    lineHeight: 1,
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-secondary)',
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
    color: 'var(--text-muted)',
  },
  input: {
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid var(--border-input)',
    borderRadius: 8,
    outline: 'none',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    padding: '8px 12px',
    background: 'var(--bg-error)',
    borderRadius: 8,
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    background: '#1e293b',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 8,
  },
};

export default Login;
