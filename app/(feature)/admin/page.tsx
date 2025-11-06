'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BlogService } from '@/services/blog.service';
import { NewsService } from '@/services/news.service';
import { HospitalService } from '@/services/hospital.service';
import type { BlogPost, NewsArticle } from '@/lib/api-config';
import { 
  Users, 
  FileText, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  Settings,
  Building2,
  Calendar,
  Stethoscope
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBlogs: 0,
    totalBlogs: 0,
    totalNews: 0,
    totalUsers: 0,
    totalHospitals: 0,
    totalAppointments: 0,
    pendingAppointments: 0
  });
  const [recentBlogs, setRecentBlogs] = useState<BlogPost[]>([]);
  const [recentNews, setRecentNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (isAdmin()) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats and recent data in parallel
      const [blogsRes, newsRes, hospitalsRes, appointmentsRes] = await Promise.all([
        BlogService.getAllPosts({ limit: 5 }),
        NewsService.getAdminArticles({ limit: 5 }),
        HospitalService.getAllHospitals({ limit: 1 }), // Just get count
        HospitalService.getAllAppointments({ limit: 5 }) // Get recent appointments
      ]);

      // Count pending blogs
      const pendingBlogsRes = await BlogService.getAllPosts({ status: 'pending', limit: 1 });
      
      // Count pending appointments (scheduled = chờ xác nhận)
      const pendingAppointmentsRes = await HospitalService.getAllAppointments({ status: 'scheduled', limit: 1 });
      
      if (blogsRes.success && blogsRes.data) {
        setRecentBlogs(blogsRes.data.data);
        setStats(prev => ({
          ...prev,
          totalBlogs: blogsRes.data?.total || 0,
          pendingBlogs: pendingBlogsRes.success && pendingBlogsRes.data ? pendingBlogsRes.data.total || 0 : 0
        }));
      }

      if (newsRes.success && newsRes.data) {
        setRecentNews(newsRes.data.data);
        setStats(prev => ({
          ...prev,
          totalNews: newsRes.data?.total || 0
        }));
      }

      if (hospitalsRes.success && hospitalsRes.data) {
        setStats(prev => ({
          ...prev,
          totalHospitals: hospitalsRes.data?.total || 0
        }));
      }

      if (appointmentsRes.success && appointmentsRes.data) {
        setStats(prev => ({
          ...prev,
          totalAppointments: appointmentsRes.data?.total || 0,
          pendingAppointments: pendingAppointmentsRes.success && pendingAppointmentsRes.data ? pendingAppointmentsRes.data.total || 0 : 0
        }));
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600 mb-4">Bạn cần có quyền admin để truy cập trang này.</p>
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
            <CheckCircle className="h-3 w-3 mr-1" />
            Đã duyệt
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
            <Clock className="h-3 w-3 mr-1" />
            Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 border border-red-200 rounded-full">
            <XCircle className="h-3 w-3 mr-1" />
            Từ chối
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
            <Eye className="h-3 w-3 mr-1" />
            Đã xuất bản
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Quản lý hệ thống và nội dung</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Xin chào, <span className="font-medium text-gray-900">{user?.display_name}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* Pending Blogs */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bài báo chờ duyệt</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingBlogs}</p>
                <p className="text-sm text-gray-500">Cần xử lý</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            {stats.pendingBlogs > 0 && (
              <button
                onClick={() => router.push('/admin/blog')}
                className="mt-4 text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center"
              >
                Xem chi tiết <ArrowRight className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>

          {/* Total Blogs */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng bài báo</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalBlogs}</p>
                <p className="text-sm text-gray-500">Tất cả bài viết</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/blog')}
              className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
            >
              Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Total News */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tin tức</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalNews}</p>
                <p className="text-sm text-gray-500">Đã xuất bản</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/news')}
              className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              Quản lý tin tức <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Users */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Người dùng</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
                <p className="text-sm text-gray-500">Đã đăng ký</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/users')}
              className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center"
            >
              Quản lý users <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Total Hospitals */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Bệnh viện</p>
                <p className="text-3xl font-bold text-indigo-600">{stats.totalHospitals}</p>
                <p className="text-sm text-gray-500">Đã đăng ký</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
            <button
              onClick={() => router.push('/admin/hospitals')}
              className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
            >
              Quản lý bệnh viện <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>

          {/* Pending Appointments */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lịch hẹn chờ</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingAppointments}</p>
                <p className="text-sm text-gray-500">Cần xác nhận</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            {stats.pendingAppointments > 0 && (
              <button
                onClick={() => router.push('/admin/appointments')}
                className="mt-4 text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
              >
                Xem chi tiết <ArrowRight className="h-3 w-3 ml-1" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Blog Posts */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Bài báo gần đây</h3>
              <button
                onClick={() => router.push('/admin/blog')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Xem tất cả
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))
            ) : recentBlogs.length > 0 ? (
              recentBlogs.map((blog) => (
                <div key={blog.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(blog.status)}
                      <span className="text-xs text-gray-500">{formatDate(blog.created_at)}</span>
                    </div>
                    <p className="font-medium text-gray-900 line-clamp-2">
                      {blog.content.replace(/<[^>]*>/g, '').slice(0, 100)}...
                    </p>
                    {blog.author && (
                      <p className="text-sm text-gray-600">Bởi: {blog.author.display_name}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Chưa có bài báo nào</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent News */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tin tức gần đây</h3>
              <button
                onClick={() => router.push('/admin/news')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Xem tất cả
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))
            ) : recentNews.length > 0 ? (
              recentNews.map((news) => (
                <div key={news.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(news.status)}
                      <span className="text-xs text-gray-500">{formatDate(news.created_at)}</span>
                    </div>
                    <p className="font-medium text-gray-900 line-clamp-2">{news.title}</p>
                    <p className="text-sm text-gray-600 line-clamp-1">{news.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Views: {news.view_count}</span>
                      {news.priority && (
                        <span className={`px-2 py-1 rounded-full ${
                          news.priority === 'high' ? 'bg-red-100 text-red-700' :
                          news.priority === 'normal' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {news.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500">
                <Globe className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Chưa có tin tức nào</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <button
            onClick={() => router.push('/admin/blog')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Duyệt bài báo</p>
              <p className="text-sm text-gray-600">Quản lý và duyệt bài viết</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/admin/news/create')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Globe className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Tạo tin tức</p>
              <p className="text-sm text-gray-600">Đăng tin tức mới</p>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Quản lý users</p>
              <p className="text-sm text-gray-600">Xem và quản lý người dùng</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/hospitals')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building2 className="h-5 w-5 text-indigo-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Quản lý bệnh viện</p>
              <p className="text-sm text-gray-600">Tạo, sửa, xóa bệnh viện</p>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/appointments')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="h-5 w-5 text-orange-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Quản lý lịch hẹn</p>
              <p className="text-sm text-gray-600">Xem và xử lý lịch hẹn</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}