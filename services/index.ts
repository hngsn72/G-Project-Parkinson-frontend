// Services exports
export { VoiceAnalysisService, AudioRecordingService } from './voice-analysis.service';
export { HospitalService } from './hospital.service';

// Service types exports (re-export from api-config)
export type { 
  DiagnosisResult,
  VoiceFeatures,
  AnalysisMetadata,
  RandomSentence,
  DiagnosisHistory,
  StatsResponse,
  HealthCheck,
  ApiResponse,
  APIError,
  // Hospital types
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
