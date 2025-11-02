'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BlogService } from '@/services/blog.service';
import type { BlogPost } from '@/lib/api-config';
import PostCard from '@/components/blog/PostCard';
import { 
  Search, 
  Plus,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function BlogFeedPage() {
  const { user, isAdmin, isDoctor, hasPermission } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'my-posts' | 'admin'>('published');

  const loadPosts = useCallback(async (page: number = 1, reset: boolean = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      let postsRes;
      
      if (activeTab === 'published') {
        // Public view - only approved posts
        postsRes = await BlogService.getPosts({
          page,
          limit: 10,
          status: 'approved',
          search: searchTerm || undefined,
        });
      } else if (activeTab === 'my-posts' && (isDoctor() || isAdmin())) {
        // Doctor's own posts
        postsRes = await BlogService.getMyPosts({
          page,
          limit: 10,
        });
      } else if (activeTab === 'admin' && isAdmin()) {
        // Admin view - all posts
        postsRes = await BlogService.getAllPosts({
          page,
          limit: 10,
        });
      }

      if (postsRes?.success && postsRes.data) {
        const newPosts = postsRes.data.data;
        if (reset || page === 1) {
          setPosts(newPosts);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
        }
        
        const pagination = postsRes.data.pagination;
        if (pagination) {
          const totalPages = Math.ceil(pagination.total / pagination.limit);
          setHasMore(page < totalPages);
        }
      }
    } catch (error) {
      console.error('Error loading blog posts:', error);
      toast.error('Không thể tải bài viết');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab, searchTerm, isDoctor, isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
    loadPosts(1, true);
  }, [loadPosts]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadPosts(nextPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadPosts(1, true);
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    loadPosts(1, true);
  };

  const handleReact = async (postId: number, reactionType: string) => {
    try {
      await BlogService.reactToPost(postId, { reaction_type: reactionType });
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              user_reaction: { 
                id: 0, 
                post_id: postId, 
                user_id: user?.id || 0, 
                reaction_type: reactionType, 
                created_at: new Date().toISOString(), 
                updated_at: new Date().toISOString() 
              },
              like_count: (post.like_count || 0) + (post.user_reaction ? 0 : 1)
            }
          : post
      ));
      
      toast.success(`Đã ${reactionType === 'like' ? 'thích' : reactionType} bài viết`);
    } catch (error) {
      console.error('Error reacting to post:', error);
      toast.error('Không thể thực hiện phản ứng');
    }
  };

  const handleRemoveReaction = async (postId: number) => {
    try {
      await BlogService.removeReaction(postId);
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              user_reaction: undefined,
              like_count: Math.max(0, (post.like_count || 0) - 1)
            }
          : post
      ));
      
      toast.success('Đã bỏ phản ứng');
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast.error('Không thể bỏ phản ứng');
    }
  };

  const handleSave = async (postId: number) => {
    try {
      await BlogService.savePost(postId);
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, is_saved: true }
          : post
      ));
      
      toast.success('Đã lưu bài viết');
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Không thể lưu bài viết');
    }
  };

  const handleUnsave = async (postId: number) => {
    try {
      await BlogService.unsavePost(postId);
      
      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, is_saved: false }
          : post
      ));
      
      toast.success('Đã bỏ lưu bài viết');
    } catch (error) {
      console.error('Error unsaving post:', error);
      toast.error('Không thể bỏ lưu bài viết');
    }
  };

  const canCreatePost = hasPermission('blog.create') || isDoctor() || isAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Blog Bác sĩ</h1>
                <p className="text-gray-600">Chia sẻ kinh nghiệm và góc nhìn từ các bác sĩ</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Làm mới"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => {
                  setActiveTab('published');
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

          {/* Search and Create */}
          <div className="p-6">
            <div className="flex space-x-4">
              <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Tìm
                </button>
              </form>
              
              {canCreatePost && (
                <button
                  onClick={() => router.push('/blog/create')}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Viết bài</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReact={handleReact}
                  onRemoveReaction={handleRemoveReaction}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                />
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="text-center py-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <span>Tải thêm bài viết</span>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'published' ? 'Chưa có bài báo nào' : 
                 activeTab === 'my-posts' ? 'Bạn chưa có bài báo nào' : 
                 'Không có bài báo nào cần duyệt'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'published' ? 'Hiện tại chưa có bài báo nào được xuất bản.' :
                 activeTab === 'my-posts' ? 'Hãy viết bài báo đầu tiên của bạn!' :
                 'Tất cả bài báo đã được xử lý.'}
              </p>
              {canCreatePost && activeTab === 'my-posts' && (
                <button
                  onClick={() => router.push('/blog/create')}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Viết bài mới</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}