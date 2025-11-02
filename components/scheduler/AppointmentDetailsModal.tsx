"use client";
import { useState } from "react";
import { X, Calendar, Clock, User, Hospital, FileText, AlertCircle } from "lucide-react";
import { AppointmentData } from "../scheduler/SchedulerPage";

interface AppointmentDetailsModalProps {
  appointment: AppointmentData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (id: number, notes?: string) => void;
  onReject?: (id: number, reason?: string) => void;
  onComplete?: (id: number, notes?: string) => void;
  userRole?: string;
}

export default function AppointmentDetailsModal({
  appointment,
  isOpen,
  onClose,
  onConfirm,
  onReject,
  onComplete,
  userRole
}: AppointmentDetailsModalProps) {
  const [notes, setNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !appointment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Chờ xác nhận';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getTimeSlotText = (timeSlot: string) => {
    switch (timeSlot) {
      case 'morning': return 'Buổi sáng (8:00 - 12:00)';
      case 'afternoon': return 'Buổi chiều (13:00 - 17:00)';
      case 'evening': return 'Buổi tối (18:00 - 21:00)';
      default: return timeSlot;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(appointment.id, notes);
      onClose();
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(appointment.id, rejectReason);
      onClose();
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete(appointment.id, notes);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Chi tiết lịch hẹn #{appointment.id}
          </h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
            {getStatusText(appointment.status)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Appointment Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Ngày khám</p>
                <p className="font-medium">{appointment.appointment_date}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Thời gian</p>
                <p className="font-medium">{getTimeSlotText(appointment.time_slot)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Hospital className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Bệnh viện</p>
                <p className="font-medium">{appointment.hospital_name}</p>
              </div>
            </div>
          </div>

          {/* People Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Bác sĩ</p>
                <p className="font-medium">{appointment.doctor_name}</p>
              </div>
            </div>

            {userRole === 'admin' && (
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Bệnh nhân</p>
                  <p className="font-medium">{appointment.patient_name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Symptoms and Notes */}
        {(appointment.symptoms || appointment.notes) && (
          <div className="mb-6 space-y-4">
            {appointment.symptoms && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Triệu chứng:</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{appointment.symptoms}</p>
              </div>
            )}

            {appointment.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ghi chú:</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{appointment.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Doctor Actions */}
        {userRole === 'doctor' && appointment.status === 'pending' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="font-medium text-yellow-800">Yêu cầu xác nhận</h3>
            </div>
            
            {!showRejectForm ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn):
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Thêm ghi chú cho bệnh nhân..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Xác nhận lịch hẹn
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Từ chối
                  </button>
                </div>
              </>
            ) : (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do từ chối *:
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do từ chối lịch hẹn..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Xác nhận từ chối
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Complete Action */}
        {userRole === 'doctor' && appointment.status === 'confirmed' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-medium text-blue-800">Hoàn thành khám bệnh</h3>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ghi chú kết quả khám (tùy chọn):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú kết quả khám, hướng dẫn điều trị..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Hoàn thành khám bệnh
            </button>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}