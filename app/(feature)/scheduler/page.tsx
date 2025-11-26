'use client';

import { useState, useEffect } from 'react';
import { HospitalService } from '@/services/hospital.service';
import { AppointmentService, CreateAppointmentRequest, DoctorWithSlots, TimeSlot } from '@/services/appointment.service';
import type { Hospital, HospitalDoctor, Appointment } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import PatientProfileSelector from '@/components/patient-profile/PatientProfileSelector';
import { PatientProfile } from '@/services/patient-profile.service';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

export default function AppointmentBookingPage() {
  const { user, isAdmin, isDoctor, isPatient } = useAuth();
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('book');
  
  // Booking state
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [doctorsInHospital, setDoctorsInHospital] = useState<HospitalDoctor[]>([]);
  const [doctorsWithSlots, setDoctorsWithSlots] = useState<DoctorWithSlots[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<HospitalDoctor | null>(null);
  const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>('morning');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // Appointments state
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
  // Patient info for appointment
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | ''>('');

  // Fetch hospitals on load
  useEffect(() => {
    fetchHospitals();
    if (user) {
      fetchMyAppointments();
      if (isDoctor() || isAdmin()) {
        fetchAllAppointments();
      }
    }
  }, [user, isAdmin, isDoctor]);

  // Auto-fill patient name from user profile
  useEffect(() => {
    if (user && !patientName && user.display_name) {
      setPatientName(user.display_name);
    }
  }, [user, patientName]);

  // Update form when profile is selected
  useEffect(() => {
    if (selectedProfile) {
      // Family member selected - auto-fill their info
      setPatientName(selectedProfile.full_name);
      setPatientPhone(selectedProfile.phone);
      setPatientAge(selectedProfile.date_of_birth ? 
        String(new Date().getFullYear() - new Date(selectedProfile.date_of_birth).getFullYear()) : 
        '');
      setPatientGender(selectedProfile.gender === 'male' || selectedProfile.gender === 'female' ? 
        selectedProfile.gender : '');
    } else if (user) {
      // Current user (self) selected - auto-fill user's info
      setPatientName(user.display_name || '');
      setPatientPhone(''); // User doesn't have phone in profile
      setPatientAge('');
      setPatientGender('');
    }
  }, [selectedProfile, user]);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await HospitalService.getAllHospitals({ 
        page: 1, 
        limit: 50 
      });
      if (response.success && response.data) {
        setHospitals(response.data.data);
      }
    } catch {
      setError('Không thể tải danh sách bệnh viện');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsInHospital = async (hospitalId: string) => {
    try {
      setLoading(true);
      const response = await HospitalService.getHospitalDoctors(hospitalId);
      if (response.success && response.data) {
        setDoctorsInHospital(response.data);
      }
    } catch {
      setError('Không thể tải danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsWithSlots = async (hospitalId: number, date: string) => {
    if (!date) {
      setDoctorsWithSlots([]);
      return;
    }
    
    try {
      setLoadingSlots(true);
      const response = await AppointmentService.getDoctorsWithSlots(hospitalId, date);
      if (response.success && response.data) {
        setDoctorsWithSlots(response.data);
      } else {
        setError(response.error || 'Không thể tải danh sách bác sĩ và lịch trống');
      }
    } catch {
      setError('Không thể tải danh sách bác sĩ và lịch trống');
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      const response = await HospitalService.getPatientAppointments();
      if (response.success && response.data) {
        setMyAppointments(response.data);
      }
    } catch (err) {
      console.error('Error fetching my appointments:', err);
    }
  };

  const fetchAllAppointments = async () => {
    try {
      const response = await HospitalService.getAllAppointments({ 
        page: 1, 
        limit: 50 
      });
      if (response.success && response.data) {
        setAllAppointments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching all appointments:', err);
    }
  };

  const handleHospitalSelect = async (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setSelectedDoctor(null);
    setSelectedTimeSlot(null);
    setDoctorsWithSlots([]);
    
    // Always fetch doctors list immediately
    await fetchDoctorsInHospital(hospital.id.toString());
    
    // Fetch slots if date is already selected
    if (selectedDate) {
      fetchDoctorsWithSlots(hospital.id, selectedDate);
    }
  };

  // Fetch slots when date changes
  useEffect(() => {
    if (selectedHospital && selectedDate) {
      fetchDoctorsWithSlots(selectedHospital.id, selectedDate);
      setSelectedTimeSlot(null); // Reset selected time slot when date changes
    }
  }, [selectedDate, selectedHospital]);

  const handleBookAppointment = async () => {
    if (!selectedHospital || !selectedDoctor || !selectedDate || !selectedTimeSlot) {
      alert('Vui lòng điền đầy đủ thông tin và chọn khung giờ');
      return;
    }

    if (!patientName && !user?.display_name) {
      alert('Vui lòng nhập tên bệnh nhân');
      return;
    }

    if (!patientPhone) {
      alert('Vui lòng nhập số điện thoại bệnh nhân');
      return;
    }

    try {
      setLoading(true);
      const appointmentData: CreateAppointmentRequest = {
        doctor_id: selectedDoctor.doctor_id || '',
        hospital_id: selectedHospital.id.toString(),
        appointment_date: selectedDate,
        time_slot: selectedTimeSlot.time,
        session: selectedSession,
        patient_profile_id: selectedProfile?.id,
        patient_name: patientName || user?.display_name || "Bệnh nhân",
        patient_phone: patientPhone || "Chưa cung cấp", 
        patient_age: patientAge ? parseInt(patientAge) : undefined,
        patient_gender: patientGender || undefined,
        symptoms: symptoms || undefined,
        notes: reason || undefined,
        urgency: "normal",
      };

      const response = await AppointmentService.createAppointment(appointmentData);
      if (response.success) {
        alert('Đặt lịch hẹn thành công!');
        // Reset form
        setSelectedHospital(null);
        setSelectedDoctor(null);
        setSelectedDate('');
        setSelectedTimeSlot(null);
        setSelectedSession('morning');
        setReason('');
        setSymptoms('');
        setPatientName('');
        setPatientPhone('');
        setPatientAge('');
        setPatientGender('');
        setDoctorsInHospital([]);
        setDoctorsWithSlots([]);
        
        // Refresh appointments
        fetchMyAppointments();
        setActiveTab('my-appointments');
      } else {
        alert('Lỗi khi đặt lịch hẹn: ' + response.error);
      }
    } catch {
      alert('Có lỗi xảy ra khi đặt lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string | number) => {
    if (!confirm('Bạn có chắc chắn muốn xác nhận lịch hẹn này?')) return;
    
    try {
      const response = await HospitalService.confirmAppointment(appointmentId.toString());
      if (response.success) {
        alert('Đã xác nhận lịch hẹn!');
        fetchMyAppointments();
        if (isDoctor() || isAdmin()) {
          fetchAllAppointments();
        }
      } else {
        alert('Lỗi khi xác nhận lịch hẹn: ' + response.error);
      }
    } catch {
      alert('Có lỗi xảy ra khi xác nhận lịch hẹn');
    }
  };

  const handleCancelAppointment = async (appointmentId: string | number) => {
    const reason = prompt('Lý do hủy lịch hẹn (tùy chọn):');
    if (reason === null) return; // User cancelled
    
    try {
      const response = await HospitalService.cancelAppointment(appointmentId.toString(), reason);
      if (response.success) {
        alert('Đã hủy lịch hẹn!');
        fetchMyAppointments();
        if (isDoctor() || isAdmin()) {
          fetchAllAppointments();
        }
      } else {
        alert('Lỗi khi hủy lịch hẹn: ' + response.error);
      }
    } catch {
      alert('Có lỗi xảy ra khi hủy lịch hẹn');
    }
  };

  const handleCompleteAppointment = async (appointmentId: string | number) => {
    const diagnosisNotes = prompt('Ghi chú chẩn đoán:');
    const prescription = prompt('Đơn thuốc:');
    const followUpNeeded = confirm('Cần tái khám?');
    
    try {
      const response = await HospitalService.completeAppointment(appointmentId.toString(), {
        diagnosis_notes: diagnosisNotes || undefined,
        prescription: prescription || undefined,
        follow_up_needed: followUpNeeded,
      });
      if (response.success) {
        alert('Đã hoàn thành lịch hẹn!');
        fetchMyAppointments();
        if (isDoctor() || isAdmin()) {
          fetchAllAppointments();
        }
      } else {
        alert('Lỗi khi hoàn thành lịch hẹn: ' + response.error);
      }
    } catch {
      alert('Có lỗi xảy ra khi hoàn thành lịch hẹn');
    }
  };

  const handleEditAppointment = async (appointment: Appointment) => {
    // Switch to booking tab and pre-fill form
    setActiveTab('book');
    
    // Find and set the hospital
    const hospital = hospitals.find(h => h.id.toString() === appointment.hospital_id?.toString());
    if (hospital) {
      setSelectedHospital(hospital);
      await fetchDoctorsInHospital(hospital.id.toString());
    }
    
    // Pre-fill form with appointment data
    setSelectedDate(appointment.appointment_date);
    setReason(appointment.reason || '');
    setSymptoms(appointment.symptoms || '');
    
    // Set session if available
    if (appointment.session) {
      setSelectedSession(appointment.session as 'morning' | 'afternoon');
    }
    
    // Note: Doctor will need to be selected manually from the list
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong className="font-bold">Cần đăng nhập!</strong>
          <span className="block sm:inline"> Vui lòng đăng nhập để đặt lịch hẹn.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch hẹn khám bệnh</h1>
        <p className="text-gray-600">
          {isPatient() 
            ? 'Đặt lịch hẹn với bác sĩ tại các bệnh viện'
            : 'Quản lý lịch hẹn và cuộc hẹn của bệnh nhân'
          }
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {isPatient() && (
              <button
                onClick={() => setActiveTab('book')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'book'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Calendar className="inline h-4 w-4 mr-2" />
                Đặt lịch hẹn
              </button>
            )}
            <button
              onClick={() => setActiveTab('my-appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'my-appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Eye className="inline h-4 w-4 mr-2" />
              {isPatient() ? 'Lịch hẹn của tôi' : 'Quản lý lịch hẹn'}
            </button>
          </nav>
        </div>
      </div>

      {/* Book Appointment Tab */}
      {activeTab === 'book' && isPatient() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Hospital & Doctor Selection */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn bệnh viện</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm bệnh viện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Hospital List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredHospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => handleHospitalSelect(hospital)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedHospital?.id === hospital.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {hospital.address}
                    </div>
                    {hospital.specializations && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {JSON.parse(hospital.specializations).slice(0, 3).map((spec: string, index: number) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Selection */}
            {selectedHospital && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {selectedDate ? 'Chọn bác sĩ và khung giờ' : 'Chọn bác sĩ'}
                </h3>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-3 text-gray-600">Đang tải danh sách bác sĩ...</span>
                  </div>
                ) : doctorsInHospital.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Không có bác sĩ nào tại bệnh viện này
                  </div>
                ) : (
                  <div className="space-y-6">
                    {doctorsInHospital.map((hospitalDoctor) => {
                      const doctorSlots = doctorsWithSlots.find(
                        d => d.doctor_id === hospitalDoctor.doctor_id
                      );
                      
                      return (
                      <div
                        key={hospitalDoctor.id}
                        className={`p-4 border rounded-lg ${
                          selectedDoctor?.id === hospitalDoctor.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div 
                          onClick={() => setSelectedDoctor(hospitalDoctor)}
                          className="cursor-pointer"
                        >
                          <h4 className="font-medium text-gray-900">
                            {hospitalDoctor.doctor?.display_name}
                          </h4>
                          <div className="text-sm text-gray-600 mt-1">
                            {hospitalDoctor.department} • {hospitalDoctor.position}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">
                              Phí khám: {hospitalDoctor.consultation_fee?.toLocaleString('vi-VN')}đ
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              hospitalDoctor.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {hospitalDoctor.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </div>
                        </div>

                        {/* Time Slots - Only show when date is selected and slots are loaded */}
                        {selectedDoctor?.id === hospitalDoctor.id && selectedDate && doctorSlots && (
                          <div className="mt-4 space-y-4">
                            {loadingSlots ? (
                              <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="ml-2 text-sm text-gray-600">Đang tải lịch trống...</span>
                              </div>
                            ) : (
                              <>
                                {/* Session Selector */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedSession('morning');
                                      setSelectedTimeSlot(null);
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                      selectedSession === 'morning'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    Buổi sáng (7:00-9:30)
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSession('afternoon');
                                      setSelectedTimeSlot(null);
                                    }}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                                      selectedSession === 'afternoon'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    Buổi chiều (14:00-15:30)
                                  </button>
                                </div>

                                {/* Time Slot Grid */}
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                                    Chọn khung giờ:
                                  </h5>
                                  <div className="grid grid-cols-4 gap-2">
                                    {(selectedSession === 'morning' 
                                      ? doctorSlots.morning_slots 
                                      : doctorSlots.afternoon_slots
                                    ).map((slot) => (
                                      <button
                                        key={slot.time}
                                        onClick={() => slot.available && setSelectedTimeSlot(slot)}
                                        disabled={!slot.available}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                          selectedTimeSlot?.time === slot.time
                                            ? 'bg-blue-500 text-white'
                                            : slot.available
                                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                      >
                                        {slot.time}
                                        {!slot.available && (
                                          <div className="text-xs mt-0.5">Đầy</div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  {selectedTimeSlot && (
                                    <div className="mt-2 text-sm text-gray-600">
                                      Đã chọn: {selectedTimeSlot.time} - 
                                      Còn {selectedTimeSlot.max_slots - selectedTimeSlot.booked}/{selectedTimeSlot.max_slots} chỗ
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Message when no date selected */}
                        {selectedDoctor?.id === hospitalDoctor.id && !selectedDate && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              Vui lòng chọn ngày khám để xem lịch trống
                            </p>
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Appointment Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin lịch hẹn</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày khám *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedDoctor(null);
                    setSelectedTimeSlot(null);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chọn ngày để xem lịch trống của bác sĩ
                </p>
              </div>

              {selectedTimeSlot && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="text-sm font-medium text-blue-900">
                        Khung giờ đã chọn: {selectedTimeSlot.time}
                      </div>
                      <div className="text-xs text-blue-700">
                        {selectedSession === 'morning' ? 'Buổi sáng' : 'Buổi chiều'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lý do khám
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Khám định kỳ, tái khám..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Triệu chứng
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Mô tả triệu chứng bệnh..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Patient Information */}
              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Thông tin bệnh nhân</h4>
                
                {/* Patient Profile Selector */}
                <div className="mb-4">
                  <PatientProfileSelector
                    selectedProfileId={selectedProfile?.id || null}
                    onSelectProfile={(profile) => setSelectedProfile(profile)}
                    currentUser={user ? {
                      display_name: user.display_name,
                      email: user.email
                    } : undefined}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder={user?.display_name || "Nhập họ và tên"}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tuổi
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={patientAge}
                      onChange={(e) => setPatientAge(e.target.value)}
                      placeholder="Nhập tuổi"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={patientGender}
                      onChange={(e) => setPatientGender(e.target.value as 'male' | 'female' | '')}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn giới tính</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBookAppointment}
                disabled={!selectedHospital || !selectedDoctor || !selectedDate || !selectedTimeSlot || !patientPhone || loading}
                className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang đặt lịch...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Đặt lịch hẹn
                  </>
                )}
              </button>
              
              {(!selectedHospital || !selectedDate || !selectedDoctor || !selectedTimeSlot) && (
                <p className="text-xs text-gray-500 text-center">
                  Vui lòng chọn bệnh viện, ngày khám, bác sĩ và khung giờ
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Appointments Tab */}
      {activeTab === 'my-appointments' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isPatient() ? 'Lịch hẹn của tôi' : 'Quản lý lịch hẹn'}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày & Giờ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bệnh viện
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bác sĩ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(isPatient() ? myAppointments : allAppointments).map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.appointment_date}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {appointment.appointment_time}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.hospital?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.hospital?.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.doctor?.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.doctor?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{appointment.reason || '-'}</div>
                      {appointment.symptoms && (
                        <div className="text-sm text-gray-500 mt-1">{appointment.symptoms}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">
                          {appointment.status === 'scheduled' && 'Đã lên lịch'}
                          {appointment.status === 'confirmed' && 'Đã xác nhận'}
                          {appointment.status === 'cancelled' && 'Đã hủy'}
                          {appointment.status === 'completed' && 'Hoàn thành'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 p-1" title="Xem chi tiết">
                          <Eye className="h-4 w-4" />
                        </button>
                        {appointment.status === 'scheduled' && (
                          <>
                            <button 
                              onClick={() => handleConfirmAppointment(appointment.id)}
                              className="text-green-600 hover:text-green-900 p-1" 
                              title="Xác nhận"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditAppointment(appointment)}
                              className="text-blue-600 hover:text-blue-900 p-1" 
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleCancelAppointment(appointment.id)}
                              className="text-red-600 hover:text-red-900 p-1" 
                              title="Hủy lịch"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {appointment.status === 'confirmed' && (isDoctor() || isAdmin()) && (
                          <button 
                            onClick={() => handleCompleteAppointment(appointment.id)}
                            className="text-purple-600 hover:text-purple-900 p-1" 
                            title="Hoàn thành"
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

          {(isPatient() ? myAppointments : allAppointments).length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có lịch hẹn nào</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isPatient() 
                  ? 'Bạn chưa có lịch hẹn nào. Hãy đặt lịch hẹn mới!'
                  : 'Chưa có lịch hẹn nào trong hệ thống.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
}