'use client';

import { useState, useEffect } from 'react';
import { Activity, Calendar, AlertCircle, CheckCircle2, TrendingUp, Waves, Volume2 } from 'lucide-react';
import { backendApi } from '@/lib/api-client';
import { DiagnosisHistory } from '@/lib/api-config';
import DiagnosisDetailModal from '../history/DiagnosisDetailModal';

interface ProfileDiagnosisHistoryProps {
  profileId: number | null; // null = main account (no profile)
  profileName?: string;
}

export default function ProfileDiagnosisHistory({ profileId, profileName }: ProfileDiagnosisHistoryProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisHistory | null>(null);

  useEffect(() => {
    loadDiagnoses();
  }, [profileId]);

  const loadDiagnoses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (profileId === null || profileId === 0) {
        // Load all user's diagnoses (main account)
        const response = await backendApi.get<DiagnosisHistory[]>('/api/v1/history');
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : 
                      (response.data as any).diagnoses || [];
          setDiagnoses(data);
        }
      } else {
        // Load diagnoses for specific profile
        const response = await backendApi.get<DiagnosisHistory[]>(`/api/v1/diagnosis/profile/${profileId}`);
        if (response.success && response.data) {
          const data = Array.isArray(response.data) ? response.data : 
                      (response.data as any).data || [];
          setDiagnoses(data);
        }
      }
    } catch (err) {
      console.error('Failed to load diagnoses:', err);
      setError('Không thể tải lịch sử phân tích');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (prediction: number, confidence: number) => {
    if (prediction === 0) return 'text-green-600 bg-green-100';
    const confidencePercent = confidence * 100;
    if (confidencePercent >= 75) return 'text-red-600 bg-red-100';
    if (confidencePercent >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getRiskLevel = (prediction: number, confidence: number) => {
    if (prediction === 0) return 'Khỏe mạnh';
    const confidencePercent = confidence * 100;
    if (confidencePercent >= 75) return 'Nguy cơ cao';
    if (confidencePercent >= 60) return 'Nguy cơ trung bình';
    return 'Nguy cơ thấp';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử phân tích</h3>
        <p className="text-gray-600">
          {profileName ? `${profileName} chưa có kết quả phân tích giọng nói nào.` : 'Bạn chưa có kết quả phân tích giọng nói nào.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Lịch sử phân tích {profileName && `- ${profileName}`}
          </h3>
          <span className="text-sm text-gray-500">{diagnoses.length} kết quả</span>
        </div>

        <div className="space-y-3">
          {diagnoses.map((diagnosis) => {
            const isParkinsons = Number(diagnosis.prediction) === 1;
            // Use probability field (0-1 range) instead of confidence (which is a string like "High")
            const probability = typeof (diagnosis as { probability?: number }).probability === 'number' 
              ? (diagnosis as { probability: number }).probability 
              : 0;
            const confidencePercent = probability * 100;

            return (
              <div
                key={diagnosis.id || diagnosis.session_id}
                onClick={() => setSelectedDiagnosis(diagnosis)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {isParkinsons ? (
                      <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    ) : (
                      <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {isParkinsons ? 'Phát hiện dấu hiệu Parkinson' : 'Giọng nói khỏe mạnh'}
                        </h4>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRiskColor(diagnosis.prediction, probability)}`}>
                          {getRiskLevel(diagnosis.prediction, probability)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(diagnosis.timestamp || diagnosis.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>Độ tin cậy: {confidencePercent.toFixed(1)}%</span>
                        </div>
                      </div>

                      {/* Critical Features Preview */}
                      {diagnosis.critical_features && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {diagnosis.critical_features.jitter_local !== undefined && (
                            <div className="flex items-center gap-1">
                              <Waves className="h-3 w-3" />
                              <span>Jitter: {diagnosis.critical_features.jitter_local.toFixed(4)}</span>
                            </div>
                          )}
                          {diagnosis.critical_features.shimmer_local !== undefined && (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              <span>Shimmer: {diagnosis.critical_features.shimmer_local.toFixed(4)}</span>
                            </div>
                          )}
                          {diagnosis.critical_features.hnr !== undefined && (
                            <div className="flex items-center gap-1">
                              <Volume2 className="h-3 w-3" />
                              <span>HNR: {diagnosis.critical_features.hnr.toFixed(2)} dB</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{confidencePercent.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDiagnosis && (
        <DiagnosisDetailModal
          diagnosis={selectedDiagnosis}
          onClose={() => setSelectedDiagnosis(null)}
        />
      )}
    </>
  );
}
