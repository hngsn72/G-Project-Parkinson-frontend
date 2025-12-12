"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, MapPin, AlertCircle, XCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface Doctor {
  user_id: string;
  display_name: string;
  email: string;
  specialization?: string;
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
  cancellation_reason?: string;
  diagnosis_notes?: string;
  prescription?: string;
  created_at: string;
  Doctor?: Doctor;
  Hospital?: Hospital;
}

interface GroupedAppointments {
  pending: Appointment[];
  confirmed: Appointment[];
  completed: Appointment[];
  cancelled: Appointment[];
}

interface AppointmentTabsProps {
  backendUrl?: string;
}

const AppointmentTabs: React.FC<AppointmentTabsProps> = ({ backendUrl }) => {
  const [appointments, setAppointments] = useState<GroupedAppointments>({
    pending: [],
    confirmed: [],
    completed: [],
    cancelled: []
  });
  const [counts, setCounts] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("pending");
  
  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const apiUrl = backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập để xem lịch hẹn');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/appointments/my/grouped`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải danh sách lịch hẹn');
      }

      const data = await response.json();
      setAppointments(data.data);
      setCounts(data.counts);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancelClick = (appointment: Appointment) => {
    setAppointmentToCancel(appointment);
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!appointmentToCancel) return;

    try {
      setCancelling(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/v1/appointments/${appointmentToCancel.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancelReason || "Bệnh nhân hủy lịch hẹn"
        })
      });

      if (!response.ok) {
        throw new Error('Không thể hủy lịch hẹn');
      }

      // Refresh appointments
      await fetchAppointments();
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
      setCancelReason("");
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Không thể hủy lịch hẹn. Vui lòng thử lại.');
    } finally {
      setCancelling(false);
    }
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

  const formatTime = (timeSlot: string) => {
    return timeSlot;
  };

  const getSessionLabel = (session: string) => {
    const sessions: { [key: string]: string } = {
      morning: 'Buổi sáng',
      afternoon: 'Buổi chiều',
      evening: 'Buổi tối'
    };
    return sessions[session] || session;
  };

  const getAppointmentTypeLabel = (type?: string) => {
    if (!type) return null;
    const types: { [key: string]: { label: string; color: string } } = {
      regular: { label: 'Khám lần đầu', color: 'bg-blue-100 text-blue-800' },
      follow_up: { label: 'Tái khám', color: 'bg-green-100 text-green-800' }
    };
    return types[type] || null;
  };

  const getUrgencyBadge = (urgency?: string) => {
    if (!urgency) return null;
    const urgencies: { [key: string]: { label: string; color: string } } = {
      normal: { label: 'Bình thường', color: 'bg-gray-100 text-gray-800' },
      urgent: { label: 'Khẩn', color: 'bg-orange-100 text-orange-800' },
      emergency: { label: 'Cấp cứu', color: 'bg-red-100 text-red-800' }
    };
    const badge = urgencies[urgency];
    return badge ? (
      <Badge className={badge.color}>{badge.label}</Badge>
    ) : null;
  };

  const renderAppointmentCard = (appointment: Appointment, status: string) => {
    const appointmentType = getAppointmentTypeLabel(appointment.appointment_type);

    return (
      <Card key={appointment.id} className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                {appointment.Doctor?.display_name || 'Bác sĩ'}
                {appointment.Doctor?.specialization && (
                  <span className="text-sm text-gray-500 font-normal">
                    - {appointment.Doctor.specialization}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                {appointment.Hospital?.hospital_name || 'Bệnh viện'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {appointmentType && (
                <Badge className={appointmentType.color}>{appointmentType.label}</Badge>
              )}
              {getUrgencyBadge(appointment.urgency)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Date and Time */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(appointment.appointment_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{getSessionLabel(appointment.session)} - {formatTime(appointment.time_slot)}</span>
              </div>
            </div>

            {/* Symptoms */}
            {appointment.symptoms && (
              <div className="text-sm">
                <span className="font-medium">Triệu chứng:</span> {appointment.symptoms}
              </div>
            )}

            {/* Notes */}
            {appointment.notes && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Ghi chú:</span> {appointment.notes}
              </div>
            )}

            {/* Cancellation Reason */}
            {status === 'cancelled' && appointment.cancellation_reason && (
              <div className="text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5" />
                <div>
                  <span className="font-medium">Lý do hủy:</span> {appointment.cancellation_reason}
                </div>
              </div>
            )}

            {/* Diagnosis Notes */}
            {status === 'completed' && appointment.diagnosis_notes && (
              <div className="text-sm bg-blue-50 p-3 rounded-md">
                <div className="font-medium flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4" />
                  Chẩn đoán:
                </div>
                <p className="text-gray-700">{appointment.diagnosis_notes}</p>
              </div>
            )}

            {/* Prescription */}
            {status === 'completed' && appointment.prescription && (
              <div className="text-sm bg-green-50 p-3 rounded-md">
                <div className="font-medium mb-1">Đơn thuốc:</div>
                <p className="text-gray-700">{appointment.prescription}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {status === 'pending' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelClick(appointment)}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Hủy lịch hẹn
                </Button>
              )}
              {status === 'confirmed' && (
                <>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancelClick(appointment)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Hủy lịch hẹn
                  </Button>
                </>
              )}
              {status === 'completed' && (
                <>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    Xem báo cáo y tế
                  </Button>
                  <Button variant="outline" size="sm">
                    Tải xuống PDF
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = (status: string, appointmentList: Appointment[]) => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (appointmentList.length === 0) {
      return (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Không có lịch hẹn nào</p>
        </div>
      );
    }

    return (
      <div>
        {appointmentList.map(appointment => renderAppointmentCard(appointment, status))}
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="relative">
            Chờ xác nhận
            {counts.pending > 0 && (
              <Badge className="ml-2 bg-yellow-500">{counts.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="relative">
            Đã xác nhận
            {counts.confirmed > 0 && (
              <Badge className="ml-2 bg-blue-500">{counts.confirmed}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="relative">
            Đã hoàn thành
            {counts.completed > 0 && (
              <Badge className="ml-2 bg-green-500">{counts.completed}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="relative">
            Đã hủy
            {counts.cancelled > 0 && (
              <Badge className="ml-2 bg-gray-500">{counts.cancelled}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {renderTabContent('pending', appointments.pending)}
        </TabsContent>

        <TabsContent value="confirmed">
          {renderTabContent('confirmed', appointments.confirmed)}
        </TabsContent>

        <TabsContent value="completed">
          {renderTabContent('completed', appointments.completed)}
        </TabsContent>

        <TabsContent value="cancelled">
          {renderTabContent('cancelled', appointments.cancelled)}
        </TabsContent>
      </Tabs>

      {/* Cancel Appointment Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch hẹn</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy lịch hẹn này không? Vui lòng cho biết lý do hủy.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Lý do hủy</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Nhập lý do hủy lịch hẹn..."
                value={cancelReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelling}
            >
              Không
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelling}
            >
              {cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentTabs;
