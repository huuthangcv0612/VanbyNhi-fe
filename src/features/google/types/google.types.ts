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
