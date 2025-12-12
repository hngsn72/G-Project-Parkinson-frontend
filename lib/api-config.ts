// API Configuration
export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://wonderful-production.up.railway.app',
  ML_SERVICE_URL: process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'https://ml-service-production-850d.up.railway.app',
  TIMEOUT: 120000, // 120000 = 120 seconds (Extended for Enhanced Model V2 with 768 features)
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
};

// API Endpoints - matching backend exactly
export const API_ENDPOINTS = {
  // Backend V1 endpoints 
  backend: {
    health: '/health',
    sentences: '/api/v1/sentences',
    predict: '/api/v1/predict',
    history: '/api/v1/history',
    historyById: (id: string) => `/api/v1/history/${id}`,
    deleteHistory: (id: string) => `/api/v1/history/${id}`,
    stats: '/api/v1/stats',
    // Auth endpoints
    register: '/api/v1/auth/register',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    profile: '/api/v1/user/profile',
    // Admin endpoints
    adminUsers: '/api/v1/admin/users',
    adminUserById: (id: string) => `/api/v1/admin/users/${id}`,
  // Blog endpoints
    blogPosts: '/api/v1/blog/posts',
    blogPostById: (id: string) => `/api/v1/blog/posts/${id}`,
    blogPostApprove: (id: string) => `/api/v1/blog/posts/${id}/approve`,
    blogComments: (postId: string) => `/api/v1/blog/posts/${postId}/comments`,
    commentReplies: (commentId: string) => `/api/v1/blog/comments/${commentId}/replies`,
    blogSaved: '/api/v1/blog/saved',
    // News endpoints
    newsCategories: '/api/v1/news/categories',
    newsArticles: '/api/v1/news/articles',
    newsArticleById: (id: string) => `/api/v1/news/articles/${id}`,
    newsArticleBySlug: (slug: string) => `/api/v1/news/articles/slug/${slug}`,
    // Admin news endpoints
    adminNewsCategories: '/api/v1/news/admin/categories',
    adminNewsCategoryById: (id: string) => `/api/v1/news/admin/categories/${id}`,
    adminNewsArticles: '/api/v1/news/admin/articles',
    adminNewsArticleById: (id: string) => `/api/v1/news/admin/articles/${id}`,
    // Hospital endpoints
    hospitals: '/api/v1/hospitals',
    hospitalById: (id: string) => `/api/v1/hospitals/${id}`,
    hospitalDoctors: (hospitalId: string) => `/api/v1/hospitals/${hospitalId}/doctors`,
    hospitalDoctorById: (hospitalId: string, doctorId: string) => `/api/v1/hospitals/${hospitalId}/doctors/${doctorId}`,
    // Appointment endpoints
    appointments: '/api/v1/appointments',
    appointmentById: (id: string) => `/api/v1/appointments/${id}`,
  // backend route for patient-specific appointments
  // backend registers this as GET "/api/v1/appointments/my" (patient's own appointments)
  patientAppointments: '/api/v1/appointments/my',
    doctorAppointments: '/api/v1/appointments/doctor',
    appointmentAvailability: (doctorId: string, date: string) => `/api/v1/appointments/availability/${doctorId}/${date}`,
  },
  
  // Legacy diagnosis endpoints (for compatibility)
  diagnosis: {
    sentence: '/api/diagnosis/sentence',
    predict: '/api/diagnosis/predict', 
    history: '/api/diagnosis/history',
  },
  
  // ML Service endpoints
  mlService: {
    health: '/health',
    predict: '/predict',
  },
};

// Response types matching backend
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// V3 Scientific Edition Critical Features
export interface CriticalFeatures {
  jitter_local: number;  // Frequency perturbation
  shimmer_local: number; // Amplitude perturbation  
  hnr: number;           // Harmonic-to-Noise Ratio
}

// V3 Scientific Edition Model Info
export interface V3ModelInfo {
  name: string;
  version: string;
  algorithm: string;
  accuracy: number;
  f1_score: number;
  sensitivity: number;
  specificity: number;
  features: number;
  auc_score?: number;
  feature_reduction?: string; // "768 → 87 (88.7% reduction)"
  critical_features_included?: string[]; // ["jitter_local", "shimmer_local", "hnr"]
  includes_jitter_shimmer: boolean;
}

export interface DiagnosisResult {
  // V3 Scientific Edition Response Format
  session_id: string;
  prediction: number; // 0=Healthy, 1=Parkinson's
  probability: number; // 0.0-1.0
  confidence: string; // 'Low' | 'Medium' | 'High'
  diagnosis: string; // Human-readable diagnosis
  features: EnhancedVoiceFeatures; // Comprehensive features
  
  // V3 Scientific Edition - Critical Clinical Features
  critical_features?: CriticalFeatures;
  
  sentence: string;
  status: string;
  timestamp: string;
  recommendations?: string[];
  model_info?: V3ModelInfo; // Enhanced V3 Scientific model info
  
  // Legacy compatibility fields
  id?: string;
  risk_level?: 'low' | 'moderate' | 'high';
  analysis_metadata?: AnalysisMetadata;
  created_at?: string;
  input_type?: 'record' | 'file';
}

// Enhanced Model V2 - 768 Comprehensive Features
export interface EnhancedVoiceFeatures {
  // Clinical Biomarkers
  f0_mean?: number;
  f0_std?: number;
  f0_min?: number;
  f0_max?: number;
  f0_range?: number;
  hnr?: number;
  jitter_abs?: number;
  jitter_rel?: number;
  shimmer_abs?: number;
  shimmer_rel?: number;
  
  // MFCC Features (13 coefficients + derivatives)
  mfcc_mean_1?: number;
  mfcc_mean_2?: number;
  mfcc_mean_3?: number;
  mfcc_mean_4?: number;
  mfcc_mean_5?: number;
  mfcc_mean_6?: number;
  mfcc_mean_7?: number;
  mfcc_mean_8?: number;
  mfcc_mean_9?: number;
  mfcc_mean_10?: number;
  mfcc_mean_11?: number;
  mfcc_mean_12?: number;
  mfcc_mean_13?: number;
  
  // Delta MFCC
  delta_mfcc_mean_1?: number;
  delta_mfcc_mean_2?: number;
  delta_mfcc_mean_3?: number;
  // ... (continues with delta patterns)
  
  // Delta-Delta MFCC
  delta2_mfcc_mean_1?: number;
  delta2_mfcc_mean_2?: number;
  // ... (continues with delta2 patterns)
  
  // Mel-Spectrogram Features (128 bands)
  mel_mean_1?: number;
  mel_mean_2?: number;
  // ... (continues up to mel_mean_128)
  
  // Spectral Features
  spectral_centroid_mean?: number;
  spectral_centroid_std?: number;
  spectral_bandwidth_mean?: number;
  spectral_bandwidth_std?: number;
  spectral_rolloff_mean?: number;
  spectral_rolloff_std?: number;
  spectral_flux?: number;
  
  // Chroma Features
  chroma_mean_1?: number;
  chroma_mean_2?: number;
  // ... (continues up to chroma_mean_12)
  
  // Contrast Features
  contrast_mean_1?: number;
  contrast_mean_2?: number;
  // ... (continues up to contrast_mean_7)
  
  // Tonnetz Features
  tonnetz_mean_1?: number;
  tonnetz_mean_2?: number;
  // ... (continues up to tonnetz_mean_6)
  
  // Prosodic & Temporal Features
  duration?: number;
  tempo?: number;
  onset_rate?: number;
  onset_regularity?: number;
  beat_regularity?: number;
  pause_count?: number;
  pause_rate?: number;
  avg_pause_duration?: number;
  pause_duration_std?: number;
  silence_ratio?: number;
  voiced_ratio?: number;
  
  // RMS Energy
  rms_mean?: number;
  rms_std?: number;
  
  // Zero Crossing Rate
  zcr?: number;
  
  // Allow any additional feature (since we have 768+ features)
  [key: string]: number | undefined;
}

// Legacy VoiceFeatures for backward compatibility
export interface VoiceFeatures {
  // Fundamental frequency measures
  mdvp_fo_hz: number;
  mdvp_fhi_hz: number;
  mdvp_flo_hz: number;

  // Jitter measures
  mdvp_jitter_percent: number;
  mdvp_jitter_abs: number;
  mdvp_rap: number;
  mdvp_ppq: number;
  jitter_ddp: number;

  // Shimmer measures
  mdvp_shimmer: number;
  mdvp_shimmer_db: number;
  shimmer_apq3: number;
  shimmer_apq5: number;
  mdvp_apq: number;
  shimmer_dda: number;

  // Noise measures
  nhr: number;
  hnr: number;

  // Nonlinear measures
  rpde: number;
  dfa: number;
  spread1: number;
  spread2: number;
  d2: number;
  ppe: number;

  // Engineered features
  fo_range?: number;
  jitter_mean?: number;
  shimmer_mean?: number;
  jitter_shimmer_ratio?: number;
  harmonic_noise_combined?: number;
  voice_stability_index?: number;

  jitter?: number;
  shimmer?: number;
  f0?: number;

  // Thêm xác suất dự đoán cho FE
  probability_healthy?: number;
  probability_parkinsons?: number;
}

export interface AnalysisMetadata {
  model_version: string;
  feature_extraction_time: number;
  prediction_time: number;
  audio_duration: number;
  sample_rate: number;
  sentence_id: string;
  sentence_text: string;
}

export interface RandomSentence {
  sentence_id: string;
  sentence: string;
  length: number;
  word_count: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  instructions: string[];
  estimated_duration: number;
}

export interface DiagnosisHistory {
  id: string;
  session_id: string;
  timestamp: string;
  created_at: string;
  prediction: 'Healthy' | 'Parkinsons' | number;
  confidence: number | string;
  audio_duration?: number;
  sentence_used?: string;
  sentence?: string;
  risk_level?: 'low' | 'moderate' | 'high';
  diagnosis?: string;
  probability?: number;
  status?: string;
  features?: EnhancedVoiceFeatures;
  critical_features?: {
    jitter_local?: number;
    shimmer_local?: number;
    hnr?: number;
  };
  recommendations?: string[];
  model_info?: {
    name: string;
    version?: string;
    accuracy: number;
    features: number;
  };
}

export interface StatsResponse {
  total_analyses: number;
  total_high_risk: number;
  total_medium_risk: number;
  total_low_risk: number;
  accuracy_rate: number;
  recent_analyses: DiagnosisHistory[];
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    ml_service: 'up' | 'down';
  };
}

export interface APIError {
  error: string;
  message: string;
  timestamp: string;
}

// Blog types
export interface BlogPost {
  id: number;
  title: string;
  content: string;
  summary?: string;
  featured_image?: string;
  images?: string[];
  tags?: string[];
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  status: 'pending' | 'approved' | 'rejected';
  author_id: number;
  author?: {
    id: number;
    display_name: string;
    full_name?: string;
    email: string;
    role?: string;
  };
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  // User interaction fields
  user_reaction?: {
    id: number;
    post_id: number;
    user_id: number;
    reaction_type: string;
    created_at: string;
    updated_at: string;
  };
  is_saved?: boolean;
}

export interface CreateBlogPostRequest {
  content: string;
  images?: string[];
  tags?: string[];
}

export interface ApproveBlogPostRequest {
  approved: boolean;
  rejection_reason?: string;
}

// News types
export interface NewsCategory {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
  article_count?: number;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image?: string;
  images?: string[];
  category_id: number;
  category?: NewsCategory;
  tags?: string[];
  source?: string;
  source_url?: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'low' | 'normal' | 'high';
  author_id: number;
  author?: {
    id: number;
    display_name: string;
    full_name?: string;
    email: string;
  };
  published_at?: string;
  view_count: number;
  content_blocks?: Array<{
    type: string;
    content: string;
    caption?: string;
    order: number;
  }>;
  created_at: string;
  updated_at: string;
}

export interface CreateNewsArticleRequest {
  title: string;
  summary: string;
  content: string;
  featured_image?: string;
  images?: string[];
  category_id: number;
  tags?: string[];
  source?: string;
  source_url?: string;
  status?: 'draft' | 'published';
  priority?: 'low' | 'normal' | 'high';
  content_blocks?: Array<{
    type: string;
    content: string;
    caption?: string;
    order: number;
  }>;
}

export interface CreateNewsCategoryRequest {
  name: string;
  display_name: string;
  description?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Pagination
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Backend actual response structure (flat format)
export interface BackendPaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

// Hospital types
export interface Hospital {
  id: number; // Backend trả về number, không phải string
  name: string;
  slug?: string;
  address: string;
  phone?: string;
  email?: string;
  description?: string;
  website?: string;
  image?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  province?: string;
  working_hours?: string; // JSON string
  emergency_available?: boolean;
  specializations?: string; // JSON string
  status: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  hospital_doctors?: HospitalDoctor[];
}

export interface HospitalDoctor {
  id: number;
  hospital_id: number;
  doctor_id: string;
  department?: string;
  specialization?: string;
  position?: string;
  is_primary: boolean;
  consultation_fee?: number;
  available_days?: string; // JSON string
  morning_hours?: string;
  afternoon_hours?: string;
  status: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  hospital?: Hospital;
  doctor?: {
    id: number;
    user_id: string;
    email: string;
    display_name: string;
    role: string;
    status: string;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface Appointment {
  id: number;
  patient_id: string;
  doctor_id: string;
  hospital_id: number;
  appointment_date: string; // ISO date format
  time_slot: string; // Time in HH:mm format (e.g., "08:30")
  session: 'morning' | 'afternoon'; // Session period
  appointment_type: 'regular' | 'urgent';
  patient_profile_id?: number;
  // Patient demographics
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female';
  // Appointment details
  symptoms?: string;
  notes?: string;
  urgency: 'normal' | 'urgent';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' | 'rejected';
  // Confirmation
  confirmed_at?: string;
  confirmed_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
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
  medical_result_id?: number;
  // Follow-up
  follow_up_needed: boolean;
  follow_up_date?: string;
  next_appointment_id?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // Relations
  patient?: {
    id: number;
    user_id: string;
    email: string;
    phone: string;
    display_name: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
  };
  doctor?: {
    id: number;
    user_id: string;
    email: string;
    phone: string;
    display_name: string;
    role: string;
    status: string;
    last_login_at?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
  };
  hospital?: Hospital;
}

export interface CreateHospitalRequest {
  name: string;
  address: string;
  phone: string;
  email: string;
  description?: string;
  specializations?: string[];
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  emergency_contact?: string;
  website?: string;
  facilities?: string[];
  insurance_accepted?: string[];
}

export type UpdateHospitalRequest = Partial<CreateHospitalRequest>;

export interface CreateHospitalDoctorRequest {
  doctor_id: string;
  specialization?: string;
  available_days?: string[];
  morning_hours?: string;
  afternoon_hours?: string;
  consultation_fee?: number;
}

export interface UpdateHospitalDoctorRequest extends Partial<CreateHospitalDoctorRequest> {
  status?: 'active' | 'inactive' | 'on_leave';
}

export interface CreateAppointmentRequest {
  doctor_id: string;
  hospital_id: string;
  appointment_date: string;
  appointment_time: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  reason?: string;
  symptoms?: string;
}

export interface UpdateAppointmentRequest extends Partial<CreateAppointmentRequest> {
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  diagnosis?: string;
  prescription?: string;
  follow_up_date?: string;
}

export interface DoctorAvailability {
  doctor_id: string;
  date: string;
  morning_slots: string[];
  afternoon_slots: string[];
  evening_slots: string[];
  booked_slots: string[];
  available_slots: string[];
}

export interface HospitalSearchParams {
  name?: string;
  address?: string;
  specialization?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  page?: number;
  limit?: number;
}

export interface AppointmentSearchParams {
  patient_id?: string;
  doctor_id?: string;
  hospital_id?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}
