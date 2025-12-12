'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AnalyticsService, type DashboardStats } from '@/services/analytics.service';
import {
  Users,
  Activity,
  Calendar,
  Building2,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (isAdmin()) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await AnalyticsService.getDashboardStats();
      if (response.success && response.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check admin permission
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 mb-4">
            Bạn cần có quyền admin để truy cập trang này.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      change: null
    },
    {
      title: 'Tổng phát hiện',
      value: stats?.total_detections || 0,
      icon: Activity,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      today: stats?.today_detections || 0,
      todayLabel: 'Hôm nay'
    },
    {
      title: 'Tổng lịch hẹn',
      value: stats?.total_appointments || 0,
      icon: Calendar,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      today: stats?.today_appointments || 0,
      todayLabel: 'Hôm nay'
    },
    {
      title: 'Lịch chờ xác nhận',
      value: stats?.pending_appointments || 0,
      icon: Clock,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-600',
      alert: (stats?.pending_appointments || 0) > 0
    },
    {
      title: 'Bệnh viện',
      value: stats?.total_hospitals || 0,
      icon: Building2,
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Bác sĩ',
      value: stats?.total_doctors || 0,
      icon: Stethoscope,
      color: 'pink',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Thống kê tổng quan hệ thống Parkinson Detection
            </p>
          </div>

          <div className="text-sm text-gray-600">
            Xin chào, <span className="font-medium text-gray-900">{user?.display_name}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm border p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${card.bgColor} rounded-lg`}>
                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                  {card.alert && (
                    <div className="flex items-center text-yellow-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Cần xử lý</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor}`}>
                    {card.value.toLocaleString()}
                  </p>

                  {card.today !== undefined && (
                    <div className="mt-2 flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-600">
                        <span className="font-medium text-green-600">
                          +{card.today}
                        </span>{' '}
                        {card.todayLabel}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts Section - Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Xu hướng phát hiện
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>Biểu đồ xu hướng phát hiện theo thời gian</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Kết quả phát hiện
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-2" />
              <p>Biểu đồ phân bố kết quả dương/âm</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lịch hẹn theo bệnh viện
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-2" />
              <p>Biểu đồ phân bố lịch hẹn</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bác sĩ hàng đầu
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Stethoscope className="h-12 w-12 mx-auto mb-2" />
              <p>Danh sách bác sĩ có nhiều lịch hẹn nhất</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
