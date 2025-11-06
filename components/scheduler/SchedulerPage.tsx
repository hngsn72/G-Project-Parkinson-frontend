"use client";
import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, FileDown, PlusCircle, X } from "lucide-react";
import AppointmentBookingForm from "./AppointmentBookingForm";
import AppointmentDetailsModal from "./AppointmentDetailsModal";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { HospitalService } from '@/services/hospital.service';
import { AppointmentService } from '@/services/appointment.service';
import type { Hospital } from '@/services';

// Updated appointment interface to match backend
export interface AppointmentData {
  id: number;
  patient_id: string;
  doctor_id: string;
  hospital_id: number;
  appointment_date: string;
  time_slot: 'morning' | 'afternoon' | 'evening';
  
  // Patient information (for booking without account)
  patient_name: string;
  patient_phone: string;
  patient_age?: number;
  patient_gender?: 'male' | 'female';
  
  // Appointment details
  symptoms?: string;
  notes?: string;
  urgency?: 'normal' | 'urgent' | 'emergency';
  
  // Status management
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  confirmed_at?: string;
  confirmed_by?: string;
  
  // Rescheduling
  original_date?: string;
  original_time_slot?: string;
  reschedule_reason?: string;
  reschedule_count?: number;
  
  // Cancellation
  cancelled_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  
  // Completion
  completed_at?: string;
  diagnosis_notes?: string;
  prescription?: string;
  follow_up_needed?: boolean;
  follow_up_date?: string;
  
  created_at?: string;
  updated_at?: string;
  
  // For display (populated from relations)
  hospital_name?: string;
  doctor_name?: string;
}

export default function Scheduler() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState("1 Tuần");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHospitals = useCallback(async () => {
    try {
      const response = await HospitalService.getAllHospitals({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setHospitals(response.data.data);
      }
    } catch (e) {
      console.error('Failed to load hospitals:', e);
    }
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      // Load appointments based on user role with required parameters
      let response;
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      if (user?.role === 'admin') {
        // Admin can see all appointments
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments?page=1&limit=50`, {
          headers,
        });
      } else if (user?.role === 'doctor') {
        // Doctor sees their appointments
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments/doctor?page=1&limit=50`, {
          headers,
        });
      } else {
        // Patient sees their appointments
        response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments/my?page=1&limit=50`, {
          headers,
        });
      }

      if (response && response.ok) {
        const data = await response.json();
        setAppointments(data.data || []);
      } else if (response) {
        const errorData = await response.json();
        setError(errorData.error || 'Không thể tải dữ liệu lịch hẹn');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  }, [user?.role]);

  // Load hospitals and appointments
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      return;
    }
    
    if (user) {
      loadHospitals();
      loadAppointments();
    }
  }, [loading, user, router, loadHospitals, loadAppointments]);

  const handleExport = () => {
    if (appointments.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const header = [
      "ID",
      "Ngày",
      "Buổi",
      "Bệnh viện",
      "Bác sĩ",
      "Bệnh nhân",
      "Lý do khám",
      "Trạng thái",
    ];
    const rows = appointments.map((a) => [
      a.id,
      a.appointment_date,
      a.time_slot === 'morning' ? 'Buổi sáng' : a.time_slot === 'afternoon' ? 'Buổi chiều' : 'Buổi tối',
      a.hospital_name || '',
      a.doctor_name || '',
      a.patient_name || '',
      a.symptoms || '',
      a.status === 'pending' ? 'Chờ xác nhận' : 
        a.status === 'confirmed' ? 'Đã xác nhận' :
        a.status === 'cancelled' ? 'Đã hủy' : 
        a.status === 'completed' ? 'Hoàn thành' : 'Không đến',
    ]);

    // Chuyển thành chuỗi CSV
    const csvContent = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Tạo blob file CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Tạo link tải file
    const link = document.createElement("a");
    const now = new Date();
    const filename = `lich-hen-${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAppointment = async (data: AppointmentData) => {
    try {
      setLoadingData(true);
      setError(null);

      // Create appointment via AppointmentService
      const response = await AppointmentService.createAppointment({
        doctor_id: data.doctor_id,
        hospital_id: data.hospital_id.toString(),
        appointment_date: data.appointment_date,
        time_slot: data.time_slot,
        patient_name: data.patient_name,
        patient_phone: data.patient_phone,
        patient_age: data.patient_age,
        patient_gender: data.patient_gender,
        symptoms: data.symptoms,
        notes: data.notes,
        urgency: data.urgency,
      });

      if (response.success) {
        // Reload appointments to get updated data with proper relationships
        await loadAppointments();
        setShowCreateForm(false);
      } else {
        setError(response.error || 'Không thể tạo lịch hẹn');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const handleConfirmAppointment = async (id: number) => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      if (response.ok) {
        await loadAppointments(); // Reload to get updated status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Không thể xác nhận lịch hẹn');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  const handleRejectAppointment = async (id: number) => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        await loadAppointments(); // Reload to get updated status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Không thể từ chối lịch hẹn');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCompleteAppointment = async (id: number) => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await loadAppointments(); // Reload to get updated status
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Không thể hoàn thành lịch hẹn');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  const handleViewDetails = (id: number) => {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowDetailsModal(true);
    }
  };

  const confirmDelete = () => {
    // if (selectedId !== null) {
    //   await deleteAppointment(selectedId);
    // }
    setAppointments((prev) => prev.filter((item) => item.id !== selectedId));
    setShowModal(false);
    setSelectedId(null);
  };

  // if (loading)
  //   return <div className="p-6 text-gray-600 text-sm">Đang tải dữ liệu...</div>;
  // if (error) return <div className="p-6 text-red-600 text-sm">Lỗi</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {user?.role === 'admin' ? 'Quản lý Lịch hẹn' : 
           user?.role === 'doctor' ? 'Lịch hẹn bệnh nhân' : 'Lịch khám bệnh'}
        </h1>
        <p className="text-gray-600">
          {user?.role === 'admin' ? 'Quản lý tất cả lịch hẹn trong hệ thống' :
           user?.role === 'doctor' ? 'Quản lý lịch hẹn và xác nhận cuộc hẹn với bệnh nhân' : 'Danh sách lịch khám bệnh của bạn'}
        </p>

        {/* Show pending appointments count for doctors */}
        {user?.role === 'doctor' && (
          <div className="mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
              {appointments.filter(a => a.status === 'pending').length} lịch hẹn chờ xác nhận
            </span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex justify-between items-start">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option>1 Ngày</option>
            <option>1 Tuần</option>
            <option>1 Tháng</option>
          </select>

          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[220px] focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Chỉ hiển thị nút đặt lịch cho bệnh nhân */}
          {(!user?.role || user?.role === 'patient') && (
            <button
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              onClick={() => setShowCreateForm(true)}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Đặt lịch khám mới
            </button>
          )}
          
          <button
            onClick={loadAppointments}
            disabled={loadingData}
            className="flex items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loadingData ? 'Đang tải...' : 'Làm mới'}
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-900 text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Ngày & Buổi</th>
              <th className="px-6 py-3 text-left">Bệnh viện</th>
              <th className="px-6 py-3 text-left">Bác sĩ</th>
              <th className="px-6 py-3 text-left">{user?.role === 'admin' ? 'Bệnh nhân' : 'Lý do khám'}</th>
              <th className="px-6 py-3 text-center">Trạng thái</th>
              <th className="px-6 py-3 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loadingData ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500">Đang tải dữ liệu...</p>
                  </div>
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <p className="text-gray-500">
                      {user?.role === 'admin' ? 'Chưa có lịch hẹn nào trong hệ thống' :
                       user?.role === 'doctor' ? 'Chưa có lịch hẹn nào từ bệnh nhân' : 'Bạn chưa có lịch khám nào'}
                    </p>
                    {(!user?.role || user?.role === 'patient') && (
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        Đặt lịch khám đầu tiên
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              appointments.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{item.appointment_date}</div>
                    <div className="text-sm text-gray-500">
                      {item.time_slot === 'morning' ? 'Buổi sáng' : 
                       item.time_slot === 'afternoon' ? 'Buổi chiều' : 'Buổi tối'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{item.hospital_name || 'N/A'}</td>
                <td className="px-6 py-4">{item.doctor_name || 'N/A'}</td>
                <td className="px-6 py-4">
                  {user?.role === 'admin' ? item.patient_name || 'N/A' : item.reason || 'N/A'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : item.status === "confirmed"
                        ? "bg-blue-100 text-blue-700"
                        : item.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status === 'pending' ? 'Chờ xác nhận' : 
                     item.status === 'confirmed' ? 'Đã xác nhận' :
                     item.status === 'cancelled' ? 'Đã hủy' : 
                     item.status === 'completed' ? 'Hoàn thành' : 'Không đến'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    {/* Actions based on user role and appointment status */}
                    {user?.role === 'doctor' && item.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => handleConfirmAppointment(item.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          title="Xác nhận lịch hẹn"
                        >
                          Xác nhận
                        </button>
                        <button 
                          onClick={() => handleRejectAppointment(item.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          title="Từ chối lịch hẹn"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                    
                    {user?.role === 'doctor' && item.status === 'confirmed' && (
                      <button 
                        onClick={() => handleCompleteAppointment(item.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        title="Hoàn thành khám"
                      >
                        Hoàn thành
                      </button>
                    )}

                    {/* General actions */}
                    <button 
                      onClick={() => handleViewDetails(item.id)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Xem chi tiết"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    {(user?.role === 'admin' || (user?.role === 'patient' && item.status === 'pending')) && (
                      <button
                        onClick={() => handleDeleteClick(item.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Hủy lịch hẹn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Xác nhận xóa lịch hẹn
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa lịch hẹn này không? Hành động này không
              thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      <AppointmentBookingForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleAddAppointment}
      />

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleConfirmAppointment}
        onReject={handleRejectAppointment}
        onComplete={handleCompleteAppointment}
        userRole={user?.role}
      />
    </div>
  );
}
