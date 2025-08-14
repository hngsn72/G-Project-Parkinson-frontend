// API Configuration
export const API_CONFIG = {
  BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://wonderful-production.up.railway.app',
  ML_SERVICE_URL: process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'https://ml-service-production-850d.up.railway.app',
  TIMEOUT: 30000, // 30 seconds
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

export interface DiagnosisResult {
  id: string;
  prediction: 'healthy' | 'parkinsons';
  confidence: number;
  probability_healthy: number;
  probability_parkinsons: number;
  risk_level: 'low' | 'moderate' | 'high';
  features: VoiceFeatures;
  analysis_metadata: AnalysisMetadata;
  created_at: string;
}

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
  // Các trường cũ giữ lại để tránh lỗi FE nếu backend chưa trả về
  jitter_shimmer_ratio?: number;
  harmonic_noise_combined?: number;
  voice_stability_index?: number;

  // Các trường đồng bộ backend mới
  jitter?: number;
  shimmer?: number;
  f0?: number;
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
  prediction: 'Healthy' | 'Parkinsons';
  confidence: number;
  audio_duration: number;
  sentence_used: string;
  risk_level: 'low' | 'moderate' | 'high';
  features?: VoiceFeatures; // <-- add this line to support features in history
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
