'use client';

import { useState } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface RescheduleModalProps {
  isOpen: boolean;
  currentDate: string;
  currentTime: string;
  onConfirm: (newDate: string, newTime: string, reason: string) => void;
  onCancel: () => void;
}

export default function RescheduleModal({
  isOpen,
  currentDate,
  currentTime,
  onConfirm,
  onCancel
}: RescheduleModalProps) {
  const [newDate, setNewDate] = useState(currentDate);
  const [newTime, setNewTime] = useState(currentTime);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!newDate || !newTime) {
      alert('Vui lòng nhập đầy đủ ngày và giờ');
      return;
    }
    onConfirm(newDate, newTime, reason);
    setNewDate(currentDate);
    setNewTime(currentTime);
    setReason('');
  };

  const handleCancel = () => {
    setNewDate(currentDate);
    setNewTime(currentTime);
    setReason('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Đổi lịch hẹn
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Ngày mới <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4 inline mr-1" />
              Giờ mới <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do thay đổi (tùy chọn)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thay đổi lịch hẹn..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
