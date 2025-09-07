// Services exports
export { VoiceAnalysisService, AudioRecordingService } from './voice-analysis.service';

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
  APIError
} from '@/lib/api-config';
