'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, Phone, FileText,
  CheckCircle, XCircle, AlertCircle, Eye, Ban, X
} from 'lucide-react';
import { Appointment, AppointmentService } from '@/services/appointment.service';
import { ACCESSIBILITY } from '@/constants/accessibility';
import { useAuth } from '@/hooks/useAuth';

export default function MyAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await AppointmentService.getMyAppointments();
      
      if (response.success && response.data) {
        const allAppointments = response.data.data || [];
        
        // Filter based on active tab
        if (activeTab === 'upcoming') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          setAppointments(allAppointments.filter(apt => {
            const aptDate = new Date(apt.appointment_date);
            aptDate.setHours(0, 0, 0, 0);
            return (apt.status === 'pending' || apt.status === 'confirmed') && aptDate >= today;
          }));
        } else if (activeTab === 'completed') {
        setAppointments(allAppointments.filter(apt => apt.status === 'completed'));
        } else {
          setAppointments(allAppointments.filter(apt => 
            apt.status === 'cancelled' || apt.status === 'no_show'
          ));
        }
      }
    } catch {
      console.error('Error loading appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy lịch');
      return;
    }
    
    // Check if appointment can be cancelled (at least 2 hours before)
    const appointmentDateTime = new Date(`${selectedAppointment.appointment_date}T${selectedAppointment.time_slot || '00:00'}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 2) {
      alert('Không thể hủy lịch hẹn trong vòng 2 giờ trước giờ khám. Vui lòng liên hệ bệnh viện.');
      return;
    }
    
    try {
      const result = await AppointmentService.updateAppointmentStatus(
        selectedAppointment.id,
        'cancelled',
        cancelReason
      );
      
      if (result.success) {
        alert('Đã hủy lịch hẹn thành công');
        setShowCancelModal(false);
        setCancelReason('');
        setSelectedAppointment(null);
        loadAppointments();
      } else {
        alert('Lỗi: ' + (result.error || 'Không thể hủy lịch hẹn'));
      }
    } catch {
      alert('Có lỗi xảy ra khi hủy lịch hẹn');
    }
  };

  const handleDetailClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Chờ xác nhận' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Đã xác nhận' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Hoàn thành' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Đã hủy' },
      no_show: { color: 'bg-gray-100 text-gray-800', icon: Ban, text: 'Không đến' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString('vi-VN', { month: 'short' }),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString('vi-VN', { weekday: 'short' })
    };
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 pb-24">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cần đăng nhập</h2>
          <p className="text-gray-600">Vui lòng đăng nhập để xem lịch hẹn của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch hẹn của tôi</h1>
        <p className="text-gray-600">Quản lý và theo dõi các cuộc hẹn khám bệnh</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
          >
            <Calendar className="inline w-5 h-5 mr-2" />
            Sắp tới
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'completed'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
          >
            <CheckCircle className="inline w-5 h-5 mr-2" />
            Hoàn thành
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'cancelled'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
          >
            <XCircle className="inline w-5 h-5 mr-2" />
            Đã hủy
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lịch hẹn</h3>
          <p className="text-gray-600">
            {activeTab === 'upcoming' && 'Bạn chưa có lịch hẹn nào sắp tới'}
            {activeTab === 'completed' && 'Bạn chưa hoàn thành lịch hẹn nào'}
            {activeTab === 'cancelled' && 'Bạn chưa hủy lịch hẹn nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appointment) => {
            const dateInfo = formatDate(appointment.appointment_date);
            
            return (
              <div
                key={appointment.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Date Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-5xl font-bold">{dateInfo.day}</div>
                      <div className="text-sm opacity-90">
                        {dateInfo.month} {dateInfo.year}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <Clock className="w-5 h-5" />
                        {appointment.time_slot || 'Chưa xác định'}
                      </div>
                      <div className="text-sm opacity-90">{dateInfo.weekday}</div>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="p-4 space-y-3">
                  {/* Hospital */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{appointment.hospital_name || 'Bệnh viện'}</div>
                    </div>
                  </div>

                  {/* Doctor */}
                  <div className="flex items-start gap-2">
                    <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{appointment.doctor_name || 'Bác sĩ'}</div>
                    </div>
                  </div>

                  {/* Patient Info */}
                  {appointment.patient_name && (
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm text-gray-600">{appointment.patient_name}</div>
                        {appointment.patient_phone && (
                          <div className="text-sm text-gray-500">{appointment.patient_phone}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {appointment.symptoms && (
                    <div className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-medium">Triệu chứng:</span> {appointment.symptoms}
                    </div>
                  )}

                  {/* Status */}
                  <div className="pt-2">
                    {getStatusBadge(appointment.status)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleDetailClick(appointment)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                    
                    {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
                      >
                        <XCircle className="w-4 h-4" />
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Hủy lịch hẹn</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Bạn có chắc chắn muốn hủy lịch hẹn này?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-medium">{selectedAppointment.hospital_name}</div>
                <div className="text-gray-600">
                  {formatDate(selectedAppointment.appointment_date).day} {formatDate(selectedAppointment.appointment_date).month} - {selectedAppointment.time_slot}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Vui lòng cho biết lý do hủy lịch hẹn..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
              >
                Đóng
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={!cancelReason.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Chi tiết lịch hẹn</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Trạng thái</label>
                {getStatusBadge(selectedAppointment.status)}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ngày khám</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedAppointment.appointment_date}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Giờ khám</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{selectedAppointment.time_slot || 'Chưa xác định'}</span>
                  </div>
                </div>
              </div>

              {/* Hospital */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bệnh viện</label>
                <div className="flex items-start gap-2 text-gray-900">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="font-medium">{selectedAppointment.hospital_name}</span>
                </div>
              </div>

              {/* Doctor */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Bác sĩ</label>
                <div className="flex items-start gap-2 text-gray-900">
                  <User className="w-4 h-4 text-gray-400 mt-0.5" />
                  <span className="font-medium">{selectedAppointment.doctor_name}</span>
                </div>
              </div>

              {/* Patient Info */}
              {selectedAppointment.patient_name && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Thông tin bệnh nhân</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Họ tên</label>
                      <div className="text-gray-900">{selectedAppointment.patient_name}</div>
                    </div>
                    {selectedAppointment.patient_phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Số điện thoại</label>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {selectedAppointment.patient_phone}
                        </div>
                      </div>
                    )}
                    {selectedAppointment.patient_age && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Tuổi</label>
                        <div className="text-gray-900">{selectedAppointment.patient_age}</div>
                      </div>
                    )}
                    {selectedAppointment.patient_gender && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Giới tính</label>
                        <div className="text-gray-900">
                          {selectedAppointment.patient_gender === 'male' ? 'Nam' : 'Nữ'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Symptoms & Notes */}
              {(selectedAppointment.symptoms || selectedAppointment.notes) && (
                <div className="border-t pt-4">
                  {selectedAppointment.symptoms && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Triệu chứng</label>
                      <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        {selectedAppointment.symptoms}
                      </div>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Ghi chú</label>
                      <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        {selectedAppointment.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Info */}
              {selectedAppointment.status === 'cancelled' && selectedAppointment.cancellation_reason && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Lý do hủy</label>
                  <div className="text-gray-900 bg-red-50 rounded-lg p-3">
                    {selectedAppointment.cancellation_reason}
                  </div>
                </div>
              )}

              {/* Diagnosis (if completed) */}
              {selectedAppointment.status === 'completed' && (
                <div className="border-t pt-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Kết quả khám</h4>
                  {selectedAppointment.diagnosis_notes && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Chẩn đoán</label>
                      <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        {selectedAppointment.diagnosis_notes}
                      </div>
                    </div>
                  )}
                  {selectedAppointment.prescription && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Đơn thuốc</label>
                      <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                        {selectedAppointment.prescription}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
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
