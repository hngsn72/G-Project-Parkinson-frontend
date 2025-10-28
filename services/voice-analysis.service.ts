import { backendApi, mlServiceApi } from '@/lib/api-client';
import { 
  API_ENDPOINTS, 
  DiagnosisResult, 
  DiagnosisHistory, 
  StatsResponse, 
  RandomSentence,
  HealthCheck 
} from '@/lib/api-config';

export class VoiceAnalysisService {
  // Health checks
  static async checkBackendHealth() {
    return await backendApi.get<HealthCheck>(API_ENDPOINTS.backend.health);
  }

  static async checkMLServiceHealth() {
    return await mlServiceApi.get<HealthCheck>(API_ENDPOINTS.mlService.health);
  }

  // Get random sentence for recording
  static async getRandomSentence() {
    return await backendApi.get<RandomSentence>(API_ENDPOINTS.backend.sentences);
  }

  // Analyze voice using V1 API (matches backend exactly)
  static async analyzeVoice(audioFile: File, sentence: string, user_id: string) {
    let actualUserId = user_id;
    if (!actualUserId && typeof window !== 'undefined') {
      const userRaw = localStorage.getItem('auth_user');
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          actualUserId = user.user_id;
        } catch {}
      }
    }
    return await backendApi.upload<DiagnosisResult>(
      API_ENDPOINTS.backend.predict,
      audioFile,
      {
        sentence: sentence,
        timestamp: new Date().toISOString(),
        user_id: actualUserId || ''
      },
      'audio'
    );
  }

  // Get analysis history
  static async getAnalysisHistory(limit: number = 10) {
    return await backendApi.get<DiagnosisHistory[]>(`${API_ENDPOINTS.backend.history}?limit=${limit}`);
  }

  // Get statistics
  static async getStatistics() {
    return await backendApi.get<StatsResponse>(API_ENDPOINTS.backend.stats);
  }

  // Delete analysis record
  static async deleteAnalysis(id: string) {
    return await backendApi.delete(API_ENDPOINTS.backend.deleteHistory(id));
  }

  // Get analysis details by ID
  static async getAnalysisById(id: string) {
    return await backendApi.get<DiagnosisResult>(API_ENDPOINTS.backend.historyById(id));
  }
}

// Audio recording utilities
export class AudioRecordingService {
  private static mediaRecorder: MediaRecorder | null = null;
  private static audioChunks: Blob[] = [];

  static async startRecording(): Promise<MediaRecorder | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      return this.mediaRecorder;
    } catch (error) {
      console.error('Error starting recording:', error);
      return null;
    }
  }

  static stopRecording(): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        
        // Stop all tracks
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        
        resolve(audioFile);
      };

      this.mediaRecorder.stop();
    });
  }

  static isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  static async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.src = URL.createObjectURL(file);
    });
  }
}
