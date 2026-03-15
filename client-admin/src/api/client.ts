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

export interface ShelterUpdateEvent {
  shelterId: string;
  update: ShelterUpdate;
  shelter: {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
  };
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

// Disaster event types
export interface DisasterEvent {
  id: string;
  name: string;
  category: number | null;
  windSpeedMph: number | null;
  status: 'PREPARING' | 'ACTIVE' | 'RECOVERY' | 'CLOSED';
  affectedParishes: string[];
  landfallDate: string | null;
  startDate: string;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
}

// AI recommendation types
export interface AiRecommendation {
  id: string;
  disasterEventId: string | null;
  shelterId: string | null;
  shelter: { id: string; name: string; parish: string; lat: number | null; lng: number | null } | null;
  type: 'RESPONSE' | 'PREPAREDNESS';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  recommendation: string;
  reasoning: string | null;
  createdAt: string;
}

export interface AiPredictions {
  predictions: Array<{
    shelterName: string;
    estimatedCapacityReachTime: string;
    confidence: string;
  }>;
  prePositioning: Array<{
    shelterId: string;
    resource: string;
    quantity: string;
    rationale: string;
  }>;
  timeline: Record<string, unknown>;
}

export interface AiPredictResponse {
  predictions: AiPredictions;
  stored: AiRecommendation[];
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

// Disaster endpoints
export const getDisasters = async (): Promise<DisasterEvent[]> => {
  const data = await apiFetch<{ events: DisasterEvent[] }>('/api/disasters');
  return data.events;
};

export const createDisaster = async (body: Partial<DisasterEvent>): Promise<DisasterEvent> => {
  const data = await apiFetch<{ event: DisasterEvent }>('/api/disasters', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.event;
};

export const updateDisaster = async (id: string, body: Partial<DisasterEvent>): Promise<DisasterEvent> => {
  const data = await apiFetch<{ event: DisasterEvent }>(`/api/disasters/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return data.event;
};

// AI endpoints
export const analyzeNetwork = async (disasterEventId: string): Promise<{ recommendations: AiRecommendation[]; cached?: boolean }> => {
  return apiFetch('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ disasterEventId }),
  });
};

export const predictPreparedness = async (disasterEventId: string): Promise<AiPredictResponse> => {
  return apiFetch('/api/ai/predict', {
    method: 'POST',
    body: JSON.stringify({ disasterEventId }),
  });
};

export const getRecommendations = async (
  eventId: string,
  type?: 'RESPONSE' | 'PREPAREDNESS'
): Promise<AiRecommendation[]> => {
  const params = new URLSearchParams({ eventId });
  if (type) params.set('type', type);
  const data = await apiFetch<{ recommendations: AiRecommendation[] }>(`/api/ai/recommendations?${params}`);
  return data.recommendations;
};
