"use client";

import { useState, useEffect } from "react";
import { PatientProfile, PatientProfileService } from "@/services/patient-profile.service";
import { backendApi } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

interface SaveResultModalProps {
  sessionId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SaveResultModal({ sessionId, onClose, onSuccess }: SaveResultModalProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PatientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [saveToSelf, setSaveToSelf] = useState(true); // Default to saving to self
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setFetching(true);
      const response = await PatientProfileService.getUserProfiles();
      
      console.log('🔍 Raw API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Is array?:', Array.isArray(response));
      console.log('🔍 Has data property?:', response && typeof response === 'object' && 'data' in response);
      
      // Handle API response structure
      let profileData: PatientProfile[] = [];
      if (response && typeof response === 'object') {
        if ('data' in response) {
          console.log('📦 response.data:', response.data);
          console.log('📦 response.data type:', typeof response.data);
          console.log('📦 response.data is array?:', Array.isArray(response.data));
          
          if (Array.isArray(response.data)) {
            profileData = response.data;
          } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
            // Nested data property
            console.log('📦 Nested data:', response.data.data);
            profileData = Array.isArray(response.data.data) ? response.data.data : [];
          }
        } else if (Array.isArray(response)) {
          profileData = response;
        }
      }
      
      console.log('✅ Final profileData:', profileData);
      console.log('✅ profileData length:', profileData.length);
      if (profileData.length > 0) {
        console.log('🔍 First profile details:', {
          id: profileData[0].id,
          name: profileData[0].full_name,
          relationship: profileData[0].relationship,
          is_default: profileData[0].is_default
        });
      }
      
      setProfiles(profileData);
      
      // Don't auto-select any profile - default to "save to self"
      // User can manually select a family member profile if needed
    } catch (error) {
      console.error("❌ Failed to load profiles:", error);
      if (typeof window !== 'undefined' && window.alert) {
        window.alert("Không thể tải danh sách hồ sơ");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      let profileIdToSave = selectedProfileId;
      
      // If saving to self but no profile selected, find or create default profile
      if (saveToSelf) {
        // Check if user already has a default profile
        const defaultProfile = profiles.find(p => p.is_default === true);
        if (defaultProfile) {
          profileIdToSave = defaultProfile.id;
        } else {
          // Need to create a default profile first
          if (typeof window !== 'undefined' && window.confirm) {
            const shouldCreate = window.confirm(
              "Bạn chưa có hồ sơ bệnh nhân. Bạn có muốn tạo hồ sơ để lưu kết quả không?"
            );
            if (!shouldCreate) {
              setLoading(false);
              return;
            }
          }
          
          // Create default profile for user
          try {
            const createResponse = await PatientProfileService.createProfile({
              full_name: user?.display_name || "Người dùng",
              phone: user?.phone || "",
              email: user?.email || "",
              relationship: "self",
              is_default: true,
            });
            
            if (createResponse.success && createResponse.data) {
              // Handle nested response
              const newProfile = 'data' in createResponse.data 
                ? createResponse.data.data 
                : createResponse.data;
              profileIdToSave = newProfile.id;
              
              // Reload profiles
              await loadProfiles();
            } else {
              throw new Error("Failed to create profile");
            }
          } catch (createError) {
            console.error("Failed to create profile:", createError);
            if (typeof window !== 'undefined' && window.alert) {
              window.alert("Không thể tạo hồ sơ bệnh nhân. Vui lòng thử lại.");
            }
            setLoading(false);
            return;
          }
        }
      }
      
      // Validate we have a profile ID
      if (!profileIdToSave) {
        if (typeof window !== 'undefined' && window.alert) {
          window.alert("Vui lòng chọn hồ sơ");
        }
        setLoading(false);
        return;
      }
      
      // Save diagnosis to profile
      await backendApi.put(`/api/v1/diagnosis/${sessionId}/assign-profile`, {
        profile_id: profileIdToSave,
      });

      if (typeof window !== 'undefined' && window.alert) {
        window.alert("Đã lưu kết quả phân tích");
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to save result:", error);
      const errorMessage = error instanceof Error ? error.message : "Không thể lưu kết quả";
      if (typeof window !== 'undefined' && window.alert) {
        window.alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Lưu kết quả phân tích</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-gray-900 font-medium mb-2">Bạn chưa có hồ sơ bệnh nhân nào</p>
            <p className="text-sm text-gray-600 mb-4">
              Để lưu kết quả phân tích, bạn cần tạo hồ sơ bệnh nhân trước
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Hồ sơ bệnh nhân</strong> là thông tin cá nhân của bạn hoặc người thân cần theo dõi sức khỏe.
              </p>
              <p className="text-sm text-blue-700">
                Bạn có thể tạo nhiều hồ sơ để quản lý kết quả phân tích cho bản thân và gia đình.
              </p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Đóng và tạo hồ sơ
            </button>
            <div className="mt-4 p-4 bg-gray-100 rounded text-left text-xs font-mono overflow-auto max-h-40">
              <p className="font-bold mb-2">Debug Info:</p>
              <p>Profiles state: {JSON.stringify(profiles)}</p>
              <p>Profiles length: {profiles.length}</p>
              <p>Check browser console for API response</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Chọn hồ sơ lưu kết quả
              </label>
              <p className="mb-3 text-xs text-gray-500">
                Chọn hồ sơ của bạn hoặc người thân để lưu kết quả phân tích này
              </p>
              <div className="space-y-2">
                {/* Option to save to self (no profile_id) */}
                <button
                  key="self"
                  onClick={() => {
                    setSaveToSelf(true);
                    setSelectedProfileId(null);
                  }}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    saveToSelf
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-purple-300"
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100">
                        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{user?.display_name || 'Tài khoản của tôi'}</div>
                        <span className="text-sm font-medium text-purple-600">Bản thân</span>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                        saveToSelf
                          ? "border-purple-600 bg-purple-600"
                          : "border-gray-300"
                      } flex items-center justify-center`}
                    >
                      {saveToSelf && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth={2} fill="none" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>

                {/* Family member profiles */}
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    onClick={() => {
                      setSaveToSelf(false);
                      setSelectedProfileId(profile.id);
                    }}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      !saveToSelf && selectedProfileId === profile.id
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                    disabled={loading}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{profile.full_name}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{profile.relationship === "parent" ? "Bố/Mẹ" : 
                                 profile.relationship === "child" ? "Con" :
                                 profile.relationship === "spouse" ? "Vợ/Chồng" :
                                 profile.relationship === "sibling" ? "Anh/Chị/Em" :
                                 "Người thân"}</span>
                        </div>
                      </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex-shrink-0 ${
                        !saveToSelf && selectedProfileId === profile.id
                            ? "border-purple-600 bg-purple-600"
                            : "border-gray-300"
                        } flex items-center justify-center`}
                      >
                        {!saveToSelf && selectedProfileId === profile.id && (
                          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth={2} fill="none" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={loading || (!saveToSelf && !selectedProfileId)}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang lưu...
                  </span>
                ) : (
                  "Lưu"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
