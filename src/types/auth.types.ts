import type { UserRole } from './common.types';
export type { UserRole };

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
  dateOfBirth?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  refreshToken: string;
}

export interface LoginPayload {
  /** Email hoặc Số điện thoại */
  identifier: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  message: string;
  tokens: AuthTokens;
}

export interface LogoutResponse {
  message: string;
}

export interface AuthMeResponse {
  user: {
    sub: string;
    role: UserRole;
    phone: string;
    email: string | null;
  };
}
