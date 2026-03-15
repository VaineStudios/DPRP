const API_URL = import.meta.env.VITE_API_URL || '';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  shelterId: string | null;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface ShelterUpdate {
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  notes?: string | null;
  createdAt: string;
}

export interface Shelter {
  id: string;
  name: string;
  parish: string;
  location: string | null;
  facilityType: string;
  lat: number;
  lng: number;
  maxCapacity: number | null;
  status: string;
  latestUpdate: ShelterUpdate | null;
}

const getToken = (): string | null => localStorage.getItem('dprp_admin_token');

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
    localStorage.removeItem('dprp_admin_token');
    localStorage.removeItem('dprp_admin_user');
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

export const getShelters = async (): Promise<Shelter[]> => {
  const data = await apiFetch<{ shelters: Shelter[] }>('/api/shelters');
  return data.shelters;
};

export const getShelter = async (id: string): Promise<Shelter> => {
  const data = await apiFetch<{ shelter: Shelter }>(`/api/shelters/${id}`);
  return data.shelter;
};
