'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, User, Calendar as CalendarIcon, Check,
  CheckCircle2, ArrowRight, ArrowLeft, MapPin, Phone, Mail, Award, Clock
} from 'lucide-react';
import { AppointmentService } from '@/services/appointment.service';
import { HospitalService } from '@/services/hospital.service';
import { PatientProfileService, PatientProfile } from '@/services/patient-profile.service';
import { ACCESSIBILITY } from '@/constants/accessibility';

type Step = 1 | 2 | 3 | 4 | 5;

// Backend response types (match exactly with backend)
interface Hospital {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  image?: string;
  status: string;
}

interface User {
  id: number;
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
}

interface HospitalDoctor {
  id: number;
  hospital_id: number;
  doctor_id: string;
  department?: string;
  position?: string;
  specialization?: string;
  consultation_fee?: number;
  status: string;
  doctor?: User; // Backend returns User, not Doctor!
}

interface TimeSlot {
  time: string;
  available: boolean;
  booked_count: number;
}

interface DoctorWithSlots {
  doctor_id: string;
  doctor_name: string;
  department?: string;
  position?: string;
  consultation_fee?: number;
  morning_slots: TimeSlot[];
  afternoon_slots: TimeSlot[];
}

export default function ImprovedSchedulerPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<HospitalDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [patientProfiles, setPatientProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showCreateProfileModal, setShowCreateProfileModal] = useState(false);
  const [newProfileData, setNewProfileData] = useState<{
    full_name: string;
    phone: string;
    email?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    relationship?: 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'other';
  }>({
    full_name: '',
    phone: '',
    relationship: 'self'
  });

  // Load hospitals on mount
  useEffect(() => {
    const loadHospitals = async () => {
      setLoadingHospitals(true);
      try {
        const response = await HospitalService.getAllHospitals({});
        console.log('🏥 Hospital API Response:', response);
        
        if (response.success && response.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = response.data as any;
          console.log('📦 Response data:', data);
          
          // Try different possible response structures
          let hospitalList: Hospital[] = [];
          
          if (Array.isArray(data)) {
            // Response is direct array
            hospitalList = data;
          } else if (data.hospitals && Array.isArray(data.hospitals)) {
            // Response has { hospitals: [...] }
            hospitalList = data.hospitals;
          } else if (data.data && Array.isArray(data.data)) {
            // Response has { data: [...] }
            hospitalList = data.data;
          } else if (data.data && data.data.hospitals && Array.isArray(data.data.hospitals)) {
            // Response has { data: { hospitals: [...] } }
            hospitalList = data.data.hospitals;
          }
          
          console.log('🏥 Parsed hospital list:', hospitalList);
          
          // Filter only active hospitals
          const activeHospitals = hospitalList.filter((h: Hospital) => h.status === 'active');
          console.log('✅ Active hospitals:', activeHospitals);
          
          setHospitals(activeHospitals);
        }
      } catch (error) {
        console.error('❌ Error loading hospitals:', error);
      }
      setLoadingHospitals(false);
    };
    loadHospitals();
  }, []);

  // Handler tạo profile mới
  const handleCreateProfile = async () => {
    if (!newProfileData.full_name || !newProfileData.phone) {
      alert('Vui lòng nhập đầy đủ Họ tên và Số điện thoại');
      return;
    }

    try {
      const response = await PatientProfileService.createProfile({
        full_name: newProfileData.full_name,
        phone: newProfileData.phone,
        email: newProfileData.email,
        date_of_birth: newProfileData.date_of_birth,
        gender: newProfileData.gender,
        relationship: newProfileData.relationship || 'self',
        is_default: patientProfiles.length === 0 // Nếu là profile đầu tiên thì set làm default
      });

      if (response.success && response.data) {
        console.log('✅ Created new profile:', response.data);
        // Thêm vào danh sách
        setPatientProfiles([...patientProfiles, response.data]);
        // Auto-select profile vừa tạo
        setSelectedProfile(response.data);
        // Đóng modal và reset form
        setShowCreateProfileModal(false);
        setNewProfileData({
          full_name: '',
          phone: '',
          relationship: 'self'
        });
      }
    } catch (error) {
      console.error('❌ Error creating profile:', error);
      alert('Không thể tạo hồ sơ. Vui lòng thử lại.');
    }
  };

  // Load patient profiles on mount
  useEffect(() => {
    const loadProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const response = await PatientProfileService.getUserProfiles();
        console.log('👤 Patient Profile API Response:', response);
        
        if (response.success && response.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = response.data as any;
          console.log('📦 Raw profile data:', data);
          
          // Try different response structures
          let profiles: PatientProfile[] = [];
          if (Array.isArray(data)) {
            profiles = data;
          } else if (data.profiles && Array.isArray(data.profiles)) {
            profiles = data.profiles;
          } else if (data.data && Array.isArray(data.data)) {
            profiles = data.data;
          }
          
          console.log('✅ Parsed profiles:', profiles);
          console.log('📊 Total profiles:', profiles.length);
          
          setPatientProfiles(profiles);
          
          // Auto-select default profile OR first profile
          const defaultProfile = profiles.find(p => p.is_default);
          const profileToSelect = defaultProfile || profiles[0];
          
          if (profileToSelect) {
            console.log('🎯 Auto-selected profile:', profileToSelect);
            setSelectedProfile(profileToSelect);
          } else {
            console.log('⚠️ No profiles found - user needs to create one');
          }
        } else {
          console.log('❌ API response not successful or no data');
        }
      } catch (error) {
        console.error('❌ Error loading profiles:', error);
      }
      setLoadingProfiles(false);
    };
    loadProfiles();
  }, []);

  // Load doctors when hospital is selected
  useEffect(() => {
    const loadDoctors = async () => {
      if (!selectedHospital) {
        setDoctors([]);
        return;
      }
      setLoadingDoctors(true);
      try {
        const response = await HospitalService.getHospitalDoctors(selectedHospital.id.toString());
        console.log('👨‍⚕️ Doctor API Response:', response);
        
        if (response.success && response.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = response.data as any;
          console.log('📦 Response data:', data);
          
          // Try different possible response structures
          let doctorList: HospitalDoctor[] = [];
          
          if (Array.isArray(data)) {
            // Response is direct array
            doctorList = data;
          } else if (data.doctors && Array.isArray(data.doctors)) {
            // Response has { doctors: [...] }
            doctorList = data.doctors;
          } else if (data.data && Array.isArray(data.data)) {
            // Response has { data: [...] }
            doctorList = data.data;
          }
          
          console.log('👨‍⚕️ Parsed doctor list:', doctorList);
          
          // Filter only active doctors
          const activeDoctors = doctorList.filter(
            (d: HospitalDoctor) => d.status === 'active' && d.doctor?.status === 'active'
          );
          console.log('✅ Active doctors:', activeDoctors);
          
          setDoctors(activeDoctors);
        }
      } catch (error) {
        console.error('❌ Error loading doctors:', error);
      }
      setLoadingDoctors(false);
    };
    loadDoctors();
  }, [selectedHospital]);

  // Load available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate && selectedHospital) {
      loadAvailableSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDoctor, selectedDate, selectedHospital]);

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate || !selectedHospital) return;
    setLoading(true);
    try {
      // Call backend API: GET /api/v1/appointments/hospitals/:hospitalId/doctors/slots?date=YYYY-MM-DD
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8081'}/api/v1/appointments/hospitals/${selectedHospital.id}/doctors/slots?date=${selectedDate}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        const doctors: DoctorWithSlots[] = result.data?.doctors || [];
        const doctorSlots = doctors.find(d => d.doctor_id === selectedDoctor.doctor_id);
        
        if (doctorSlots) {
          // Extract available time slots from morning and afternoon
          const availableTimes: string[] = [];
          
          doctorSlots.morning_slots?.forEach(slot => {
            if (slot.available) availableTimes.push(slot.time);
          });
          
          doctorSlots.afternoon_slots?.forEach(slot => {
            if (slot.available) availableTimes.push(slot.time);
          });
          
          if (availableTimes.length > 0) {
            setAvailableSlots(availableTimes);
          } else {
            // No available slots
            setAvailableSlots([]);
          }
        } else {
          // Doctor not found in response
          setAvailableSlots([]);
        }
      } else {
        throw new Error('Failed to fetch slots');
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      // Fallback to default slots on error
      setAvailableSlots([
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'
      ]);
    }
    setLoading(false);
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleConfirm = async () => {
    if (!selectedHospital || !selectedDoctor || !selectedDate || !selectedTime || !selectedProfile) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const appointmentData = {
        doctor_id: selectedDoctor.doctor_id.toString(),
        hospital_id: selectedHospital.id.toString(),
        appointment_date: selectedDate + 'T00:00:00Z',
        time_slot: selectedTime,
        session: selectedTime < '12:00' ? 'morning' as const : 'afternoon' as const,
        patient_profile_id: selectedProfile.id,
        patient_name: selectedProfile.full_name,
        patient_phone: selectedProfile.phone,
        patient_email: selectedProfile.email,
        patient_age: selectedProfile.date_of_birth ? new Date().getFullYear() - new Date(selectedProfile.date_of_birth).getFullYear() : undefined,
        patient_gender: selectedProfile.gender === 'other' ? undefined : selectedProfile.gender,
        notes: reason,
        urgency: 'normal' as const,
      };

      await AppointmentService.createAppointment(appointmentData);
      alert('Đặt lịch thành công! Vui lòng chờ xác nhận từ bệnh viện.');
      // Reset form
      setCurrentStep(1);
      setSelectedHospital(null);
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      setSelectedProfile(patientProfiles.find(p => p.is_default) || null);
      setReason('');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Đặt lịch thất bại. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  const canProceed = () => {
    if (currentStep === 1) return selectedHospital !== null;
    if (currentStep === 2) return selectedDoctor !== null;
    if (currentStep === 3) return selectedDate !== '' && selectedTime !== '';
    if (currentStep === 4) return selectedProfile !== null;
    return true;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-6 md:px-6 md:py-8 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Đặt lịch khám Parkinson</h1>
        <p className="text-lg md:text-xl opacity-90">Phân tích giọng nói & Đặt lịch khám - 5 bước đơn giản</p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-8 left-0 right-0 h-2 bg-gray-200 rounded-full -z-10">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              />
            </div>

            {[
              { num: 1, label: 'Bệnh viện', icon: Building2 },
              { num: 2, label: 'Bác sĩ', icon: User },
              { num: 3, label: 'Ngày giờ', icon: CalendarIcon },
              { num: 4, label: 'Người khám', icon: User },
              { num: 5, label: 'Xác nhận', icon: Check },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-all ${ currentStep >= step.num
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {currentStep > step.num ? (
                    <Check className="h-8 w-8" />
                  ) : (
                    <step.icon className="h-8 w-8" />
                  )}
                </div>
                <span className={`text-sm font-semibold hidden md:block ${
                  currentStep >= step.num ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-6">
        
        {/* Step 1: Select Hospital */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Bước 1: Chọn bệnh viện chuyên khoa Thần kinh</h2>
            {loadingHospitals && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Đang tải danh sách bệnh viện...</p>
              </div>
            )}
            {!loadingHospitals && hospitals.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <p className="text-gray-600">Không tìm thấy bệnh viện nào</p>
              </div>
            )}
            
            {/* Desktop: 2 Column Grid, Mobile: Single Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {!loadingHospitals && hospitals.map((hospital) => (
              <button
                key={hospital.id}
                onClick={() => setSelectedHospital(hospital)}
                className={`p-4 md:p-6 lg:p-5 rounded-xl md:rounded-2xl border-4 text-left transition-all touch-manipulation w-full ${
                  selectedHospital?.id === hospital.id
                    ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                }`}
                style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="text-4xl md:text-5xl lg:text-4xl">{hospital.image || '🏥'}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl lg:text-lg font-bold text-gray-900 mb-2 md:mb-3 truncate">{hospital.name}</h3>
                    <div className="space-y-1 md:space-y-2 text-sm md:text-base text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                        <span className="line-clamp-2">{hospital.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                        <span>{hospital.phone}</span>
                      </div>
                      {hospital.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{hospital.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedHospital?.id === hospital.id && (
                    <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Bước 2: Chọn bác sĩ chuyên khoa Thần kinh</h2>
            {loadingDoctors && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Đang tải danh sách bác sĩ...</p>
              </div>
            )}
            {!loadingDoctors && doctors.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl">
                <p className="text-gray-600">Không tìm thấy bác sĩ nào tại bệnh viện này</p>
              </div>
            )}
            
            {/* Desktop: 2 Column Grid, Mobile: Single Column */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {!loadingDoctors && doctors.map((hospitalDoctor) => {
              const doctor = hospitalDoctor.doctor;
              if (!doctor) return null;
              return (
                <button
                  key={hospitalDoctor.id}
                  onClick={() => setSelectedDoctor(hospitalDoctor)}
                  className={`p-4 md:p-6 lg:p-5 rounded-xl md:rounded-2xl border-4 text-left transition-all touch-manipulation w-full ${
                    selectedDoctor?.id === hospitalDoctor.id
                      ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                  }`}
                  style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">👨‍⚕️</div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">{doctor.display_name}</h3>
                      <div className="space-y-2 text-base text-gray-600">
                        {hospitalDoctor.specialization && (
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            <span>{hospitalDoctor.specialization}</span>
                          </div>
                        )}
                        {hospitalDoctor.position && (
                          <div className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            <span>Chức vụ: {hospitalDoctor.position}</span>
                          </div>
                        )}
                        {hospitalDoctor.department && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <span>Khoa: {hospitalDoctor.department}</span>
                          </div>
                        )}
                        {hospitalDoctor.consultation_fee && (
                          <div className="text-sm text-green-600 font-semibold">
                            Phí khám: {hospitalDoctor.consultation_fee.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedDoctor?.id === hospitalDoctor.id && (
                      <CheckCircle2 className="h-10 w-10 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Bước 3: Chọn ngày và giờ khám</h2>
            
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
              <label className="block text-lg font-semibold text-gray-900 mb-4">
                <CalendarIcon className="h-6 w-6 inline mr-2 text-blue-600" />
                Chọn ngày khám
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
              />
            </div>

            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  <Clock className="h-6 w-6 inline mr-2 text-blue-600" />
                  Chọn giờ khám
                </label>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-4 rounded-xl border-2 font-semibold transition-all touch-manipulation ${
                          selectedTime === slot
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                        style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTime && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
                <label className="block text-lg font-semibold text-gray-900 mb-4">
                  Lý do khám (tùy chọn)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Nhập lý do khám bệnh hoặc triệu chứng..."
                  className="w-full p-4 text-base border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                  rows={4}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Select Patient Profile */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bước 4: Chọn người khám bệnh</h2>
              {patientProfiles.length > 0 && (
                <button
                  onClick={() => {
                    setNewProfileData({
                      full_name: '',
                      phone: '',
                      relationship: 'parent' // Default to người thân khi bấm nút thêm
                    });
                    setShowCreateProfileModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm md:text-base font-semibold transition-all"
                >
                  + Thêm người thân
                </button>
              )}
            </div>
            
            {loadingProfiles && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Đang tải hồ sơ bệnh nhân...</p>
              </div>
            )}
            
            {/* Hiển thị danh sách profiles */}
            {!loadingProfiles && patientProfiles.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Chọn người cần khám bệnh (bạn hoặc người thân):
                </p>
                {/* Desktop: 2 Column Grid, Mobile: Single Column */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {patientProfiles.map((profile) => {
              const relationshipText = profile.relationship === 'self' ? '👤 Bản thân' 
                : profile.relationship === 'parent' ? '👨‍👩‍👦 Cha/Mẹ'
                : profile.relationship === 'child' ? '👶 Con'
                : profile.relationship === 'spouse' ? '💑 Vợ/Chồng'
                : profile.relationship === 'sibling' ? '👫 Anh/Chị/Em'
                : '👥 Khác';
              
              return (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`p-4 md:p-6 lg:p-5 rounded-xl md:rounded-2xl border-4 text-left transition-all touch-manipulation w-full ${
                    selectedProfile?.id === profile.id
                      ? 'border-blue-500 bg-blue-50 shadow-xl scale-[1.02]'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
                  }`}
                  style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="text-4xl md:text-5xl lg:text-4xl">
                      {profile.relationship === 'self' ? '🙋' : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <h3 className="text-lg md:text-xl lg:text-lg font-bold text-gray-900 truncate">{profile.full_name}</h3>
                        {profile.is_default && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 md:space-y-2 text-sm md:text-base text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{relationshipText}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                          <span>{profile.phone}</span>
                        </div>
                        {profile.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 md:h-5 md:w-5 text-blue-600 flex-shrink-0" />
                            <span>{profile.email}</span>
                          </div>
                        )}
                        {profile.date_of_birth && (
                          <div className="text-sm text-gray-500">
                            Tuổi: {new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear()}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedProfile?.id === profile.id && (
                      <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
                </div>
              </div>
            )}
            
            {!loadingProfiles && patientProfiles.length === 0 && (
              <div className="text-center py-12 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="text-6xl mb-4">🙋</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có hồ sơ khám bệnh</h3>
                <p className="text-gray-600 mb-6">Bạn cần tạo hồ sơ để đặt lịch khám bệnh.<br/>Có thể tạo hồ sơ cho bản thân hoặc người thân.</p>
                <button 
                  onClick={() => {
                    setNewProfileData({
                      full_name: '',
                      phone: '',
                      relationship: 'self' // Default to bản thân khi chưa có profile
                    });
                    setShowCreateProfileModal(true);
                  }}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all shadow-lg text-lg"
                >
                  + Tạo hồ sơ bản thân
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Confirmation */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Bước 5: Xác nhận thông tin</h2>
            
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl shadow-lg border-2 border-blue-200 p-6 md:p-8 space-y-6">
              
              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Bệnh viện
                </h3>
                <p className="text-xl font-semibold text-gray-900">{selectedHospital?.name}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedHospital?.address}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  Bác sĩ
                </h3>
                <p className="text-xl font-semibold text-gray-900">{selectedDoctor?.doctor?.display_name}</p>
                {selectedDoctor?.specialization && (
                  <p className="text-sm text-gray-600 mt-1">Chuyên khoa: {selectedDoctor.specialization}</p>
                )}
                {selectedDoctor?.position && (
                  <p className="text-sm text-gray-600">Chức vụ: {selectedDoctor.position}</p>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md">
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  Thời gian
                </h3>
                <p className="text-xl font-semibold text-gray-900">
                  {new Date(selectedDate).toLocaleDateString('vi-VN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-lg text-gray-700 mt-2">Giờ khám: {selectedTime}</p>
              </div>

              {reason && (
                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="text-lg font-bold text-gray-700 mb-3">Lý do khám</h3>
                  <p className="text-base text-gray-700">{reason}</p>
                </div>
              )}

              <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Lưu ý:</strong> Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục. Mang theo CMND/CCCD và sổ khám bệnh (nếu có).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 pt-6">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center gap-3 px-8 py-5 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold text-lg shadow-lg touch-manipulation"
              style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
            >
              <ArrowLeft className="h-6 w-6" />
              <span>Quay lại</span>
            </button>
          )}
          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 touch-manipulation ${
                canProceed()
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
            >
              <span>Tiếp theo</span>
              <ArrowRight className="h-6 w-6" />
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={`flex items-center justify-center gap-3 px-8 py-5 rounded-2xl font-bold text-lg transition-all shadow-lg flex-1 touch-manipulation ${
                loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
              }`}
              style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <Check className="h-6 w-6" />
                  <span>Xác nhận đặt lịch</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal Tạo Profile Nhanh */}
      {showCreateProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Tạo hồ sơ bệnh nhân</h2>
              
              <div className="space-y-4">
                {/* Họ tên */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Họ và tên <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProfileData.full_name}
                    onChange={(e) => setNewProfileData({...newProfileData, full_name: e.target.value})}
                    placeholder="Nhập họ và tên"
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số điện thoại <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    value={newProfileData.phone}
                    onChange={(e) => setNewProfileData({...newProfileData, phone: e.target.value})}
                    placeholder="Nhập số điện thoại"
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email (tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={newProfileData.email || ''}
                    onChange={(e) => setNewProfileData({...newProfileData, email: e.target.value})}
                    placeholder="Nhập email"
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày sinh (tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={newProfileData.date_of_birth || ''}
                    onChange={(e) => setNewProfileData({...newProfileData, date_of_birth: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giới tính (tùy chọn)
                  </label>
                  <select
                    value={newProfileData.gender || ''}
                    onChange={(e) => setNewProfileData({...newProfileData, gender: e.target.value as 'male' | 'female' | 'other'})}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                {/* Mối quan hệ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mối quan hệ <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={newProfileData.relationship || 'self'}
                    onChange={(e) => setNewProfileData({...newProfileData, relationship: e.target.value as 'self' | 'parent' | 'child' | 'spouse' | 'sibling' | 'other'})}
                    className="w-full p-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="self">Bản thân</option>
                    <option value="parent">Cha/Mẹ</option>
                    <option value="child">Con</option>
                    <option value="spouse">Vợ/Chồng</option>
                    <option value="sibling">Anh/Chị/Em</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    setShowCreateProfileModal(false);
                    setNewProfileData({
                      full_name: '',
                      phone: '',
                      relationship: 'self'
                    });
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateProfile}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-all"
                >
                  Tạo hồ sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
