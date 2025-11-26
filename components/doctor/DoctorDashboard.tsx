'use client';

import { useState, useEffect, useCallback } from 'react';
import { HospitalService } from '@/services/hospital.service';
import type { Appointment } from '@/services/hospital.service';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from '@/components/ui/Modal';
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
  CalendarDays,
  FileText,
  MapPin,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DoctorDashboard() {
  const { user, isDoctor } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed'>('pending');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarAppointments, setCalendarAppointments] = useState<{[key: string]: Appointment[]}>({});
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<Appointment[]>([]);

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
        console.log('=== Fetched appointments ===');
        console.log('Total appointments:', response.data.length);
        console.log('Sample appointment:', response.data[0]);
        
        // Set all appointments, let tabs handle filtering
        setAppointments(response.data);
        
        // Group appointments by date for calendar
        const grouped: {[key: string]: Appointment[]} = {};
        response.data.forEach(apt => {
          // Normalize date to YYYY-MM-DD format (remove time part)
          const dateOnly = apt.appointment_date.split('T')[0];
          console.log('Processing appointment date:', apt.appointment_date, '-> normalized:', dateOnly);
          
          if (!grouped[dateOnly]) {
            grouped[dateOnly] = [];
          }
          grouped[dateOnly].push(apt);
        });
        console.log('Grouped appointments:', grouped);
        setCalendarAppointments(grouped);
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

  const handleCompleteAppointment = async (appointmentId: string) => {
    if (!confirm('Xác nhận đã hoàn thành lịch khám này?')) return;
    
    try {
      setLoading(true);
      const response = await HospitalService.completeAppointment(appointmentId, {
        diagnosis_notes: undefined,
        prescription: undefined,
        follow_up_needed: false
      });
      
      if (response.success) {
        await fetchDoctorAppointments();
        await loadStats();
        alert('Đã hoàn thành lịch hẹn!');
      } else {
        setError(response.error || 'Không thể hoàn thành lịch hẹn');
      }
    } catch (error) {
      console.error('Complete appointment error:', error);
      setError('Có lỗi xảy ra khi hoàn thành lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (dateStr: string) => {
    console.log('=== DEBUG handleDayClick ===');
    console.log('Clicked date:', dateStr);
    console.log('All calendar appointments:', calendarAppointments);
    console.log('Appointments for this date:', calendarAppointments[dateStr]);
    
    const dayApts = calendarAppointments[dateStr] || [];
    console.log('dayApts:', dayApts);
    
    setSelectedDayAppointments(dayApts);
    setSelectedDate(dateStr);
    setShowDayModal(true);
    
    console.log('Modal should open now. showDayModal will be:', true);
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
              Chờ xác nhận ({appointments.filter(apt => apt.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'confirmed'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Đã xác nhận ({appointments.filter(apt => apt.status === 'confirmed').length})
            </button>
          </div>
        </div>

        {/* Table with scroll */}
        <div className="overflow-x-auto">
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
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày & Giờ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bệnh nhân
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thông tin liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buổi khám
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Triệu chứng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.filter(apt => apt.status === activeTab).map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(appointment.appointment_date).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {appointment.time_slot || formatTime(appointment.appointment_time)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient_name || appointment.patient?.display_name || 'Không rõ tên'}
                            </div>
                            {appointment.patient_age && (
                              <div className="text-sm text-gray-500">
                                {appointment.patient_age} tuổi
                                {appointment.patient_gender && ` • ${appointment.patient_gender === 'male' ? 'Nam' : 'Nữ'}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {appointment.patient_phone && (
                            <div className="flex items-center text-gray-900 mb-1">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              {appointment.patient_phone}
                            </div>
                          )}
                          {appointment.patient?.email && (
                            <div className="text-gray-500 text-xs">
                              {appointment.patient.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                          appointment.session === 'morning' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.session === 'morning' ? '🌅 Buổi sáng' : '🌆 Buổi chiều'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={appointment.symptoms || 'Không có'}>
                          {appointment.symptoms || <span className="text-gray-400 italic">Không có</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appointment.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setShowDetailModal(true);
                            }}
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
                                onClick={() => handleRescheduleAppointment(appointment.id.toString())}
                                className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50"
                                title="Thay đổi lịch"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
                                  if (reason !== null) {
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
                          
                          {appointment.status === 'confirmed' && (
                            <button
                              onClick={() => handleCompleteAppointment(appointment.id.toString())}
                              className="text-purple-600 hover:text-purple-800 p-2 rounded-lg hover:bg-purple-50"
                              title="Hoàn thành khám"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Calendar View - Schedule Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              Lịch khám tháng {currentMonth.getMonth() + 1}/{currentMonth.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
              >
                Hôm nay
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Calendar headers */}
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {(() => {
              const year = currentMonth.getFullYear();
              const month = currentMonth.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const days = [];
              
              // Empty cells for days before month starts
              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="aspect-square" />);
              }
              
              // Days of the month
              for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayAppointments = calendarAppointments[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const confirmedCount = dayAppointments.filter(apt => apt.status === 'confirmed').length;
                const pendingCount = dayAppointments.filter(apt => apt.status === 'pending').length;
                const completedCount = dayAppointments.filter(apt => apt.status === 'completed').length;
                const hasAppointments = dayAppointments.length > 0;
                
                // Determine background color based on appointments
                let bgColor = '';
                if (hasAppointments) {
                  if (completedCount > 0) bgColor = 'bg-green-100 border-green-300';
                  else if (confirmedCount > 0) bgColor = 'bg-blue-100 border-blue-300';
                  else if (pendingCount > 0) bgColor = 'bg-yellow-100 border-yellow-300';
                } else {
                  bgColor = isToday ? 'bg-purple-50 border-purple-400' : 'border-gray-200';
                }
                
                days.push(
                  <div
                    key={day}
                    className={`aspect-square p-2 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${bgColor} ${
                      hasAppointments ? 'hover:border-blue-500' : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleDayClick(dateStr)}
                  >
                    <div className={`text-sm font-bold mb-1 ${
                      isToday ? 'text-purple-600' : hasAppointments ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {day}
                      {isToday && <span className="ml-1 text-xs">●</span>}
                    </div>
                    {hasAppointments && (
                      <div className="space-y-0.5">
                        <div className="text-xs font-semibold text-gray-700">
                          {dayAppointments.length} lịch
                        </div>
                        {confirmedCount > 0 && (
                          <div className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5" />
                            {confirmedCount}
                          </div>
                        )}
                        {pendingCount > 0 && (
                          <div className="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {pendingCount}
                          </div>
                        )}
                        {completedCount > 0 && (
                          <div className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            ✓ {completedCount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              
              return days;
            })()}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-50 border-2 border-purple-400 rounded"></div>
              <span className="text-gray-600">Hôm nay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
              <span className="text-gray-600">Chờ xác nhận</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-gray-600">Đã xác nhận</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-gray-600">Đã hoàn thành</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Appointments Modal */}
      <Modal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        title={`Lịch hẹn ngày ${new Date(selectedDate).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}`}
        maxWidth="3xl"
      >
        {selectedDayAppointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có lịch hẹn
            </h3>
            <p className="text-gray-600">
              Không có lịch hẹn nào trong ngày này
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Tổng <span className="font-semibold text-gray-900">{selectedDayAppointments.length}</span> lịch hẹn
            </p>
            
            {selectedDayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setShowDayModal(false);
                  setShowDetailModal(true);
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-gray-900">
                        {appointment.time_slot || formatTime(appointment.appointment_time)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.session === 'morning' ? '🌅 Buổi sáng' : '🌆 Buổi chiều'}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Bệnh nhân</div>
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      {appointment.patient_name || appointment.patient?.display_name || 'Không rõ tên'}
                    </div>
                    {appointment.patient_age && (
                      <div className="text-xs text-gray-600 mt-1">
                        {appointment.patient_age} tuổi • {appointment.patient_gender === 'male' ? 'Nam' : 'Nữ'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Liên hệ</div>
                    {appointment.patient_phone && (
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {appointment.patient_phone}
                      </div>
                    )}
                  </div>
                </div>

                {appointment.symptoms && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="text-xs font-semibold text-red-900 mb-1">Triệu chứng:</div>
                    <div className="text-sm text-red-700">{appointment.symptoms}</div>
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t">
                  {appointment.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmAppointment(appointment.id.toString());
                          setShowDayModal(false);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Xác nhận
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const reason = prompt('Lý do hủy:');
                          if (reason !== null) {
                            handleCancelAppointment(appointment.id.toString(), reason);
                            setShowDayModal(false);
                          }
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <XCircle className="h-4 w-4" />
                        Hủy
                      </button>
                    </>
                  )}
                  {appointment.status === 'confirmed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteAppointment(appointment.id.toString());
                        setShowDayModal(false);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Hoàn thành khám
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Appointment Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Chi tiết lịch hẹn #${selectedAppointment?.id || ''}`}
        maxWidth="3xl"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedAppointment.status)}
              <div className="text-sm text-gray-500">
                Tạo lúc: {new Date(selectedAppointment.created_at || '').toLocaleString('vi-VN')}
              </div>
            </div>

            {/* Appointment Time */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-lg">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-600">Thời gian khám</div>
                  <div className="text-lg font-bold text-gray-900">
                    {new Date(selectedAppointment.appointment_date).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">
                      {selectedAppointment.time_slot || formatTime(selectedAppointment.appointment_time)}
                    </span>
                    {selectedAppointment.session && (
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        selectedAppointment.session === 'morning' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedAppointment.session === 'morning' ? '🌅 Buổi sáng' : '🌆 Buổi chiều'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Info */}
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900 text-lg">Thông tin bệnh nhân</h4>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Họ và tên:</span>
                  <p className="font-medium text-gray-900 text-base">
                    {selectedAppointment.patient_name || selectedAppointment.patient?.display_name || 'Không rõ'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium text-gray-900">{selectedAppointment.patient?.email || 'Không có'}</p>
                </div>
                {selectedAppointment.patient_phone && (
                  <div>
                    <span className="text-gray-600">Số điện thoại:</span>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <Phone className="h-4 w-4 text-blue-600" />
                      {selectedAppointment.patient_phone}
                    </p>
                  </div>
                )}
                {selectedAppointment.patient_age && (
                  <div>
                    <span className="text-gray-600">Tuổi:</span>
                    <p className="font-medium text-gray-900">{selectedAppointment.patient_age} tuổi</p>
                  </div>
                )}
                {selectedAppointment.patient_gender && (
                  <div>
                    <span className="text-gray-600">Giới tính:</span>
                    <p className="font-medium text-gray-900">
                      {selectedAppointment.patient_gender === 'male' ? 'Nam' : 'Nữ'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Hospital Info */}
            {selectedAppointment.hospital && (
              <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-gray-900 text-lg">Bệnh viện</h4>
                </div>
                <p className="font-medium text-gray-900">{selectedAppointment.hospital.name}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedAppointment.hospital.address}</p>
              </div>
            )}

            {/* Symptoms */}
            {selectedAppointment.symptoms && (
              <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold text-gray-900 text-lg">Triệu chứng</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedAppointment.symptoms}</p>
              </div>
            )}

            {/* Notes */}
            {selectedAppointment.notes && (
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold text-gray-900 text-lg">Ghi chú</h4>
                </div>
                <p className="text-gray-700 leading-relaxed">{selectedAppointment.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            {selectedAppointment.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleConfirmAppointment(selectedAppointment.id.toString());
                    setShowDetailModal(false);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <CheckCircle className="h-5 w-5" />
                  Xác nhận lịch hẹn
                </button>
                <button
                  onClick={() => {
                    handleRescheduleAppointment(selectedAppointment.id.toString());
                    setShowDetailModal(false);
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <RefreshCw className="h-5 w-5" />
                  Thay đổi lịch
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
                    if (reason !== null) {
                      handleCancelAppointment(selectedAppointment.id.toString(), reason);
                      setShowDetailModal(false);
                    }
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                  Hủy lịch hẹn
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

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