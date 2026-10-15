import type { UserRole } from './common.types';
export type { UserRole };

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  avatarUrl: string | null;
  zaloId?: string | null;
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

export interface ExchangeZaloTicketPayload {
  ticket: string;
}

export interface ExchangeZaloResponse {
  message: string;
  isLinked: boolean;
  user: User;
  tokens: AuthTokens;
}

export interface LinkZaloPayload {
  linkTicket: string;
  identifier: string;
  password: string;
}

export interface LinkZaloResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface UnlinkZaloResponse {
  message: string;
}

export interface LoginPayload {
  /** Email hoặc Số điện thoại */
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
  dateOfBirth?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
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
  message?: string;
  tokens?: AuthTokens;
  accessToken?: string;
  refreshToken?: string;
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
