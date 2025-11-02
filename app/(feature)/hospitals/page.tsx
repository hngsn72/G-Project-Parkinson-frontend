'use client';

import { useState, useEffect, useCallback } from 'react';
import { HospitalService } from '@/services/hospital.service';
import type { Hospital, HospitalDoctor } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download
} from 'lucide-react';

export default function HospitalManagementPage() {
  const { isAdmin, isDoctor } = useAuth();
  const [activeTab, setActiveTab] = useState<'hospitals' | 'doctors'>('hospitals');
  
  // Hospital state
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  
  // Doctor state
  const [hospitalDoctors, setHospitalDoctors] = useState<HospitalDoctor[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Define permissions
  const canViewHospitals = isAdmin() || isDoctor();
  const canManageHospitals = isAdmin();

  const fetchHospitals = useCallback(async (params: Record<string, unknown> = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await HospitalService.getAllHospitals({
        page: currentPage,
        limit: 10,
        name: searchQuery || undefined,
        ...params
      });

      if (response.success && response.data) {
        setHospitals(response.data.data);
        setTotalPages(Math.ceil(response.data.total / response.data.limit));
        setTotalItems(response.data.total);
      } else {
        setError(response.error || 'Failed to fetch hospitals');
      }
    } catch {
      setError('An error occurred while fetching hospitals');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    if (canViewHospitals) {
      fetchHospitals();
    }
  }, [canViewHospitals, fetchHospitals]);

  const fetchHospitalDoctors = async (hospitalId: number) => {
    try {
      const response = await HospitalService.getHospitalDoctors(hospitalId.toString());
      if (response.success && response.data) {
        setHospitalDoctors(response.data);
      }
    } catch {
      setError('Không thể tải danh sách bác sĩ');
    }
  };

  // Permission check and component rendering

  const handleDeleteHospital = async (hospitalId: number) => {
    if (!canManageHospitals) return;
    
    if (confirm('Bạn có chắc chắn muốn xóa bệnh viện này?')) {
      try {
        setLoading(true);
        const response = await HospitalService.deleteHospital(hospitalId.toString());
        if (response.success) {
          fetchHospitals(); // Refresh list
          alert('Xóa bệnh viện thành công!');
        } else {
          alert('Lỗi khi xóa bệnh viện: ' + response.error);
        }
      } catch (error) {
        console.error('Error deleting hospital:', error);
        alert('Có lỗi xảy ra khi xóa bệnh viện');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveDoctorFromHospital = async (hospitalId: number, doctorId: string) => {
    if (!confirm('Bạn có chắc chắn muốn gỡ bác sĩ khỏi bệnh viện này?')) return;
    
    try {
      setLoading(true);
      const response = await HospitalService.removeDoctorFromHospital(hospitalId.toString(), doctorId);
      if (response.success) {
        alert('Gỡ bác sĩ thành công!');
        fetchHospitalDoctors(hospitalId);
      } else {
        alert('Lỗi khi gỡ bác sĩ: ' + response.error);
      }
    } catch {
      alert('Có lỗi xảy ra khi gỡ bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <XCircle className="h-4 w-4" />;
      case 'maintenance':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Redirect if no permission
  if (!canViewHospitals) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Không có quyền truy cập!</strong>
          <span className="block sm:inline"> Bạn cần có quyền Admin hoặc Doctor để truy cập trang này.</span>
        </div>
      </div>
    );
  }

  if (loading && hospitals.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Bệnh viện & Bác sĩ</h1>
        <p className="text-gray-600">Quản lý thông tin bệnh viện, bác sĩ và mối quan hệ làm việc</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('hospitals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'hospitals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="inline h-4 w-4 mr-2" />
              Quản lý Bệnh viện
            </button>
            
            <button
              onClick={() => setActiveTab('doctors')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'doctors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline h-4 w-4 mr-2" />
              Bác sĩ trong Bệnh viện
            </button>
          </nav>
        </div>
      </div>

      {/* Hospitals Tab */}
      {activeTab === 'hospitals' && (
        <div className="space-y-6">
          {/* Search and Actions */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bệnh viện..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>

              <div className="flex gap-2">
                {canManageHospitals && (
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm Bệnh viện
                  </button>
                )}
                
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Download className="h-4 w-4" />
                  Xuất Excel
                </button>
              </div>
            </div>
          </div>

          {/* Hospitals List */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bệnh viện
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Địa chỉ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bác sĩ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {hospitals.map((hospital) => (
                    <tr key={hospital.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Building2 className="h-8 w-8 text-blue-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {hospital.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {hospital.slug}
                            </div>
                            {hospital.is_verified && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Đã xác minh
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {hospital.phone && (
                            <div className="flex items-center mb-1">
                              <Phone className="h-3 w-3 text-gray-400 mr-1" />
                              {hospital.phone}
                            </div>
                          )}
                          {hospital.email && (
                            <div className="flex items-center mb-1">
                              <Mail className="h-3 w-3 text-gray-400 mr-1" />
                              {hospital.email}
                            </div>
                          )}
                          {hospital.website && (
                            <div className="flex items-center">
                              <Globe className="h-3 w-3 text-gray-400 mr-1" />
                              <a href={hospital.website} target="_blank" rel="noopener noreferrer" 
                                 className="text-blue-600 hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            {hospital.address}
                          </div>
                          {hospital.city && hospital.province && (
                            <div className="text-xs text-gray-500 mt-1">
                              {hospital.city}, {hospital.province}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(hospital.status)}`}>
                          {getStatusIcon(hospital.status)}
                          <span className="ml-1">
                            {hospital.status === 'active' && 'Hoạt động'}
                            {hospital.status === 'inactive' && 'Không hoạt động'}
                            {hospital.status === 'maintenance' && 'Bảo trì'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {hospital.hospital_doctors?.length || 0} bác sĩ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedHospital(hospital);
                              setActiveTab('doctors');
                              fetchHospitalDoctors(hospital.id);
                            }}
                            className="text-blue-600 hover:text-blue-900 p-1" 
                            title="Xem bác sĩ"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canManageHospitals && (
                            <>
                              <button className="text-green-600 hover:text-green-900 p-1" title="Chỉnh sửa">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteHospital(hospital.id)}
                                className="text-red-600 hover:text-red-900 p-1" 
                                title="Xóa"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Hiển thị {((currentPage - 1) * 10) + 1} đến {Math.min(currentPage * 10, totalItems)} của {totalItems} kết quả
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Hospital Selection */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedHospital ? `Bác sĩ tại ${selectedHospital.name}` : 'Chọn bệnh viện để xem bác sĩ'}
              </h3>
              {selectedHospital && canManageHospitals && (
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <UserPlus className="h-4 w-4" />
                  Thêm Bác sĩ
                </button>
              )}
            </div>

            {!selectedHospital && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.slice(0, 6).map((hospital) => (
                  <div
                    key={hospital.id}
                    onClick={() => {
                      setSelectedHospital(hospital);
                      fetchHospitalDoctors(hospital.id);
                    }}
                    className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{hospital.address}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-500">
                        {hospital.hospital_doctors?.length || 0} bác sĩ
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(hospital.status)}`}>
                        {hospital.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hospital Doctors List */}
          {selectedHospital && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Danh sách bác sĩ - {selectedHospital.name}
                </h3>
                <button
                  onClick={() => setSelectedHospital(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Quay lại
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bác sĩ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chuyên khoa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lịch làm việc
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phí khám
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
                    {hospitalDoctors.map((hospitalDoctor) => (
                      <tr key={hospitalDoctor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {hospitalDoctor.doctor?.display_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {hospitalDoctor.doctor?.email}
                              </div>
                              {hospitalDoctor.is_primary && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                                  <Star className="h-3 w-3 mr-1" />
                                  Bác sĩ chính
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {hospitalDoctor.department || 'Chưa xác định'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {hospitalDoctor.position || 'Chưa xác định'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {hospitalDoctor.morning_hours && (
                              <div className="flex items-center mb-1">
                                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                Sáng: {hospitalDoctor.morning_hours}
                              </div>
                            )}
                            {hospitalDoctor.afternoon_hours && (
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 text-gray-400 mr-1" />
                                Chiều: {hospitalDoctor.afternoon_hours}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                            {hospitalDoctor.consultation_fee 
                              ? hospitalDoctor.consultation_fee.toLocaleString('vi-VN') + 'đ'
                              : 'Chưa xác định'
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(hospitalDoctor.status)}`}>
                            {getStatusIcon(hospitalDoctor.status)}
                            <span className="ml-1">
                              {hospitalDoctor.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {canManageHospitals && (
                              <>
                                <button className="text-green-600 hover:text-green-900 p-1" title="Chỉnh sửa">
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleRemoveDoctorFromHospital(
                                    hospitalDoctor.hospital_id, 
                                    hospitalDoctor.doctor_id
                                  )}
                                  className="text-red-600 hover:text-red-900 p-1" 
                                  title="Gỡ khỏi bệnh viện"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hospitalDoctors.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có bác sĩ nào</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Bệnh viện này chưa có bác sĩ làm việc.
                  </p>
                </div>
              )}
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
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Đang xử lý...</p>
          </div>
        </div>
      )}

      {/* Create Hospital Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Thêm Bệnh viện Mới</h3>
            <p className="text-gray-600 mb-4">Form tạo bệnh viện sẽ được implement sau...</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}