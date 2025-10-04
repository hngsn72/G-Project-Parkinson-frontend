"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { AppointmentData } from "@/hooks/scheduler/useScheduler";

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentData) => void;
}

export default function AppointmentForm({ open, onClose, onSubmit }: AppointmentFormProps) {
  const [form, setForm] = useState<Omit<AppointmentData, "id" | "status">>({
    time: "",
    hospital: "",
    doctor: "",
    description: "",
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newAppointment: AppointmentData = {
      id: Date.now(),
      ...form,
      status: "Đang xử lý",
    };

    onSubmit(newAppointment);
    setForm({
      time: "",
      hospital: "",
      doctor: "",
      description: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          Tạo Lịch Hẹn Mới
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thời gian
            </label>
            <input
              type="datetime-local"
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bệnh viện
            </label>
            <input
              type="text"
              required
              value={form.hospital}
              onChange={(e) => setForm({ ...form, hospital: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bác sĩ
            </label>
            <input
              type="text"
              required
              value={form.doctor}
              onChange={(e) => setForm({ ...form, doctor: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm"
            >
              Tạo lịch hẹn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
