'use client';

import Link from "next/link";
import { useState, useEffect } from 'react';
import type { Comment } from '@/types/comment';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { BlogService } from '@/services/blog.service';
import type { BlogPost } from '@/lib/api-config';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Share2,
  Heart,
  MessageCircle,
  Eye
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function BlogDetailPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const postId = params?.id as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);

  // Load comments from API
  const loadComments = async () => {
    if (!postId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const res = await BlogService.getComments(postId);
      // API response: { success, data: Comment[] }
      if (res.success && Array.isArray(res.data)) {
        setComments(res.data.map((c: Record<string, any>) => ({
          name: c.user?.display_name || c.name || 'Ẩn danh',
          createdAt: c.created_at || c.createdAt,
          text: c.content || c.text,
        })));
      } else {
        setComments([]);
        setCommentsError('Không tải được bình luận');
      }
    } catch {
      setCommentsError('Có lỗi khi tải bình luận');
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  // Add comment handler (API)
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setCommentsLoading(true);
    setCommentsError(null);
    try {
      const res = await BlogService.createComment(postId, newComment);
      if (res.success) {
        setNewComment("");
        toast.success('Bình luận đã được gửi!');
        await loadComments();
      } else {
        setCommentsError('Không gửi được bình luận');
      }
    } catch {
      setCommentsError('Có lỗi xảy ra khi gửi bình luận');
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadPost = async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading blog post with ID:', postId);
      const res = await BlogService.getPostById(postId);
      console.log('📡 Full API response:', res);
      
      if (res.success && res.data) {
        console.log('✅ API response success');
        console.log('🔍 Raw response data:', JSON.stringify(res.data, null, 2));
        console.log('🔍 Data keys:', Object.keys(res.data));
        console.log('🔍 First key:', Object.keys(res.data)[0]);
        
        // Check if data is nested (common in some APIs)
        let actualData: BlogPost = res.data;
        const rawData = res.data as unknown as Record<string, unknown>;
        
        if (rawData.data && Object.keys(res.data).length === 1) {
          console.log('🔄 Detected nested data structure, unwrapping...');
          actualData = rawData.data as BlogPost;
          console.log('🔍 Unwrapped data:', JSON.stringify(actualData, null, 2));
        }
        
        console.log('📝 Final data to set:', actualData);
        console.log('📝 Has content?', !!actualData.content);
        console.log('📝 Has title?', !!actualData.title);
        console.log('📝 Has author?', !!actualData.author);
        console.log('📝 Post title:', actualData.title);
        console.log('📝 Post content preview:', actualData.content?.substring(0, 100) + '...');
        console.log('👤 Post author:', actualData.author);
        console.log('📅 Post status:', actualData.status);
        
        setPost(actualData);
      } else {
        console.error('❌ API failed:', res);
        setError(res.error || 'Không tìm thấy bài viết');
      }
    } catch {
      setError('Có lỗi xảy ra khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      loadPost();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleDelete = async () => {
    if (!post || !window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    
    try {
      const res = await BlogService.deletePost(post.id.toString());
      if (res.success) {
        toast.success('Xóa bài viết thành công');
        router.push('/blog');
      } else {
        toast.error(res.error || 'Có lỗi xảy ra khi xóa bài viết');
      }
    } catch (error) {
      console.error('Error deleting blog post:', error);
      toast.error('Có lỗi xảy ra khi xóa bài viết');
    }
  };

  const handleApprove = async (approved: boolean, rejectionReason?: string) => {
    if (!post) return;
    
    try {
      const res = await BlogService.approvePost(post.id.toString(), {
        approved,
        rejection_reason: rejectionReason
      });
      
      if (res.success) {
        toast.success(approved ? 'Đã duyệt bài viết' : 'Đã từ chối bài viết');
        loadPost(); // Reload to get updated data
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error approving blog post:', error);
      toast.error('Có lỗi xảy ra');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
            <CheckCircle className="h-4 w-4 mr-1" />
            Đã duyệt
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
            <Clock className="h-4 w-4 mr-1" />
            Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-red-100 text-red-800 border border-red-200 rounded-full">
            <XCircle className="h-4 w-4 mr-1" />
            Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200 rounded-full">
            <AlertCircle className="h-4 w-4 mr-1" />
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

  const renderMarkdown = (content: string) => {
    // Simple markdown-to-HTML converter
    if (!content) return '';
    
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 text-gray-900">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-4 text-gray-800 mt-8">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-3 text-gray-800 mt-6">$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic text-gray-800">$1</em>')
      .replace(/`(.*?)`/gim, '<code class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">$1</code>')
      .replace(/^\- (.*$)/gim, '<li class="mb-2">$1</li>')
      .replace(/(<li.*<\/li>)/gim, '<ul class="list-disc list-inside mb-4 pl-4">$1</ul>')
      .replace(/\n\n/gim, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/^(.*)$/gim, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>');
  };

  const canEdit = isAdmin() || (post && post.author_id === user?.id);
  const canApprove = isAdmin() && post?.status === 'pending';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy bài viết</h2>
          <p className="text-gray-600 mb-4">{error || 'Bài viết không tồn tại hoặc đã bị xóa'}</p>
          <button
            onClick={() => router.push('/blog')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách bài viết
          </button>
        </div>
      </div>
    );
  }

  // Check if user can view this post
  const canView = post.status === 'approved' || isAdmin() || (post.author_id === user?.id);
  
  if (!canView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Bài viết chưa được duyệt</h2>
          <p className="text-gray-600 mb-4">Bài viết này đang chờ admin duyệt và chưa thể xem được.</p>
          <button
            onClick={() => router.push('/blog')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách bài viết
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết bài viết</h1>
              <p className="text-gray-600">Đọc bài viết y khoa</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Action Buttons */}
            {canEdit && (
              <button
                onClick={() => router.push(`/blog/edit/${post.id}`)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <span>Chỉnh sửa</span>
              </button>
            )}
            
            {canEdit && (
              <button
                onClick={handleDelete}
                className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Xóa</span>
              </button>
            )}
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Share2 className="h-4 w-4" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Article Header */}
        <div className="p-8 border-b border-gray-200">
          <div className="space-y-4">
            {/* Status and Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
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
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>1,234 lượt xem</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>56 thích</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>12 bình luận</span>
                </div>
              </div>
            </div>

            {/* Title - Extract from content */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {post.content ? (post.content.split('\n')[0].replace(/^# /, '') || 'Bài viết y khoa') : 'Bài viết y khoa'}
            </h1>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Approval Info */}
            {post.approved_by && post.approved_at && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Đã được duyệt vào {formatDate(post.approved_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Rejection Info */}
            {post.status === 'rejected' && post.rejection_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-2 text-red-800">
                  <XCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Bài viết đã bị từ chối</p>
                    <p className="text-sm mt-1">Lý do: {post.rejection_reason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div className="p-8">
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content || '') }} />
          </article>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh đính kèm</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {post.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={image}
                      alt={`Hình ảnh ${index + 1}`}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-lg border group-hover:opacity-90 transition-opacity"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        {canApprove && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Duyệt bài viết</h4>
            <div className="flex space-x-3">
              <button
                onClick={() => handleApprove(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Duyệt bài</span>
              </button>
              
              <button
                onClick={() => {
                  const reason = prompt('Nhập lý do từ chối:');
                  if (reason) {
                    handleApprove(false, reason);
                  }
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                <span>Từ chối</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Bài viết được tạo vào {formatDate(post.created_at)}</p>
              {post.updated_at !== post.created_at && (
                <p>Cập nhật lần cuối: {formatDate(post.updated_at)}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                <Heart className="h-4 w-4" />
                <span>Thích</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span>Bình luận</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          💬 Bình luận
        </h3>
        {/* Comment Input Bar - Always show, Facebook style */}
        <div className="bg-gray-50 p-5 rounded-2xl shadow-sm border border-gray-200 mb-8">
          <p className="text-sm text-gray-600 mb-2">
            Bình luận dưới tên <span className="font-medium text-blue-600">{user?.display_name || userName || 'Ẩn danh'}</span>
          </p>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Hãy chia sẻ suy nghĩ của bạn..."
            className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleAddComment}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-xl shadow-sm transition-transform hover:scale-105"
              disabled={commentsLoading}
            >
              Gửi bình luận
            </button>
          </div>
        </div>

        {/* Comment List */}
        {commentsLoading ? (
          <p className="text-gray-500 text-center py-6 italic">Đang tải bình luận...</p>
        ) : commentsError ? (
          <p className="text-red-500 text-center py-6 italic">{commentsError}</p>
        ) : comments.length > 0 ? (
          <ul className="space-y-5">
            {comments.map((comment, index) => (
              <li key={index} className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {comment.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">{comment.name}</p>
                    <span className="text-sm text-gray-500">{comment.createdAt}</span>
                  </div>
                  <p className="text-gray-700 mt-1 leading-relaxed">{comment.text}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-6 italic">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn!
          </p>
        )}
      </div>
    </div>
  );
}