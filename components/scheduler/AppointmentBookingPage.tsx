"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { AppointmentService } from '@/services/appointment.service';
import { HospitalService } from '@/services/hospital.service';
import type { Hospital, HospitalDoctor } from '@/services';
import PatientProfileSelector from '../patient-profile/PatientProfileSelector';
import { PatientProfile } from '@/services/patient-profile.service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import TimeSlotPicker from './TimeSlotPicker';
import VoiceAnalysisSelector from '../appointments/VoiceAnalysisSelector';

export default function AppointmentBookingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  const [selectedVoiceAnalysisIds, setSelectedVoiceAnalysisIds] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  
  const [form, setForm] = useState({
    doctor_id: "",
    hospital_id: 0,
    appointment_date: "",
    session: "morning" as 'morning' | 'afternoon',
    specific_time: "",
    symptoms: "",
    notes: "",
    urgency: "normal" as 'normal' | 'urgent' | 'emergency',
    appointment_type: "regular" as 'regular' | 'follow_up',
  });

  // Load hospitals when component mounts
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const response = await HospitalService.getAllHospitals({ page: 1, limit: 100 });
        console.log('Hospitals response:', response);
        if (response.success && response.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = response.data as any;
          const hospitalList = data.data || data.hospitals || (Array.isArray(data) ? data : []);
          console.log('Hospital list:', hospitalList);
          setHospitals(hospitalList.filter((h: Hospital) => h.status === 'active'));
        }
      } catch (e) {
        console.error('Failed to load hospitals:', e);
      } finally {
        setLoadingHospitals(false);
      }
    };
    loadHospitals();
  }, []);

  // Load doctors when hospital changes
  useEffect(() => {
    const loadDoctors = async () => {
      if (form.hospital_id > 0) {
        try {
          setLoadingDoctors(true);
          console.log('Loading doctors for hospital:', form.hospital_id);
          const response = await HospitalService.getHospitalDoctors(form.hospital_id.toString());
          console.log('Doctors response:', response);
          if (response.success && response.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = response.data as any;
            const doctorList = Array.isArray(data) ? data : (data.doctors || []);
            console.log('Doctor list:', doctorList);
            setDoctors(doctorList.filter((d: HospitalDoctor) => d.status === 'active'));
          }
        } catch (e) {
          console.error('Failed to load doctors:', e);
        } finally {
          setLoadingDoctors(false);
        }
      } else {
        setDoctors([]);
      }
    };
    loadDoctors();
  }, [form.hospital_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfile && !user) {
      alert('Vui lòng chọn người khám hoặc đăng nhập');
      return;
    }

    if (!form.specific_time) {
      alert('Vui lòng chọn khung giờ khám');
      return;
    }

    try {
      setSubmitting(true);

      // Calculate age from profile or leave empty
      let patientAge: number | undefined;
      if (selectedProfile?.date_of_birth) {
        patientAge = new Date().getFullYear() - new Date(selectedProfile.date_of_birth).getFullYear();
      }

      const appointmentData = {
        doctor_id: form.doctor_id,
        hospital_id: form.hospital_id.toString(),
        appointment_date: form.appointment_date, // YYYY-MM-DD format only
        time_slot: form.specific_time, // Specific time like "08:00", "08:30"
        session: form.session, // "morning" or "afternoon"
        appointment_type: form.appointment_type,
        patient_profile_id: selectedProfile?.id,
        voice_analysis_ids: selectedVoiceAnalysisIds.length > 0 ? selectedVoiceAnalysisIds : undefined,
        patient_name: selectedProfile?.full_name || user?.display_name || '',
        patient_phone: selectedProfile?.phone || user?.phone || '',
        patient_email: selectedProfile?.email || user?.email,
        patient_age: patientAge,
        patient_gender: selectedProfile?.gender === 'other' ? undefined : selectedProfile?.gender,
        symptoms: form.symptoms || undefined,
        notes: form.notes || undefined,
        urgency: form.urgency,
      };

      const response = await AppointmentService.createAppointment(appointmentData);
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/appointments');
        }, 2000);
      } else {
        alert('Đặt lịch thất bại: ' + (response.error || 'Lỗi không xác định'));
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra khi đặt lịch');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Đặt lịch thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Lịch hẹn của bạn đã được ghi nhận. Vui lòng chờ xác nhận từ bác sĩ.
          </p>
          <p className="text-sm text-gray-500">
            Đang chuyển hướng...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-3">
            <Calendar className="h-10 w-10 md:h-12 md:w-12" />
            <h1 className="text-3xl md:text-4xl font-bold">Đặt lịch khám bệnh</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Phát hiện sớm bệnh Parkinson - Đặt lịch khám với chuyên gia
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            
            {/* Hospital & Doctor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bệnh viện <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={form.hospital_id}
                  onChange={(e) => setForm({ ...form, hospital_id: parseInt(e.target.value), doctor_id: "" })}
                  disabled={loadingHospitals}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value={0}>
                    {loadingHospitals ? 'Đang tải...' : 'Chọn bệnh viện'}
                  </option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bác sĩ <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  disabled={form.hospital_id === 0 || loadingDoctors}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">
                    {form.hospital_id === 0 ? "Chọn bệnh viện trước" : 
                     loadingDoctors ? "Đang tải..." : "Chọn bác sĩ"}
                  </option>
                  {doctors.map((doctor) => (
                    <option key={doctor.doctor_id} value={doctor.doctor_id}>
                      {doctor.doctor?.display_name || 'Bác sĩ'} - {doctor.department || 'Thần kinh'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Session Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ngày khám <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.appointment_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setForm({ ...form, appointment_date: e.target.value, specific_time: "" })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buổi khám <span className="text-red-600">*</span>
                </label>
                <select
                  required
                  value={form.session}
                  onChange={(e) => setForm({ ...form, session: e.target.value as 'morning' | 'afternoon', specific_time: "" })}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="morning">Buổi sáng (7:00 - 11:00)</option>
                  <option value="afternoon">Buổi chiều (13:00 - 17:00)</option>
                </select>
              </div>
            </div>

            {/* Time Slot Picker */}
            {form.doctor_id && form.appointment_date && form.session && (
              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
                <TimeSlotPicker
                  doctorId={form.doctor_id}
                  hospitalId={form.hospital_id}
                  date={form.appointment_date}
                  session={form.session}
                  selectedTime={form.specific_time}
                  onSelectTime={(time) => setForm({ ...form, specific_time: time })}
                />
              </div>
            )}

            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Loại lịch hẹn
              </label>
              <select
                value={form.appointment_type}
                onChange={(e) => setForm({ ...form, appointment_type: e.target.value as 'regular' | 'follow_up' })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="regular">Khám lần đầu</option>
                <option value="follow_up">Tái khám</option>
              </select>
            </div>

            {/* Patient Profile Selector */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin bệnh nhân</h3>
              <PatientProfileSelector
                selectedProfileId={selectedProfile?.id || null}
                onSelectProfile={(profile) => setSelectedProfile(profile)}
                currentUser={user ? {
                  display_name: user.display_name,
                  phone: user.phone,
                  email: user.email
                } : undefined}
              />
            </div>

            {/* Voice Analysis Selector */}
            <div className="border-t-2 border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kết quả phát hiện giọng nói</h3>
              <p className="text-sm text-gray-600 mb-4">
                Đính kèm kết quả phát hiện Parkinson qua giọng nói để bác sĩ tham khảo
              </p>
              <VoiceAnalysisSelector
                profileId={selectedProfile?.id || null}
                selectedIds={selectedVoiceAnalysisIds}
                onSelectionChange={setSelectedVoiceAnalysisIds}
              />
            </div>

            {/* Symptoms & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Triệu chứng
                </label>
                <textarea
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  placeholder="Mô tả triệu chứng hiện tại..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ghi chú thêm
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Thông tin bổ sung..."
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mức độ khẩn cấp
              </label>
              <select
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value as 'normal' | 'urgent' | 'emergency' })}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Bình thường</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="emergency">Cấp cứu</option>
              </select>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Vui lòng đến trước giờ hẹn 15 phút</li>
                    <li>Mang theo CMND/CCCD và sổ khám bệnh (nếu có)</li>
                    <li>Lịch hẹn sẽ được xác nhận sau khi bác sĩ duyệt</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Đang xử lý...
                  </span>
                ) : (
                  'Xác nhận đặt lịch'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
