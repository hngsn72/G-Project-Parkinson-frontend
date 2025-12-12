"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Plus, Send, Edit, Trash2, Eye } from "lucide-react";
import { MedicalReportService, MedicalReport, MedicalReportRequest } from "@/services/medical-report.service";

export default function DoctorReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingReport, setEditingReport] = useState<MedicalReport | null>(null);
  const [viewReport, setViewReport] = useState<MedicalReport | null>(null);
  
  const [form, setForm] = useState<Partial<MedicalReportRequest>>({
    appointment_id: 0,
    patient_id: "",
    patient_profile_id: 0,
    chief_complaint: "",
    diagnosis: "",
    diagnosis_code: "",
    clinical_findings: "",
    lab_results: "",
    imaging_results: "",
    voice_analysis_session_id: "",
    prescription: "",
    treatment_plan: "",
    recommendations: "",
    follow_up_required: false,
    follow_up_date: "",
    follow_up_notes: "",
    severity: "normal",
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await MedicalReportService.getDoctorReports(1, 0);
      setReports(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingReport(null);
    setForm({
      appointment_id: 0,
      patient_id: "",
      patient_profile_id: 0,
      chief_complaint: "",
      diagnosis: "",
      diagnosis_code: "",
      clinical_findings: "",
      lab_results: "",
      imaging_results: "",
      voice_analysis_session_id: "",
      prescription: "",
      treatment_plan: "",
      recommendations: "",
      follow_up_required: false,
      follow_up_date: "",
      follow_up_notes: "",
      severity: "normal",
    });
    setShowDialog(true);
  };

  const handleEdit = (report: MedicalReport) => {
    if (report.status !== "draft") {
      alert("Chỉ có thể chỉnh sửa bản nháp!");
      return;
    }
    setEditingReport(report);
    setForm({
      appointment_id: report.appointment_id,
      patient_id: report.patient_id,
      patient_profile_id: report.patient_profile_id || 0,
      chief_complaint: report.chief_complaint || "",
      diagnosis: report.diagnosis,
      diagnosis_code: report.diagnosis_code || "",
      clinical_findings: report.clinical_findings || "",
      lab_results: report.lab_results || "",
      imaging_results: report.imaging_results || "",
      voice_analysis_session_id: report.voice_analysis_session_id || "",
      prescription: report.prescription,
      treatment_plan: report.treatment_plan || "",
      recommendations: report.recommendations || "",
      follow_up_required: report.follow_up_required,
      follow_up_date: report.follow_up_date || "",
      follow_up_notes: report.follow_up_notes || "",
      severity: report.severity || "normal",
    });
    setShowDialog(true);
  };

  const handleSave = async (sendNow: boolean = false) => {
    try {
      if (editingReport) {
        await MedicalReportService.updateReport(editingReport.id, form as MedicalReportRequest);
        if (sendNow) {
          await MedicalReportService.sendReport(editingReport.id);
        }
        alert(sendNow ? "Gửi báo cáo thành công!" : "Cập nhật bản nháp thành công!");
      } else {
        const response = await MedicalReportService.createReport(form as MedicalReportRequest);
        if (sendNow && response.data?.id) {
          await MedicalReportService.sendReport(response.data.id);
        }
        alert(sendNow ? "Tạo và gửi báo cáo thành công!" : "Tạo bản nháp thành công!");
      }
      setShowDialog(false);
      fetchReports();
    } catch (error) {
      console.error("Error saving report:", error);
      alert("Lỗi khi lưu báo cáo");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bản nháp này?")) return;
    
    try {
      await MedicalReportService.deleteReport(id);
      alert("Xóa bản nháp thành công!");
      fetchReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Lỗi khi xóa báo cáo");
    }
  };

  const handleView = (report: MedicalReport) => {
    setViewReport(report);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "severe": return "bg-orange-500";
      case "moderate": return "bg-yellow-500";
      case "mild": return "bg-blue-500";
      default: return "bg-green-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft": return <Badge variant="secondary">Bản nháp</Badge>;
      case "sent": return <Badge variant="default">Đã gửi</Badge>;
      case "viewed": return <Badge variant="outline">Đã xem</Badge>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Báo Cáo Y Khoa</h1>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo Báo Cáo Mới
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{report.diagnosis}</h3>
                    {getStatusBadge(report.status)}
                    <Badge className={getSeverityColor(report.severity || "normal")}>
                      {report.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Bệnh nhân: {report.patient_name} | Ngày: {new Date(report.created_at).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="text-sm">{report.chief_complaint}</p>
                  {report.prescription && (
                    <p className="text-sm mt-2"><strong>Đơn thuốc:</strong> {report.prescription}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(report)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {report.status === "draft" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(report)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(report.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReport ? "Chỉnh Sửa Báo Cáo" : "Tạo Báo Cáo Mới"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="appointment_id">Mã Cuộc Hẹn *</Label>
                <Input
                  id="appointment_id"
                  type="number"
                  value={form.appointment_id}
                  onChange={(e) => setForm({ ...form, appointment_id: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="patient_id">Mã Bệnh Nhân *</Label>
                <Input
                  id="patient_id"
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="chief_complaint">Lý Do Khám</Label>
              <Textarea
                id="chief_complaint"
                value={form.chief_complaint}
                onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="diagnosis">Chẩn Đoán *</Label>
                <Input
                  id="diagnosis"
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="diagnosis_code">Mã Bệnh (ICD-10)</Label>
                <Input
                  id="diagnosis_code"
                  value={form.diagnosis_code}
                  onChange={(e) => setForm({ ...form, diagnosis_code: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinical_findings">Kết Quả Khám Lâm Sàng</Label>
              <Textarea
                id="clinical_findings"
                value={form.clinical_findings}
                onChange={(e) => setForm({ ...form, clinical_findings: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lab_results">Kết Quả Xét Nghiệm</Label>
                <Textarea
                  id="lab_results"
                  value={form.lab_results}
                  onChange={(e) => setForm({ ...form, lab_results: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="imaging_results">Kết Quả Chẩn Đoán Hình Ảnh</Label>
                <Textarea
                  id="imaging_results"
                  value={form.imaging_results}
                  onChange={(e) => setForm({ ...form, imaging_results: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prescription">Đơn Thuốc *</Label>
              <Textarea
                id="prescription"
                value={form.prescription}
                onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="treatment_plan">Kế Hoạch Điều Trị</Label>
              <Textarea
                id="treatment_plan"
                value={form.treatment_plan}
                onChange={(e) => setForm({ ...form, treatment_plan: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="recommendations">Khuyến Nghị</Label>
              <Textarea
                id="recommendations"
                value={form.recommendations}
                onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="severity">Mức Độ Nghiêm Trọng</Label>
              <Select
                value={form.severity}
                onValueChange={(value: string) => setForm({ ...form, severity: value as "mild" | "moderate" | "severe" | "critical" | "normal" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="mild">Nhẹ</SelectItem>
                  <SelectItem value="moderate">Trung bình</SelectItem>
                  <SelectItem value="severe">Nặng</SelectItem>
                  <SelectItem value="critical">Nguy kịch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up"
                checked={form.follow_up_required}
                onCheckedChange={(checked: boolean) => setForm({ ...form, follow_up_required: checked })}
              />
              <Label htmlFor="follow_up">Yêu cầu tái khám</Label>
            </div>

            {form.follow_up_required && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="follow_up_date">Ngày Tái Khám</Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    value={form.follow_up_date}
                    onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="follow_up_notes">Ghi Chú Tái Khám</Label>
                  <Textarea
                    id="follow_up_notes"
                    value={form.follow_up_notes}
                    onChange={(e) => setForm({ ...form, follow_up_notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Hủy
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)}>
              <FileText className="mr-2 h-4 w-4" />
              Lưu Bản Nháp
            </Button>
            <Button onClick={() => handleSave(true)}>
              <Send className="mr-2 h-4 w-4" />
              Gửi Cho Bệnh Nhân
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      {viewReport && (
        <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi Tiết Báo Cáo</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                {getStatusBadge(viewReport.status)}
                <Badge className={getSeverityColor(viewReport.severity || "normal")}>
                  {viewReport.severity}
                </Badge>
              </div>

              <div>
                <Label>Bệnh nhân:</Label>
                <p>{viewReport.patient_name}</p>
              </div>

              <div>
                <Label>Ngày tạo:</Label>
                <p>{new Date(viewReport.created_at).toLocaleString("vi-VN")}</p>
              </div>

              {viewReport.chief_complaint && (
                <div>
                  <Label>Lý do khám:</Label>
                  <p>{viewReport.chief_complaint}</p>
                </div>
              )}

              <div>
                <Label>Chẩn đoán:</Label>
                <p>{viewReport.diagnosis} {viewReport.diagnosis_code && `(${viewReport.diagnosis_code})`}</p>
              </div>

              {viewReport.clinical_findings && (
                <div>
                  <Label>Kết quả khám lâm sàng:</Label>
                  <p className="whitespace-pre-wrap">{viewReport.clinical_findings}</p>
                </div>
              )}

              {viewReport.lab_results && (
                <div>
                  <Label>Kết quả xét nghiệm:</Label>
                  <p className="whitespace-pre-wrap">{viewReport.lab_results}</p>
                </div>
              )}

              {viewReport.imaging_results && (
                <div>
                  <Label>Kết quả chẩn đoán hình ảnh:</Label>
                  <p className="whitespace-pre-wrap">{viewReport.imaging_results}</p>
                </div>
              )}

              <div>
                <Label>Đơn thuốc:</Label>
                <p className="whitespace-pre-wrap">{viewReport.prescription}</p>
              </div>

              {viewReport.treatment_plan && (
                <div>
                  <Label>Kế hoạch điều trị:</Label>
                  <p className="whitespace-pre-wrap">{viewReport.treatment_plan}</p>
                </div>
              )}

              {viewReport.recommendations && (
                <div>
                  <Label>Khuyến nghị:</Label>
                  <p className="whitespace-pre-wrap">{viewReport.recommendations}</p>
                </div>
              )}

              {viewReport.follow_up_required && (
                <div>
                  <Label>Tái khám:</Label>
                  <p>
                    {viewReport.follow_up_date && `Ngày: ${new Date(viewReport.follow_up_date).toLocaleDateString("vi-VN")}`}
                    {viewReport.follow_up_notes && <><br />{viewReport.follow_up_notes}</>}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setViewReport(null)}>Đóng</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
