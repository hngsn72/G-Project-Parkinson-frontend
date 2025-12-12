import { backendApi } from '@/lib/api-client';

export interface FamilyMember {
  id: number;
  user_id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  phone?: string;
  medical_history?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberRequest {
  user_id: string;
  name: string;
  relationship: string;
  age: number;
  gender: string;
  phone?: string;
  medical_history?: string;
  notes?: string;
}

export class FamilyMemberService {
  // Get all family members for current user
  static async getFamilyMembers(userId: string) {
    return backendApi.get<{ members: FamilyMember[]; total: number }>(
      `/api/v1/family-members?user_id=${userId}`
    );
  }

  // Get family member by ID
  static async getFamilyMemberById(id: number) {
    return backendApi.get<FamilyMember>(`/api/v1/family-members/${id}`);
  }

  // Create new family member
  static async createFamilyMember(data: FamilyMemberRequest) {
    return backendApi.post<FamilyMember>('/api/v1/family-members', data);
  }

  // Update family member
  static async updateFamilyMember(id: number, data: FamilyMemberRequest) {
    return backendApi.put<FamilyMember>(`/api/v1/family-members/${id}`, data);
  }

  // Delete family member
  static async deleteFamilyMember(id: number) {
    return backendApi.delete<{ message: string }>(`/api/v1/family-members/${id}`);
  }
}
