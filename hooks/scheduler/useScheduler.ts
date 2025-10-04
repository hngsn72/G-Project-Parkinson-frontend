"use client";

import { useState, useEffect, useCallback } from "react";

export interface AppointmentData {
  id: number;
  time: string;
  hospital: string;
  doctor: string;
  description: string;
  status: string;
}

interface UseScheduler {
  appointments: AppointmentData[];
  loading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  fetchAppointmentDetail: (id: number) => Promise<AppointmentData | null>;
  createAppointment: (newData: Omit<AppointmentData, "id" | "status">) => Promise<AppointmentData | null>;
  updateAppointment: (id: number, updateData: Partial<AppointmentData>) => Promise<AppointmentData | null>;
  deleteAppointment: (id: number) => Promise<void>;
}

export function useScheduler(apiUrl: string = "http://localhost:3009/v1/appointments"): UseScheduler {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Fetch all appointments
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Không thể tải danh sách lịch hẹn");
      const data: AppointmentData[] = await res.json();
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // 🔹 Fetch appointment detail
  const fetchAppointmentDetail = useCallback(
    async (id: number): Promise<AppointmentData | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiUrl}/${id}`);
        if (!res.ok) throw new Error("Không thể tải chi tiết lịch hẹn");
        return await res.json();
      } catch (err: any) {
        setError(err.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  // 🔹 Create new appointment
  const createAppointment = useCallback(
    async (newData: Omit<AppointmentData, "id" | "status">): Promise<AppointmentData | null> => {
      try {
        const body = { ...newData, status: "Đang xử lý" };
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Không thể tạo lịch hẹn mới");
        const created: AppointmentData = await res.json();
        setAppointments((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [apiUrl]
  );

  // 🔹 Update appointment
  const updateAppointment = useCallback(
    async (id: number, updateData: Partial<AppointmentData>): Promise<AppointmentData | null> => {
      try {
        const res = await fetch(`${apiUrl}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });
        if (!res.ok) throw new Error("Không thể cập nhật lịch hẹn");
        const updated: AppointmentData = await res.json();
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
        );
        return updated;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [apiUrl]
  );

  // 🔹 Delete appointment
  const deleteAppointment = useCallback(
    async (id: number): Promise<void> => {
      try {
        const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Không thể xóa lịch hẹn");
        setAppointments((prev) => prev.filter((a) => a.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    },
    [apiUrl]
  );

  // Tự động fetch khi mount
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    fetchAppointmentDetail,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
