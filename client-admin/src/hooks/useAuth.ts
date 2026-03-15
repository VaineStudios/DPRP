import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin } from '../api/client';
import { connect, disconnect } from '../api/socket';
import type { UserResponse } from '../api/client';

interface AuthState {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
}

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('dprp_admin_token');
    const storedUser = localStorage.getItem('dprp_admin_user');

    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      setState({ token: storedToken, user: JSON.parse(storedUser), isLoading: false });
      connect(storedToken);
    } else {
      localStorage.removeItem('dprp_admin_token');
      localStorage.removeItem('dprp_admin_user');
      setState({ token: null, user: null, isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await apiLogin(email, password);
    if (user.role !== 'ADMIN') {
      throw new Error('Admin access required');
    }
    localStorage.setItem('dprp_admin_token', token);
    localStorage.setItem('dprp_admin_user', JSON.stringify(user));
    setState({ token, user, isLoading: false });
    connect(token);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dprp_admin_token');
    localStorage.removeItem('dprp_admin_user');
    disconnect();
    setState({ token: null, user: null, isLoading: false });
  }, []);

  return {
    ...state,
    login,
    logout,
    isAuthenticated: !!state.token,
  };
};
