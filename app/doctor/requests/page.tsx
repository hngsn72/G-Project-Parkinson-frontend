"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Mail, CheckCircle, XCircle, AlertCircle, FileUser } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import VoiceAnalysisDisplay from '@/components/appointments/VoiceAnalysisDisplay';

interface Patient {
  user_id: string;
  display_name: string;
  email: string;
  phone_number?: string;
}

interface Hospital {
  id: number;
  hospital_name: string;
  address?: string;
  phone?: string;
}

interface Appointment {
  id: number;
  patient_id: string;
  doctor_id: string;
  hospital_id: number;
  appointment_date: string;
  time_slot: string;
  session: string;
  appointment_type?: string;
  status: string;
  patient_name?: string;
  patient_phone?: string;
  patient_age?: number;
  patient_gender?: string;
  symptoms?: string;
  notes?: string;
  urgency?: string;
  voice_analysis_ids?: string[]; // Session IDs of attached voice analyses
  created_at: string;
  Patient?: Patient;
  Hospital?: Hospital;
}

export default function DoctorRequestsPage() {
  const [requests, setRequests] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [appointmentToConfirm, setAppointmentToConfirm] = useState<Appointment | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [appointmentToReject, setAppointmentToReject] = useState<Appointment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Patient profile dialog
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/appointments/doctor/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách yêu cầu');
      }

      const data = await response.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleConfirmClick = (appointment: Appointment) => {
    setAppointmentToConfirm(appointment);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAppointment = async () => {
    if (!appointmentToConfirm) return;

    try {
      setConfirming(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/v1/appointments/${appointmentToConfirm.id}/confirm`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể xác nhận lịch hẹn');
      }

      await fetchRequests();
      setConfirmDialogOpen(false);
      setAppointmentToConfirm(null);
    } catch (err) {
      console.error('Error confirming appointment:', err);
      alert('Không thể xác nhận lịch hẹn. Vui lòng thử lại.');
    } finally {
      setConfirming(false);
    }
  };

  const handleRejectClick = (appointment: Appointment) => {
    setAppointmentToReject(appointment);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectAppointment = async () => {
    if (!appointmentToReject) return;

    try {
      setRejecting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/v1/appointments/${appointmentToReject.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectReason || "Bác sĩ từ chối yêu cầu"
        })
      });

      if (!response.ok) {
        throw new Error('Không thể từ chối lịch hẹn');
      }

      await fetchRequests();
      setRejectDialogOpen(false);
      setAppointmentToReject(null);
      setRejectReason("");
    } catch (err) {
      console.error('Error rejecting appointment:', err);
      alert('Không thể từ chối lịch hẹn. Vui lòng thử lại.');
    } finally {
      setRejecting(false);
    }
  };

  const handleViewProfile = (appointment: Appointment) => {
    setSelectedPatient(appointment);
    setProfileDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSessionLabel = (session: string) => {
    const sessions: { [key: string]: string } = {
      morning: 'Buổi sáng',
      afternoon: 'Buổi chiều',
      evening: 'Buổi tối'
    };
    return sessions[session] || session;
  };

  const getAppointmentTypeBadge = (type?: string) => {
    if (!type) return null;
    const types: { [key: string]: { label: string; color: string } } = {
      regular: { label: 'Khám lần đầu', color: 'bg-blue-100 text-blue-800' },
      follow_up: { label: 'Tái khám', color: 'bg-green-100 text-green-800' }
    };
    const badge = types[type];
    return badge ? <Badge className={badge.color}>{badge.label}</Badge> : null;
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    const urgencies: { [key: string]: { label: string; color: string } } = {
      normal: { label: 'Bình thường', color: 'bg-gray-100 text-gray-800' },
      urgent: { label: 'Khẩn', color: 'bg-orange-100 text-orange-800' },
      emergency: { label: 'Cấp cứu', color: 'bg-red-100 text-red-800' }
    };
    const badge = urgencies[urgency];
    return badge ? <Badge className={badge.color}>{badge.label}</Badge> : null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertCircle className="w-12 h-12 mx-auto mb-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Yêu cầu đặt lịch khám</h1>
        <p className="text-gray-600">
          Quản lý các yêu cầu đặt lịch khám từ bệnh nhân ({requests.length} yêu cầu đang chờ)
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Không có yêu cầu đặt lịch nào đang chờ</p>
              <p className="text-gray-400 text-sm mt-2">Tất cả yêu cầu đã được xử lý</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {request.patient_name || request.Patient?.display_name || 'Bệnh nhân'}
                      {request.patient_age && (
                        <span className="text-sm text-gray-500 font-normal">
                          - {request.patient_age} tuổi
                        </span>
                      )}
                      {request.patient_gender && (
                        <span className="text-sm text-gray-500 font-normal">
                          - {request.patient_gender === 'male' ? 'Nam' : request.patient_gender === 'female' ? 'Nữ' : 'Khác'}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      {request.patient_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {request.patient_phone}
                        </span>
                      )}
                      {request.Patient?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {request.Patient.email}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getAppointmentTypeBadge(request.appointment_type)}
                    {getUrgencyBadge(request.urgency)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Ngày khám:</span>
                      <span>{formatDate(request.appointment_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Giờ khám:</span>
                      <span>{getSessionLabel(request.session)} - {request.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm col-span-full">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Bệnh viện:</span>
                      <span>{request.Hospital?.hospital_name}</span>
                    </div>
                  </div>

                  {/* Symptoms */}
                  {request.symptoms && (
                    <div className="bg-yellow-50 p-3 rounded-md">
                      <div className="font-medium text-sm mb-1">Triệu chứng:</div>
                      <p className="text-sm text-gray-700">{request.symptoms}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {request.notes && (
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="font-medium text-sm mb-1">Ghi chú:</div>
                      <p className="text-sm text-gray-700">{request.notes}</p>
                    </div>
                  )}

                  {/* Voice Analysis Results */}
                  {request.voice_analysis_ids && request.voice_analysis_ids.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
                      <div className="font-medium text-sm mb-3 text-purple-900">Kết quả phát hiện giọng nói đính kèm:</div>
                      <VoiceAnalysisDisplay sessionIds={request.voice_analysis_ids} />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewProfile(request)}
                    >
                      <FileUser className="w-4 h-4 mr-1" />
                      Xem hồ sơ bệnh nhân
                    </Button>
                    <div className="flex-1"></div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectClick(request)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Từ chối
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConfirmClick(request)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Xác nhận
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận lịch hẹn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xác nhận lịch hẹn này?
            </DialogDescription>
          </DialogHeader>
          {appointmentToConfirm && (
            <div className="space-y-2 text-sm">
              <p><strong>Bệnh nhân:</strong> {appointmentToConfirm.patient_name}</p>
              <p><strong>Ngày khám:</strong> {formatDate(appointmentToConfirm.appointment_date)}</p>
              <p><strong>Giờ khám:</strong> {getSessionLabel(appointmentToConfirm.session)} - {appointmentToConfirm.time_slot}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={confirming}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmAppointment}
              disabled={confirming}
              className="bg-green-600 hover:bg-green-700"
            >
              {confirming ? 'Đang xác nhận...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối lịch hẹn</DialogTitle>
            <DialogDescription>
              Vui lòng cho biết lý do từ chối lịch hẹn này.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Lý do từ chối *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejecting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectAppointment}
              disabled={rejecting || !rejectReason.trim()}
            >
              {rejecting ? 'Đang từ chối...' : 'Từ chối'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hồ sơ bệnh nhân</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Họ tên</Label>
                  <p className="font-medium">{selectedPatient.patient_name || selectedPatient.Patient?.display_name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Tuổi</Label>
                  <p className="font-medium">{selectedPatient.patient_age || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Giới tính</Label>
                  <p className="font-medium">
                    {selectedPatient.patient_gender === 'male' ? 'Nam' : 
                     selectedPatient.patient_gender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Số điện thoại</Label>
                  <p className="font-medium">{selectedPatient.patient_phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedPatient.Patient?.email || 'N/A'}</p>
                </div>
              </div>
              
              {selectedPatient.symptoms && (
                <div>
                  <Label className="text-gray-500">Triệu chứng</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedPatient.symptoms}</p>
                </div>
              )}
              
              {selectedPatient.notes && (
                <div>
                  <Label className="text-gray-500">Ghi chú</Label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-md">{selectedPatient.notes}</p>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Đây là thông tin cơ bản. Hồ sơ bệnh án chi tiết sẽ được hiển thị sau khi xác nhận lịch hẹn.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setProfileDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
