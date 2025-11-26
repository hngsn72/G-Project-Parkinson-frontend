import { backendApi } from '@/lib/api-client';

export interface PatientProfile {
  id: number;
  user_id: string;
  full_name: string;
  phone: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  email?: string;
  relationship?: 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'other';
  blood_type?: string;
  allergies?: string;
  medical_history?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientProfileRequest {
  full_name: string;
  phone: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  email?: string;
  relationship?: 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'other';
  blood_type?: string;
  allergies?: string;
  is_default?: boolean;
}

export interface UpdatePatientProfileRequest {
  full_name?: string;
  phone?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  email?: string;
  relationship?: 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'other';
  blood_type?: string;
  allergies?: string;
  is_default?: boolean;
}

export class PatientProfileService {
  private static readonly BASE_PATH = '/api/v1/patient-profiles';

  static async getUserProfiles() {
    return backendApi.get<PatientProfile[]>(this.BASE_PATH);
  }

  static async getProfileById(id: number) {
    return backendApi.get<PatientProfile>(`${this.BASE_PATH}/${id}`);
  }

  static async getDefaultProfile() {
    return backendApi.get<PatientProfile>(`${this.BASE_PATH}/default`);
  }

  static async createProfile(data: CreatePatientProfileRequest) {
    return backendApi.post<PatientProfile>(this.BASE_PATH, data);
  }

  static async updateProfile(id: number, data: UpdatePatientProfileRequest) {
    return backendApi.put<PatientProfile>(`${this.BASE_PATH}/${id}`, data);
  }

  static async deleteProfile(id: number) {
    return backendApi.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async setDefaultProfile(id: number) {
    return backendApi.put<void>(`${this.BASE_PATH}/${id}/set-default`, {});
  }
}
