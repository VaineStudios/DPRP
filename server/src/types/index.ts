import { UserRole, Priority, RecommendationType } from '@prisma/client';

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

export type { UserRole, Priority, RecommendationType };
