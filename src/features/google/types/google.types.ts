import type { User, AuthTokens } from '@/types/auth.types';

export type GoogleConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'NEEDS_REAUTH';

export interface GoogleConnectionResponse {
  isConnected: boolean;
  status: GoogleConnectionStatus;
  email?: string;
  lastConnectedAt?: string;
}

export interface GoogleConnectResponse {
  authorizationUrl: string;
}

export interface GoogleDisconnectResponse {
  message: string;
}

export interface GoogleExchangePayload {
  ticket: string;
}

export interface GoogleExchangeResponse {
  message: string;
  isLinked: boolean;
  user: User;
  tokens: AuthTokens;
}

export interface GoogleLinkPayload {
  linkTicket: string;
  identifier: string;
  password: string;
}

export interface GoogleLinkResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

