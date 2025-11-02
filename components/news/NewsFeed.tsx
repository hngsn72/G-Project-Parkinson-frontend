'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Search, Bell, Newspaper } from 'lucide-react';
import NewsCard from './NewsCard';
import { BlogService } from '@/services/blog.service';
import { useAuth } from '@/hooks/useAuth';
import type { BlogPost } from '@/lib/api-config';

interface NewsFeedProps {
  className?: string;
}

export default function NewsFeed({ className }: NewsFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'important' | 'recent'>('all');

  useEffect(() => {
    loadNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadNews = async (pageNum: number = 1) => {
    if (pageNum === 1) {
      setLoading(true);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }

    try {
      // For news, we want approved posts only, ordered by creation date
      const response = await BlogService.getAllPosts({
        page: pageNum,
        limit: 10,
        status: 'approved',
        author_id: undefined // To get news-style posts
      });

      if (response?.data) {
        const newPosts = Array.isArray(response.data) ? response.data : response.data.data || [];
        
        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }

        setHasMore(newPosts.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Không thể tải tin tức');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadNews(1);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadNews(page + 1);
    }
  };

  const handleSave = async (postId: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu tin tức');
      return;
    }

    try {
      await BlogService.savePost(postId);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, is_saved: true } : post
      ));
      toast.success('Đã lưu tin tức');
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Không thể lưu tin tức');
    }
  };

  const handleUnsave = async (postId: number) => {
    try {
      await BlogService.unsavePost(postId);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, is_saved: false } : post
      ));
      toast.success('Đã bỏ lưu tin tức');
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast.error('Không thể bỏ lưu tin tức');
    }
  };

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    switch (activeTab) {
      case 'important':
        return posts.filter(post => post.view_count && post.view_count > 100);
      case 'recent':
        return posts.filter(post => {
          const postDate = new Date(post.created_at);
          const daysDiff = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysDiff <= 7;
        });
      default:
        return posts;
    }
  };

  const filteredPosts = getFilteredPosts();

  if (loading && posts.length === 0) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 space-y-4 border">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          <div className="p-3 bg-blue-100 rounded-xl">
            <Newspaper className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tin tức chính thức</h1>
            <p className="text-gray-600">
              Cập nhật thông tin quan trọng từ Ban Quản Trị
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">
            {filteredPosts.length} tin tức
          </span>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tin tức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Search className="h-5 w-5" />
          <span>Tìm</span>
        </button>
      </form>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'important', label: 'Quan trọng' },
          { key: 'recent', label: 'Gần đây' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'all' | 'important' | 'recent')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* News List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <Newspaper className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Không tìm thấy tin tức' : 'Chưa có tin tức mới'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Thử thay đổi từ khóa tìm kiếm'
              : 'Tin tức mới sẽ được cập nhật sớm'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post, index) => (
            <NewsCard
              key={`${post.id}-${index}`}
              post={post}
              onSave={handleSave}
              onUnsave={handleUnsave}
              className="mb-6"
            />
          ))}

          {/* Load More */}
          {hasMore && !loading && (
            <div className="text-center py-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Đang tải...' : 'Tải thêm tin tức'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}