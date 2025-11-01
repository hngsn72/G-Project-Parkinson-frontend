'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BlogService } from '@/services/blog.service';
import type { BlogPost } from '@/lib/api-config';
import { 
  Search, 
  Calendar, 
  User, 
  ArrowRight, 
  Tag,
  Plus,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function BlogPage() {
  const { user, isAdmin, isDoctor, hasPermission } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('approved');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'published' | 'my-posts' | 'admin'>('published');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let postsRes;
      
      if (activeTab === 'published') {
        // Public view - only approved posts
        postsRes = await BlogService.getPosts({
          page: currentPage,
          limit: 10,
          status: 'approved',
          search: searchTerm || undefined,
        });
      } else if (activeTab === 'my-posts' && (isDoctor() || isAdmin())) {
        // Doctor's own posts
        postsRes = await BlogService.getMyPosts({
          page: currentPage,
          limit: 10,
          status: selectedStatus || undefined,
        });
      } else if (activeTab === 'admin' && isAdmin()) {
        // Admin view - all posts
        postsRes = await BlogService.getAllPosts({
          page: currentPage,
          limit: 10,
          status: selectedStatus || undefined,
        });
      }

      if (postsRes?.success && postsRes.data) {
        console.log('📚 Blog posts response:', postsRes.data);
        setPosts(postsRes.data.data);
        const pagination = postsRes.data.pagination;
        if (pagination) {
          const totalPages = Math.ceil(pagination.total / pagination.limit);
          setTotalPages(totalPages);
          console.log('📄 Pagination:', { total: pagination.total, limit: pagination.limit, totalPages });
        }
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedStatus, searchTerm, activeTab, isDoctor, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

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
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
            <AlertCircle className="h-3 w-3 mr-1" />
            Không xác định
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractTextFromContent = (content: string, maxLength: number = 200) => {
    // Remove HTML/Markdown and get plain text
    const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*_]/g, '');
    return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
  };

  const canCreatePost = hasPermission('blog.create') || isDoctor() || isAdmin();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bài báo Y khoa</h1>
              <p className="text-gray-600">Chia sẻ kiến thức và nghiên cứu y khoa</p>
            </div>
          </div>
          
          {canCreatePost && (
            <button
              onClick={() => router.push('/blog/create')}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Viết bài mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => {
                setActiveTab('published');
                setSelectedStatus('approved');
                setCurrentPage(1);
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'published'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bài đã xuất bản
            </button>
            
            {canCreatePost && (
              <button
                onClick={() => {
                  setActiveTab('my-posts');
                  setSelectedStatus('');
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'my-posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bài của tôi
              </button>
            )}
            
            {isAdmin() && (
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setSelectedStatus('');
                  setCurrentPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quản lý bài báo
              </button>
            )}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm bài báo..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
          </form>

          {(activeTab === 'my-posts' || activeTab === 'admin') && (
            <div className="flex space-x-4">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(post.status)}
                    {post.author && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{post.author.display_name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                  
                  {(isAdmin() || (post.author_id === user?.id)) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/blog/edit/${post.id}`)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Preview */}
                <div className="space-y-3">
                  <p className="text-gray-800 leading-relaxed">
                    {extractTextFromContent(post.content)}
                  </p>
                  
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-4">
                    {post.approved_by && post.approved_at && (
                      <div className="text-sm text-green-600">
                        Đã duyệt {formatDate(post.approved_at)}
                      </div>
                    )}
                    {post.rejection_reason && (
                      <div className="text-sm text-red-600">
                        Lý do từ chối: {post.rejection_reason}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/blog/${post.id}`)}
                      className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span className="text-sm font-medium">Đọc thêm</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    
                    {activeTab === 'admin' && post.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/admin/blog/approve/${post.id}`)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => router.push(`/admin/blog/reject/${post.id}`)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'published' ? 'Chưa có bài báo nào' : 
             activeTab === 'my-posts' ? 'Bạn chưa có bài báo nào' : 
             'Không có bài báo nào cần duyệt'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'published' ? 'Hiện tại chưa có bài báo nào được xuất bản.' :
             activeTab === 'my-posts' ? 'Hãy viết bài báo đầu tiên của bạn!' :
             'Tất cả bài báo đã được xử lý.'}
          </p>
          {canCreatePost && activeTab === 'my-posts' && (
            <button
              onClick={() => router.push('/blog/create')}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Viết bài mới
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Trước
          </button>
          
          {[...Array(Math.min(5, totalPages))].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 border rounded-lg ${
                  currentPage === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}