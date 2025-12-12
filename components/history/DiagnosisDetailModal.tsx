'use client';

import { useState } from 'react';
import { DiagnosisHistory } from '@/lib/api-config';
import {
  X,
  Activity,
  BarChart3,
  Waves,
  Volume2,
  Calendar,
  FileAudio,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Info
} from 'lucide-react';

interface DiagnosisDetailModalProps {
  diagnosis: DiagnosisHistory;
  onClose: () => void;
}

export default function DiagnosisDetailModal({ diagnosis, onClose }: DiagnosisDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'details'>('overview');

  const isParkinsons = Number(diagnosis.prediction) === 1;
  const confidencePercent = (typeof diagnosis.confidence === 'number' ? diagnosis.confidence : parseFloat(String(diagnosis.confidence)) || 0) * 100;

  // Parse features if they exist
  const features = diagnosis.features || {};
  const criticalFeatures = diagnosis.critical_features;

  const getRiskColor = () => {
    if (!isParkinsons) return 'text-green-600 bg-green-100';
    if (confidencePercent >= 75) return 'text-red-600 bg-red-100';
    if (confidencePercent >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getRiskLevel = () => {
    if (!isParkinsons) return 'Khỏe mạnh';
    if (confidencePercent >= 75) return 'Nguy cơ cao';
    if (confidencePercent >= 60) return 'Nguy cơ trung bình';
    return 'Nguy cơ thấp';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Chi tiết phân tích giọng nói</h2>
              <p className="text-sm text-blue-100">
                Session ID: {diagnosis.session_id || diagnosis.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Tổng quan
              </span>
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'features'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Chỉ số phân tích
              </span>
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <FileAudio className="h-4 w-4" />
                Thông tin chi tiết
              </span>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Result Card */}
              <div className={`border-2 rounded-lg p-6 ${isParkinsons ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {isParkinsons ? (
                      <AlertCircle className="h-12 w-12 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-12 w-12 text-green-600" />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {isParkinsons ? 'Phát hiện dấu hiệu Parkinson' : 'Giọng nói khỏe mạnh'}
                      </h3>
                      <p className={`text-sm font-medium mt-1 px-3 py-1 rounded-full inline-block ${getRiskColor()}`}>
                        {getRiskLevel()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Độ tin cậy</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {confidencePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Features - V3 Scientific Edition */}
              {criticalFeatures && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Chỉ số lâm sàng quan trọng (V3 Scientific)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {criticalFeatures.jitter_local !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Waves className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Jitter (Rung giọng)</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {criticalFeatures.jitter_local.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Biến động tần số</div>
                      </div>
                    )}
                    
                    {criticalFeatures.shimmer_local !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Shimmer (Rung biên độ)</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {criticalFeatures.shimmer_local.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Biến động cường độ</div>
                      </div>
                    )}
                    
                    {criticalFeatures.hnr !== undefined && (
                      <div className="bg-white rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Volume2 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">HNR (Tỷ lệ âm hài)</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {criticalFeatures.hnr.toFixed(2)} dB
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Harmonic-to-Noise Ratio</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Khuyến nghị</h4>
                <ul className="space-y-2">
                  {isParkinsons ? (
                    <>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs">1</span>
                        </div>
                        <span className="text-gray-700">Tham khảo ý kiến bác sĩ chuyên khoa thần kinh để đánh giá toàn diện</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs">2</span>
                        </div>
                        <span className="text-gray-700">Theo dõi các triệu chứng và ghi nhật ký sức khỏe hàng ngày</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-xs">3</span>
                        </div>
                        <span className="text-gray-700">Thực hiện các xét nghiệm lâm sàng bổ sung nếu cần thiết</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="text-green-600 h-3 w-3" />
                        </div>
                        <span className="text-gray-700">Giọng nói của bạn cho thấy các mẫu khỏe mạnh</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="text-green-600 h-3 w-3" />
                        </div>
                        <span className="text-gray-700">Tiếp tục duy trì lối sống lành mạnh và kiểm tra sức khỏe định kỳ</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <Info className="h-4 w-4 inline mr-1" />
                  Các chỉ số được trích xuất từ mẫu giọng nói của bạn bằng thuật toán AI tiên tiến
                </p>
              </div>

              {Object.keys(features).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(features).map(([key, value]) => (
                    <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        {key.replace(/_/g, ' ')}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {typeof value === 'number' ? value.toFixed(4) : String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Không có dữ liệu features chi tiết</p>
                </div>
              )}
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Thông tin phiên</h4>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Mã phiên:</dt>
                      <dd className="text-gray-900 font-mono">{diagnosis.session_id || diagnosis.id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Thời gian:</dt>
                      <dd className="text-gray-900">
                        {new Date(diagnosis.timestamp || diagnosis.created_at).toLocaleString('vi-VN')}
                      </dd>
                    </div>
                    {('audio_duration' in diagnosis && diagnosis.audio_duration) && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Độ dài âm thanh:</dt>
                        <dd className="text-gray-900">{diagnosis.audio_duration.toFixed(2)}s</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Trạng thái:</dt>
                      <dd className="text-gray-900">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          {diagnosis.status || 'completed'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileAudio className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Nội dung ghi âm</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">
                      &ldquo;{diagnosis.sentence || diagnosis.sentence_used || 'Không có thông tin'}&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* Model Information */}
              {diagnosis.model_info && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Thông tin mô hình AI
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Tên mô hình</div>
                      <div className="font-semibold text-gray-900">{diagnosis.model_info.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Phiên bản</div>
                      <div className="font-semibold text-gray-900">{diagnosis.model_info.version}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Độ chính xác</div>
                      <div className="font-semibold text-gray-900">{(diagnosis.model_info.accuracy * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Số features</div>
                      <div className="font-semibold text-gray-900">{diagnosis.model_info.features}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
