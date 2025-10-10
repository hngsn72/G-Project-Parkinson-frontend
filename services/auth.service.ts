import { backendApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';

export type User = {
  id: number;
  user_id: string;
  email: string;
  display_name: string;
  role: 'user' | 'admin' | 'doctor' | 'patient'; // Updated roles
  status: string;
  created_at?: string;
  updated_at?: string;
  // Matrix role fields
  roles?: Array<{
    id: number;
    name: string;
    display_name?: string;
  }>;
  permissions?: string[];
};

export type TokenPair = { 
  access_token: string; 
  refresh_token: string; 
};

export type LoginResponse = {
  user: User;
  access_token: string;
  refresh_token: string;
};

export class AuthService {
  static getAccessToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  static setAccessToken(token: string | null) {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem('access_token', token);
    else localStorage.removeItem('access_token');
  }

  static async register(email: string, password: string, displayName: string) {
    return backendApi.post<LoginResponse>(API_ENDPOINTS.backend.register, {
      email,
      password,
      display_name: displayName,
    });
  }

  static async login(email: string, password: string) {
    const res = await backendApi.post<LoginResponse>(API_ENDPOINTS.backend.login, {
      email,
      password,
    });
    if (res.success && res.data) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', res.data.access_token);
        localStorage.setItem('refresh_token', res.data.refresh_token);
        if (res.data.user) {
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        }
      }
    }
    return res;
  }

  static async logout() {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refresh) {
      await backendApi.post(API_ENDPOINTS.backend.logout, { refresh_token: refresh });
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('auth_user');
    }
  }

  static async me() {
    return backendApi.get<User>(API_ENDPOINTS.backend.profile);
  }
}


