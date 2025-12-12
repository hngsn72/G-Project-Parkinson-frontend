'use client';

import { useState, useEffect } from 'react';
import { Activity, Calendar, AlertCircle } from 'lucide-react';
import { backendApi } from '@/lib/api-client';

interface DiagnosisResult {
  id?: number;
  session_id: string;
  prediction: number;
  probability?: number;
  confidence: string;
  diagnosis: string;
  timestamp?: string;
  created_at?: string;
  profile_id?: number | null;
}

interface VoiceAnalysisSelectorProps {
  profileId?: number | null; // null for main account, number for family member
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function VoiceAnalysisSelector({ 
  profileId, 
  selectedIds, 
  onSelectionChange 
}: VoiceAnalysisSelectorProps) {
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDiagnoses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const loadDiagnoses = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Loading diagnoses for profileId:', profileId);
      
      // Always fetch all history - we'll filter by profile if needed
      console.log('Fetching all history:', '/api/v1/history');
      const response = await backendApi.get('/api/v1/history');

      console.log('Voice analysis response:', response);
      console.log('Response data:', response.data);

      if (response.data) {
        // Backend returns {success: true, data: {diagnoses: [...], limit, offset, total}}
        const responseData = response.data.data || response.data;
        const data = responseData.diagnoses || responseData.data || [];
        
        console.log('Data received:', data);
        console.log('Current profileId param:', profileId);
        
        // Filter based on profileId
        const filtered = data.filter((d: DiagnosisResult) => {
          const isParkinsons = d.prediction === 1;
          
          // Check if diagnosis has been saved to a profile
          if (!isParkinsons) {
            console.log('Skip - not Parkinsons:', d.session_id);
            return false;
          }
          
          // TEMPORARY: Show all Parkinson results regardless of profile_id
          // This is for testing - normally should filter by profile
          console.log('Include Parkinson diagnosis:', d.session_id, 'profile_id:', d.profile_id);
          return true;
          
          /* Original logic - uncomment when profile assignment works:
          if (profileId === null || profileId === undefined) {
            // Main account - show all saved diagnoses
            const hasSavedProfile = d.profile_id !== undefined && d.profile_id !== null;
            console.log('Main account - Diagnosis:', d.session_id, 'has profile_id:', d.profile_id, 'Include:', hasSavedProfile);
            return hasSavedProfile;
          } else {
            // Specific family member profile - match exact profile_id
            const matches = d.profile_id === profileId;
            console.log('Family member - Diagnosis:', d.session_id, 'profile_id:', d.profile_id, 'target:', profileId, 'Match:', matches);
            return matches;
          }
          */
        });
        
        console.log('Filtered diagnoses:', filtered);
        setDiagnoses(filtered);
        
        // Don't set error if no results - just show empty state
      } else {
        console.error('Response has no data:', response);
        setError('Không thể tải dữ liệu');
      }
    } catch (err) {
      console.error('Failed to load diagnoses:', err);
      setError('Lỗi khi tải lịch sử phát hiện: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedIds.includes(value)) {
      onSelectionChange([...selectedIds, value]);
    }
    // Reset select to placeholder
    e.target.value = '';
  };

  const removeSelection = (sessionId: string) => {
    onSelectionChange(selectedIds.filter(id => id !== sessionId));
  };

  const getRiskColor = (prediction: number, probability?: number) => {
    if (prediction !== 1) return 'bg-green-100 text-green-800';
    
    const prob = probability || 0;
    if (prob >= 0.85) return 'bg-red-100 text-red-800';
    if (prob >= 0.70) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Đang tải kết quả phát hiện...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (diagnoses.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Chưa có kết quả phát hiện nào được lưu</p>
        <p className="text-xs text-gray-500 mt-1">
          Thực hiện phát hiện và lưu kết quả vào hồ sơ để đính kèm vào lịch khám
        </p>
      </div>
    );
  }

  // Get selected diagnoses details
  const selectedDiagnoses = diagnoses.filter(d => selectedIds.includes(d.session_id));

  return (
    <div className="space-y-3">
      {/* Dropdown to add more */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn kết quả phát hiện để đính kèm
        </label>
        <select
          onChange={handleSelectChange}
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          defaultValue=""
        >
          <option value="" disabled>-- Chọn kết quả phát hiện --</option>
          {diagnoses.map((diagnosis) => {
            const probability = diagnosis.probability || 0;
            const confidencePercent = (probability * 100).toFixed(1);
            const dateStr = diagnosis.timestamp || diagnosis.created_at || '';
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'N/A';
            const isAlreadySelected = selectedIds.includes(diagnosis.session_id);
            
            return (
              <option 
                key={diagnosis.session_id} 
                value={diagnosis.session_id}
                disabled={isAlreadySelected}
              >
                {formattedDate} - Độ tin cậy: {confidencePercent}% {isAlreadySelected ? '(Đã chọn)' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Selected items display */}
      {selectedDiagnoses.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Đã chọn {selectedDiagnoses.length} kết quả:
            </p>
            <button
              onClick={() => onSelectionChange([])}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Xóa tất cả
            </button>
          </div>
          
          <div className="space-y-2">
            {selectedDiagnoses.map((diagnosis) => {
              const probability = diagnosis.probability || 0;
              const confidencePercent = (probability * 100).toFixed(1);
              const dateStr = diagnosis.timestamp || diagnosis.created_at || '';
              const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'N/A';
              
              return (
                <div
                  key={diagnosis.session_id}
                  className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          Phát hiện dấu hiệu Parkinson
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRiskColor(diagnosis.prediction, probability)}`}>
                          Độ tin cậy: {confidencePercent}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeSelection(diagnosis.session_id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Xóa"
                  >
                    <AlertCircle className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium">
                {selectedIds.length} kết quả sẽ được gửi kèm lịch khám
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Bác sĩ sẽ xem các chỉ số phát hiện khi chấp nhận lịch khám của bạn
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
