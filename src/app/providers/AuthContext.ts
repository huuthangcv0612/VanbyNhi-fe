import { createContext } from 'react';
import type { User, UserRole, LoginPayload, AuthTokens } from '@/types/auth.types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  setAuthSession: (tokens: AuthTokens, user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
