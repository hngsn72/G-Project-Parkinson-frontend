'use client';

import { useState } from 'react';
import { 
  Users, Search, Edit, Trash2, Shield, Mail, Phone, Calendar,
  TrendingUp, Activity, CheckCircle, XCircle
} from 'lucide-react';
import { ACCESSIBILITY } from '@/constants/accessibility';

interface UserData {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  createdAt: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserData[]>([
    { id: 1, name: 'Nguyễn Văn A', email: 'nva@email.com', phone: '0912345678', role: 'patient', status: 'active', createdAt: '2025-01-15' },
    { id: 2, name: 'Trần Thị B', email: 'ttb@email.com', phone: '0987654321', role: 'doctor', status: 'pending', createdAt: '2025-11-20' },
    { id: 3, name: 'Lê Văn C', email: 'lvc@email.com', phone: '0901234567', role: 'patient', status: 'active', createdAt: '2025-10-05' },
    { id: 4, name: 'Phạm Thị D', email: 'ptd@email.com', phone: '0976543210', role: 'admin', status: 'active', createdAt: '2025-09-12' },
    { id: 5, name: 'Hoàng Văn E', email: 'hve@email.com', phone: '0965432109', role: 'doctor', status: 'active', createdAt: '2025-08-25' },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'patient' | 'doctor' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  const handleActivateUser = (id: number) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: 'active' as const } : user
    ));
  };

  const handleDeactivateUser = (id: number) => {
    setUsers(users.map(user => 
      user.id === id ? { ...user, status: 'inactive' as const } : user
    ));
  };

  const handleDeleteUser = (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    pendingUsers: users.filter(u => u.status === 'pending').length,
    doctors: users.filter(u => u.role === 'doctor').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-6 md:px-6 md:py-8 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Quản trị hệ thống</h1>
        <p className="text-lg md:text-xl opacity-90">Quản lý người dùng và quyền truy cập</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base text-gray-600 mb-1">Tổng người dùng</p>
                <p className="text-3xl md:text-4xl font-bold text-blue-600">{stats.totalUsers}</p>
              </div>
              <Users className="h-12 w-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base text-gray-600 mb-1">Hoạt động</p>
                <p className="text-3xl md:text-4xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <Activity className="h-12 w-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base text-gray-600 mb-1">Chờ duyệt</p>
                <p className="text-3xl md:text-4xl font-bold text-yellow-600">{stats.pendingUsers}</p>
              </div>
              <TrendingUp className="h-12 w-12 text-yellow-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm md:text-base text-gray-600 mb-1">Bác sĩ</p>
                <p className="text-3xl md:text-4xl font-bold text-purple-600">{stats.doctors}</p>
              </div>
              <Shield className="h-12 w-12 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="space-y-4">
            {/* Search Bar - Large */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-5 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 transition-all"
                style={{ minHeight: ACCESSIBILITY.touchTarget.large }}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Vai trò:</span>
                {(['all', 'patient', 'doctor', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-5 py-3 rounded-xl font-semibold text-base transition-all touch-manipulation ${
                      roleFilter === role
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ minHeight: ACCESSIBILITY.touchTarget.comfortable }}
                  >
                    {role === 'all' && 'Tất cả'}
                    {role === 'patient' && 'Bệnh nhân'}
                    {role === 'doctor' && 'Bác sĩ'}
                    {role === 'admin' && 'Quản trị'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Trạng thái:</span>
                {(['all', 'active', 'pending', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-5 py-3 rounded-xl font-semibold text-base transition-all touch-manipulation ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ minHeight: ACCESSIBILITY.touchTarget.comfortable }}
                  >
                    {status === 'all' && 'Tất cả'}
                    {status === 'active' && 'Hoạt động'}
                    {status === 'pending' && 'Chờ duyệt'}
                    {status === 'inactive' && 'Khóa'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              Danh sách người dùng ({filteredUsers.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-5 text-left text-base font-bold text-gray-700">Người dùng</th>
                  <th className="px-6 py-5 text-left text-base font-bold text-gray-700">Liên hệ</th>
                  <th className="px-6 py-5 text-left text-base font-bold text-gray-700">Vai trò</th>
                  <th className="px-6 py-5 text-left text-base font-bold text-gray-700">Trạng thái</th>
                  <th className="px-6 py-5 text-left text-base font-bold text-gray-700">Ngày tạo</th>
                  <th className="px-6 py-5 text-center text-base font-bold text-gray-700">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-all">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1 text-base text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{user.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-semibold ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'doctor' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' && '🛡️ Quản trị'}
                        {user.role === 'doctor' && '👨‍⚕️ Bác sĩ'}
                        {user.role === 'patient' && '👤 Bệnh nhân'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-2 rounded-full text-sm font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-800' :
                        user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {user.status === 'active' && '✅ Hoạt động'}
                        {user.status === 'pending' && '⏳ Chờ duyệt'}
                        {user.status === 'inactive' && '🔒 Khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-base text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="p-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all touch-manipulation"
                            title="Kích hoạt"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="p-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all touch-manipulation"
                            title="Khóa"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          className="p-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all touch-manipulation"
                          title="Sửa"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all touch-manipulation"
                          title="Xóa"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center text-gray-500 text-xl">
              Không tìm thấy người dùng nào
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
