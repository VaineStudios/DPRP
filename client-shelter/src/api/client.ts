const API_URL = import.meta.env.VITE_API_URL || '';

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  shelterId: string | null;
}

interface LoginResponse {
  token: string;
  user: UserResponse;
}

interface ShelterUpdateData {
  shelterId: string;
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  notes?: string;
}

const getToken = (): string | null => localStorage.getItem('dprp_token');

const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('dprp_token');
    localStorage.removeItem('dprp_user');
    window.location.reload();
    throw new Error('Authentication expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json();
};

export const login = (email: string, password: string): Promise<LoginResponse> =>
  apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const submitUpdate = (data: ShelterUpdateData): Promise<{ update: object }> =>
  apiFetch<{ update: object }>('/api/updates', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export interface ShelterSummary {
  id: string;
  name: string;
  parish: string;
  facilityType: string | null;
  location: string | null;
}

export const getSheltersByParish = (parish: string): Promise<{ shelters: ShelterSummary[] }> =>
  apiFetch<{ shelters: ShelterSummary[] }>(`/api/shelters?parish=${encodeURIComponent(parish)}`);

export const getShelterById = (id: string): Promise<{ shelter: { id: string; parish: string } }> =>
  apiFetch<{ shelter: { id: string; parish: string } }>(`/api/shelters/${encodeURIComponent(id)}`);

export interface ShelterUpdateResponse {
  id: string;
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  notes: string | null;
  createdAt: string;
}

export const getUpdateHistory = (shelterId: string): Promise<{ updates: ShelterUpdateResponse[] }> =>
  apiFetch<{ updates: ShelterUpdateResponse[] }>(`/api/updates/${encodeURIComponent(shelterId)}`);

export type { UserResponse, LoginResponse, ShelterUpdateData };
