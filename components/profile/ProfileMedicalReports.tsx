'use client';

import { useState, useEffect } from 'react';
import { MedicalReportService, type MedicalReport } from '@/services/medical-report.service';
import { 
  FileText, 
  Calendar, 
  User, 
  AlertCircle, 
  Eye, 
  X,
  Loader2,
  Download,
  File
} from 'lucide-react';

interface ProfileMedicalReportsProps {
  profileId?: number;
  patientId: string;
  profileName: string;
}

export default function ProfileMedicalReports({ profileId, patientId, profileName }: ProfileMedicalReportsProps) {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadReports = async () => {
    console.log('=== ProfileMedicalReports loadReports ===');
    console.log('patientId:', patientId);
    console.log('profileId:', profileId);
    console.log('profileName:', profileName);
    
    setLoading(true);
    setError(null);

    try {
      // Always use patient reports endpoint (backend doesn't expose profile-specific endpoint yet)
      console.log('Calling getPatientReports with:', { patientId, limit: 50, offset: 0 });
      const response = await MedicalReportService.getPatientReports(patientId, 50, 0);
      console.log('Response:', response);

      if (response.success && response.data) {
        let allReports = response.data.data || [];
        console.log('All reports before filter:', allReports.length);
        
        // Filter by profile on frontend if profileId is provided
        if (profileId) {
          allReports = allReports.filter(report => report.patient_profile_id === profileId);
          console.log('Filtered by profileId:', allReports.length);
        } else {
          // For personal profile (no profileId), show reports without patient_profile_id
          allReports = allReports.filter(report => !report.patient_profile_id);
          console.log('Filtered for personal (no profileId):', allReports.length);
        }
        
        setReports(allReports);
      } else {
        console.error('Response not success:', response.error);
        setError(response.error || 'Không thể tải kết quả khám');
      }
    } catch (err) {
      console.error('Load reports error:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('=== ProfileMedicalReports useEffect ===');
    console.log('patientId:', patientId);
    console.log('Will call loadReports:', !!patientId);
    
    if (patientId) {
      loadReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, patientId]);

  const handleViewReport = async (report: MedicalReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);

    // Mark as viewed if not already
    if (report.status === 'sent' && !report.viewed_at) {
      try {
        await MedicalReportService.markAsViewed(report.id);
        loadReports(); // Reload to update viewed status
      } catch (error) {
        console.error('Mark as viewed error:', error);
      }
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      mild: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      severe: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
      normal: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      mild: 'Nhẹ',
      moderate: 'Trung bình',
      severe: 'Nặng',
      critical: 'Nguy kịch',
      normal: 'Bình thường'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${badges[severity as keyof typeof badges] || badges.normal}`}>
        {labels[severity as keyof typeof labels] || severity}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải kết quả khám...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Chưa có kết quả khám nào cho {profileName}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" />
        Kết quả khám - {profileName}
        <span className="text-sm font-normal text-gray-500">({reports.length} lần khám)</span>
      </h3>

      <div className="space-y-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewReport(report)}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-gray-900">
                    Kết quả khám #{report.id}
                  </span>
                  {getSeverityBadge(report.severity)}
                  {report.status === 'sent' && !report.viewed_at && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                      Mới
                    </span>
                  )}
                  {report.pdf_file_path && (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-600 flex items-center gap-1">
                      <File className="h-3 w-3" />
                      PDF
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  {report.appointment_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(report.appointment_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                  {report.doctor_name && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{report.doctor_name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    <span className="font-medium">Chẩn đoán:</span> {report.diagnosis}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewReport(report);
                }}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                title="Xem chi tiết"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>

            {report.viewed_at && (
              <div className="text-xs text-gray-500 mt-2">
                Đã xem: {new Date(report.viewed_at).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Kết quả khám #{selectedReport.id}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {selectedReport.appointment_date && new Date(selectedReport.appointment_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Doctor & Severity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Bác sĩ:</span>
                  <span className="text-gray-700">{selectedReport.doctor_name}</span>
                </div>
                {getSeverityBadge(selectedReport.severity)}
              </div>

              {/* Chief Complaint */}
              {selectedReport.chief_complaint && (
                <div className="border-l-4 border-yellow-500 pl-4 bg-yellow-50 p-3 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">Lý do khám</h4>
                  <p className="text-gray-700">{selectedReport.chief_complaint}</p>
                </div>
              )}

              {/* Diagnosis */}
              <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-3 rounded">
                <h4 className="font-semibold text-gray-900 mb-2">Chẩn đoán</h4>
                <p className="text-gray-700">{selectedReport.diagnosis}</p>
                {selectedReport.diagnosis_code && (
                  <p className="text-sm text-gray-600 mt-1">Mã ICD-10: {selectedReport.diagnosis_code}</p>
                )}
              </div>

              {/* Clinical Findings */}
              {selectedReport.clinical_findings && (
                <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-3 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">Kết quả thăm khám</h4>
                  <p className="text-gray-700 whitespace-pre-line">{selectedReport.clinical_findings}</p>
                </div>
              )}

              {/* Lab & Imaging Results */}
              {(selectedReport.lab_results || selectedReport.imaging_results) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedReport.lab_results && (
                    <div className="border-l-4 border-purple-500 pl-4 bg-purple-50 p-3 rounded">
                      <h4 className="font-semibold text-gray-900 mb-2">Xét nghiệm</h4>
                      <p className="text-gray-700 whitespace-pre-line text-sm">{selectedReport.lab_results}</p>
                    </div>
                  )}
                  {selectedReport.imaging_results && (
                    <div className="border-l-4 border-indigo-500 pl-4 bg-indigo-50 p-3 rounded">
                      <h4 className="font-semibold text-gray-900 mb-2">Hình ảnh</h4>
                      <p className="text-gray-700 whitespace-pre-line text-sm">{selectedReport.imaging_results}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Prescription */}
              <div className="border-l-4 border-red-500 pl-4 bg-red-50 p-3 rounded">
                <h4 className="font-semibold text-gray-900 mb-2">Đơn thuốc</h4>
                <p className="text-gray-700 whitespace-pre-line">{selectedReport.prescription}</p>
              </div>

              {/* Treatment Plan */}
              {selectedReport.treatment_plan && (
                <div className="border-l-4 border-orange-500 pl-4 bg-orange-50 p-3 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">Kế hoạch điều trị</h4>
                  <p className="text-gray-700 whitespace-pre-line">{selectedReport.treatment_plan}</p>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations && (
                <div className="border-l-4 border-teal-500 pl-4 bg-teal-50 p-3 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">Khuyến nghị</h4>
                  <p className="text-gray-700 whitespace-pre-line">{selectedReport.recommendations}</p>
                </div>
              )}

              {/* Follow-up */}
              {selectedReport.follow_up_required && (
                <div className="border-l-4 border-pink-500 pl-4 bg-pink-50 p-3 rounded">
                  <h4 className="font-semibold text-gray-900 mb-2">Tái khám</h4>
                  {selectedReport.follow_up_date && (
                    <p className="text-gray-700">
                      Ngày tái khám: {new Date(selectedReport.follow_up_date).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                  {selectedReport.follow_up_notes && (
                    <p className="text-gray-700 mt-2">{selectedReport.follow_up_notes}</p>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="border-t pt-4 text-sm text-gray-600 space-y-1">
                <p>Tạo lúc: {new Date(selectedReport.created_at).toLocaleString('vi-VN')}</p>
                {selectedReport.sent_at && (
                  <p>Gửi lúc: {new Date(selectedReport.sent_at).toLocaleString('vi-VN')}</p>
                )}
                {selectedReport.viewed_at && (
                  <p>Xem lúc: {new Date(selectedReport.viewed_at).toLocaleString('vi-VN')}</p>
                )}
              </div>

              {/* PDF Attachment */}
              {selectedReport.pdf_file_path && (
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedReport.pdf_file_name}</p>
                        <p className="text-sm text-gray-600">
                          {selectedReport.pdf_file_size && `${(selectedReport.pdf_file_size / 1024).toFixed(0)} KB`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => MedicalReportService.downloadPDF(selectedReport.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Tải xuống PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
