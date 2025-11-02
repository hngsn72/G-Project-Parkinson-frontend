'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { BlogService } from '@/services/blog.service';
import { Comment } from '@/types/comment';
import { 
  MessageCircle, 
  ThumbsUp, 
  Edit3, 
  Trash2, 
  Send,
  Smile
} from 'lucide-react';
import { toast } from 'react-toastify';

interface CommentSectionProps {
  postId: number;
  commentCount?: number;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentSection({ 
  postId, 
  commentCount = 0, 
  onCommentCountChange 
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    try {
      const response = await BlogService.getComments(postId.toString());
      if (response && typeof response === 'object' && 'data' in response) {
        const commentsData = (response as { data: Comment[] }).data;
        setComments(commentsData || []);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const response = await BlogService.createComment(postId.toString(), newComment);
      if (response) {
        setNewComment('');
        await loadComments(); // Reload to get updated data
        onCommentCountChange?.(commentCount + 1);
        toast.success('Đã thêm bình luận');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Không thể thêm bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user || !replyTo) return;

    setSubmitting(true);
    try {
      const response = await BlogService.createComment(postId.toString(), replyContent, replyTo);
      if (response) {
        setReplyContent('');
        setReplyTo(null);
        await loadComments();
        onCommentCountChange?.(commentCount + 1);
        toast.success('Đã trả lời bình luận');
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Không thể trả lời bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await BlogService.updateComment(commentId.toString(), editContent);
      if (response) {
        setEditingComment(null);
        setEditContent('');
        await loadComments();
        toast.success('Đã cập nhật bình luận');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Không thể cập nhật bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      const response = await BlogService.deleteComment(commentId.toString());
      if (response) {
        await loadComments();
        onCommentCountChange?.(Math.max(0, commentCount - 1));
        toast.success('Đã xóa bình luận');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Không thể xóa bình luận');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const canEditComment = (comment: Comment) => {
    return user && (user.id === comment.user_id || user.role === 'admin');
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-12' : ''} mb-4`}>
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-semibold">
            {comment.user?.display_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Comment bubble */}
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user?.display_name || 'Người dùng'}
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Người dùng
              </span>
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Chỉnh sửa bình luận..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    disabled={submitting}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 text-sm whitespace-pre-wrap">
                {comment.content}
              </p>
            )}
          </div>

          {/* Comment actions */}
          <div className="flex items-center space-x-4 mt-1 ml-4">
            <span className="text-xs text-gray-500">
              {formatDate(comment.created_at)}
            </span>
            
            {!isReply && user && (
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs text-gray-500 hover:text-blue-600 font-medium"
              >
                Trả lời
              </button>
            )}

            <button className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600">
              <ThumbsUp className="h-3 w-3" />
              <span>Thích</span>
            </button>

            {canEditComment(comment) && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => startEdit(comment)}
                  className="text-xs text-gray-500 hover:text-blue-600"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Reply form */}
          {replyTo === comment.id && (
            <form onSubmit={handleSubmitReply} className="mt-3 ml-4">
              <div className="flex space-x-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {user?.display_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Trả lời ${comment.user?.display_name || 'người này'}...`}
                    className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={2}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setReplyTo(null)}
                      className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100 rounded"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !replyContent.trim()}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Note: Replies will be loaded separately from backend */}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 pt-4">
      {/* Comment header */}
      <div className="flex items-center space-x-2 mb-4 px-4">
        <MessageCircle className="h-5 w-5 text-gray-500" />
        <span className="font-medium text-gray-900">
          {commentCount} bình luận
        </span>
      </div>

      {/* New comment form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="px-4 mb-6">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-semibold">
                {user.display_name?.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Thêm emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="px-4 mb-6 text-center py-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Vui lòng đăng nhập để bình luận</p>
        </div>
      )}

      {/* Comments list */}
      <div className="px-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Chưa có bình luận nào</p>
            <p className="text-sm">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
