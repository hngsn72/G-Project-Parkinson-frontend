'use client';

import { useState, useEffect } from 'react';
import { HospitalService } from '@/services/hospital.service';
import type { Hospital, CreateHospitalRequest, HospitalDoctor } from '@/services/hospital.service';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Phone, 
  Mail,
  Building2,
  Users,
  Search,
  Filter,
  X,
  Stethoscope,
  UserPlus
} from 'lucide-react';

type AdminUser = {
  id: number;
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
};

export default function HospitalManagement() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  
  // Doctor management state
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [hospitalDoctors, setHospitalDoctors] = useState<HospitalDoctor[]>([]);
  const [showDoctorsModal, setShowDoctorsModal] = useState(false);
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<AdminUser[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorFormData, setDoctorFormData] = useState({
    specialization: '',
    consultation_fee: 0
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    specializations: [] as string[]
  });

  // Predefined specializations
  const availableSpecializations = [
    'Khoa Nội tổng hợp',
    'Khoa Ngoại tổng hợp', 
    'Khoa Sản phụ khoa',
    'Khoa Nhi',
    'Khoa Tim mạch',
    'Khoa Thần kinh',
    'Khoa Ung bướu',
    'Khoa Tai mũi họng',
    'Khoa Mắt',
    'Khoa Da liễu',
    'Khoa Chỉnh hình',
    'Khoa Phục hồi chức năng'
  ];

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const response = await HospitalService.getAllHospitals({ page: 1, limit: 100 });
      if (response.success && response.data) {
        setHospitals(response.data.data);
      }
    } catch (err) {
      setError('Không thể tải danh sách bệnh viện');
    } finally {
      setLoading(false);
    }
  };

  // Load doctors in a hospital
  const fetchHospitalDoctors = async (hospitalId: number) => {
    try {
      setLoading(true);
      const response = await HospitalService.getHospitalDoctors(hospitalId.toString());
      if (response.success && response.data) {
        setHospitalDoctors(response.data);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setHospitalDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  // Load available doctors (not in any hospital or role = doctor)
  const fetchAvailableDoctors = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/users?role=doctor`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableDoctors(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load available doctors:', err);
    }
  };

  // Open doctors modal
  const handleViewDoctors = async (hospital: Hospital) => {
    setSelectedHospital(hospital);
    setShowDoctorsModal(true);
    await fetchHospitalDoctors(hospital.id);
  };

  // Add doctor to hospital
  const handleAddDoctorToHospital = async () => {
    if (!selectedHospital || !selectedDoctorId) return;
    
    try {
      setLoading(true);
      const response = await HospitalService.addDoctorToHospital(
        selectedHospital.id.toString(),
        {
          doctor_id: selectedDoctorId,
          specialization: doctorFormData.specialization || undefined,
          consultation_fee: doctorFormData.consultation_fee || undefined
        }
      );
      
      if (response.success) {
        alert('Thêm bác sĩ vào bệnh viện thành công!');
        setShowAddDoctorModal(false);
        setSelectedDoctorId('');
        setDoctorFormData({ specialization: '', consultation_fee: 0 });
        await fetchHospitalDoctors(selectedHospital.id);
      } else {
        alert(response.error || 'Không thể thêm bác sĩ');
      }
    } catch (error) {
      console.error('Add doctor error:', error);
      alert('Có lỗi xảy ra khi thêm bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHospital = async () => {
    try {
      setLoading(true);
      const response = await HospitalService.createHospital({
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        specializations: formData.specializations
      });
      
      if (response.success) {
        await fetchHospitals();
        setShowCreateForm(false);
        resetForm();
        alert('Tạo bệnh viện thành công!');
      } else {
        setError(response.error || 'Không thể tạo bệnh viện');
      }
    } catch (error) {
      console.error('Create hospital error:', error);
      setError('Có lỗi xảy ra khi tạo bệnh viện');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHospital = async () => {
    if (!editingHospital) return;
    
    try {
      setLoading(true);
      const response = await HospitalService.updateHospital(editingHospital.id.toString(), {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        specializations: formData.specializations
      });
      
      if (response.success) {
        await fetchHospitals();
        setEditingHospital(null);
        resetForm();
        alert('Cập nhật bệnh viện thành công!');
      } else {
        setError(response.error || 'Không thể cập nhật bệnh viện');
      }
    } catch (error) {
      console.error('Update hospital error:', error);
      setError('Có lỗi xảy ra khi cập nhật bệnh viện');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHospital = async (hospitalId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bệnh viện này?')) return;
    
    try {
      setLoading(true);
      const response = await HospitalService.deleteHospital(hospitalId.toString());
      
      if (response.success) {
        await fetchHospitals();
        alert('Xóa bệnh viện thành công!');
      } else {
        setError(response.error || 'Không thể xóa bệnh viện');
      }
    } catch (error) {
      console.error('Delete hospital error:', error);
      setError('Có lỗi xảy ra khi xóa bệnh viện');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (hospital: Hospital) => {
    setEditingHospital(hospital);
    setFormData({
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone || '',
      email: hospital.email || '',
      description: hospital.description || '',
      specializations: hospital.specializations ? JSON.parse(hospital.specializations) : []
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      description: '',
      specializations: []
    });
    setEditingHospital(null);
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Quản lý Bệnh viện
          </h2>
          <p className="text-gray-600">Tạo, sửa, xóa thông tin bệnh viện</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Thêm bệnh viện
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm bệnh viện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Lọc
        </button>
      </div>

      {/* Hospital List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital) => (
          <div key={hospital.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{hospital.name}</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                  hospital.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {hospital.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(hospital)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Chỉnh sửa"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteHospital(hospital.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Xóa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-2">{hospital.address}</span>
              </div>
              
              {hospital.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{hospital.phone}</span>
                </div>
              )}
              
              {hospital.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span>{hospital.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4 flex-shrink-0" />
                <button
                  onClick={() => handleViewDoctors(hospital)}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Xem danh sách bác sĩ
                </button>
              </div>
            </div>

            {hospital.specializations && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-1">
                  {JSON.parse(hospital.specializations).slice(0, 3).map((spec: string, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {spec}
                    </span>
                  ))}
                  {JSON.parse(hospital.specializations).length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{JSON.parse(hospital.specializations).length - 3} khác
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingHospital ? 'Chỉnh sửa bệnh viện' : 'Thêm bệnh viện mới'}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên bệnh viện *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tên bệnh viện"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập địa chỉ bệnh viện"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Mô tả về bệnh viện"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chuyên khoa
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableSpecializations.map((spec) => (
                      <label key={spec} className="flex items-center space-x-2 text-sm">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => toggleSpecialization(spec)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={editingHospital ? handleUpdateHospital : handleCreateHospital}
                  disabled={!formData.name || !formData.address || loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg"
                >
                  {loading ? 'Đang xử lý...' : editingHospital ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctors Management Modal */}
      {showDoctorsModal && selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold">Bác sĩ tại {selectedHospital.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">Quản lý đội ngũ bác sĩ trong bệnh viện</p>
                </div>
                <button
                  onClick={() => {
                    setShowDoctorsModal(false);
                    setSelectedHospital(null);
                    setHospitalDoctors([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Add Doctor Button */}
              <div className="mb-4">
                <button
                  onClick={() => {
                    fetchAvailableDoctors();
                    setShowAddDoctorModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4" />
                  Thêm bác sĩ
                </button>
              </div>

              {/* Doctors List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Đang tải...</div>
                ) : hospitalDoctors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có bác sĩ nào trong bệnh viện này
                  </div>
                ) : (
                  hospitalDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {doctor.doctor?.display_name || 'N/A'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {doctor.specialization || doctor.department || 'Chưa có chuyên khoa'}
                            </p>
                            {doctor.consultation_fee && (
                              <p className="text-sm text-green-600 font-medium mt-1">
                                Phí khám: {doctor.consultation_fee.toLocaleString('vi-VN')} VNĐ
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            doctor.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {doctor.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoctorModal && selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Thêm bác sĩ vào {selectedHospital.name}</h3>
                <button
                  onClick={() => {
                    setShowAddDoctorModal(false);
                    setSelectedDoctorId('');
                    setDoctorFormData({ specialization: '', consultation_fee: 0 });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn bác sĩ *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {availableDoctors.map((doctor) => (
                      <option key={doctor.user_id} value={doctor.user_id}>
                        {doctor.display_name} ({doctor.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chuyên khoa
                  </label>
                  <input
                    type="text"
                    value={doctorFormData.specialization}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, specialization: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Tim mạch, Thần kinh..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phí khám (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={doctorFormData.consultation_fee}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, consultation_fee: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="200000"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddDoctorModal(false);
                    setSelectedDoctorId('');
                    setDoctorFormData({ specialization: '', consultation_fee: 0 });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddDoctorToHospital}
                  disabled={!selectedDoctorId || loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg"
                >
                  {loading ? 'Đang thêm...' : 'Thêm bác sĩ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
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