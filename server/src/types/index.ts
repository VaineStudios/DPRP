import { UserRole, Priority, RecommendationType, DisasterStatus } from '@prisma/client';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface AuthPayload {
  userId: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface ShelterUpdateRequest {
  shelterId: string;
  capacityLevel: number;
  waterLevel: number;
  foodLevel: number;
  medicalLevel: number;
  notes?: string;
}

export interface CreateDisasterRequest {
  name: string;
  category?: number;
  windSpeedMph?: number;
  affectedParishes: string[];
  status?: DisasterStatus;
  landfallDate?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface DisasterStatsResponse {
  totalUpdates: number;
  sheltersReporting: number;
  avgCapacity: number;
  avgWater: number;
  avgFood: number;
  avgMedical: number;
  criticalCapacity: number;
  criticalWater: number;
}

export type { UserRole, Priority, RecommendationType, DisasterStatus };
