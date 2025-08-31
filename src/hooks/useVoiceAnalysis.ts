'use client';

import { useState, useEffect, useCallback } from 'react';
import { VoiceAnalysisService, AudioRecordingService } from '@/services/voice-analysis.service';
import { DiagnosisResult, DiagnosisHistory, StatsResponse, RandomSentence } from '@/lib/api-config';

// Hook for voice analysis operations
export function useVoiceAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);

  const analyzeVoice = useCallback(async (audioFile: File, sentence: string) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await VoiceAnalysisService.analyzeVoice(audioFile, sentence);
      
      if (response.success && response.data) {
        setResult(response.data as DiagnosisResult);
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    analyzeVoice,
    resetAnalysis,
    isAnalyzing,
    result,
    error,
  };
}

// Hook for audio recording
export function useAudioRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioFile(null);
    setRecordingTime(0);

    try {
      const mediaRecorder = await AudioRecordingService.startRecording();
      if (mediaRecorder) {
        setIsRecording(true);
        window.dispatchEvent(new CustomEvent('voice-analysis-history-update'));
      } else {
        setError('Failed to start recording');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recording failed');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const file = await AudioRecordingService.stopRecording();
      setAudioFile(file);
      setIsRecording(false);
      return file;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsRecording(false);
      return null;
    }
  }, []);

  const resetRecording = useCallback(() => {
    setIsRecording(false);
    setRecordingTime(0);
    setAudioFile(null);
    setError(null);
  }, []);

  return {
    startRecording,
    stopRecording,
    resetRecording,
    isRecording,
    recordingTime,
    audioFile,
    error,
  };
}

// Hook for analysis history
export function useAnalysisHistory() {
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await VoiceAnalysisService.getAnalysisHistory(10);
      
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        setError(response.error || 'Failed to fetch history');
        setHistory([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAnalysis = useCallback(async (id: string) => {
    try {
      const response = await VoiceAnalysisService.deleteAnalysis(id);
      
      if (response.success) {
        setHistory(prev => prev.filter(item => item.id !== id));
      } else {
        setError(response.error || 'Failed to delete analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    fetchHistory,
    deleteAnalysis,
  };
}

// Hook for statistics
export function useStatistics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await VoiceAnalysisService.getStatistics();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}

// Hook for sentences
export function useSentences() {
  const [sentence, setSentence] = useState<RandomSentence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomSentence = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await VoiceAnalysisService.getRandomSentence();
      
      if (response.success && response.data) {
        setSentence(response.data);
      } else {
        setError(response.error || 'Failed to fetch sentence');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRandomSentence();
  }, [fetchRandomSentence]);

  return {
    sentence,
    isLoading,
    error,
    fetchRandomSentence,
  };
}

// Hook for system health
export function useSystemHealth() {
  const [backendHealth, setBackendHealth] = useState<boolean | null>(null);
  const [mlServiceHealth, setMLServiceHealth] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);

    try {
      const [backendResponse, mlResponse] = await Promise.all([
        VoiceAnalysisService.checkBackendHealth(),
        VoiceAnalysisService.checkMLServiceHealth(),
      ]);

      setBackendHealth(backendResponse.success);
      setMLServiceHealth(mlResponse.success);
    } catch {
      setBackendHealth(false);
      setMLServiceHealth(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return {
    backendHealth,
    mlServiceHealth,
    isChecking,
    checkHealth,
  };
}
