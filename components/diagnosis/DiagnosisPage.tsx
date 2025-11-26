'use client';

import { useVoiceAnalysis, useAudioRecording, useSentences } from '@/hooks';
import { 
  Mic, 
  Upload, 
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Zap,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';

export default function DiagnosisPage() {
  const { 
    analyzeVoice, 
    resetAnalysis, 
    isAnalyzing, 
    result, 
    error: analysisError 
  } = useVoiceAnalysis();
  
  const { 
    startRecording, 
    stopRecording, 
    resetRecording, 
    isRecording, 
    recordingTime,
    error: recordingError 
  } = useAudioRecording();
  
  const { 
    sentence, 
    fetchRandomSentence,
    error: sentenceError 
  } = useSentences();

  const handleStartRecording = async () => {
    await fetchRandomSentence();
    await startRecording();
  };

  const handleStopRecording = async () => {
    const file = await stopRecording();
    if (file && sentence) {
      // Automatically start analysis after recording
      await analyzeVoice(file, sentence.sentence);
    }
  };

  const handleReset = () => {
    resetRecording();
    resetAnalysis();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && sentence) {
      resetRecording();
      await analyzeVoice(file, sentence.sentence);
    }
  };

  const getRiskColor = (confidence: string, prediction: number) => {
    if (prediction === 0) {
      return 'text-green-800 bg-green-100 border-green-200'; // Healthy
    }
    
    switch (confidence?.toLowerCase()) {
      case 'high': return 'text-red-800 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-800 bg-green-100 border-green-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getRiskLevel = (confidence: string, prediction: number) => {
    if (prediction === 0) return 'Thấp';
    
    switch (confidence?.toLowerCase()) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return '-';
    }
  };

  const getPredictionText = (prediction: number) => {
    return prediction === 1 ? 'Có dấu hiệu bệnh' : 'Bình thường';
  };

  const error = analysisError || recordingError || sentenceError;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Phân tích giọng nói</h1>
        <p className="text-gray-600">Phát hiện bệnh Parkinson bằng AI qua phân tích mẫu giọng nói</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recording Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Mic className="h-6 w-6 mr-2 text-blue-600" />
                Ghi âm giọng nói
              </h2>
            </div>
            
            <div className="p-8">
              {/* Recording Interface */}
              <div className="text-center space-y-6">

                {/* Recording Visualizer */}
                <div className="relative">
                  <div className={`w-32 h-32 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'border-red-500 bg-red-50 animate-pulse' 
                      : result
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}>
                    {isRecording ? (
                      <div className="relative">
                        <Mic className="h-12 w-12 text-red-500" />
                        <div className="absolute inset-0 animate-ping">
                          <div className="w-full h-full bg-red-400 rounded-full opacity-75"></div>
                        </div>
                      </div>
                    ) : isAnalyzing ? (
                      <Brain className="h-12 w-12 text-blue-500 animate-spin" />
                    ) : result ? (
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    ) : (
                      <Mic className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  {/* Recording Time */}
                  {isRecording && (
                    <div className="mt-4">
                      <div className="text-2xl font-mono font-bold text-red-600">
                        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-gray-500">Recording...</div>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="mt-4">
                      <div className="text-lg font-semibold text-blue-600">Analyzing Voice Pattern</div>
                      <div className="text-sm text-gray-500">AI processing in progress...</div>
                    </div>
                  )}
                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">{error}</div>
                    </div>
                  )}
                </div>

                {/* Sentence to read - always show in recording card if not analyzing and (not result or isRecording) */}
                {(!isAnalyzing && (isRecording || !result) && sentence) && (
                  <div className="mb-2 flex flex-col items-center">
                    <span className="text-blue-800 text-sm font-medium mb-1">Vui lòng đọc câu sau:</span>
                    <div className={`bg-white p-3 rounded border border-blue-200 w-fit max-w-full ${isRecording ? 'ring-2 ring-blue-400' : ''}`}>
                      <span className="text-gray-900 font-medium">&quot;{sentence.sentence}&quot;</span>
                    </div>
                    {!isRecording && (
                      <button 
                        onClick={fetchRandomSentence}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        Lấy câu khác
                      </button>
                    )}
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex justify-center space-x-4">
                  {!isRecording && !isAnalyzing ? (
                    <>
                      <button
                        onClick={handleStartRecording}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        disabled={isAnalyzing}
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Bắt đầu ghi âm
                      </button>
                      <label className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="h-5 w-5 mr-2" />
                        Tải file âm thanh
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  ) : isRecording ? (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Dừng ghi âm
                    </button>
                  ) : result ? (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleReset}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <RefreshCw className="h-5 w-5 mr-2" />
                        Phân tích mới
                      </button>
                      <button className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        <Download className="h-5 w-5 mr-2" />
                        Xuất báo cáo
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Instructions */}
                {(!isAnalyzing && !result) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Hướng dẫn ghi âm</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Nói rõ ràng vào micro</li>
                      <li>• Ghi âm ít nhất 10-15 giây</li>
                      <li>• Đảm bảo môi trường yên tĩnh</li>
                      <li>• Giữ khoảng cách micro ổn định</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Results */}
          {result && (
            <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-green-600" />
                  Kết quả phân tích
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Risk Assessment */}
                  <div className={`text-center p-4 rounded-lg border ${getRiskColor(result.confidence, result.prediction)}`}>
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">Mức độ nguy cơ</div>
                    <div className="text-2xl font-bold">{getRiskLevel(result.confidence, result.prediction)}</div>
                    <div className="text-xs">{getPredictionText(result.prediction)}</div>
                  </div>
                  {/* Confidence Score */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-blue-800">Độ tin cậy</div>
                    <div className="text-2xl font-bold text-blue-900">{result.confidence}</div>
                    <div className="text-xs text-blue-700">Độ tin cậy phân tích</div>
                  </div>
                  {/* Processing Time */}
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-green-800">Trạng thái</div>
                    <div className="text-2xl font-bold text-green-900">Hoàn thành</div>
                    <div className="text-xs text-green-700">Đã phân tích xong</div>
                  </div>
                </div>

                {/* Bảng chỉ số âm học */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Bảng chỉ số âm học</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border">Chỉ số âm học</th>
                          <th className="px-3 py-2 border">Giá trị</th>
                          <th className="px-3 py-2 border">Đánh giá</th>
                          <th className="px-3 py-2 border">Ngưỡng bình thường</th>
                          <th className="px-3 py-2 border">Giải thích</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* CODE CŨ */}
                        {/* {(() => {
                          const features = result.features || {};
                          // Định nghĩa logic đánh giá cho từng chỉ số
                          function getJitterLevel(val: number) {
                            if (val > 1.5) return { label: 'Nghi ngờ nặng', color: 'text-red-600' };
                            if (val > 1.0) return { label: 'Nghi ngờ trung bình', color: 'text-orange-500' };
                            if (val > 0.6) return { label: 'Nghi ngờ nhẹ', color: 'text-yellow-600' };
                            if (val >= 0.2) return { label: 'Bình thường', color: 'text-green-600' };
                            return { label: '-', color: '' };
                          }
                          function getShimmerLevel(val: number) {
                            if (val > 0.7) return { label: 'Nghi ngờ nặng', color: 'text-red-600' };
                            if (val > 0.5) return { label: 'Nghi ngờ trung bình', color: 'text-orange-500' };
                            if (val > 0.35) return { label: 'Nghi ngờ nhẹ', color: 'text-yellow-600' };
                            if (val >= 0.1) return { label: 'Bình thường', color: 'text-green-600' };
                            return { label: '-', color: '' };
                          }
                          function getHNRLevel(val: number) {
                            if (val < 10) return { label: 'Nghi ngờ nặng', color: 'text-red-600' };
                            if (val < 12) return { label: 'Nghi ngờ trung bình', color: 'text-orange-500' };
                            if (val < 15) return { label: 'Nghi ngờ nhẹ', color: 'text-yellow-600' };
                            if (val >= 15 && val <= 25) return { label: 'Bình thường', color: 'text-green-600' };
                            return { label: '-', color: '' };
                          }
                          function getF0Level(val: number) {
                            if (val < 15) return { label: 'Nghi ngờ nặng', color: 'text-red-600' };
                            if (val < 25) return { label: 'Nghi ngờ trung bình', color: 'text-orange-500' };
                            if (val < 40) return { label: 'Nghi ngờ nhẹ', color: 'text-yellow-600' };
                            if (val >= 40) return { label: 'Bình thường', color: 'text-green-600' };
                            return { label: '-', color: '' };
                          }
                          // Bảng chỉ số chính - lấy đúng key từ backend
                          const featureList = [
                            {
                              key: 'Jitter (%)',
                              value: features.jitter,
                              unit: '%',
                              level: getJitterLevel(typeof features.jitter === 'number' ? features.jitter : 0),
                              normal: '0.2 – 0.6%',
                              explain: 'Độ dao động tần số cơ bản của giọng nói.'
                            },
                            {
                              key: 'Shimmer (dB)',
                              value: features.shimmer,
                              unit: 'dB',
                              level: getShimmerLevel(typeof features.shimmer === 'number' ? features.shimmer : 0),
                              normal: '0.1 – 0.35 dB',
                              explain: 'Độ dao động biên độ của giọng nói.'
                            },
                            {
                              key: 'HNR (dB)',
                              value: features.hnr,
                              unit: 'dB',
                              level: getHNRLevel(typeof features.hnr === 'number' ? features.hnr : 0),
                              normal: '15 – 25 dB',
                              explain: 'Tỉ số tín hiệu/hệ số nhiễu.'
                            },
                            {
                              key: 'F0 dao động (Hz)',
                              value: (features.f0 ?? features.fo_range ?? features.mdvp_fo_hz) ?? '-',
                              unit: 'Hz',
                              level: getF0Level((features.f0 ?? features.fo_range ?? features.mdvp_fo_hz) ?? 0),
                              normal: '≥ 40 Hz',
                              explain: 'Độ dao động tần số cơ bản (F0) của giọng.'
                            },
                          ];
                          return featureList.map(row => (
                            <tr key={row.key}>
                              <td className="px-3 py-2 border font-medium">{row.key}</td>
                              <td className="px-3 py-2 border">{row.value !== undefined ? row.value : '-'}</td>
                              <td className={`px-3 py-2 border font-semibold ${row.level?.color}`}>{row.level?.label}</td>
                              <td className="px-3 py-2 border text-gray-500">{row.normal}</td>
                              <td className="px-3 py-2 border text-gray-500">{row.explain}</td>
                            </tr>
                          ));
                        })()} */}
                        {/* V3 Scientific Edition Critical Features */}
                        {result ? (
                          (() => {
                            const criticalFeatures = result?.critical_features;
                            const features = result?.features || {};
                            const getStatus = (value: number, min: number, max: number) => {
                              if (value >= min && value <= max) return { text: 'Bình thường', color: 'text-green-600' };
                              return { text: 'Bất thường', color: 'text-red-600' };
                            };
                            
                            return (
                              <>
                                {/* V3 Scientific Critical Features - Primary */}
                                {criticalFeatures?.jitter_local !== undefined && (
                                  <tr className="bg-blue-50">
                                    <td className="px-3 py-2 border font-medium text-blue-900">Jitter Local ⭐</td>
                                    <td className="px-3 py-2 border font-semibold">{(criticalFeatures.jitter_local * 100).toFixed(4)}%</td>
                                    <td className={`px-3 py-2 border font-semibold ${getStatus(criticalFeatures.jitter_local * 100, 0.2, 0.6).color}`}>
                                      {getStatus(criticalFeatures.jitter_local * 100, 0.2, 0.6).text}
                                    </td>
                                    <td className="px-3 py-2 border text-gray-500">0.2 – 0.6%</td>
                                    <td className="px-3 py-2 border text-blue-800">🔬 Critical: Frequency perturbation (V3 Scientific)</td>
                                  </tr>
                                )}
                                {criticalFeatures?.shimmer_local !== undefined && (
                                  <tr className="bg-blue-50">
                                    <td className="px-3 py-2 border font-medium text-blue-900">Shimmer Local ⭐</td>
                                    <td className="px-3 py-2 border font-semibold">{(criticalFeatures.shimmer_local * 100).toFixed(4)}%</td>
                                    <td className={`px-3 py-2 border font-semibold ${getStatus(criticalFeatures.shimmer_local * 100, 10, 35).color}`}>
                                      {getStatus(criticalFeatures.shimmer_local * 100, 10, 35).text}
                                    </td>
                                    <td className="px-3 py-2 border text-gray-500">10 – 35%</td>
                                    <td className="px-3 py-2 border text-blue-800">🔬 Critical: Amplitude perturbation (V3 Scientific)</td>
                                  </tr>
                                )}
                                {criticalFeatures?.hnr !== undefined && (
                                  <tr className="bg-blue-50">
                                    <td className="px-3 py-2 border font-medium text-blue-900">HNR ⭐</td>
                                    <td className="px-3 py-2 border font-semibold">{criticalFeatures.hnr.toFixed(2)} dB</td>
                                    <td className={`px-3 py-2 border font-semibold ${getStatus(criticalFeatures.hnr, 15, 25).color}`}>
                                      {getStatus(criticalFeatures.hnr, 15, 25).text}
                                    </td>
                                    <td className="px-3 py-2 border text-gray-500">15 – 25 dB</td>
                                    <td className="px-3 py-2 border text-blue-800">🔬 Critical: Harmonic-to-Noise Ratio (V3 Scientific)</td>
                                  </tr>
                                )}
                                
                                {/* Additional Features from Enhanced Model */}
                                {features.jitter_rel && (
                                  <tr>
                                    <td className="px-3 py-2 border font-medium">Jitter Relative</td>
                                    <td className="px-3 py-2 border">{(features.jitter_rel * 100).toFixed(4)}%</td>
                                    <td className={`px-3 py-2 border font-semibold ${getStatus(features.jitter_rel * 100, 0.2, 0.6).color}`}>
                                      {getStatus(features.jitter_rel * 100, 0.2, 0.6).text}
                                    </td>
                                    <td className="px-3 py-2 border text-gray-500">0.2 – 0.6%</td>
                                    <td className="px-3 py-2 border text-gray-500">Relative jitter measurement</td>
                                  </tr>
                                )}
                                {features.shimmer_rel && (
                                  <tr>
                                    <td className="px-3 py-2 border font-medium">Shimmer Relative</td>
                                    <td className="px-3 py-2 border">{(features.shimmer_rel * 100).toFixed(4)}%</td>
                                    <td className={`px-3 py-2 border font-semibold ${getStatus(features.shimmer_rel * 100, 10, 35).color}`}>
                                      {getStatus(features.shimmer_rel * 100, 10, 35).text}
                                    </td>
                                    <td className="px-3 py-2 border text-gray-500">10 – 35%</td>
                                    <td className="px-3 py-2 border text-gray-500">Relative shimmer measurement</td>
                                  </tr>
                                )}
                                {features.f0_mean && (
                                  <tr>
                                    <td className="px-3 py-2 border font-medium">F0 Mean (Hz)</td>
                                    <td className="px-3 py-2 border">{features.f0_mean.toFixed(2)} Hz</td>
                                    <td className={`px-3 py-2 border font-semibold ${getStatus(features.f0_mean, 80, 300).color}`}>
                                      {getStatus(features.f0_mean, 80, 300).text}
                                    </td>
                                    <td className="px-3 py-2 border text-gray-500">80 – 300 Hz</td>
                                    <td className="px-3 py-2 border text-gray-500">Mean fundamental frequency</td>
                                  </tr>
                                )}
                              </>
                            );
                          })()
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                  {/* Cảnh báo tổng hợp */}
                  {(() => {
                    const features = result.features || {};
                    const warnings = [];
                    if (features.f0 !== undefined && features.f0 < 40) warnings.push('F0 dao động thấp, giọng đơn điệu hoặc nghi ngờ bệnh.');
                    if (features.jitter !== undefined && features.jitter > 0.6) warnings.push('Jitter cao, có thể rối loạn phát âm.');
                    if (features.shimmer !== undefined && features.shimmer > 0.35) warnings.push('Shimmer cao, bất thường về cường độ.');
                    if (features.hnr !== undefined && features.hnr < 15) warnings.push('HNR thấp, tín hiệu nhiễu nhiều.');
                    return warnings.length > 0 ? (
                      <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
                        <div className="font-semibold mb-1">Cảnh báo bất thường:</div>
                        <ul className="list-disc pl-5">
                          {warnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    ) : null;
                  })()}
                </div>

                {/* Detailed Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Chi tiết phân tích</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Tình trạng</div>
                      <div className="text-lg font-semibold text-gray-900 capitalize">{result.prediction === 1 ? 'Mắc bệnh Parkinson' : 'Khỏe mạnh'}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Chẩn đoán</div>
                      <div className="text-lg text-gray-900">
                        {result.diagnosis || (result.prediction === 1 ? 'Phát hiện dấu hiệu bệnh Parkinson' : 'Không phát hiện dấu hiệu Parkinson')}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-2">Xác suất</div>
                      <div className="text-lg text-gray-900">
                        {typeof result.probability === 'number' 
                          ? `${(result.probability * 100).toFixed(2)}%`
                          : '-'}
                      </div>
                    </div>
                    {result.model_info && (
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-900 mb-3">🧠 V3 Scientific Edition Model Info</div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="font-semibold text-blue-800">Version:</span> <span className="text-blue-900">{result.model_info.version}</span></div>
                          <div><span className="font-semibold text-blue-800">Algorithm:</span> <span className="text-blue-900">{result.model_info.algorithm}</span></div>
                          <div><span className="font-semibold text-blue-800">Accuracy:</span> <span className="text-green-700 font-bold">{(result.model_info.accuracy * 100).toFixed(1)}%</span></div>
                          <div><span className="font-semibold text-blue-800">Features:</span> <span className="text-blue-900">{result.model_info.features}</span></div>
                          {result.model_info.auc_score && (
                            <div><span className="font-semibold text-blue-800">AUC Score:</span> <span className="text-purple-700 font-bold">{result.model_info.auc_score.toFixed(3)}</span></div>
                          )}
                          {result.model_info.feature_reduction && (
                            <div className="col-span-2"><span className="font-semibold text-blue-800">Reduction:</span> <span className="text-orange-700">{result.model_info.feature_reduction}</span></div>
                          )}
                          {result.model_info.critical_features_included && (
                            <div className="col-span-2">
                              <span className="font-semibold text-blue-800">Critical Features:</span> 
                              <span className="text-purple-700 ml-1">{result.model_info.critical_features_included.join(', ')}</span>
                            </div>
                          )}
                          <div className="col-span-2">
                            <span className="font-semibold text-blue-800">Jitter/Shimmer:</span> 
                            <span className={`ml-1 px-2 py-1 rounded text-xs font-bold ${
                              result.model_info.includes_jitter_shimmer 
                                ? 'bg-green-200 text-green-800' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {result.model_info.includes_jitter_shimmer ? '✅ Included' : '❌ Not Included'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Statistics</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Analyses</span>
                <span className="text-lg font-semibold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High Risk</span>
                <span className="text-lg font-semibold text-red-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Normal</span>
                <span className="text-lg font-semibold text-green-600">18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Accuracy</span>
                <span className="text-lg font-semibold text-blue-600">91%</span>
              </div>
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
            </div>
            <div className="p-6 space-y-3">
              {[
                { id: 'A001', time: '2 min ago', risk: 'Low', confidence: '94%' },
                { id: 'A002', time: '15 min ago', risk: 'High', confidence: '87%' },
                { id: 'A003', time: '1 hour ago', risk: 'Medium', confidence: '91%' },
              ].map((analysis) => (
                <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">#{analysis.id}</div>
                    <div className="text-xs text-gray-500">{analysis.time}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      analysis.risk === 'High' 
                        ? 'bg-red-100 text-red-800'
                        : analysis.risk === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {analysis.risk}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{analysis.confidence}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* V3 Scientific Model Info */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 shadow-sm">
            <div className="p-6 border-b border-blue-100">
              <h3 className="text-lg font-semibold text-blue-900">🧠 V3 Scientific AI Model</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Model Version</span>
                <span className="text-sm font-medium text-blue-900">V3 Scientific Edition</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Features</span>
                <span className="text-sm font-medium text-purple-700">87 (from 768)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Accuracy</span>
                <span className="text-sm font-medium text-green-600 font-bold">100%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Critical Features</span>
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">Jitter, Shimmer, HNR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Reduction</span>
                <span className="text-sm font-medium text-orange-600">88.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">Last Update</span>
                <span className="text-sm font-medium text-blue-900">Nov 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
