import { backendApi } from '@/lib/api-client';

export interface MedicalReport {
  id: number;
  appointment_id: number;
  patient_profile_id?: number;
  doctor_id: string;
  doctor_name?: string;
  patient_id: string;
  patient_name?: string;
  chief_complaint?: string;
  diagnosis: string;
  diagnosis_code?: string;
  clinical_findings?: string;
  lab_results?: string;
  imaging_results?: string;
  voice_analysis_session_id?: string;
  prescription: string;
  treatment_plan?: string;
  recommendations?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  status: 'draft' | 'sent' | 'viewed';
  severity: 'mild' | 'moderate' | 'severe' | 'critical' | 'normal';
  created_at: string;
  sent_at?: string;
  viewed_at?: string;
  appointment_date?: string;
  appointment_time?: string;
  pdf_file_path?: string;
  pdf_file_name?: string;
  pdf_file_size?: number;
}

export interface MedicalReportRequest {
  appointment_id: number;
  patient_profile_id?: number;
  patient_id: string;
  chief_complaint?: string;
  diagnosis: string;
  diagnosis_code?: string;
  clinical_findings?: string;
  lab_results?: string;
  imaging_results?: string;
  voice_analysis_session_id?: string;
  prescription: string;
  treatment_plan?: string;
  recommendations?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  severity?: string;
}

export class MedicalReportService {
  // Doctor: Create new report (draft)
  static async createReport(data: MedicalReportRequest) {
    return backendApi.post<{ message: string; id: number }>(
      '/api/v1/medical-reports',
      data
    );
  }

  // Doctor: Update report (draft only)
  static async updateReport(id: number, data: MedicalReportRequest) {
    return backendApi.put<{ message: string }>(
      `/api/v1/medical-reports/${id}`,
      data
    );
  }

  // Doctor: Send report to patient
  static async sendReport(id: number) {
    return backendApi.post<{ message: string }>(
      `/api/v1/medical-reports/${id}/send`,
      {}
    );
  }

  // Doctor: Delete draft report
  static async deleteReport(id: number) {
    return backendApi.delete<{ message: string }>(
      `/api/v1/medical-reports/${id}`
    );
  }

  // Doctor: Get all reports created by doctor
  static async getDoctorReports(limit = 10, offset = 0) {
    return backendApi.get<{
      data: MedicalReport[];
      total: number;
      limit: number;
      offset: number;
    }>(`/api/v1/medical-reports/doctor?limit=${limit}&offset=${offset}`);
  }

  // Patient: Get all reports for patient
  static async getPatientReports(patientId: string, limit = 10, offset = 0) {
    return backendApi.get<{
      data: MedicalReport[];
      total: number;
      limit: number;
      offset: number;
    }>(
      `/api/v1/medical-reports/patient?patient_id=${patientId}&limit=${limit}&offset=${offset}`
    );
  }

  // Get report by ID
  static async getReportById(id: number) {
    return backendApi.get<MedicalReport>(`/api/v1/medical-reports/${id}`);
  }

  // Patient: Mark report as viewed
  static async markAsViewed(id: number) {
    return backendApi.post<{ message: string }>(
      `/api/v1/medical-reports/${id}/viewed`,
      {}
    );
  }

  // Doctor: Upload PDF file for report
  static async uploadPDF(reportId: number, file: File) {
    const formData = new FormData();
    formData.append('pdf', file);
    
    return backendApi.upload<{ message: string; file_path: string; file_name: string; file_size: number }>(
      `/api/v1/medical-reports/${reportId}/upload-pdf`,
      file,
      {},
      'pdf'
    );
  }

  // Download PDF file
  static async downloadPDF(reportId: number) {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/medical-reports/${reportId}/download-pdf`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
    
    // Open in new tab for download
    window.open(`${url}?token=${token}`, '_blank');
  }
}
