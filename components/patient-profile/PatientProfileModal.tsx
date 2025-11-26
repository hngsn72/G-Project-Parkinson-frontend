'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PatientProfile, CreatePatientProfileRequest, PatientProfileService } from '@/services/patient-profile.service';
import { User, AlertCircle } from 'lucide-react';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  profile?: PatientProfile | null;
}

export default function PatientProfileModal({
  isOpen,
  onClose,
  onSuccess,
  profile
}: PatientProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreatePatientProfileRequest>({
    full_name: '',
    phone: '',
    national_id: '',
    date_of_birth: '',
    gender: undefined,
    address: '',
    email: '',
    relationship: 'self',
    blood_type: '',
    allergies: '',
    is_default: false
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone,
        national_id: profile.national_id || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender,
        address: profile.address || '',
        email: profile.email || '',
        relationship: profile.relationship,
        blood_type: profile.blood_type || '',
        allergies: profile.allergies || '',
        is_default: profile.is_default
      });
    } else {
      // Reset form for new profile
      setFormData({
        full_name: '',
        phone: '',
        national_id: '',
        date_of_birth: '',
        gender: undefined,
        address: '',
        email: '',
        relationship: 'self',
        blood_type: '',
        allergies: '',
        is_default: false
      });
    }
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (profile) {
        // Update existing profile
        const response = await PatientProfileService.updateProfile(profile.id, formData);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.error || 'Cập nhật hồ sơ thất bại');
        }
      } else {
        // Create new profile
        const response = await PatientProfileService.createProfile(formData);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.error || 'Tạo hồ sơ thất bại');
        }
      }
    } catch (err) {
      console.error('Profile save error:', err);
      setError('Có lỗi xảy ra khi lưu hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={profile ? 'Cập nhật hồ sơ bệnh nhân' : 'Thêm hồ sơ bệnh nhân mới'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Thông tin cơ bản
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Căn cước công dân
              </label>
              <input
                type="text"
                name="national_id"
                value={formData.national_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="001234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày sinh
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quan hệ
              </label>
              <select
                name="relationship"
                value={formData.relationship || 'self'}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="self">Bản thân</option>
                <option value="parent">Cha/Mẹ</option>
                <option value="child">Con</option>
                <option value="spouse">Vợ/Chồng</option>
                <option value="sibling">Anh/Chị/Em</option>
                <option value="other">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhóm máu
              </label>
              <select
                name="blood_type"
                value={formData.blood_type || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Chọn nhóm máu --</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dị ứng (nếu có)
            </label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ví dụ: Dị ứng thuốc Penicillin, dị ứng hải sản..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_default" className="text-sm font-medium text-gray-700">
              Đặt làm hồ sơ mặc định
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : profile ? 'Cập nhật' : 'Tạo hồ sơ'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
