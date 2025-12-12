import Cookies from 'js-cookie';
import { backendApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';

export type User = {
  id: number;
  user_id: string;
  email: string;
  display_name: string;
  phone?: string; // Phone number
  role: 'user' | 'admin' | 'doctor' | 'patient'; // Updated roles
  status: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  avatar_url?: string;
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
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  user: User;
};

export class AuthService {
  static getAccessToken() {
    if (typeof window === 'undefined') return null;
    return Cookies.get('access_token');
  }

  static setAccessToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) Cookies.set('access_token', token, { expires: 1, path: '/' });
  else Cookies.remove('access_token');
  }

  static async register(email: string, password: string, displayName: string) {
    return backendApi.post<LoginResponse>(API_ENDPOINTS.backend.register, {
      email,
      password,
      display_name: displayName,
    });
  }

  static async login(identifier: string, password: string) {
    const res = await backendApi.post<LoginResponse>(API_ENDPOINTS.backend.login, {
      identifier,
      password,
    });
    if (res.success && res.data) {
      const token = res.data.tokens?.access_token;
      const refresh = res.data.tokens?.refresh_token;
      if (typeof window !== 'undefined') {
        Cookies.set('access_token', token, { expires: 1, path: '/' });
        Cookies.set('refresh_token', refresh, { expires: 7, path: '/' });
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refresh);
        if (res.data.user) {
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        }
      }
    }
    return res;
  }

  static async logout() {
    const refresh = typeof window !== 'undefined' ? Cookies.get('refresh_token') : null;
    if (refresh) {
      await backendApi.post(API_ENDPOINTS.backend.logout, { refresh_token: refresh });
    }
    if (typeof window !== 'undefined') {
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      localStorage.removeItem('auth_user');
    }
  }

  static async me() {
    const token = Cookies.get('access_token');
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('access_token', token);
    }
    return backendApi.get<User>(API_ENDPOINTS.backend.profile);
  }

  // Phone-based authentication
  static async sendRegisterOTP(phone: string, displayName: string) {
    return backendApi.post<{ message: string }>(
      '/api/v1/auth/phone/register/send-otp',
      { phone, display_name: displayName }
    );
  }

  static async verifyRegisterOTP(phone: string, code: string, password: string, displayName: string) {
    const res = await backendApi.post<LoginResponse>(
      '/api/v1/auth/phone/register/verify',
      { phone, code, password, display_name: displayName }
    );
    
    if (res.success && res.data) {
      const token = res.data.tokens?.access_token;
      const refresh = res.data.tokens?.refresh_token;
      if (typeof window !== 'undefined') {
        Cookies.set('access_token', token, { expires: 1, path: '/' });
        Cookies.set('refresh_token', refresh, { expires: 7, path: '/' });
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refresh);
        if (res.data.user) {
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        }
      }
    }
    return res;
  }

  static async sendLoginOTP(phone: string) {
    return backendApi.post<{ message: string }>(
      '/api/v1/auth/phone/login/send-otp',
      { phone }
    );
  }

  static async verifyLoginOTP(phone: string, code: string) {
    const res = await backendApi.post<LoginResponse>(
      '/api/v1/auth/phone/login/verify',
      { phone, code }
    );
    
    if (res.success && res.data) {
      const token = res.data.tokens?.access_token;
      const refresh = res.data.tokens?.refresh_token;
      if (typeof window !== 'undefined') {
        Cookies.set('access_token', token, { expires: 1, path: '/' });
        Cookies.set('refresh_token', refresh, { expires: 7, path: '/' });
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refresh);
        if (res.data.user) {
          localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        }
      }
    }
    return res;
  }

  static async forgotPassword(phone: string) {
    return backendApi.post<{ message: string }>(
      '/api/v1/auth/forgot-password',
      { phone }
    );
  }

  static async resetPassword(phone: string, code: string, newPassword: string) {
    return backendApi.post<{ message: string }>(
      '/api/v1/auth/reset-password',
      { phone, code, new_password: newPassword }
    );
  }
}


