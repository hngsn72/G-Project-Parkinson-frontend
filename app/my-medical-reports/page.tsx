"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Calendar, Stethoscope } from "lucide-react";
import { MedicalReportService, MedicalReport } from "@/services/medical-report.service";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function PatientReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    severity: "",
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await MedicalReportService.getPatientReports(user.user_id, 100, 0);
      setReports(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: MedicalReport) => {
    setSelectedReport(report);
    try {
      await MedicalReportService.markAsViewed(report.id);
      fetchReports(); // Refresh to update status
    } catch (error) {
      console.error("Error marking as viewed:", error);
    }
  };

  const handleDownloadPDF = (report: MedicalReport) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("BÁO CÁO Y KHOA", 105, 20, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Ngày: ${new Date(report.created_at).toLocaleDateString("vi-VN")}`, 20, 35);
    doc.text(`Bác sĩ: ${report.doctor_name}`, 20, 42);
    doc.text(`Bệnh nhân: ${report.patient_name}`, 20, 49);

    let yPos = 60;

    // Diagnosis
    doc.setFontSize(14);
    doc.text("CHẨN ĐOÁN", 20, yPos);
    yPos += 7;
    doc.setFontSize(11);
    doc.text(report.diagnosis + (report.diagnosis_code ? ` (${report.diagnosis_code})` : ""), 20, yPos);
    yPos += 10;

    // Severity
    if (report.severity) {
      doc.text(`Mức độ: ${report.severity}`, 20, yPos);
      yPos += 7;
    }

    // Chief Complaint
    if (report.chief_complaint) {
      doc.setFontSize(12);
      doc.text("LÝ DO KHÁM", 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      const complaintLines = doc.splitTextToSize(report.chief_complaint, 170);
      doc.text(complaintLines, 20, yPos);
      yPos += complaintLines.length * 5 + 5;
    }

    // Clinical Findings
    if (report.clinical_findings) {
      doc.setFontSize(12);
      doc.text("KẾT QUẢ KHÁM LÂM SÀNG", 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      const findingsLines = doc.splitTextToSize(report.clinical_findings, 170);
      doc.text(findingsLines, 20, yPos);
      yPos += findingsLines.length * 5 + 5;
    }

    // Prescription
    doc.setFontSize(12);
    doc.text("ĐƠN THUỐC", 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    const prescriptionLines = doc.splitTextToSize(report.prescription, 170);
    doc.text(prescriptionLines, 20, yPos);
    yPos += prescriptionLines.length * 5 + 5;

    // Treatment Plan
    if (report.treatment_plan) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.text("KẾ HOẠCH ĐIỀU TRỊ", 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      const planLines = doc.splitTextToSize(report.treatment_plan, 170);
      doc.text(planLines, 20, yPos);
      yPos += planLines.length * 5 + 5;
    }

    // Recommendations
    if (report.recommendations) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.text("KHUYẾN NGHỊ", 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      const recLines = doc.splitTextToSize(report.recommendations, 170);
      doc.text(recLines, 20, yPos);
      yPos += recLines.length * 5 + 5;
    }

    // Follow-up
    if (report.follow_up_required) {
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.text("TÁI KHÁM", 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      if (report.follow_up_date) {
        doc.text(`Ngày: ${new Date(report.follow_up_date).toLocaleDateString("vi-VN")}`, 20, yPos);
        yPos += 5;
      }
      if (report.follow_up_notes) {
        const followUpLines = doc.splitTextToSize(report.follow_up_notes, 170);
        doc.text(followUpLines, 20, yPos);
      }
    }

    doc.save(`bao-cao-${report.id}.pdf`);
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

  const filteredReports = reports.filter((report) => {
    if (filters.dateFrom && new Date(report.created_at) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(report.created_at) > new Date(filters.dateTo)) return false;
    if (filters.severity && report.severity !== filters.severity) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Báo Cáo Y Khoa Của Tôi</h1>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Lọc Báo Cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="dateFrom">Từ Ngày</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Đến Ngày</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="severity">Mức Độ</Label>
              <Select
                value={filters.severity}
                onValueChange={(value: string) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="mild">Nhẹ</SelectItem>
                  <SelectItem value="moderate">Trung bình</SelectItem>
                  <SelectItem value="severe">Nặng</SelectItem>
                  <SelectItem value="critical">Nguy kịch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid gap-4">
        {filteredReports.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Không có báo cáo y khoa nào
            </CardContent>
          </Card>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold">{report.diagnosis}</h3>
                      {report.status === "viewed" && (
                        <Badge variant="outline">Đã xem</Badge>
                      )}
                      {report.severity && (
                        <Badge className={getSeverityColor(report.severity)}>
                          {report.severity}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(report.created_at).toLocaleDateString("vi-VN")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4" />
                        <span>Bác sĩ: {report.doctor_name}</span>
                      </div>
                      {report.chief_complaint && (
                        <p className="mt-2">{report.chief_complaint.substring(0, 100)}...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                    >
                      Xem Chi Tiết
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownloadPDF(report)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Detail Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chi Tiết Báo Cáo Y Khoa
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label className="text-gray-600">Ngày tạo</Label>
                  <p className="font-medium">{new Date(selectedReport.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Bác sĩ</Label>
                  <p className="font-medium">{selectedReport.doctor_name}</p>
                </div>
              </div>

              {/* Status & Severity */}
              <div className="flex gap-2">
                {selectedReport.severity && (
                  <Badge className={getSeverityColor(selectedReport.severity)}>
                    Mức độ: {selectedReport.severity}
                  </Badge>
                )}
                {selectedReport.status === "viewed" && (
                  <Badge variant="outline">Đã xem</Badge>
                )}
              </div>

              {/* Chief Complaint */}
              {selectedReport.chief_complaint && (
                <div>
                  <Label className="text-lg font-semibold">Lý Do Khám</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded">{selectedReport.chief_complaint}</p>
                </div>
              )}

              {/* Diagnosis */}
              <div>
                <Label className="text-lg font-semibold">Chẩn Đoán</Label>
                <p className="mt-2 p-3 bg-blue-50 rounded font-medium text-blue-900">
                  {selectedReport.diagnosis}
                  {selectedReport.diagnosis_code && ` (${selectedReport.diagnosis_code})`}
                </p>
              </div>

              {/* Clinical Findings */}
              {selectedReport.clinical_findings && (
                <div>
                  <Label className="text-lg font-semibold">Kết Quả Khám Lâm Sàng</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                    {selectedReport.clinical_findings}
                  </p>
                </div>
              )}

              {/* Lab Results */}
              {selectedReport.lab_results && (
                <div>
                  <Label className="text-lg font-semibold">Kết Quả Xét Nghiệm</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                    {selectedReport.lab_results}
                  </p>
                </div>
              )}

              {/* Imaging Results */}
              {selectedReport.imaging_results && (
                <div>
                  <Label className="text-lg font-semibold">Kết Quả Chẩn Đoán Hình Ảnh</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                    {selectedReport.imaging_results}
                  </p>
                </div>
              )}

              {/* Prescription */}
              <div>
                <Label className="text-lg font-semibold">Đơn Thuốc</Label>
                <p className="mt-2 p-3 bg-green-50 rounded whitespace-pre-wrap border border-green-200">
                  {selectedReport.prescription}
                </p>
              </div>

              {/* Treatment Plan */}
              {selectedReport.treatment_plan && (
                <div>
                  <Label className="text-lg font-semibold">Kế Hoạch Điều Trị</Label>
                  <p className="mt-2 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                    {selectedReport.treatment_plan}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {selectedReport.recommendations && (
                <div>
                  <Label className="text-lg font-semibold">Khuyến Nghị</Label>
                  <p className="mt-2 p-3 bg-yellow-50 rounded whitespace-pre-wrap border border-yellow-200">
                    {selectedReport.recommendations}
                  </p>
                </div>
              )}

              {/* Follow-up */}
              {selectedReport.follow_up_required && (
                <div>
                  <Label className="text-lg font-semibold">Tái Khám</Label>
                  <div className="mt-2 p-3 bg-orange-50 rounded border border-orange-200">
                    {selectedReport.follow_up_date && (
                      <p className="font-medium">
                        Ngày: {new Date(selectedReport.follow_up_date).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                    {selectedReport.follow_up_notes && (
                      <p className="mt-2">{selectedReport.follow_up_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReport(null)}>
                Đóng
              </Button>
              <Button onClick={() => handleDownloadPDF(selectedReport)}>
                <Download className="mr-2 h-4 w-4" />
                Tải PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
