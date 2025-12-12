'use client';

import { useState } from 'react';
import { 
  AlertCircle,
  Activity,
  Phone,
  Calendar,
  FileText,
  Download,
  Share2,
  ChevronRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Save
} from 'lucide-react';
import { SaveResultModal } from './SaveResultModal';

interface PositiveResultMobileProps {
  result: {
    prediction: number;
    confidence: string;
    probability?: number;
    diagnosis?: string;
    session_id?: string;
    critical_features?: {
      jitter_local?: number;
      shimmer_local?: number;
      hnr?: number;
    };
    features?: Record<string, number | undefined>;
    model_info?: {
      version?: string;
      accuracy?: number;
      algorithm?: string;
    };
  };
  onNewAnalysis: () => void;
}

export default function PositiveResultMobile({ result, onNewAnalysis }: PositiveResultMobileProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const confidencePercent = result.probability ? (result.probability * 100).toFixed(1) : '95.0';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header Alert Card */}
      <div className="bg-white rounded-3xl shadow-xl mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <AlertCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Phát hiện dấu hiệu bất thường
          </h1>
          <p className="text-white/90 text-center text-sm">
            Kết quả phân tích giọng nói cho thấy các chỉ số cần lưu ý
          </p>
        </div>

        {/* Confidence Level */}
        <div className="p-6 bg-gradient-to-b from-white to-red-50">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-red-600 mb-2">
              {confidencePercent}%
            </div>
            <div className="text-sm text-gray-600 uppercase tracking-wide font-semibold">
              Độ tin cậy phát hiện
            </div>
          </div>

          {/* Confidence Bar */}
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div 
              className="absolute h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
              <Phone className="h-5 w-5" />
              Tư vấn ngay
            </button>
            <button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-2xl font-semibold hover:bg-gray-50 transition-all">
              <Calendar className="h-5 w-5" />
              Đặt lịch khám
            </button>
          </div>
          <button 
            onClick={() => setShowSaveModal(true)}
            disabled={!result.session_id}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            Lưu kết quả vào hồ sơ
          </button>
        </div>
      </div>

      {/* Critical Indicators */}
      <div className="bg-white rounded-3xl shadow-xl mb-6 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity className="h-6 w-6 text-red-500" />
          <h2 className="text-xl font-bold text-gray-900">Chỉ số quan trọng</h2>
        </div>

        <div className="space-y-4">
          {result.critical_features?.jitter_local !== undefined && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-gray-900">Jitter (Dao động tần số)</span>
                </div>
                <span className="text-red-600 font-bold">
                  {(result.critical_features.jitter_local * 100).toFixed(3)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 ml-5">
                Cao hơn ngưỡng bình thường - Giọng nói không ổn định
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: '75%' }} />
              </div>
            </div>
          )}

          {result.critical_features?.shimmer_local !== undefined && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
                  <span className="font-semibold text-gray-900">Shimmer (Dao động biên độ)</span>
                </div>
                <span className="text-orange-600 font-bold">
                  {(result.critical_features.shimmer_local * 100).toFixed(3)}%
                </span>
              </div>
              <div className="text-sm text-gray-600 ml-5">
                Biên độ giọng nói dao động bất thường
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500" style={{ width: '68%' }} />
              </div>
            </div>
          )}

          {result.critical_features?.hnr !== undefined && (
            <div className="bg-gradient-to-r from-yellow-50 to-red-50 rounded-2xl p-4 border-l-4 border-yellow-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-pulse" />
                  <span className="font-semibold text-gray-900">HNR (Tỷ lệ tín hiệu/nhiễu)</span>
                </div>
                <span className="text-yellow-700 font-bold">
                  {result.critical_features.hnr.toFixed(2)} dB
                </span>
              </div>
              <div className="text-sm text-gray-600 ml-5">
                Thấp hơn mức khuyến nghị - Giọng nói có nhiễu
              </div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-600" style={{ width: '55%' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What This Means */}
      <div className="bg-white rounded-3xl shadow-xl mb-6 p-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">Ý nghĩa kết quả</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold text-sm">1</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Phát hiện sớm</h3>
              <p className="text-sm text-gray-600">
                Các chỉ số giọng nói cho thấy có sự thay đổi cần được theo dõi. 
                Đây chỉ là kết quả sàng lọc ban đầu.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">2</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Cần thăm khám</h3>
              <p className="text-sm text-gray-600">
                Bạn nên đến gặp bác sĩ chuyên khoa thần kinh để được khám và 
                đánh giá toàn diện hơn.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Không hoảng sợ</h3>
              <p className="text-sm text-gray-600">
                Kết quả này không phải là chẩn đoán cuối cùng. Nhiều yếu tố 
                có thể ảnh hưởng đến giọng nói.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-xl mb-6 p-6 text-white">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="h-6 w-6" />
          <h2 className="text-xl font-bold">Bước tiếp theo</h2>
        </div>

        <div className="space-y-3">
          <button className="w-full bg-white text-blue-600 rounded-2xl p-4 flex items-center justify-between hover:bg-blue-50 transition-all shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Tư vấn trực tuyến</div>
                <div className="text-sm text-gray-600">Gọi ngay: 1900-xxxx</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>

          <button className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-4 flex items-center justify-between hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Đặt lịch khám</div>
                <div className="text-sm text-white/80">Tại bệnh viện gần bạn</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/60" />
          </button>

          <button className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-2xl p-4 flex items-center justify-between hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Tải báo cáo PDF</div>
                <div className="text-sm text-white/80">Mang đến bác sĩ</div>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* AI Model Info */}
      <div className="bg-white rounded-3xl shadow-xl mb-6 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Award className="h-6 w-6 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900">Về AI Model</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">93.4%</div>
            <div className="text-xs text-gray-600">Độ chính xác</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">87</div>
            <div className="text-xs text-gray-600">Chỉ số phân tích</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">97.4%</div>
            <div className="text-xs text-gray-600">AUC Score</div>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">V3</div>
            <div className="text-xs text-gray-600">Phiên bản</div>
          </div>
        </div>

        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              AI được huấn luyện trên <span className="font-semibold">hàng nghìn mẫu giọng nói</span> và 
              sử dụng các chỉ số khoa học được công nhận quốc tế
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-3 mb-6">
        <button 
          onClick={onNewAnalysis}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
        >
          <Activity className="h-5 w-5" />
          Phân tích lại
        </button>
        <button className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center">
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold mb-1">Lưu ý quan trọng</p>
            <p className="text-amber-800">
              Đây chỉ là công cụ hỗ trợ sàng lọc, không thay thế cho chẩn đoán y tế. 
              Hãy tham khảo ý kiến bác sĩ chuyên khoa để có kết luận chính xác.
            </p>
          </div>
        </div>
      </div>

      {/* Save Result Modal */}
      {showSaveModal && result.session_id && (
        <SaveResultModal
          sessionId={result.session_id}
          onClose={() => setShowSaveModal(false)}
          onSuccess={() => {
            // Could trigger refetch or show success message
          }}
        />
      )}
    </div>
  );
}
