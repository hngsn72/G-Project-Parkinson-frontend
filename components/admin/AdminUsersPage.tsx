'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { HospitalService } from '@/services/hospital.service';
import type { Hospital } from '@/services';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  Stethoscope,
  Eye,
  EyeOff,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import Image from 'next/image';

type AdminUser = {
  id: number;
  user_id: string;
  email: string;
  display_name: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
  phone?: string;
  profile_image?: string;
}

type CreateDoctorData = {
  email: string;
  password: string;
  display_name: string;
  phone?: string;
  hospital_id?: number;
  specialization?: string;
  consultation_fee?: number;
}

export default function AdminUsersPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  
  // State management
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading_data, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Form state
  const [createData, setCreateData] = useState<CreateDoctorData>({
    email: '',
    password: '',
    display_name: '',
    phone: '',
    hospital_id: undefined,
    specialization: '',
    consultation_fee: undefined
  });
  
  const [editData, setEditData] = useState({
    display_name: '',
    email: '',
    role: '',
    status: ''
  });

  const itemsPerPage = 10;

  // Load data
  const loadUsers = useCallback(async () => {
    try {
      setLoadingData(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Không có quyền truy cập hoặc lỗi máy chủ');
      
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  }, []);

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

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
      return;
    }
    
    if (user && !isAdmin()) {
      router.replace('/dashboard');
      return;
    }
    
    if (user && isAdmin()) {
      loadUsers();
      loadHospitals();
    }
  }, [user, loading, isAdmin, router, loadUsers, loadHospitals]);

  // Create new user account (doctor if hospital assigned, regular user otherwise)
  const handleCreateUser = async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      
      // Determine role based on hospital assignment
      const userRole = createData.hospital_id ? 'doctor' : 'user';
      
      // Create user account
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: createData.email,
          password: createData.password,
          display_name: createData.display_name,
          phone: createData.phone,
          role: userRole
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.error || 'Không thể tạo tài khoản');
      }

      const userData = await userResponse.json();
      
      // If hospital is selected, add doctor to hospital
      if (createData.hospital_id && userData.user?.user_id) {
        try {
          const doctorResponse = await HospitalService.addDoctorToHospital(
            createData.hospital_id.toString(),
            {
              doctor_id: userData.user.user_id,
              specialization: createData.specialization || 'Tổng quát',
              consultation_fee: createData.consultation_fee || undefined
            }
          );

          if (!doctorResponse.success) {
            console.warn('User created but failed to add to hospital:', doctorResponse.error);
          }
        } catch (hospitalError) {
          console.warn('User created but failed to add to hospital:', hospitalError);
        }
      }

      const successMessage = createData.hospital_id 
        ? 'Tạo tài khoản bác sĩ thành công!' 
        : 'Tạo tài khoản người dùng thành công!';
      setSuccess(successMessage);
      setShowCreateModal(false);
      setCreateData({
        email: '',
        password: '',
        display_name: '',
        phone: '',
        hospital_id: undefined,
        specialization: '',
        consultation_fee: undefined
      });
      
      // Reload users list
      await loadUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  // Edit user
  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoadingData(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          display_name: editData.display_name,
          email: editData.email,
          role: editData.role,
          status: editData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể cập nhật người dùng');
      }

      setSuccess('Cập nhật người dùng thành công!');
      setShowEditModal(false);
      setSelectedUser(null);
      
      // Reload users list
      await loadUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoadingData(true);
      setError(null);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Không thể xóa người dùng');
      }

      setSuccess('Xóa người dùng thành công!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      
      // Reload users list
      await loadUsers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định');
    } finally {
      setLoadingData(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Helper functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'doctor': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Shield className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'doctor': return <Stethoscope className="h-4 w-4" />;
      case 'patient': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Đang kiểm tra đăng nhập...</span>
      </div>
    );
  }

  // Access control
  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Người dùng</h1>
            <p className="text-gray-600 mt-1">Quản lý tài khoản người dùng và phân quyền trong hệ thống</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Tạo Người Dùng Mới
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="doctor">Bác sĩ</option>
              <option value="patient">Bệnh nhân</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="pending">Chờ xác nhận</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            {success}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading_data ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có người dùng nào</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {filteredUsers.length === 0 ? 'Không tìm thấy người dùng nào phù hợp với bộ lọc.' : 'Bắt đầu bằng cách tạo tài khoản người dùng mới.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.profile_image ? (
                            <Image 
                              src={user.profile_image} 
                              alt={user.display_name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-600 font-medium">
                              {user.display_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.user_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        <span className="ml-1">
                          {user.role === 'super_admin' ? 'Super Admin' : 
                           user.role === 'admin' ? 'Admin' :
                           user.role === 'doctor' ? 'Bác sĩ' :
                           user.role === 'patient' ? 'Bệnh nhân' : user.role}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status === 'active' ? <UserCheck className="h-3 w-3 mr-1" /> : 
                         user.status === 'inactive' ? <UserX className="h-3 w-3 mr-1" /> :
                         <Clock className="h-3 w-3 mr-1" />}
                        {user.status === 'active' ? 'Hoạt động' :
                         user.status === 'inactive' ? 'Không hoạt động' : 
                         user.status === 'pending' ? 'Chờ xác nhận' : user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="h-3 w-3 text-gray-400 mr-1" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center text-gray-500">
                            <span className="text-xs">📞 {user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                          {new Date(user.created_at).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(user.created_at).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setEditData({
                              display_name: user.display_name,
                              email: user.email,
                              role: user.role,
                              status: user.status
                            });
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1" 
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1" 
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filteredUsers.length)} của {filteredUsers.length} kết quả
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Trước
              </button>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Doctor Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Tạo Tài khoản Người dùng Mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Usage Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hướng dẫn:</strong> Nếu bạn không chọn bệnh viện, tài khoản sẽ được tạo với quyền người dùng thường. 
                  Nếu chọn bệnh viện, tài khoản sẽ được tạo với quyền bác sĩ và được phân công vào bệnh viện đó.
                </p>
              </div>

              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={createData.email}
                      onChange={(e) => setCreateData({...createData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="doctor@hospital.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={createData.password}
                        onChange={(e) => setCreateData({...createData, password: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mật khẩu"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên hiển thị *
                    </label>
                    <input
                      type="text"
                      value={createData.display_name}
                      onChange={(e) => setCreateData({...createData, display_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="BS. Nguyễn Văn A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={createData.phone}
                      onChange={(e) => setCreateData({...createData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0123456789"
                    />
                  </div>
                </div>
              </div>

              {/* Hospital Assignment */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Phân công Bệnh viện</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bệnh viện
                    </label>
                    <select
                      value={createData.hospital_id || ''}
                      onChange={(e) => setCreateData({...createData, hospital_id: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn bệnh viện (tùy chọn)</option>
                      {hospitals.map(hospital => (
                        <option key={hospital.id} value={hospital.id}>
                          {hospital.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {createData.hospital_id && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Chuyên khoa
                        </label>
                        <input
                          type="text"
                          value={createData.specialization}
                          onChange={(e) => setCreateData({...createData, specialization: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Tim mạch, Thần kinh..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phí khám (VNĐ)
                        </label>
                        <input
                          type="number"
                          value={createData.consultation_fee || ''}
                          onChange={(e) => setCreateData({...createData, consultation_fee: e.target.value ? parseInt(e.target.value) : undefined})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="200000"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateUser}
                disabled={loading_data || !createData.email || !createData.password || !createData.display_name}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading_data ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Tạo Tài khoản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Chỉnh sửa Người dùng</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên hiển thị
                </label>
                <input
                  type="text"
                  value={editData.display_name}
                  onChange={(e) => setEditData({...editData, display_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="patient">Bệnh nhân</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({...editData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không hoạt động</option>
                  <option value="pending">Chờ xác nhận</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleEditUser}
                disabled={loading_data}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading_data ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Xác nhận Xóa</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-center text-gray-700">
                Bạn có chắc chắn muốn xóa người dùng <strong>{selectedUser.display_name}</strong>?
              </p>
              <p className="text-center text-sm text-gray-500 mt-2">
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading_data}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading_data ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
