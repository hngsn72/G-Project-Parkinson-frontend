'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertCircle, TrendingUp, TrendingDown, Waves, FileText } from 'lucide-react';
import { backendApi } from '@/lib/api-client';
import DiagnosisDetailModal from '../diagnosis/DiagnosisDetailModal';

interface DiagnosisResult {
  id?: number;
  session_id: string;
  prediction: number;
  probability: number;
  confidence: string;
  diagnosis: string;
  features?: {
    jitter_percent?: number;
    shimmer_percent?: number;
    hnr_db?: number;
    [key: string]: number | undefined;
  };
  timestamp?: string;
  created_at?: string;
}

interface VoiceAnalysisDisplayProps {
  sessionIds: string[]; // Array of diagnosis session IDs from appointment
}

export default function VoiceAnalysisDisplay({ sessionIds }: VoiceAnalysisDisplayProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<DiagnosisResult | null>(null);

  useEffect(() => {
    if (sessionIds && sessionIds.length > 0) {
      loadDiagnoses();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionIds]);

  const loadDiagnoses = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch all session IDs
      const promises = sessionIds.map(sessionId => 
        backendApi.get(`/api/v1/history/${sessionId}`)
      );

      const responses = await Promise.all(promises);
      const results: DiagnosisResult[] = [];

      responses.forEach(response => {
        if (response.data.success && response.data.data) {
          results.push(response.data.data);
        }
      });

      setDiagnoses(results);
    } catch (err) {
      console.error('Failed to load diagnoses:', err);
      setError('Không thể tải kết quả phát hiện');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (prediction: number, probability: number) => {
    if (prediction !== 1) return 'bg-green-100 text-green-800 border-green-300';
    
    if (probability >= 0.85) return 'bg-red-100 text-red-800 border-red-300';
    if (probability >= 0.70) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  };

  const getFeatureStatus = (value: number | undefined, feature: 'jitter' | 'shimmer' | 'hnr') => {
    if (value === undefined) return { icon: null, color: 'text-gray-400', status: 'N/A' };

    // Normal ranges (simplified)
    const thresholds = {
      jitter: { normal: 1.0, high: 1.5 },
      shimmer: { normal: 3.0, high: 5.0 },
      hnr: { low: 20, normal: 25 } // Higher HNR is better
    };

    if (feature === 'hnr') {
      if (value >= thresholds.hnr.normal) {
        return { icon: TrendingUp, color: 'text-green-600', status: 'Tốt' };
      } else if (value >= thresholds.hnr.low) {
        return { icon: Activity, color: 'text-yellow-600', status: 'Trung bình' };
      } else {
        return { icon: TrendingDown, color: 'text-red-600', status: 'Thấp' };
      }
    } else {
      const threshold = thresholds[feature];
      if (value <= threshold.normal) {
        return { icon: TrendingUp, color: 'text-green-600', status: 'Bình thường' };
      } else if (value <= threshold.high) {
        return { icon: Activity, color: 'text-yellow-600', status: 'Tăng nhẹ' };
      } else {
        return { icon: TrendingDown, color: 'text-red-600', status: 'Cao' };
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Chưa có kết quả phát hiện đính kèm</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="h-5 w-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900">Kết quả phân tích giọng nói ({diagnoses.length})</h4>
        </div>

        {diagnoses.map((diagnosis) => {
          const probability = typeof (diagnosis as { probability?: number }).probability === 'number' 
            ? (diagnosis as { probability: number }).probability 
            : 0;
          const confidencePercent = probability * 100;
          const isParkinsons = diagnosis.prediction === 1;
          const dateStr = diagnosis.timestamp || diagnosis.created_at || '';

          const jitterStatus = getFeatureStatus(diagnosis.features?.jitter_percent, 'jitter');
          const shimmerStatus = getFeatureStatus(diagnosis.features?.shimmer_percent, 'shimmer');
          const hnrStatus = getFeatureStatus(diagnosis.features?.hnr_db, 'hnr');

          return (
            <div
              key={diagnosis.session_id}
              className={`border-2 rounded-lg p-4 ${getRiskColor(diagnosis.prediction, probability)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2">
                  {isParkinsons ? (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Activity className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {isParkinsons ? 'Phát hiện dấu hiệu Parkinson' : 'Giọng nói bình thường'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {dateStr ? new Date(dateStr).toLocaleString('vi-VN') : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{confidencePercent.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">Độ tin cậy</p>
                </div>
              </div>

              {/* Critical Features */}
              {diagnosis.features && (
                <div className="grid grid-cols-3 gap-3 mb-3 pt-3 border-t border-gray-300">
                  {/* Jitter */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {jitterStatus.icon && <jitterStatus.icon className={`h-3 w-3 ${jitterStatus.color}`} />}
                      <p className="text-xs font-medium text-gray-700">Jitter</p>
                    </div>
                    <p className="text-sm font-bold">{diagnosis.features.jitter_percent?.toFixed(2) || 'N/A'}%</p>
                    <p className={`text-xs ${jitterStatus.color}`}>{jitterStatus.status}</p>
                  </div>

                  {/* Shimmer */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {shimmerStatus.icon && <shimmerStatus.icon className={`h-3 w-3 ${shimmerStatus.color}`} />}
                      <p className="text-xs font-medium text-gray-700">Shimmer</p>
                    </div>
                    <p className="text-sm font-bold">{diagnosis.features.shimmer_percent?.toFixed(2) || 'N/A'}%</p>
                    <p className={`text-xs ${shimmerStatus.color}`}>{shimmerStatus.status}</p>
                  </div>

                  {/* HNR */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {hnrStatus.icon && <hnrStatus.icon className={`h-3 w-3 ${hnrStatus.color}`} />}
                      <p className="text-xs font-medium text-gray-700">HNR</p>
                    </div>
                    <p className="text-sm font-bold">{diagnosis.features.hnr_db?.toFixed(1) || 'N/A'} dB</p>
                    <p className={`text-xs ${hnrStatus.color}`}>{hnrStatus.status}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedDiagnosis(diagnosis)}
                className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 pt-2 border-t border-gray-300"
              >
                <FileText className="h-3 w-3" />
                Xem chi tiết đầy đủ
              </button>
            </div>
          );
        })}
      </div>

      {/* Diagnosis Detail Modal */}
      {selectedDiagnosis && (
        <DiagnosisDetailModal
          diagnosis={selectedDiagnosis}
          isOpen={!!selectedDiagnosis}
          onClose={() => setSelectedDiagnosis(null)}
        />
      )}
    </>
  );
}
