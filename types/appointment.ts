// Appointment Status Flow:
// pending -> confirmed (doctor accepts) -> checked_in (patient arrives) -> completed/cancelled/no_show

export type AppointmentStatus = 
  | 'pending'      // Chờ bác sĩ xác nhận
  | 'confirmed'    // Bác sĩ đã xác nhận
  | 'checked_in'   // Bệnh nhân đã đến
  | 'completed'    // Đã khám xong
  | 'cancelled'    // Đã hủy
  | 'no_show';     // Không đến

export type AppointmentType = 'first_visit' | 'follow_up' | 'emergency';

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  doctor_id: number;
  doctor_name: string;
  doctor_specialty: string;
  hospital_id: number;
  hospital_name: string;
  hospital_address: string;
  specialty: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:mm
  type: AppointmentType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
  checked_in_at?: string;
  completed_at?: string;
}

export interface CreateAppointmentRequest {
  specialty: string;
  hospital_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  type: AppointmentType;
  reason?: string;
}

export interface AppointmentFilter {
  status?: AppointmentStatus;
  from_date?: string;
  to_date?: string;
  doctor_id?: number;
  hospital_id?: number;
  patient_id?: number;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  checked_in: number;
  completed: number;
  cancelled: number;
  no_show: number;
}
