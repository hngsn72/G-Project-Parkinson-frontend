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

type TabType = 'pending' | 'confirmed' | 'completed';

export default function PatientAppointments() {
  const { user, isPatient } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
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
        // Sort by date (newest first)
        const sortedData = response.data.sort((a, b) => {
          const dateA = new Date(a.appointment_date);
          const dateB = new Date(b.appointment_date);
          const [hourA, minA] = (a.time_slot || '00:00').split(':').map(Number);
          const [hourB, minB] = (b.time_slot || '00:00').split(':').map(Number);
          dateA.setHours(hourA, minA);
          dateB.setHours(hourB, minB);
          return dateB.getTime() - dateA.getTime();
        });
        
        setAppointments(sortedData);
        
        // Calculate stats
        const totalAppointments = response.data.length;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingAppointments = response.data.filter(apt => {
          const aptDate = new Date(apt.appointment_date);
          if (apt.time_slot) {
            const [hour, min] = apt.time_slot.split(':').map(Number);
            aptDate.setHours(hour, min);
          }
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
  }, []);

  useEffect(() => {
    if (isPatient()) {
      fetchPatientAppointments();
    }
  }, [isPatient, fetchPatientAppointments]);

  // Filter appointments by active tab
  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'pending') return apt.status === 'pending';
    if (activeTab === 'confirmed') return apt.status === 'confirmed';
    if (activeTab === 'completed') return apt.status === 'completed';
    return true;
  });

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

  const formatDateTime = (dateString: string, timeSlot?: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: timeSlot || 'Chưa xác định',
      fullDate: date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    };
  };

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentDateTime = new Date(appointment.appointment_date);
    if (appointment.time_slot) {
      const [hour, min] = appointment.time_slot.split(':').map(Number);
      appointmentDateTime.setHours(hour, min);
    }
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

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('pending')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Chờ xác nhận</span>
                <span className="ml-2 bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('confirmed')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'confirmed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Đã xác nhận</span>
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'completed'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Đã khám</span>
                <span className="ml-2 bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {appointments.filter(a => a.status === 'completed').length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'pending' && 'Chưa có lịch chờ xác nhận'}
                {activeTab === 'confirmed' && 'Chưa có lịch đã xác nhận'}
                {activeTab === 'completed' && 'Chưa có lịch đã khám'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'pending' && 'Các lịch hẹn mới sẽ xuất hiện ở đây sau khi bạn đặt lịch.'}
                {activeTab === 'confirmed' && 'Các lịch hẹn đã được bác sĩ xác nhận sẽ xuất hiện ở đây.'}
                {activeTab === 'completed' && 'Các lịch hẹn đã hoàn thành sẽ xuất hiện ở đây.'}
              </p>
              {activeTab === 'pending' && (
                <button
                  onClick={() => window.location.href = '/scheduler'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Đặt lịch hẹn mới
                </button>
              )}
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const { date, time, fullDate } = formatDateTime(appointment.appointment_date, appointment.time_slot);
              const appointmentDateTime = new Date(appointment.appointment_date);
              if (appointment.time_slot) {
                const [hour, min] = appointment.time_slot.split(':').map(Number);
                appointmentDateTime.setHours(hour, min);
              }
              const isPast = appointmentDateTime < new Date();
              
              return (
                <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors border-l-4" style={{
                  borderLeftColor: appointment.status === 'pending' ? '#f59e0b' :
                                   appointment.status === 'confirmed' ? '#3b82f6' :
                                   appointment.status === 'completed' ? '#10b981' : '#ef4444'
                }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(appointment.status)}
                        {isPast && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            Quá hạn
                          </span>
                        )}
                        {appointment.urgency === 'urgent' && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                            🔴 Khẩn cấp
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {fullDate}
                      </h4>
                      <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Clock className="h-4 w-4" />
                        <span>{time}</span>
                        <span className="text-sm text-gray-500">({appointment.session === 'morning' ? 'Buổi sáng' : 'Buổi chiều'})</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedAppointment(appointment)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      
                      {canCancelAppointment(appointment) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                          title="Hủy lịch hẹn"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                    {appointment.doctor && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="h-4 w-4 text-gray-500" />
                        <span><span className="font-medium">Bác sĩ:</span> {appointment.doctor.display_name}</span>
                      </div>
                    )}
                    
                    {appointment.hospital && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{appointment.hospital.name}</span>
                      </div>
                    )}

                    {appointment.patient_name && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <User className="h-4 w-4 text-gray-500" />
                        <span><span className="font-medium">Bệnh nhân:</span> {appointment.patient_name}</span>
                      </div>
                    )}

                    {appointment.patient_phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-medium">SĐT:</span> {appointment.patient_phone}
                      </div>
                    )}
                  </div>

                  {appointment.symptoms && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm font-medium text-yellow-900 mb-1">Triệu chứng:</p>
                      <p className="text-sm text-yellow-700">{appointment.symptoms}</p>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-1">Ghi chú:</p>
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                  
                  {appointment.diagnosis_notes && appointment.status === 'completed' && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-medium text-green-900 mb-1">Chẩn đoán:</h5>
                      <p className="text-sm text-green-700">{appointment.diagnosis_notes}</p>
                    </div>
                  )}
                  
                  {appointment.prescription && appointment.status === 'completed' && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
                    <p><span className="font-medium">Ngày:</span> {formatDateTime(selectedAppointment.appointment_date, selectedAppointment.time_slot).date}</p>
                    <p><span className="font-medium">Giờ:</span> {formatDateTime(selectedAppointment.appointment_date, selectedAppointment.time_slot).time}</p>
                    <p><span className="font-medium">Buổi:</span> {
                      selectedAppointment.session === 'morning' ? 'Sáng (7:00-11:00)' : 'Chiều (13:00-17:00)'
                    }</p>
                    {selectedAppointment.appointment_type && (
                      <p><span className="font-medium">Loại:</span> {selectedAppointment.appointment_type === 'regular' ? 'Khám thường' : 'Khám khẩn'}</p>
                    )}
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
                  {selectedAppointment.hospital ? (
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Tên:</span> {selectedAppointment.hospital.name}</p>
                      <p><span className="font-medium">Địa chỉ:</span> {selectedAppointment.hospital.address}</p>
                      {selectedAppointment.hospital.phone && (
                        <p><span className="font-medium">SĐT:</span> {selectedAppointment.hospital.phone}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm"><span className="font-medium">ID:</span> {selectedAppointment.hospital_id}</p>
                  )}
                </div>

                {/* Patient Info */}
                {(selectedAppointment.patient_name || selectedAppointment.patient_phone) && (
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Thông tin bệnh nhân</h4>
                    <div className="space-y-1 text-sm">
                      {selectedAppointment.patient_name && (
                        <p><span className="font-medium">Họ tên:</span> {selectedAppointment.patient_name}</p>
                      )}
                      {selectedAppointment.patient_phone && (
                        <p><span className="font-medium">SĐT:</span> {selectedAppointment.patient_phone}</p>
                      )}
                      {selectedAppointment.patient_age && (
                        <p><span className="font-medium">Tuổi:</span> {selectedAppointment.patient_age}</p>
                      )}
                      {selectedAppointment.patient_gender && (
                        <p><span className="font-medium">Giới tính:</span> {selectedAppointment.patient_gender === 'male' ? 'Nam' : 'Nữ'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Symptoms */}
                {selectedAppointment.symptoms && (
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Triệu chứng</h4>
                    <p className="text-sm text-gray-700">{selectedAppointment.symptoms}</p>
                  </div>
                )}

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
                    {selectedAppointment.diagnosis_notes && (
                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Chẩn đoán</h4>
                        <p className="text-sm text-gray-700">{selectedAppointment.diagnosis_notes}</p>
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