"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, User, MapPin, Phone, Search, Filter, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  diagnosis_notes?: string;
  prescription?: string;
  created_at: string;
  Patient?: Patient;
  Hospital?: Hospital;
}

interface GroupedAppointments {
  confirmed: Appointment[];
  completed: Appointment[];
  cancelled: Appointment[];
  pending: Appointment[];
}

export default function DoctorSchedulePage() {
  const [appointments, setAppointments] = useState<GroupedAppointments>({
    confirmed: [],
    completed: [],
    cancelled: [],
    pending: []
  });
  const [counts, setCounts] = useState({
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("confirmed");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Complete dialog
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Appointment | null>(null);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [completing, setCompleting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/v1/appointments/doctor/grouped`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Không thể tải lịch khám');
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

  const handleCompleteClick = (appointment: Appointment) => {
    setAppointmentToComplete(appointment);
    setDiagnosisNotes("");
    setPrescription("");
    setCompleteDialogOpen(true);
  };

  const handleCompleteAppointment = async () => {
    if (!appointmentToComplete) return;

    try {
      setCompleting(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/v1/appointments/${appointmentToComplete.id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          diagnosis_notes: diagnosisNotes,
          prescription: prescription,
          follow_up_needed: false
        })
      });

      if (!response.ok) {
        throw new Error('Không thể hoàn thành lịch khám');
      }

      await fetchAppointments();
      setCompleteDialogOpen(false);
      setAppointmentToComplete(null);
      setDiagnosisNotes("");
      setPrescription("");
    } catch (err) {
      console.error('Error completing appointment:', err);
      alert('Không thể hoàn thành lịch khám. Vui lòng thử lại.');
    } finally {
      setCompleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const getSessionLabel = (session: string) => {
    const sessions: { [key: string]: string } = {
      morning: 'Sáng',
      afternoon: 'Chiều',
      evening: 'Tối'
    };
    return sessions[session] || session;
  };

  const getAppointmentTypeBadge = (type?: string) => {
    if (!type) return null;
    const types: { [key: string]: { label: string; color: string } } = {
      regular: { label: 'Lần đầu', color: 'bg-blue-100 text-blue-800' },
      follow_up: { label: 'Tái khám', color: 'bg-green-100 text-green-800' }
    };
    const badge = types[type];
    return badge ? <Badge className={badge.color}>{badge.label}</Badge> : null;
  };

  const filterAppointments = (appointmentList: Appointment[]) => {
    let filtered = appointmentList;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.Patient?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.patient_phone?.includes(searchQuery)
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(apt => apt.appointment_date === dateFilter);
    }

    return filtered;
  };

  const renderAppointmentCard = (appointment: Appointment, showActions: boolean = false) => {
    return (
      <Card key={appointment.id} className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="pt-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-gray-500" />
                <span className="font-medium">
                  {appointment.patient_name || appointment.Patient?.display_name}
                </span>
                {appointment.patient_age && (
                  <span className="text-sm text-gray-500">({appointment.patient_age} tuổi)</span>
                )}
              </div>
              {appointment.patient_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3 h-3" />
                  {appointment.patient_phone}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {getAppointmentTypeBadge(appointment.appointment_type)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3 h-3" />
              {formatDate(appointment.appointment_date)}
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Clock className="w-3 h-3" />
              {getSessionLabel(appointment.session)} - {appointment.time_slot}
            </div>
            <div className="flex items-center gap-1 text-gray-600 col-span-2">
              <MapPin className="w-3 h-3" />
              {appointment.Hospital?.hospital_name}
            </div>
          </div>

          {appointment.symptoms && (
            <div className="text-sm bg-yellow-50 p-2 rounded mb-2">
              <span className="font-medium">Triệu chứng:</span> {appointment.symptoms}
            </div>
          )}

          {appointment.diagnosis_notes && (
            <div className="text-sm bg-blue-50 p-2 rounded mb-2">
              <span className="font-medium">Chẩn đoán:</span> {appointment.diagnosis_notes}
            </div>
          )}

          {appointment.prescription && (
            <div className="text-sm bg-green-50 p-2 rounded mb-2">
              <span className="font-medium">Đơn thuốc:</span> {appointment.prescription}
            </div>
          )}

          {/* Voice Analysis Results */}
          {appointment.voice_analysis_ids && appointment.voice_analysis_ids.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mb-2">
              <div className="font-medium text-sm mb-3 text-purple-900">Kết quả phát hiện giọng nói đính kèm:</div>
              <VoiceAnalysisDisplay sessionIds={appointment.voice_analysis_ids} />
            </div>
          )}

          {showActions && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleCompleteClick(appointment)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Hoàn thành khám
              </Button>
              <Button size="sm" variant="outline">
                <FileText className="w-4 h-4 mr-1" />
                Xem hồ sơ
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderTabContent = (status: string, appointmentList: Appointment[], showActions: boolean = false) => {
    const filtered = filterAppointments(appointmentList);

    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {appointmentList.length === 0 
              ? 'Không có lịch khám nào' 
              : 'Không tìm thấy kết quả phù hợp'}
          </p>
        </div>
      );
    }

    return (
      <div>
        {filtered.map(appointment => renderAppointmentCard(appointment, showActions))}
      </div>
    );
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
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
        <h1 className="text-3xl font-bold mb-2">Lịch khám bệnh</h1>
        <p className="text-gray-600">Quản lý lịch khám của bạn</p>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                value={dateFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDateFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
          <TabsTrigger value="all" className="relative">
            Tất cả bệnh nhân
            <Badge className="ml-2 bg-gray-500">
              {counts.confirmed + counts.completed}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confirmed">
          {renderTabContent('confirmed', appointments.confirmed, true)}
        </TabsContent>

        <TabsContent value="completed">
          {renderTabContent('completed', appointments.completed, false)}
        </TabsContent>

        <TabsContent value="all">
          {renderTabContent('all', [...appointments.confirmed, ...appointments.completed], false)}
        </TabsContent>
      </Tabs>

      {/* Complete Appointment Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hoàn thành khám bệnh</DialogTitle>
            <DialogDescription>
              Nhập thông tin chẩn đoán và đơn thuốc cho bệnh nhân
            </DialogDescription>
          </DialogHeader>
          {appointmentToComplete && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Bệnh nhân:</strong> {appointmentToComplete.patient_name}
                </p>
                <p className="text-sm">
                  <strong>Ngày khám:</strong> {formatDate(appointmentToComplete.appointment_date)}
                </p>
              </div>

              <div>
                <Label htmlFor="diagnosis">Chẩn đoán *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Nhập chẩn đoán của bác sĩ..."
                  value={diagnosisNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosisNotes(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="prescription">Đơn thuốc</Label>
                <Textarea
                  id="prescription"
                  placeholder="Nhập đơn thuốc (nếu có)..."
                  value={prescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteDialogOpen(false)}
              disabled={completing}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCompleteAppointment}
              disabled={completing || !diagnosisNotes.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {completing ? 'Đang lưu...' : 'Hoàn thành khám'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
