import { backendApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import type {
  Hospital,
  HospitalDoctor,
  Appointment,
  CreateHospitalRequest,
  UpdateHospitalRequest,
  CreateHospitalDoctorRequest,
  UpdateHospitalDoctorRequest,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  DoctorAvailability,
  HospitalSearchParams,
  AppointmentSearchParams,
  BackendPaginatedResponse,
  ApiResponse
} from '@/lib/api-config';

export class HospitalService {
  // Hospital CRUD operations
  static async getAllHospitals(params?: HospitalSearchParams): Promise<ApiResponse<BackendPaginatedResponse<Hospital>>> {
    const queryParams = new URLSearchParams();
    // Provide safe defaults for pagination to satisfy backend validation
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;

    // copy other params (but ensure page & limit are set)
    const safeParams = { ...(params || {}), page, limit } as HospitalSearchParams;
    Object.entries(safeParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const endpoint = queryParams.toString() 
      ? `${API_ENDPOINTS.backend.hospitals}?${queryParams.toString()}`
      : API_ENDPOINTS.backend.hospitals;
    
    return backendApi.get<BackendPaginatedResponse<Hospital>>(endpoint);
  }

  static async getHospitalById(id: string): Promise<ApiResponse<Hospital>> {
    return backendApi.get<Hospital>(API_ENDPOINTS.backend.hospitalById(id));
  }

  static async createHospital(data: CreateHospitalRequest): Promise<ApiResponse<Hospital>> {
    return backendApi.post<Hospital>(API_ENDPOINTS.backend.hospitals, data);
  }

  static async updateHospital(id: string, data: UpdateHospitalRequest): Promise<ApiResponse<Hospital>> {
    return backendApi.put<Hospital>(API_ENDPOINTS.backend.hospitalById(id), data);
  }

  static async deleteHospital(id: string): Promise<ApiResponse<void>> {
    return backendApi.delete<void>(API_ENDPOINTS.backend.hospitalById(id));
  }

  // Hospital Doctor operations
  static async getHospitalDoctors(hospitalId: string): Promise<ApiResponse<HospitalDoctor[]>> {
    return backendApi.get<HospitalDoctor[]>(API_ENDPOINTS.backend.hospitalDoctors(hospitalId));
  }

  static async getHospitalDoctor(hospitalId: string, doctorId: string): Promise<ApiResponse<HospitalDoctor>> {
    return backendApi.get<HospitalDoctor>(API_ENDPOINTS.backend.hospitalDoctorById(hospitalId, doctorId));
  }

  static async addDoctorToHospital(hospitalId: string, data: CreateHospitalDoctorRequest): Promise<ApiResponse<HospitalDoctor>> {
    return backendApi.post<HospitalDoctor>(API_ENDPOINTS.backend.hospitalDoctors(hospitalId), data);
  }

  static async updateHospitalDoctor(
    hospitalId: string, 
    doctorId: string, 
    data: UpdateHospitalDoctorRequest
  ): Promise<ApiResponse<HospitalDoctor>> {
    return backendApi.put<HospitalDoctor>(
      API_ENDPOINTS.backend.hospitalDoctorById(hospitalId, doctorId), 
      data
    );
  }

  static async removeDoctorFromHospital(hospitalId: string, doctorId: string): Promise<ApiResponse<void>> {
    return backendApi.delete<void>(API_ENDPOINTS.backend.hospitalDoctorById(hospitalId, doctorId));
  }

  // Appointment operations
  static async getAllAppointments(params?: AppointmentSearchParams): Promise<ApiResponse<BackendPaginatedResponse<Appointment>>> {
    const queryParams = new URLSearchParams();
    // default pagination to avoid backend validation errors
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 50;
    const safeParams = { ...(params || {}), page, limit } as AppointmentSearchParams;
    Object.entries(safeParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const endpoint = `${API_ENDPOINTS.backend.appointments}?${queryParams.toString()}`;
    
    return backendApi.get<BackendPaginatedResponse<Appointment>>(endpoint);
  }

  static async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    return backendApi.get<Appointment>(API_ENDPOINTS.backend.appointmentById(id));
  }

  static async getPatientAppointments(): Promise<ApiResponse<Appointment[]>> {
    return backendApi.get<Appointment[]>(API_ENDPOINTS.backend.patientAppointments);
  }

  static async getDoctorAppointments(): Promise<ApiResponse<Appointment[]>> {
    return backendApi.get<Appointment[]>(API_ENDPOINTS.backend.doctorAppointments);
  }

  static async createAppointment(data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return backendApi.post<Appointment>(API_ENDPOINTS.backend.appointments, data);
  }

  static async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    return backendApi.put<Appointment>(API_ENDPOINTS.backend.appointmentById(id), data);
  }

  static async cancelAppointment(id: string, reason?: string): Promise<ApiResponse<Appointment>> {
    return backendApi.put<Appointment>(`${API_ENDPOINTS.backend.appointmentById(id)}/cancel`, { 
      reason 
    });
  }

  static async confirmAppointment(id: string): Promise<ApiResponse<Appointment>> {
    return backendApi.put<Appointment>(`${API_ENDPOINTS.backend.appointmentById(id)}/confirm`, {});
  }

  static async completeAppointment(id: string, data: {
    diagnosis_notes?: string;
    prescription?: string;
    follow_up_needed?: boolean;
    follow_up_date?: string;
  }): Promise<ApiResponse<Appointment>> {
    return backendApi.put<Appointment>(`${API_ENDPOINTS.backend.appointmentById(id)}/complete`, data);
  }

  static async rescheduleAppointment(id: string, data: {
    new_date: string;
    new_time: string;
    new_time_slot: 'morning' | 'afternoon' | 'evening';
    reason?: string;
  }): Promise<ApiResponse<Appointment>> {
    return backendApi.put<Appointment>(`${API_ENDPOINTS.backend.appointmentById(id)}/reschedule`, data);
  }

  static async getAppointmentHistory(
    patientId?: string, 
    doctorId?: string, 
    period: 'week' | 'month' | 'year' = 'month'
  ): Promise<ApiResponse<{
    appointments: Appointment[];
    statistics: {
      total: number;
      scheduled: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    period: string;
  }>> {
    const params = new URLSearchParams();
    if (patientId) params.append('patient_id', patientId);
    if (doctorId) params.append('doctor_id', doctorId);
    params.append('period', period);
    
    return backendApi.get(`${API_ENDPOINTS.backend.appointments}/history?${params.toString()}`);
  }

  // Doctor availability
  static async getDoctorAvailability(doctorId: string, date: string): Promise<ApiResponse<DoctorAvailability>> {
    return backendApi.get<DoctorAvailability>(
      API_ENDPOINTS.backend.appointmentAvailability(doctorId, date)
    );
  }

  // Search and filter methods
  static async searchHospitals(query: string, params?: Partial<HospitalSearchParams>): Promise<ApiResponse<BackendPaginatedResponse<Hospital>>> {
    return this.getAllHospitals({
      name: query,
      ...params
    });
  }

  static async searchHospitalsByLocation(
    latitude: number, 
    longitude: number, 
    radius: number = 10
  ): Promise<ApiResponse<BackendPaginatedResponse<Hospital>>> {
    return this.getAllHospitals({
      latitude,
      longitude,
      radius
    });
  }

  static async getHospitalsBySpecialization(specialization: string): Promise<ApiResponse<BackendPaginatedResponse<Hospital>>> {
    return this.getAllHospitals({
      specialization
    });
  }
}

// Export types for use in components
export type {
  Hospital,
  HospitalDoctor,
  Appointment,
  CreateHospitalRequest,
  UpdateHospitalRequest,
  CreateHospitalDoctorRequest,
  UpdateHospitalDoctorRequest,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  DoctorAvailability,
  HospitalSearchParams,
  AppointmentSearchParams
} from '@/lib/api-config';