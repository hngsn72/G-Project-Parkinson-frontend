"use client";
import { useState } from "react";
import { Edit, Trash2, FileDown, PlusCircle, X } from "lucide-react";
import AppointmentForm from "./SchedulerForm";
import { AppointmentData, useScheduler } from "@/hooks/scheduler/useScheduler";

const mockData: AppointmentData[] = [
  {
    id: 1,
    time: "2025-10-04 09:00",
    hospital: "Bệnh viện Bạch Mai",
    doctor: "BS. Nguyễn Văn A",
    description: "Khám tổng quát định kỳ",
    status: "Đã xử lý",
  },
  {
    id: 2,
    time: "2025-10-06 14:00",
    hospital: "Bệnh viện Việt Đức",
    doctor: "BS. Trần Thị B",
    description: "Khám tim mạch",
    status: "Đang chờ",
  },
  {
    id: 3,
    time: "2025-10-08 08:30",
    hospital: "Bệnh viện E",
    doctor: "BS. Phạm Hữu C",
    description: "Khám tai mũi họng",
    status: "Đã hủy",
  },
];

export default function Scheduler() {
  const [filter, setFilter] = useState("1 Tuần");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [appointments, setAppointments] = useState<AppointmentData[]>(mockData);

  const {
    // appointments,
    loading,
    error,
    createAppointment,
    deleteAppointment
  } =
    useScheduler("http://localhost:3009/v1/appointments");

  const handleExport = () => {
    if (appointments.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const header = [
      "ID",
      "Thời gian",
      "Bệnh viện",
      "Bác sĩ",
      "Mô tả",
      "Trạng thái",
    ];
    const rows = appointments.map((a) => [
      a.id,
      a.time,
      a.hospital,
      a.doctor,
      a.description,
      a.status,
    ]);

    // Chuyển thành chuỗi CSV
    const csvContent = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Tạo blob file CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Tạo link tải file
    const link = document.createElement("a");
    const now = new Date();
    const filename = `lich-hen-${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddAppointment = async (data: AppointmentData) => {
    setAppointments((prev) => [...prev, data]);

    // await createAppointment({
    //   time: data.time,
    //   hospital: data.hospital,
    //   doctor: data.doctor,
    //   description: data.description,
    // });
  };

  const handleDeleteClick = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  const confirmDelete = () => {
    // if (selectedId !== null) {
    //   await deleteAppointment(selectedId);
    // }
    setAppointments((prev) => prev.filter((item) => item.id !== selectedId));
    setShowModal(false);
    setSelectedId(null);
  };

  // if (loading)
  //   return <div className="p-6 text-gray-600 text-sm">Đang tải dữ liệu...</div>;
  // if (error) return <div className="p-6 text-red-600 text-sm">Lỗi</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lịch Hẹn</h1>
        <p className="text-gray-600">
          Danh sách lịch hẹn thăm khám với bác sĩ.
        </p>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option>1 Ngày</option>
            <option>1 Tuần</option>
            <option>1 Tháng</option>
          </select>

          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-[220px] focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            onClick={() => setShowCreateForm(true)}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Tạo lịch hẹn
          </button>
          <button
            onClick={handleExport}
            className="flex items-center border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-gray-900 text-sm font-semibold">
            <tr>
              <th className="px-6 py-3 text-left">Thời gian</th>
              <th className="px-6 py-3 text-left">Bệnh viện</th>
              <th className="px-6 py-3 text-left">Bác sĩ</th>
              <th className="px-6 py-3 text-left">Mô tả</th>
              <th className="px-6 py-3 text-center">Trạng thái</th>
              <th className="px-6 py-3 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {appointments.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">{item.time}</td>
                <td className="px-6 py-4">{item.hospital}</td>
                <td className="px-6 py-4">{item.doctor}</td>
                <td className="px-6 py-4">{item.description}</td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === "Đã xử lý"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Đang chờ"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-3">
                    <button className="p-1 text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-gray-700">
                      <FileDown className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Xác nhận xóa lịch hẹn
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa lịch hẹn này không? Hành động này không
              thể hoàn tác.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
      <AppointmentForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={handleAddAppointment}
      />
    </div>
  );
}
