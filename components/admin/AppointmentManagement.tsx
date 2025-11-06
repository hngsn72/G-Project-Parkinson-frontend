'use client';

import { useState, useEffect } from 'react';
import { HospitalService } from '@/services/hospital.service';
import type { Appointment } from '@/services/hospital.service';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  CheckCircle,
  XCircle,
  Search,
  Eye,
  AlertCircle
} from 'lucide-react';

export default function AppointmentManagement() {
  const { isAdmin } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (isAdmin()) {
      fetchAppointments();
    }
  }, [isAdmin]); // Remove statusFilter, will call manually

  // Call when filter changes
  useEffect(() => {
    if (isAdmin() && statusFilter) {
      fetchAppointments();
    }
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const params: { page: number; limit: number; status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show' } = { page: 1, limit: 50 };
      if (statusFilter !== 'all') {
        params.status = statusFilter as 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
      }
      
      const response = await HospitalService.getAllAppointments(params);
      if (response.success && response.data) {
        setAppointments(response.data.data);
      }
    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const response = await HospitalService.confirmAppointment(appointmentId);
      
      if (response.success) {
        await fetchAppointments();
        alert('Xác nhận lịch hẹn thành công!');
      } else {
        setError(response.error || 'Không thể xác nhận lịch hẹn');
      }
    } catch (error) {
      console.error('Confirm appointment error:', error);
      setError('Có lỗi xảy ra khi xác nhận lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string, reason?: string) => {
    try {
      setLoading(true);
      const response = await HospitalService.cancelAppointment(appointmentId, reason);
      
      if (response.success) {
        await fetchAppointments();
        alert('Hủy lịch hẹn thành công!');
      } else {
        setError(response.error || 'Không thể hủy lịch hẹn');
      }
    } catch (error) {
      console.error('Cancel appointment error:', error);
      setError('Có lỗi xảy ra khi hủy lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
            <Clock className="h-3 w-3 mr-1" />
            Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã xác nhận
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 border border-red-200 rounded-full">
            <XCircle className="h-3 w-3 mr-1" />
            Đã hủy
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
            <AlertCircle className="h-3 w-3 mr-1" />
            Không đến
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01 ${timeString}`).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patient?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment.patient?.phone?.includes(searchQuery) ||
    appointment.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Truy cập bị từ chối
          </h1>
          <p className="text-gray-600">
            Bạn không có quyền truy cập trang quản lý lịch hẹn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Quản lý Lịch hẹn
          </h2>
          <p className="text-gray-600">Xem và xử lý tất cả lịch hẹn trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bệnh nhân, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="completed">Hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-6 animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch hẹn nào</h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== 'all' 
              ? 'Không tìm thấy lịch hẹn nào phù hợp với bộ lọc.'
              : 'Chưa có lịch hẹn nào trong hệ thống.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <div key={appointment.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusBadge(appointment.status)}
                    {/* Remove urgency since it's not in the interface */}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {appointment.patient?.display_name || 'Không rõ tên'}
                  </h3>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleConfirmAppointment(appointment.id.toString())}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                        title="Xác nhận lịch hẹn"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
                          if (reason !== null) { // User didn't cancel the prompt
                            handleCancelAppointment(appointment.id.toString(), reason);
                          }
                        }}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                        title="Hủy lịch hẹn"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(appointment.appointment_date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatTime(appointment.appointment_time)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{appointment.patient?.phone || 'Không có'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {appointment.doctor?.display_name || 'Chưa phân bác sĩ'}
                  </span>
                </div>
              </div>

              {appointment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{appointment.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Chi tiết lịch hẹn</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex gap-3">
                  {getStatusBadge(selectedAppointment.status)}
                </div>

                {/* Patient Info */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Thông tin bệnh nhân</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Họ tên:</span>
                      <p className="font-medium">{selectedAppointment.patient?.display_name || 'Không rõ'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedAppointment.patient?.email || 'Không có'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Số điện thoại:</span>
                      <p className="font-medium">{selectedAppointment.patient?.phone || 'Không có'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Mã bệnh nhân:</span>
                      <p className="font-medium">{selectedAppointment.patient_id}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Thông tin lịch hẹn</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Ngày hẹn:</span>
                      <p className="font-medium">{formatDate(selectedAppointment.appointment_date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Giờ hẹn:</span>
                      <p className="font-medium">{formatTime(selectedAppointment.appointment_time)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Khung giờ:</span>
                      <p className="font-medium">
                        {selectedAppointment.time_slot === 'morning' ? 'Sáng' :
                         selectedAppointment.time_slot === 'afternoon' ? 'Chiều' : 'Tối'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Ngày tạo:</span>
                      <p className="font-medium">{formatDate(selectedAppointment.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Ghi chú</h4>
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedAppointment.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        handleConfirmAppointment(selectedAppointment.id.toString());
                        setSelectedAppointment(null);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Xác nhận lịch hẹn
                    </button>
                    
                    <button
                      onClick={() => {
                        const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
                        if (reason !== null) {
                          handleCancelAppointment(selectedAppointment.id.toString(), reason);
                          setSelectedAppointment(null);
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Hủy lịch hẹn
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}