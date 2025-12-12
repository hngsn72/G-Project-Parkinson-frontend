'use client';

import { useState } from 'react';
import { MedicalReportService, type MedicalReportRequest, type MedicalReport } from '@/services/medical-report.service';
import type { Appointment } from '@/services/hospital.service';
import { 
  X, 
  FileText, 
  AlertCircle, 
  Save, 
  Send, 
  Loader2,
  File
} from 'lucide-react';

interface MedicalReportModalProps {
  appointment: Appointment;
  existingReport?: MedicalReport | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MedicalReportModal({ appointment, existingReport, onClose, onSuccess }: MedicalReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<MedicalReportRequest>({
    appointment_id: appointment.id,
    patient_profile_id: appointment.patient_profile_id || undefined,
    patient_id: appointment.patient_id,
    chief_complaint: existingReport?.chief_complaint || appointment.symptoms || '',
    diagnosis: existingReport?.diagnosis || '',
    diagnosis_code: existingReport?.diagnosis_code || '',
    clinical_findings: existingReport?.clinical_findings || '',
    lab_results: existingReport?.lab_results || '',
    imaging_results: existingReport?.imaging_results || '',
    prescription: existingReport?.prescription || '',
    treatment_plan: existingReport?.treatment_plan || '',
    recommendations: existingReport?.recommendations || '',
    follow_up_required: existingReport?.follow_up_required || false,
    follow_up_date: existingReport?.follow_up_date || '',
    follow_up_notes: existingReport?.follow_up_notes || '',
    severity: 'normal'
  });

  const handleInputChange = (field: keyof MedicalReportRequest, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.diagnosis.trim()) {
      setError('Chẩn đoán là bắt buộc');
      return false;
    }
    if (!formData.prescription.trim()) {
      setError('Đơn thuốc là bắt buộc');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await MedicalReportService.createReport(formData);
      if (response.success) {
        alert('Đã lưu nháp kết quả khám!');
        onSuccess();
      } else {
        setError(response.error || 'Không thể lưu kết quả');
      }
    } catch (err) {
      console.error('Save draft error:', err);
      setError('Có lỗi xảy ra khi lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToPatient = async () => {
    if (!validateForm()) return;

    const confirmMessage = existingReport 
      ? 'Cập nhật kết quả khám cho bệnh nhân?' 
      : 'Gửi kết quả khám cho bệnh nhân? Kết quả sẽ không thể chỉnh sửa sau khi gửi.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let reportId: number;

      if (existingReport) {
        // Update existing report
        const updateResponse = await MedicalReportService.updateReport(existingReport.id, formData);
        if (updateResponse.success && updateResponse.data && typeof updateResponse.data === 'object' && 'id' in updateResponse.data) {
          reportId = (updateResponse.data as { id: number }).id;
        } else {
          setError(updateResponse.error || 'Không thể cập nhật kết quả');
          return;
        }
      } else {
        // Create new report
        const createResponse = await MedicalReportService.createReport(formData);
        if (createResponse.success && createResponse.data && typeof createResponse.data === 'object' && 'id' in createResponse.data) {
          reportId = (createResponse.data as { id: number }).id;
        } else {
          setError(createResponse.error || 'Không thể tạo kết quả');
          return;
        }
      }
      
      // Upload PDF if provided
      if (pdfFile) {
        const uploadResponse = await MedicalReportService.uploadPDF(reportId, pdfFile);
        if (!uploadResponse.success) {
          console.error('PDF upload failed:', uploadResponse.error);
          // Continue anyway - the report is created
        }
      }
      
      // Send to patient (only if not already sent)
      if (!existingReport || existingReport.status !== 'sent') {
        const sendResponse = await MedicalReportService.sendReport(reportId);
        if (sendResponse.success) {
          alert(existingReport ? 'Đã cập nhật kết quả khám thành công!' : 'Đã gửi kết quả khám cho bệnh nhân thành công!');
          onSuccess();
        } else {
          setError(sendResponse.error || 'Không thể gửi kết quả');
        }
      } else {
        alert('Đã cập nhật kết quả khám thành công!');
        onSuccess();
      }
    } catch (err) {
      console.error('Send error:', err);
      setError('Có lỗi xảy ra khi gửi kết quả');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setError('Chỉ chấp nhận file PDF');
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Tối đa 10MB');
        return;
      }
      setPdfFile(file);
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {existingReport ? 'Sửa kết quả khám bệnh' : 'Kết quả khám bệnh'}
              </h2>
              <p className="text-sm text-gray-600">
                Bệnh nhân: {appointment.patient_name} | Ngày khám: {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do khám <span className="text-gray-400">(từ lịch hẹn)</span>
            </label>
            <textarea
              value={formData.chief_complaint}
              onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Triệu chứng, lý do khám..."
            />
          </div>

          {/* Diagnosis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chẩn đoán <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                rows={3}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kết quả chẩn đoán chi tiết..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã chẩn đoán (ICD-10)
              </label>
              <input
                type="text"
                value={formData.diagnosis_code}
                onChange={(e) => handleInputChange('diagnosis_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="VD: G20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mức độ
              </label>
              <select
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="normal">Bình thường</option>
                <option value="mild">Nhẹ</option>
                <option value="moderate">Trung bình</option>
                <option value="severe">Nặng</option>
                <option value="critical">Nguy kịch</option>
              </select>
            </div>
          </div>

          {/* Clinical Findings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kết quả thăm khám lâm sàng
            </label>
            <textarea
              value={formData.clinical_findings}
              onChange={(e) => handleInputChange('clinical_findings', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Các dấu hiệu lâm sàng, triệu chứng quan sát..."
            />
          </div>

          {/* Lab & Imaging Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kết quả xét nghiệm
              </label>
              <textarea
                value={formData.lab_results}
                onChange={(e) => handleInputChange('lab_results', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Kết quả các xét nghiệm..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kết quả hình ảnh (X-quang, CT, MRI...)
              </label>
              <textarea
                value={formData.imaging_results}
                onChange={(e) => handleInputChange('imaging_results', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mô tả kết quả chụp chiếu..."
              />
            </div>
          </div>

          {/* Prescription */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Đơn thuốc <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.prescription}
              onChange={(e) => handleInputChange('prescription', e.target.value)}
              rows={4}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Danh sách thuốc, liều lượng, cách dùng..."
            />
          </div>

          {/* PDF Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Tải lên file PDF kết quả (tùy chọn)
              </div>
              <span className="text-xs text-gray-500 font-normal">
                File PDF chứa kết quả xét nghiệm, hình ảnh hoặc báo cáo chi tiết (Tối đa 10MB)
              </span>
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {pdfFile && (
              <div className="mt-2 text-sm text-green-600 flex items-center gap-2">
                <File className="h-4 w-4" />
                {pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)
              </div>
            )}
          </div>

          {/* Treatment Plan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kế hoạch điều trị
            </label>
            <textarea
              value={formData.treatment_plan}
              onChange={(e) => handleInputChange('treatment_plan', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Kế hoạch điều trị dài hạn..."
            />
          </div>

          {/* Recommendations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khuyến nghị
            </label>
            <textarea
              value={formData.recommendations}
              onChange={(e) => handleInputChange('recommendations', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Lời khuyên cho bệnh nhân..."
            />
          </div>

          {/* Follow-up */}
          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="follow_up"
                checked={formData.follow_up_required}
                onChange={(e) => handleInputChange('follow_up_required', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="follow_up" className="ml-2 text-sm font-medium text-gray-700">
                Cần tái khám
              </label>
            </div>

            {formData.follow_up_required && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày tái khám
                  </label>
                  <input
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú tái khám
                  </label>
                  <textarea
                    value={formData.follow_up_notes}
                    onChange={(e) => handleInputChange('follow_up_notes', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Lý do, mục đích tái khám..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu nháp
          </button>
          <button
            onClick={handleSendToPatient}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {existingReport ? 'Cập nhật kết quả' : 'Gửi cho bệnh nhân'}
          </button>
        </div>
      </div>
    </div>
  );
}
