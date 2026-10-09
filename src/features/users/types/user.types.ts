import type { UserRole, PaginatedResponse } from '@/types/common.types';
import type { User } from '@/types/auth.types';

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface QueryUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateUserPayload {
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  initialPassword?: string;
}

export interface UpdateUserStatusPayload {
  isActive: boolean;
}

export type UsersListResponse = PaginatedResponse<User>;
