'use client';
import { useEffect, useState } from 'react';
import { AuthService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PatientProfileService, PatientProfile } from '@/services/patient-profile.service';
import ProfileMedicalReports from './ProfileMedicalReports';
import ProfileDiagnosisHistory from './ProfileDiagnosisHistory';
import { UserCircle, Phone, Calendar, Edit, Save, X, Plus, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Active tab is now a profile ID (0 = personal/self)
  const [activeProfileId, setActiveProfileId] = useState<number>(0);
  
  // Personal info (main account)
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [editingPersonal, setEditingPersonal] = useState(false);
  
  // All profiles (including self + family)
  const [allProfiles, setAllProfiles] = useState<PatientProfile[]>([]);
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PatientProfile>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [, setLoadingProfiles] = useState(false);

  // Add new profile form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileData, setNewProfileData] = useState<Partial<PatientProfile>>({
    relationship: 'parent'
  });

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      console.log('=== ProfilePage user loaded ===');
      console.log('user.id:', user.id);
      console.log('user.user_id:', user.user_id);
      console.log('user.display_name:', user.display_name);
      loadPersonalInfo();
      loadAllProfiles();
    }
  }, [user]);

  const loadPersonalInfo = async () => {
    const res = await AuthService.me();
    if (res.success && res.data) {
      setDisplayName(res.data.display_name);
      setEmail(res.data.email);
    }
  };

  const loadAllProfiles = async () => {
    setLoadingProfiles(true);
    const res = await PatientProfileService.getUserProfiles();
    if (res.success && res.data) {
      const profiles = Array.isArray(res.data) ? res.data : ((res.data as { data?: PatientProfile[] }).data || []);
      setAllProfiles(profiles);
    }
    setLoadingProfiles(false);
  };

  const handleSavePersonal = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/user/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('access_token') : ''}`,
      },
      body: JSON.stringify({ display_name: displayName, email }),
    });
    setMessage(res.ok ? 'Đã lưu thông tin cá nhân' : 'Lỗi lưu thay đổi');
    setEditingPersonal(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditProfile = (profile: PatientProfile) => {
    setEditingProfileId(profile.id);
    setEditFormData(profile);
  };

  const handleCancelEdit = () => {
    setEditingProfileId(null);
    setEditFormData({});
  };

  const handleSaveProfile = async (profileId: number) => {
    const res = await PatientProfileService.updateProfile(profileId, editFormData);
    if (res.success) {
      setMessage('Đã cập nhật hồ sơ');
      setEditingProfileId(null);
      setEditFormData({});
      loadAllProfiles();
    } else {
      setMessage('Lỗi cập nhật hồ sơ');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteProfile = async (profileId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) return;
    
    const res = await PatientProfileService.deleteProfile(profileId);
    if (res.success) {
      setMessage('Đã xóa hồ sơ');
      loadAllProfiles();
      // Switch to personal tab if deleted profile was active
      if (activeProfileId === profileId) {
        setActiveProfileId(0);
      }
    } else {
      setMessage('Lỗi xóa hồ sơ');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddProfile = async () => {
    if (!newProfileData.full_name) {
      setMessage('Vui lòng nhập họ tên');
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // Ensure phone is provided or use empty string
    const profileData = {
      full_name: newProfileData.full_name,
      phone: newProfileData.phone || '',
      relationship: newProfileData.relationship || 'other',
      date_of_birth: newProfileData.date_of_birth,
      gender: newProfileData.gender,
      email: newProfileData.email,
      address: newProfileData.address,
    };

    const res = await PatientProfileService.createProfile(profileData);
    if (res.success) {
      setMessage('Đã thêm hồ sơ mới');
      setShowAddForm(false);
      setNewProfileData({ relationship: 'parent' });
      loadAllProfiles();
    } else {
      setMessage('Lỗi thêm hồ sơ');
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const getActiveProfile = () => {
    if (activeProfileId === 0) return null; // Personal tab
    return allProfiles.find(p => p.id === activeProfileId);
  };

  const getRelationshipLabel = (relationship?: string) => {
    if (!relationship) return 'Khác';
    const labels: Record<string, string> = {
      self: 'Bản thân',
      parent: 'Cha/Mẹ',
      child: 'Con',
      spouse: 'Vợ/Chồng',
      sibling: 'Anh/Chị/Em',
      other: 'Khác'
    };
    return labels[relationship] || relationship;
  };

  if (loading) {
    return <div className="p-6">Đang tải...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hồ sơ sức khỏe</h1>
        <p className="text-gray-600">Quản lý thông tin cá nhân và lịch sử khám bệnh</p>
      </div>

      {message && (
        <div className={`p-3 rounded ${message.includes('Lỗi') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Dynamic Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {/* Personal Tab (Main Account) */}
            <button
              onClick={() => setActiveProfileId(0)}
              className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeProfileId === 0
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <span>Hồ sơ của {displayName || 'Tôi'}</span>
              </div>
            </button>

            {/* Family Member Tabs */}
            {allProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setActiveProfileId(profile.id)}
                className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeProfileId === profile.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  <span>Hồ sơ của {profile.full_name}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {getRelationshipLabel(profile.relationship)}
                  </span>
                </div>
              </button>
            ))}

            {/* Add Profile Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="py-4 px-6 border-b-2 border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300 font-medium text-sm whitespace-nowrap"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span>Thêm người thân</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Personal Tab (activeProfileId === 0) */}
          {activeProfileId === 0 && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h3>
                  {!editingPersonal && (
                    <button
                      onClick={() => setEditingPersonal(true)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-sm font-medium">Chỉnh sửa</span>
                    </button>
                  )}
                </div>

                {!editingPersonal ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                      <p className="text-gray-900">{displayName || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-gray-900">{email || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên hiển thị</label>
                        <input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          className="w-full border rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSavePersonal}
                        className="flex items-center gap-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4" />
                        Lưu
                      </button>
                      <button
                        onClick={() => {
                          setEditingPersonal(false);
                          loadPersonalInfo();
                        }}
                        className="flex items-center gap-2 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300"
                      >
                        <X className="h-4 w-4" />
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Medical Reports for Personal Profile */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ProfileMedicalReports 
                  patientId={user?.user_id || ''} 
                  profileName={displayName || 'Bản thân'}
                />
              </div>

              {/* Diagnosis History for Personal Profile */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ProfileDiagnosisHistory 
                  profileId={null}
                  profileName={displayName || 'Bản thân'}
                />
              </div>
            </div>
          )}

          {/* Family Member Tabs */}
          {activeProfileId !== 0 && (() => {
            const profile = getActiveProfile();
            if (!profile) return <div>Không tìm thấy hồ sơ</div>;

            return (
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Thông tin hồ sơ</h3>
                    <div className="flex gap-2">
                      {editingProfileId !== profile.id && (
                        <>
                          <button
                            onClick={() => handleEditProfile(profile)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="text-sm font-medium">Sửa</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="text-sm font-medium">Xóa</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingProfileId === profile.id ? (
                    // Edit Mode
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                          <input
                            value={editFormData.full_name || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                          <input
                            value={editFormData.phone || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                          <input
                            type="date"
                            value={editFormData.date_of_birth || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, date_of_birth: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                          <select
                            value={editFormData.gender || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'male' | 'female' | 'other' })}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="">Chọn giới tính</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mối quan hệ</label>
                          <select
                            value={editFormData.relationship || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, relationship: e.target.value as PatientProfile['relationship'] })}
                            className="w-full border rounded px-3 py-2"
                          >
                            <option value="parent">Cha/Mẹ</option>
                            <option value="child">Con</option>
                            <option value="spouse">Vợ/Chồng</option>
                            <option value="sibling">Anh/Chị/Em</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={editFormData.email || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                          <input
                            value={editFormData.address || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleSaveProfile(profile.id)}
                          className="flex items-center gap-2 bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700"
                        >
                          <Save className="h-4 w-4" />
                          Lưu
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-2 bg-gray-200 text-gray-700 rounded px-4 py-2 hover:bg-gray-300"
                        >
                          <X className="h-4 w-4" />
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Họ tên:</span>
                        <span className="ml-2 text-gray-900 font-medium">{profile.full_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mối quan hệ:</span>
                        <span className="ml-2 text-gray-900">{getRelationshipLabel(profile.relationship)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Số điện thoại:</span>
                        <span className="text-gray-900">{profile.phone || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2 text-gray-900">{profile.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Ngày sinh:</span>
                        <span className="text-gray-900">
                          {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Giới tính:</span>
                        <span className="ml-2 text-gray-900">
                          {profile.gender === 'male' && 'Nam'}
                          {profile.gender === 'female' && 'Nữ'}
                          {profile.gender === 'other' && 'Khác'}
                          {!profile.gender && '—'}
                        </span>
                      </div>
                      {profile.address && (
                        <div className="md:col-span-2">
                          <span className="text-gray-500">Địa chỉ:</span>
                          <span className="ml-2 text-gray-900">{profile.address}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Medical Reports for this Family Member */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <ProfileMedicalReports 
                    profileId={profile.id}
                    patientId={user?.user_id || ''}
                    profileName={profile.full_name}
                  />
                </div>

                {/* Diagnosis History for this Family Member */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <ProfileDiagnosisHistory 
                    profileId={profile.id}
                    profileName={profile.full_name}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Add Profile Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Thêm hồ sơ người thân</h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewProfileData({ relationship: 'parent' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                  <input
                    value={newProfileData.full_name || ''}
                    onChange={(e) => setNewProfileData({ ...newProfileData, full_name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mối quan hệ *</label>
                  <select
                    value={newProfileData.relationship || 'parent'}
                    onChange={(e) => setNewProfileData({ ...newProfileData, relationship: e.target.value as PatientProfile['relationship'] })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="parent">Cha/Mẹ</option>
                    <option value="child">Con</option>
                    <option value="spouse">Vợ/Chồng</option>
                    <option value="sibling">Anh/Chị/Em</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    value={newProfileData.phone || ''}
                    onChange={(e) => setNewProfileData({ ...newProfileData, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={newProfileData.date_of_birth || ''}
                    onChange={(e) => setNewProfileData({ ...newProfileData, date_of_birth: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                  <select
                    value={newProfileData.gender || ''}
                    onChange={(e) => setNewProfileData({ ...newProfileData, gender: e.target.value as 'male' | 'female' | 'other' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newProfileData.email || ''}
                    onChange={(e) => setNewProfileData({ ...newProfileData, email: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="email@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    value={newProfileData.address || ''}
                    onChange={(e) => setNewProfileData({ ...newProfileData, address: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewProfileData({ relationship: 'parent' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleAddProfile}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Thêm hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
