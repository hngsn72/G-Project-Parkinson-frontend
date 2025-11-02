'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import Image from 'next/image';
import { 
  BookmarkCheck, 
  Search, 
  Filter,
  Trash2,
  ExternalLink,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'react-toastify';
import { BlogService } from '@/services/blog.service';
import { useAuth } from '@/hooks/useAuth';
import type { BlogPost } from '@/lib/api-config';

interface SavedPostsProps {
  className?: string;
}

export default function SavedPosts({ className }: SavedPostsProps) {
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'blog' | 'news'>('all');
  const [selectedPosts, setSelectedPosts] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadSavedPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // This will need to be implemented in BlogService
      const response = await BlogService.getSavedPosts();
      if (response?.data) {
        setSavedPosts(Array.isArray(response.data) ? response.data : response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading saved posts:', error);
      toast.error('Không thể tải danh sách bài viết đã lưu');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId: number) => {
    try {
      await BlogService.unsavePost(postId);
      setSavedPosts(prev => prev.filter(post => post.id !== postId));
      setSelectedPosts(prev => prev.filter(id => id !== postId));
      toast.success('Đã bỏ lưu bài viết');
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast.error('Không thể bỏ lưu bài viết');
    }
  };

  const handleBulkUnsave = async () => {
    if (selectedPosts.length === 0) return;
    
    try {
      await Promise.all(selectedPosts.map(postId => BlogService.unsavePost(postId)));
      setSavedPosts(prev => prev.filter(post => !selectedPosts.includes(post.id)));
      setSelectedPosts([]);
      setShowBulkActions(false);
      toast.success(`Đã bỏ lưu ${selectedPosts.length} bài viết`);
    } catch (error) {
      console.error('Error bulk unsaving posts:', error);
      toast.error('Không thể bỏ lưu các bài viết');
    }
  };

  const togglePostSelection = (postId: number) => {
    setSelectedPosts(prev => {
      const newSelection = prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId];
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const selectAllPosts = () => {
    const filteredPostIds = filteredPosts.map(post => post.id);
    setSelectedPosts(filteredPostIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedPosts([]);
    setShowBulkActions(false);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const getPostTypeLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Blog', color: 'bg-blue-100 text-blue-800' };
      case 'pending':
        return { label: 'Đang chờ', color: 'bg-yellow-100 text-yellow-800' };
      case 'rejected':
        return { label: 'Từ chối', color: 'bg-red-100 text-red-800' };
      default:
        return { label: 'Khác', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Filter posts based on search and type
  const filteredPosts = savedPosts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      (filterType === 'blog' && post.status === 'approved') ||
      (filterType === 'news' && post.status === 'approved'); // For now, treating approved as both types
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 space-y-3 border">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookmarkCheck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bài viết đã lưu</h1>
            <p className="text-gray-600">
              {filteredPosts.length} bài viết
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {showBulkActions && (
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-blue-700">
              Đã chọn {selectedPosts.length} bài viết
            </span>
            <button
              onClick={handleBulkUnsave}
              className="text-red-600 hover:text-red-800 p-1"
              title="Bỏ lưu tất cả"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-800 p-1"
              title="Bỏ chọn"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết đã lưu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'blog' | 'news')}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả</option>
            <option value="blog">Blog</option>
            <option value="news">Tin tức</option>
          </select>
        </div>

        {/* Select All */}
        {filteredPosts.length > 0 && (
          <button
            onClick={selectedPosts.length === filteredPosts.length ? clearSelection : selectAllPosts}
            className="px-4 py-3 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-300 whitespace-nowrap"
          >
            {selectedPosts.length === filteredPosts.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        )}
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <BookmarkCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'Không tìm thấy bài viết' : 'Chưa có bài viết đã lưu'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
              : 'Hãy lưu các bài viết yêu thích để xem lại sau'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className={`bg-white rounded-lg border transition-all duration-200 ${
                selectedPosts.includes(post.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedPosts.includes(post.id)}
                    onChange={() => togglePostSelection(post.id)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />

                  {/* Featured Image */}
                  {post.featured_image && (
                    <div className="flex-shrink-0">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        width={120}
                        height={80}
                        className="rounded-lg object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Post Type Badge */}
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPostTypeLabel(post.status).color}`}>
                            {getPostTypeLabel(post.status).label}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(post.created_at)}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Content Preview */}
                        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                          {post.content.replace(/<[^>]*>/g, '').substring(0, 200)}...
                        </p>

                        {/* Author */}
                        {post.author?.display_name && (
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1" />
                            <span>Bởi {post.author.display_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <a
                          href={`/blog/${post.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem bài viết"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                        <button
                          onClick={() => handleUnsave(post.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Bỏ lưu"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}