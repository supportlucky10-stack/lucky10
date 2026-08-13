import { apiRequest, setAuthToken } from './api';
import type { UserAccount } from '../types';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserAccount;
}

export const authService = {
  async registerCustomer(name: string, email: string, password?: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/auth/customer/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  async loginCustomer(username: string, password?: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/auth/customer/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  async loginAdmin(username: string, password?: string): Promise<AuthResponse> {
    const data = await apiRequest<AuthResponse>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.access_token);
    return data;
  },

  async getCurrentUser(): Promise<UserAccount | null> {
    try {
      return await apiRequest<UserAccount>('/api/auth/me', { method: 'GET' });
    } catch (e) {
      setAuthToken(null);
      return null;
    }
  },

  logout() {
    setAuthToken(null);
  },
};
