"use client";

import { useState, useEffect } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export interface TimeSlot {
  time: string;       // "08:00"
  available: boolean;
  booked: number;
  max_slots: number;
  remaining: number;
}

interface TimeSlotPickerProps {
  doctorId: string;
  hospitalId: number;
  date: string;
  session: 'morning' | 'afternoon';
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  disabled?: boolean;
}

export default function TimeSlotPicker({
  doctorId,
  hospitalId,
  date,
  session,
  selectedTime,
  onSelectTime,
  disabled = false
}: TimeSlotPickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doctorId || !hospitalId || !date || !session) {
      return;
    }

    const fetchAvailability = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          doctor_id: doctorId,
          hospital_id: hospitalId.toString(),
          date: date,
          session: session
        });

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/appointments/availability?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }
        });

        if (!response.ok) {
          throw new Error('Không thể tải danh sách khung giờ');
        }

        const data = await response.json();
        setTimeSlots(data.time_slots || []);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [doctorId, hospitalId, date, session]);

  const sessionLabel = session === 'morning' ? 'Buổi sáng (7:00 - 11:00)' : 'Buổi chiều (13:00 - 17:00)';

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5" />
          <span className="font-medium">{sessionLabel}</span>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Đang tải khung giờ...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5" />
          <span className="font-medium">{sessionLabel}</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5" />
          <span className="font-medium">{sessionLabel}</span>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-600 text-sm text-center">
          Chưa có khung giờ khám. Vui lòng chọn bác sĩ, ngày và buổi khám.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5" />
          <span className="font-medium">{sessionLabel}</span>
        </div>
        <div className="text-xs text-gray-500">
          Chọn giờ khám (cách nhau 30 phút)
        </div>
      </div>

      {/* Time Slot Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isAvailable = slot.available && !disabled;

          return (
            <button
              key={slot.time}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectTime(slot.time)}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md' 
                  : isAvailable
                    ? 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {/* Time Display */}
              <div className={`text-base font-semibold ${isSelected ? 'text-blue-700' : ''}`}>
                {slot.time}
              </div>

              {/* Availability Info */}
              {isAvailable && (
                <div className="text-xs mt-1">
                  {slot.remaining > 0 ? (
                    <span className={isSelected ? 'text-blue-600' : 'text-green-600'}>
                      Còn {slot.remaining}/{slot.max_slots} chỗ
                    </span>
                  ) : (
                    <span className="text-red-600">Đã đầy</span>
                  )}
                </div>
              )}

              {!isAvailable && (
                <div className="text-xs mt-1 text-gray-500">
                  Đã đầy
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-600 bg-blue-50"></div>
          <span>Đã chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-300 bg-white"></div>
          <span>Còn chỗ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-200 bg-gray-100"></div>
          <span>Đã đầy</span>
        </div>
      </div>
    </div>
  );
}
