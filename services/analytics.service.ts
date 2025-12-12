import { backendApi } from "@/lib/api-client";

export interface DashboardStats {
  total_users: number;
  total_detections: number;
  total_appointments: number;
  total_hospitals: number;
  total_doctors: number;
  pending_appointments: number;
  today_detections: number;
  today_appointments: number;
}

export interface DetectionTrendItem {
  date: string;
  count: number;
  positive_count: number;
  negative_count: number;
}

export interface DetectionResultItem {
  result: string;
  count: number;
  percentage: number;
}

export interface HospitalAppointmentItem {
  hospital_id: number;
  hospital_name: string;
  appointment_count: number;
  percentage: number;
}

export interface UserGrowthItem {
  date: string;
  count: number;
  cumulative: number;
}

export interface TopDoctor {
  doctor_id: number;
  doctor_name: string;
  specialty: string;
  hospital_name: string;
  appointment_count: number;
  rating: number;
}

export class AnalyticsService {
  static async getDashboardStats() {
    return backendApi.get<{ data: DashboardStats }>(
      "/api/v1/admin/analytics/dashboard"
    );
  }

  static async getDetectionTrend(days: number = 30) {
    return backendApi.get<{ data: DetectionTrendItem[] }>(
      `/api/v1/admin/analytics/detections/trend?days=${days}`
    );
  }

  static async getDetectionResults() {
    return backendApi.get<{ data: DetectionResultItem[] }>(
      "/api/v1/admin/analytics/detections/results"
    );
  }

  static async getAppointmentsByHospital() {
    return backendApi.get<{ data: HospitalAppointmentItem[] }>(
      "/api/v1/admin/analytics/appointments/hospitals"
    );
  }

  static async getUserGrowth(days: number = 30) {
    return backendApi.get<{ data: UserGrowthItem[] }>(
      `/api/v1/admin/analytics/users/growth?days=${days}`
    );
  }

  static async getTopDoctors(limit: number = 10) {
    return backendApi.get<{ data: TopDoctor[] }>(
      `/api/v1/admin/analytics/doctors/top?limit=${limit}`
    );
  }
}
