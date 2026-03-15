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
  disasterEventId: string | null;
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
  timeline: {
    hoursToFirstCapacity?: number;
    hoursToResourceDepletion?: number;
    milestones?: Array<{ hour: number; event: string; severity: 'green' | 'amber' | 'red' }>;
    summary?: string;
    [key: string]: unknown;
  };
}

export interface ScenarioParams {
  category: number;
  windSpeedMph: number;
  affectedParishes: string[];
  name?: string;
}

export interface TimelineEntry {
  hour: number;
  updateCount: number;
  shelterCount: number;
  avgCapacity: number;
  avgWater: number;
  avgFood: number;
  avgMedical: number;
  criticalShelters: number;
  criticalResources: number;
}

export interface TimelineSummary {
  totalUpdates: number;
  sheltersReporting: number;
  peakAvgCapacity: number;
  criticalCount: number;
  criticalResourceCount: number;
  timeToFiftyPercent: number | null;
  timeToEightyPercent: number | null;
  mostAffectedParish: string | null;
}

export interface EventTimelineResponse {
  timeline: TimelineEntry[];
  summary: TimelineSummary;
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

export const getShelters = async (eventId?: string): Promise<Shelter[]> => {
  const params = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  const data = await apiFetch<{ shelters: Shelter[] }>(`/api/shelters${params}`);
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

export const predictScenario = async (scenario: ScenarioParams): Promise<AiPredictResponse> => {
  return apiFetch('/api/ai/predict', {
    method: 'POST',
    body: JSON.stringify({ scenario }),
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

// Disaster timeline endpoint
export const getEventTimeline = async (eventId: string): Promise<EventTimelineResponse> => {
  return apiFetch(`/api/disasters/${eventId}/timeline`);
};

// Broadcast types & endpoints
export interface BroadcastMessage {
  id: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetParishes: string[];
  sentBy: string;
  createdAt: string;
}

export const sendBroadcast = async (data: {
  message: string;
  targetParishes?: string[];
  priority?: 'HIGH' | 'CRITICAL';
  disasterEventId?: string;
}): Promise<BroadcastMessage> => {
  const res = await apiFetch<{ broadcast: BroadcastMessage }>('/api/broadcasts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.broadcast;
};

export const getBroadcasts = async (limit?: number): Promise<BroadcastMessage[]> => {
  const params = limit ? `?limit=${limit}` : '';
  const data = await apiFetch<{ broadcasts: BroadcastMessage[] }>(`/api/broadcasts${params}`);
  return data.broadcasts;
};
