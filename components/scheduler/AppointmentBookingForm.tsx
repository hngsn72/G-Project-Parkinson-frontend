"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AppointmentData } from "../scheduler/SchedulerPage";
import { HospitalService } from '@/services/hospital.service';
import type { Hospital, HospitalDoctor } from '@/services';
import PatientProfileSelector from '../patient-profile/PatientProfileSelector';
import { PatientProfile } from '@/services/patient-profile.service';

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentData) => void;
}

interface Doctor {
  doctor_id: string;
  doctor_name: string;
  specialization: string;
  consultation_fee?: number;
}

export default function AppointmentForm({ open, onClose, onSubmit }: AppointmentFormProps) {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<HospitalDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);
  
  const [form, setForm] = useState({
    doctor_id: "",
    hospital_id: 0,
    appointment_date: "",
    time_slot: "morning" as 'morning' | 'afternoon' | 'evening',
    patient_profile_id: 0,
    patient_name: "",
    patient_phone: "",
    patient_age: "",
    patient_gender: "" as 'male' | 'female' | '',
    symptoms: "",
    notes: "",
    urgency: "normal" as 'normal' | 'urgent' | 'emergency',
  });

  // Load hospitals when component mounts
  useEffect(() => {
    if (open) {
      loadHospitals();
    }
  }, [open]);

  // Load doctors when hospital changes
  useEffect(() => {
    if (form.hospital_id > 0) {
      loadDoctors(form.hospital_id);
    } else {
      setDoctors([]);
    }
  }, [form.hospital_id]);

  // Update form when profile is selected
  useEffect(() => {
    if (selectedProfile) {
      setForm(prev => ({
        ...prev,
        patient_profile_id: selectedProfile.id,
        patient_name: selectedProfile.full_name,
        patient_phone: selectedProfile.phone,
        patient_age: selectedProfile.date_of_birth ? 
          String(new Date().getFullYear() - new Date(selectedProfile.date_of_birth).getFullYear()) : 
          "",
        patient_gender: selectedProfile.gender === 'male' || selectedProfile.gender === 'female' ? 
          selectedProfile.gender : '',
      }));
    }
  }, [selectedProfile]);

  const loadHospitals = async () => {
    try {
      const response = await HospitalService.getAllHospitals({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setHospitals(response.data.data);
      }
    } catch (e) {
      console.error('Failed to load hospitals:', e);
    }
  };

  const loadDoctors = async (hospitalId: number) => {
    try {
      setLoadingDoctors(true);
      const response = await HospitalService.getHospitalDoctors(hospitalId.toString());
      if (response.success && response.data) {
        setDoctors(response.data);
      }
    } catch (e) {
      console.error('Failed to load doctors:', e);
    } finally {
      setLoadingDoctors(false);
    }
  };

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfile) {
      alert('Vui lòng chọn người khám');
      return;
    }

    const newAppointment: AppointmentData = {
      id: Date.now(),
      patient_id: "", // Will be set by backend
      doctor_id: form.doctor_id,
      hospital_id: form.hospital_id,
      appointment_date: form.appointment_date,
      time_slot: form.time_slot,
      patient_profile_id: selectedProfile.id,
      patient_name: form.patient_name,
      patient_phone: form.patient_phone,
      patient_age: form.patient_age ? parseInt(form.patient_age) : undefined,
      patient_gender: form.patient_gender || undefined,
      symptoms: form.symptoms,
      notes: form.notes,
      urgency: form.urgency,
      status: "pending",
      hospital_name: hospitals.find(h => h.id === form.hospital_id)?.name || "",
      doctor_name: doctors.find(d => d.doctor_id === form.doctor_id)?.doctor?.display_name || "",
    };

    onSubmit(newAppointment);
    setSelectedProfile(null);
    setForm({
      doctor_id: "",
      hospital_id: 0,
      appointment_date: "",
      time_slot: "morning",
      patient_profile_id: 0,
      patient_name: "",
      patient_phone: "",
      patient_age: "",
      patient_gender: "",
      symptoms: "",
      notes: "",
      urgency: "normal",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Đặt Lịch Khám Mới
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bệnh viện *
            </label>
            <select
              required
              value={form.hospital_id}
              onChange={(e) => setForm({ ...form, hospital_id: parseInt(e.target.value), doctor_id: "" })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Chọn bệnh viện</option>
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bác sĩ *
            </label>
            <select
              required
              value={form.doctor_id}
              onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
              disabled={form.hospital_id === 0 || loadingDoctors}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">
                {form.hospital_id === 0 ? "Vui lòng chọn bệnh viện trước" : 
                 loadingDoctors ? "Đang tải..." : "Chọn bác sĩ"}
              </option>
              {doctors.map((doctor) => (
                <option key={doctor.doctor_id} value={doctor.doctor_id}>
                  {doctor.doctor?.display_name || 'Unknown Doctor'} - {doctor.department || 'General'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ngày khám *
            </label>
            <input
              type="date"
              required
              value={form.appointment_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buổi khám *
            </label>
            <select
              required
              value={form.time_slot}
              onChange={(e) => setForm({ ...form, time_slot: e.target.value as 'morning' | 'afternoon' | 'evening' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="morning">Buổi sáng (8:00 - 12:00)</option>
              <option value="afternoon">Buổi chiều (13:00 - 17:00)</option>
              <option value="evening">Buổi tối (18:00 - 21:00)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Thời gian cụ thể sẽ được xác nhận sau khi bác sĩ duyệt lịch hẹn
            </p>
          </div>

          {/* Patient Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Thông tin bệnh nhân</h3>
            
            {/* Patient Profile Selector */}
            <div className="mb-4">
              <PatientProfileSelector
                selectedProfileId={selectedProfile?.id || null}
                onSelectProfile={(profile) => setSelectedProfile(profile)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={form.patient_name}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Tự động điền từ hồ sơ bệnh nhân</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={form.patient_phone}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Tự động điền từ hồ sơ bệnh nhân</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tuổi
                </label>
                <input
                  type="text"
                  value={form.patient_age}
                  readOnly
                  placeholder="Chưa có thông tin"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <input
                  type="text"
                  value={form.patient_gender === 'male' ? 'Nam' : form.patient_gender === 'female' ? 'Nữ' : 'Chưa có thông tin'}
                  readOnly
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mức độ khẩn cấp
            </label>
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value as 'normal' | 'urgent' | 'emergency' })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Bình thường</option>
              <option value="urgent">Khẩn cấp</option>
              <option value="emergency">Cấp cứu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Triệu chứng (nếu có)
            </label>
            <textarea
              value={form.symptoms}
              onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
              placeholder="Mô tả các triệu chứng hiện tại..."
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú thêm
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Thông tin thêm về tình trạng sức khỏe..."
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
            >
              Đặt lịch khám
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}