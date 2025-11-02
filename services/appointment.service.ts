import { ApiResponse } from './';

export interface CreateAppointmentRequest {
  doctor_id: string;
  hospital_id: number;
  appointment_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female';
  symptoms?: string;
  notes?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
}

export interface Appointment {
  id: number;
  patient_id: string;
  doctor_id: string;
  hospital_id: number;
  appointment_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  
  // Patient information (for booking without account)
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: string;
  
  // Appointment details
  symptoms?: string;
  notes?: string;
  urgency: 'normal' | 'urgent' | 'emergency';
  
  // Status management
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  confirmed_at?: string;
  confirmed_by?: string;
  
  // Rescheduling
  original_date?: string;
  original_time_slot?: string;
  reschedule_reason?: string;
  reschedule_count: number;
  
  // Cancellation
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  
  // Completion
  completed_at?: string;
  diagnosis_notes?: string;
  prescription?: string;
  follow_up_needed: boolean;
  follow_up_date?: string;
  
  created_at: string;
  updated_at: string;
  
  // For display (populated from relations)
  hospital_name?: string;
  doctor_name?: string;
}

export interface GetAppointmentsParams {
  page?: number;
  limit?: number;
  status?: string;
  doctor_id?: string;
  hospital_id?: number;
  date_from?: string;
  date_to?: string;
}

export class AppointmentService {
  private static baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081';
  
  private static getAuthHeaders() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Create new appointment (Patient only)
  static async createAppointment(data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/appointments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể tạo lịch hẹn',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Get appointments (Admin/Doctor can see all, Patient sees only their own)
  static async getAppointments(params?: GetAppointmentsParams): Promise<ApiResponse<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.doctor_id) queryParams.append('doctor_id', params.doctor_id);
      if (params?.hospital_id) queryParams.append('hospital_id', params.hospital_id.toString());
      if (params?.date_from) queryParams.append('date_from', params.date_from);
      if (params?.date_to) queryParams.append('date_to', params.date_to);

      const response = await fetch(`${this.baseUrl}/api/v1/appointments?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể tải danh sách lịch hẹn',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Get my appointments (Patient only)
  static async getMyAppointments(params?: GetAppointmentsParams): Promise<ApiResponse<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${this.baseUrl}/api/v1/appointments/my?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể tải lịch hẹn của bạn',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Get doctor appointments (Doctor only)
  static async getDoctorAppointments(params?: GetAppointmentsParams): Promise<ApiResponse<{
    data: Appointment[];
    total: number;
    page: number;
    limit: number;
  }>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);

      const response = await fetch(`${this.baseUrl}/api/v1/appointments/doctor?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể tải lịch hẹn bác sĩ',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Get appointment by ID
  static async getAppointmentById(id: number): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/appointments/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể tải chi tiết lịch hẹn',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Update appointment status (Doctor/Admin only)
  static async updateAppointmentStatus(id: number, status: 'confirmed' | 'cancelled' | 'completed', reason?: string): Promise<ApiResponse<Appointment>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/appointments/${id}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể cập nhật trạng thái lịch hẹn',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Get available time slots for a doctor on a specific date
  static async getAvailableSlots(doctorId: string, date: string, hospitalId?: number): Promise<ApiResponse<{
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  }>> {
    try {
      const queryParams = new URLSearchParams({
        doctor_id: doctorId,
        date: date,
      });
      
      if (hospitalId) {
        queryParams.append('hospital_id', hospitalId.toString());
      }

      const response = await fetch(`${this.baseUrl}/api/v1/appointments/availability?${queryParams}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Không thể tải lịch trống',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi không xác định',
      };
    }
  }

  // Helper function to get Vietnamese status text
  static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      cancelled: 'Đã hủy',
      completed: 'Hoàn thành',
      no_show: 'Không đến',
    };
    return statusMap[status] || status;
  }

  // Helper function to get Vietnamese time slot text
  static getTimeSlotText(timeSlot: string): string {
    const slotMap: Record<string, string> = {
      morning: 'Buổi sáng',
      afternoon: 'Buổi chiều',
      evening: 'Buổi tối',
    };
    return slotMap[timeSlot] || timeSlot;
  }
}