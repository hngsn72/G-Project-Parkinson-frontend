/**
 * LUỒNG NGHIỆP VỤ ĐẶT LỊCH HẸN - PHÂN TÍCH CHI TIẾT
 * 
 * 1. LUỒNG HIỆN TẠI:
 * ==================
 * 
 * BỆNH NHÂN:
 * - Vào menu "Lịch hẹn"
 * - Click "Đặt lịch khám mới"
 * - Chọn bệnh viện → Load bác sĩ
 * - Chọn bác sĩ → Chọn ngày → Chọn buổi
 * - Nhập lý do/triệu chứng → Submit
 * - Status: "scheduled" (chờ bác sĩ xác nhận)
 * 
 * BÁC SĨ:
 * - Vào menu "Lịch hẹn" → Thấy danh sách lịch hẹn
 * - Thấy các yêu cầu status "scheduled"
 * - Actions: Xác nhận/Từ chối (chưa implement)
 * 
 * 2. VẤN ĐỀ CẦN SỬA:
 * ===================
 * 
 * A. THIẾU WORKFLOW MANAGEMENT:
 *    - Bác sĩ chưa có nút xác nhận/từ chối
 *    - Chưa có notification system
 *    - Chưa có lịch sử thay đổi status
 * 
 * B. THIẾU AVAILABILITY CHECK:
 *    - Không check bác sĩ có rảnh không
 *    - Có thể book trùng lịch
 *    - Không có giới hạn số lượng bệnh nhân/buổi
 * 
 * C. THIẾU COMMUNICATION:
 *    - Bác sĩ không thể gửi feedback
 *    - Bệnh nhân không biết lịch được xác nhận
 *    - Không có thông báo khi lịch thay đổi
 * 
 * 3. ĐỀ XUẤT CẢI TIẾN:
 * ===================
 * 
 * A. THÊM DOCTOR AVAILABILITY SYSTEM:
 *    - Bác sĩ set lịch làm việc (ngày/buổi available)
 *    - Hiển thị chỉ những slot còn trống
 *    - Giới hạn số lượng bệnh nhân/buổi
 * 
 * B. THÊM APPOINTMENT STATUS WORKFLOW:
 *    scheduled → confirmed → completed
 *    scheduled → cancelled/rescheduled
 * 
 * C. THÊM ACTIONS CHO BÁC SĨ:
 *    - Confirm appointment
 *    - Reject với lý do
 *    - Suggest alternative time
 *    - Add notes/instructions
 * 
 * D. THÊM NOTIFICATION SYSTEM:
 *    - Email/SMS khi lịch được xác nhận
 *    - Reminder trước ngày khám
 *    - Thông báo khi có thay đổi
 */

// Current Status Flow
const appointmentFlow = {
  patient: {
    actions: ["create", "view", "cancel"],
    statuses: ["scheduled", "confirmed", "completed", "cancelled"]
  },
  doctor: {
    actions: ["view", "confirm", "reject", "reschedule"], // TODO: implement confirm/reject
    statuses: ["scheduled", "confirmed", "completed", "cancelled"]
  },
  admin: {
    actions: ["view", "manage", "report"],
    statuses: ["all"]
  }
};

// Recommended Improvements
const improvements = {
  1: "Add doctor availability management",
  2: "Implement appointment confirmation workflow", 
  3: "Add notification system",
  4: "Create appointment history tracking",
  5: "Add conflict detection",
  6: "Implement feedback system"
};