
import { API_CONFIG, ApiResponse } from './api-config';
import Cookies from 'js-cookie';

// SSR-safe access token getter
function getAccessTokenSafe(): string | null {
  if (typeof window !== 'undefined') {
    return (
      Cookies.get('access_token') ||
      window.localStorage?.getItem('access_token') ||
      null
    );
  }
  return null;
}


class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = API_CONFIG.TIMEOUT) {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.timeout = timeout;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      // Add Authorization header if access token exists and not already set
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> ?? {}),
      };
      if (typeof window !== 'undefined') {
        const token = getAccessTokenSafe();
        if (token && !headers['Authorization']) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, string>, fileField: string = 'file'): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const formData = new FormData();
      formData.append(fileField, file);
      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = getAccessTokenSafe();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, string>, fileField?: string): Promise<ApiResponse<T>> {
    return this.uploadFile<T>(endpoint, file, additionalData, fileField);
  }
}

// Create API client instances
export const backendApi = new ApiClient(API_CONFIG.BACKEND_URL);
export const mlServiceApi = new ApiClient(API_CONFIG.ML_SERVICE_URL);
