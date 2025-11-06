'use client';

import { useState, useEffect, useCallback } from 'react';
import { HospitalService } from '@/services/hospital.service';
import type { Appointment } from '@/services/hospital.service';
import { useAuth } from '@/hooks/useAuth';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Plus,
  RefreshCw,
  Building2
} from 'lucide-react';

export default function PatientAppointments() {
  const { user, isPatient } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0
  });

  const fetchPatientAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HospitalService.getPatientAppointments();
      
      if (response.success && response.data) {
        let filteredData = response.data;
        
        // Filter by status
        if (statusFilter !== 'all') {
          filteredData = filteredData.filter(apt => apt.status === statusFilter);
        }
        
        // Sort by date (newest first)
        filteredData.sort((a, b) => 
          new Date(b.appointment_date + ' ' + b.appointment_time).getTime() - 
          new Date(a.appointment_date + ' ' + a.appointment_time).getTime()
        );
        
        setAppointments(filteredData);
        
        // Calculate stats
        const totalAppointments = response.data.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingAppointments = response.data.filter(apt => {
          const aptDate = new Date(apt.appointment_date + ' ' + apt.appointment_time);
          return aptDate >= today && apt.status !== 'cancelled' && apt.status !== 'completed';
        });
        
        const completedAppointments = response.data.filter(apt => apt.status === 'completed');
        const cancelledAppointments = response.data.filter(apt => apt.status === 'cancelled');
        
        setStats({
          totalAppointments,
          upcomingAppointments: upcomingAppointments.length,
          completedAppointments: completedAppointments.length,
          cancelledAppointments: cancelledAppointments.length
        });
      }
    } catch (err) {
      console.error('Fetch patient appointments error:', err);
      setError('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isPatient()) {
      fetchPatientAppointments();
    }
  }, [isPatient, fetchPatientAppointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    
    const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
    
    try {
      setLoading(true);
      const response = await HospitalService.cancelAppointment(appointmentId, reason || undefined);
      
      if (response.success) {
        await fetchPatientAppointments();
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
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
            <Clock className="h-4 w-4 mr-1" />
            Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
            <CheckCircle className="h-4 w-4 mr-1" />
            Đã xác nhận
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
            <CheckCircle className="h-4 w-4 mr-1" />
            Hoàn thành
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-red-100 text-red-800 border border-red-200 rounded-full">
            <XCircle className="h-4 w-4 mr-1" />
            Đã hủy
          </span>
        );
      case 'no_show':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
            <AlertCircle className="h-4 w-4 mr-1" />
            Không đến
          </span>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString + ' ' + timeString);
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentDateTime = new Date(appointment.appointment_date + ' ' + appointment.appointment_time);
    const now = new Date();
    const hoursUntilAppointment = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Can cancel if appointment is in the future, not yet completed, and at least 2 hours away
    return appointment.status === 'pending' && hoursUntilAppointment > 2;
  };

  if (!isPatient()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Truy cập bị từ chối
          </h1>
          <p className="text-gray-600">
            Bạn cần đăng nhập với tài khoản bệnh nhân để xem lịch hẹn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              Lịch hẹn của tôi
            </h1>
            <p className="text-gray-600">Theo dõi và quản lý các lịch hẹn khám bệnh</p>
          </div>
          <div className="text-sm text-gray-600">
            Xin chào, <span className="font-medium text-gray-900">{user?.display_name}</span>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Cần đặt lịch hẹn mới?</h2>
            <p className="text-blue-100">Đặt lịch khám với các bác sĩ chuyên khoa ngay hôm nay</p>
          </div>
          <button
            onClick={() => window.location.href = '/scheduler'}
            className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Đặt lịch mới
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng lịch hẹn</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalAppointments}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sắp tới</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.upcomingAppointments}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đã hoàn thành</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedAppointments}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Đã hủy</p>
              <p className="text-3xl font-bold text-red-600">{stats.cancelledAppointments}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <button
            onClick={fetchPatientAppointments}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách lịch hẹn</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch hẹn nào</h3>
              <p className="text-gray-600 mb-4">
                {statusFilter !== 'all' 
                  ? 'Không có lịch hẹn nào phù hợp với bộ lọc.'
                  : 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch khám ngay!'
                }
              </p>
              <button
                onClick={() => window.location.href = '/scheduler'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
              >
                <Plus className="h-5 w-5" />
                Đặt lịch hẹn đầu tiên
              </button>
            </div>
          ) : (
            appointments.map((appointment) => {
              const { date, time } = formatDateTime(appointment.appointment_date, appointment.appointment_time);
              const isPast = new Date(appointment.appointment_date + ' ' + appointment.appointment_time) < new Date();
              
              return (
                <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(appointment.status)}
                        {isPast && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            Quá hạn
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">
                        {date}
                      </h4>
                      <p className="text-blue-600 font-medium">{time}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {canCancelAppointment(appointment) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                          title="Hủy lịch hẹn"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    {appointment.doctor && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Bác sĩ: {appointment.doctor.display_name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Mã bệnh viện: {appointment.hospital_id}</span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                  
                  {appointment.diagnosis && appointment.status === 'completed' && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <h5 className="text-sm font-medium text-green-900 mb-1">Chẩn đoán:</h5>
                      <p className="text-sm text-green-700">{appointment.diagnosis}</p>
                    </div>
                  )}
                  
                  {appointment.prescription && appointment.status === 'completed' && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-1">Đơn thuốc:</h5>
                      <p className="text-sm text-blue-700">{appointment.prescription}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

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
                <div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>

                {/* Date and Time */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Thời gian</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Ngày:</span> {formatDateTime(selectedAppointment.appointment_date, selectedAppointment.appointment_time).date}</p>
                    <p><span className="font-medium">Giờ:</span> {formatDateTime(selectedAppointment.appointment_date, selectedAppointment.appointment_time).time}</p>
                    <p><span className="font-medium">Khung giờ:</span> {
                      selectedAppointment.time_slot === 'morning' ? 'Sáng' :
                      selectedAppointment.time_slot === 'afternoon' ? 'Chiều' : 'Tối'
                    }</p>
                  </div>
                </div>

                {/* Doctor Info */}
                {selectedAppointment.doctor && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Bác sĩ</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Tên:</span> {selectedAppointment.doctor.display_name}</p>
                      <p><span className="font-medium">Email:</span> {selectedAppointment.doctor.email}</p>
                      {selectedAppointment.doctor.specialization && (
                        <p><span className="font-medium">Chuyên khoa:</span> {selectedAppointment.doctor.specialization}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Hospital Info */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Bệnh viện</h4>
                  <p className="text-sm"><span className="font-medium">Mã:</span> {selectedAppointment.hospital_id}</p>
                </div>

                {/* Notes */}
                {selectedAppointment.notes && (
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Ghi chú</h4>
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                )}

                {/* Medical Info (for completed appointments) */}
                {selectedAppointment.status === 'completed' && (
                  <>
                    {selectedAppointment.diagnosis && (
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Chẩn đoán</h4>
                        <p className="text-sm text-gray-700">{selectedAppointment.diagnosis}</p>
                      </div>
                    )}

                    {selectedAppointment.prescription && (
                      <div className="border-l-4 border-indigo-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Đơn thuốc</h4>
                        <p className="text-sm text-gray-700">{selectedAppointment.prescription}</p>
                      </div>
                    )}

                    {selectedAppointment.follow_up_date && (
                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Lịch tái khám</h4>
                        <p className="text-sm text-gray-700">
                          {new Date(selectedAppointment.follow_up_date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                {canCancelAppointment(selectedAppointment) && (
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        handleCancelAppointment(selectedAppointment.id);
                        setSelectedAppointment(null);
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
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
            <AlertCircle className="h-4 w-4 mr-2" />
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