'use client';

import { useState, useEffect, useCallback } from 'react';
import { PatientProfile, PatientProfileService } from '@/services/patient-profile.service';
import { User, Plus, Check, ChevronDown } from 'lucide-react';
import PatientProfileModal from './PatientProfileModal';

interface PatientProfileSelectorProps {
  selectedProfileId: number | null;
  onSelectProfile: (profile: PatientProfile | null) => void;
  currentUser?: {
    display_name?: string;
    phone?: string;
    email?: string;
  };
}

export default function PatientProfileSelector({
  selectedProfileId,
  onSelectProfile,
  currentUser
}: PatientProfileSelectorProps) {
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await PatientProfileService.getUserProfiles();
      
      console.log('Load profiles response:', response);
      
      if (response.success && response.data) {
        // Backend returns nested structure: {success, data: {success, data: [...]}}
        const data = response.data as unknown as { data?: PatientProfile[] };
        const profilesData = Array.isArray(data.data) ? data.data : 
                            Array.isArray(response.data) ? response.data : [];
        console.log('Profiles data:', profilesData);
        setProfiles(profilesData);
        
        // Default is always the current user (no profile selected)
        // Don't auto-select any profile
      }
    } catch (error) {
      console.error('Load profiles error:', error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleProfileCreated = async () => {
    setShowModal(false);
    await loadProfiles();
  };

  const handleSelectProfile = (profile: PatientProfile | null) => {
    onSelectProfile(profile);
    setIsOpen(false);
  };

  const selectedProfile = Array.isArray(profiles) ? profiles.find(p => p.id === selectedProfileId) : null;

  const getRelationshipLabel = (relationship?: string) => {
    const labels: Record<string, string> = {
      self: 'Bản thân',
      parent: 'Cha/Mẹ',
      child: 'Con',
      spouse: 'Vợ/Chồng',
      sibling: 'Anh/Chị/Em',
      other: 'Khác'
    };
    return labels[relationship || 'self'] || 'Bản thân';
  };

  return (
    <>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Người khám <span className="text-red-500">*</span>
        </label>
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
        >
          {loading ? (
            <span className="text-gray-500">Đang tải...</span>
          ) : selectedProfile ? (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">{selectedProfile.full_name}</div>
                <div className="text-sm text-gray-500">
                  {getRelationshipLabel(selectedProfile.relationship)} • {selectedProfile.phone}
                </div>
              </div>
            </div>
          ) : currentUser?.display_name ? (
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">{currentUser.display_name} (Bạn)</div>
                <div className="text-sm text-gray-500">
                  {currentUser.phone || currentUser.email || 'Tài khoản chính'}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-gray-500">Chọn người khám</span>
          )}
          <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {/* Current User Option (Always first) */}
              <button
                type="button"
                onClick={() => handleSelectProfile(null)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 ${
                  !selectedProfileId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {currentUser?.display_name || 'Tài khoản của bạn'} (Bạn)
                    </div>
                    <div className="text-sm text-gray-500">
                      {currentUser?.phone || currentUser?.email || 'Tài khoản chính'}
                    </div>
                  </div>
                </div>
                {!selectedProfileId && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </button>

              {/* Family Member Profiles */}
              {Array.isArray(profiles) && profiles.length > 0 && (
                profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSelectProfile(profile)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 ${
                      profile.id === selectedProfileId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-900">{profile.full_name}</div>
                        <div className="text-sm text-gray-500">
                          {getRelationshipLabel(profile.relationship)} • {profile.phone}
                        </div>
                      </div>
                    </div>
                    {profile.id === selectedProfileId && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))
              )}
              
              {/* Add new profile button */}
              <button
                type="button"
                onClick={() => {
                  setShowModal(true);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-t-2 border-gray-200 text-blue-600 font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Thêm hồ sơ bệnh nhân mới</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Create Profile Modal */}
      <PatientProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleProfileCreated}
      />
    </>
  );
}
