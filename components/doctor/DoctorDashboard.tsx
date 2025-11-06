'use client';

import { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  AlertCircle,
  Eye,
  CalendarDays
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Stats
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    thisWeekAppointments: 0,
    totalPatients: 0
  });

  const fetchDoctorAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await HospitalService.getDoctorAppointments();
      
      if (response.success && response.data) {
        // Set all appointments, let tabs handle filtering
        setAppointments(response.data);
      }
    } catch (err) {
      console.error('Fetch doctor appointments error:', err);
      setError('Không thể tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDoctor()) {
      fetchDoctorAppointments();
      loadStats();
    }
  }, [isDoctor, fetchDoctorAppointments]);

  const loadStats = async () => {
    try {
      const response = await HospitalService.getDoctorAppointments();
      
      if (response.success && response.data) {
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = response.data.filter(apt => apt.appointment_date === today);
        const pendingAppointments = response.data.filter(apt => apt.status === 'pending');
        
        // Calculate this week appointments
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const thisWeekAppointments = response.data.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          return aptDate >= startOfWeek && aptDate <= endOfWeek;
        });

        // Count unique patients
        const uniquePatients = new Set(response.data.map(apt => apt.patient_id));
        
        setStats({
          todayAppointments: todayAppointments.length,
          pendingAppointments: pendingAppointments.length,
          thisWeekAppointments: thisWeekAppointments.length,
          totalPatients: uniquePatients.size
        });
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const response = await HospitalService.confirmAppointment(appointmentId);
      
      if (response.success) {
        await fetchDoctorAppointments();
        await loadStats();
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
        await fetchDoctorAppointments();
        await loadStats();
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

  const handleRescheduleAppointment = async (appointmentId: string) => {
    const newDate = prompt('Nhập ngày mới (YYYY-MM-DD):');
    const newTime = prompt('Nhập giờ mới (HH:MM):');
    const reason = prompt('Lý do thay đổi lịch (tùy chọn):');
    
    if (newDate && newTime) {
      try {
        setLoading(true);
        
        // Determine time slot based on time
        const hour = parseInt(newTime.split(':')[0]);
        let timeSlot: 'morning' | 'afternoon' | 'evening' = 'morning';
        if (hour >= 12 && hour < 18) timeSlot = 'afternoon';
        else if (hour >= 18) timeSlot = 'evening';
        
        const response = await HospitalService.rescheduleAppointment(appointmentId, {
          new_date: newDate,
          new_time: newTime,
          new_time_slot: timeSlot,
          reason: reason || undefined
        });
        
        if (response.success) {
          await fetchDoctorAppointments();
          await loadStats();
          alert('Thay đổi lịch hẹn thành công!');
        } else {
          setError(response.error || 'Không thể thay đổi lịch hẹn');
        }
      } catch (error) {
        console.error('Reschedule appointment error:', error);
        setError('Có lỗi xảy ra khi thay đổi lịch hẹn');
      } finally {
        setLoading(false);
      }
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
      default:
        return null;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(`2024-01-01 ${timeString}`).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isDoctor()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Truy cập bị từ chối
          </h1>
          <p className="text-gray-600">
            Bạn cần có quyền bác sĩ để truy cập trang này.
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
              Dashboard Bác sĩ
            </h1>
            <p className="text-gray-600">Quản lý lịch hẹn và bệnh nhân</p>
          </div>
          <div className="text-sm text-gray-600">
            Xin chào, <span className="font-medium text-gray-900">{user?.display_name}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Hôm nay</p>
              <p className="text-3xl font-bold text-blue-600">{stats.todayAppointments}</p>
              <p className="text-sm text-gray-500">Lịch hẹn</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalendarDays className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Chờ xác nhận</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingAppointments}</p>
              <p className="text-sm text-gray-500">Lịch hẹn</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tuần này</p>
              <p className="text-3xl font-bold text-green-600">{stats.thisWeekAppointments}</p>
              <p className="text-sm text-gray-500">Lịch hẹn</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Tổng bệnh nhân</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalPatients}</p>
              <p className="text-sm text-gray-500">Đã khám</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn ngày
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-6">
            <button
              onClick={fetchDoctorAppointments}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List with Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quản lý lịch hẹn
          </h3>
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lịch hẹn ({appointments.filter(apt => apt.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'confirmed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Lịch đã xác nhận ({appointments.filter(apt => apt.status === 'confirmed').length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : appointments.filter(apt => apt.status === activeTab).length === 0 ? (
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'pending' ? 'Không có lịch hẹn chờ xác nhận' : 'Không có lịch hẹn đã xác nhận'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending' 
                  ? 'Không có lịch hẹn chờ xác nhận nào'
                  : 'Không có lịch hẹn đã xác nhận nào'
                }
              </p>
            </div>
          ) : (
            appointments.filter(apt => apt.status === activeTab).map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(appointment.status)}
                      <span className="text-sm text-gray-600">
                        {formatTime(appointment.appointment_time)} - 
                        {appointment.time_slot === 'morning' ? ' Sáng' :
                         appointment.time_slot === 'afternoon' ? ' Chiều' : ' Tối'}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {appointment.patient?.display_name || 'Không rõ tên'}
                    </h4>
                    {appointment.patient?.phone && (
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" />
                        {appointment.patient.phone}
                      </p>
                    )}
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
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                          title="Xác nhận lịch hẹn"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                          className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50"
                          title="Thay đổi lịch"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
                            if (reason !== null) {
                              handleCancelAppointment(appointment.id, reason);
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

                {appointment.notes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{appointment.notes}</p>
                  </div>
                )}
                
                {appointment.symptoms && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-1">Triệu chứng:</h5>
                    <p className="text-sm text-blue-700">{appointment.symptoms}</p>
                  </div>
                )}
              </div>
            ))
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
                    {selectedAppointment.patient?.phone && (
                      <div>
                        <span className="text-gray-600">Số điện thoại:</span>
                        <p className="font-medium">{selectedAppointment.patient.phone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Chi tiết lịch hẹn</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Ngày hẹn:</span>
                      <p className="font-medium">{new Date(selectedAppointment.appointment_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Giờ hẹn:</span>
                      <p className="font-medium">{formatTime(selectedAppointment.appointment_time)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes & Symptoms */}
                {selectedAppointment.notes && (
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Ghi chú</h4>
                    <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                  </div>
                )}

                {selectedAppointment.symptoms && (
                  <div className="border-l-4 border-red-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Triệu chứng</h4>
                    <p className="text-sm text-gray-700">{selectedAppointment.symptoms}</p>
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