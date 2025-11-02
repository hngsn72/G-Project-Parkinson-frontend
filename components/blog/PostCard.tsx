'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import CommentSection from './CommentSection';
import { vi } from 'date-fns/locale';
import type { BlogPost } from '@/lib/api-config';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  BookmarkCheck,
  MoreHorizontal,
  Eye,
  ThumbsUp,
  Smile,
  Frown,
  Angry
} from 'lucide-react';

interface PostCardProps {
  post: BlogPost;
  onReact?: (postId: number, reactionType: string) => void;
  onRemoveReaction?: (postId: number) => void;
  onSave?: (postId: number) => void;
  onUnsave?: (postId: number) => void;
}

const reactionIcons = {
  like: { icon: ThumbsUp, color: 'text-blue-600', bgColor: 'bg-blue-50', hoverColor: 'hover:bg-blue-100' },
  love: { icon: Heart, color: 'text-red-600', bgColor: 'bg-red-50', hoverColor: 'hover:bg-red-100' },
  care: { icon: Heart, color: 'text-yellow-600', bgColor: 'bg-yellow-50', hoverColor: 'hover:bg-yellow-100' },
  laugh: { icon: Smile, color: 'text-green-600', bgColor: 'bg-green-50', hoverColor: 'hover:bg-green-100' },
  wow: { icon: Smile, color: 'text-purple-600', bgColor: 'bg-purple-50', hoverColor: 'hover:bg-purple-100' },
  sad: { icon: Frown, color: 'text-gray-600', bgColor: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' },
  angry: { icon: Angry, color: 'text-red-800', bgColor: 'bg-red-100', hoverColor: 'hover:bg-red-200' },
};

export default function PostCard({ 
  post, 
  onReact, 
  onRemoveReaction, 
  onSave, 
  onUnsave
}: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            Đã duyệt
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Chờ duyệt
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const handleReaction = (reactionType: string) => {
    if (post.user_reaction?.reaction_type === reactionType) {
      onRemoveReaction?.(post.id);
    } else {
      onReact?.(post.id, reactionType);
    }
    setShowReactions(false);
  };

  const extractTextFromContent = (content: string, maxLength: number = 300) => {
    const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*_]/g, '');
    return plainText.length > maxLength ? plainText.slice(0, maxLength) + '...' : plainText;
  };

  const currentReaction = post.user_reaction?.reaction_type;
  const currentReactionIcon = currentReaction ? reactionIcons[currentReaction as keyof typeof reactionIcons] : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mb-4">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="relative cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                {post.author?.display_name?.charAt(0).toUpperCase() || 'D'}
              </div>
              {/* Online status indicator */}
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-400 border-3 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1">
              {/* Author name and role */}
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 hover:underline cursor-pointer text-[15px]">
                  {post.author?.display_name || 'Bác sĩ'}
                </h3>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                  {post.author?.role === 'doctor' ? 'Bác sĩ' : 'Admin'}
                </span>
                {getStatusBadge(post.status)}
              </div>
              
              {/* Timestamp */}
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="hover:underline cursor-pointer">{formatDate(post.created_at)}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Eye className="h-3 w-3" />
                  <span>{post.view_count || 0} lượt xem</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* More options */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreHorizontal className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <div className="prose max-w-none">
          <p className="text-gray-900 text-[15px] leading-relaxed whitespace-pre-wrap">
            {isExpanded ? post.content : extractTextFromContent(post.content)}
          </p>
          {post.content.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700 font-semibold text-[15px] mt-2"
            >
              {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
            </button>
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {post.images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative aspect-video">
                <Image
                  src={image}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover rounded-lg"
                />
                {(post.images?.length || 0) > 4 && index === 3 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white font-semibold">+{(post.images?.length || 0) - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {((post.like_count || 0) > 0 || (post.comment_count || 0) > 0) && (
        <div className="px-6 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              {(post.like_count || 0) > 0 && (
                <div className="flex items-center space-x-2 cursor-pointer hover:underline">
                  <div className="flex -space-x-1">
                    <div className="h-[18px] w-[18px] bg-blue-500 rounded-full flex items-center justify-center z-10">
                      <ThumbsUp className="h-[10px] w-[10px] text-white" />
                    </div>
                    <div className="h-[18px] w-[18px] bg-red-500 rounded-full flex items-center justify-center">
                      <Heart className="h-[10px] w-[10px] text-white" />
                    </div>
                    <div className="h-[18px] w-[18px] bg-yellow-500 rounded-full flex items-center justify-center">
                      <Smile className="h-[10px] w-[10px] text-white" />
                    </div>
                  </div>
                  <span className="font-medium">{post.like_count || 0}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {(post.comment_count || 0) > 0 && (
                <span className="hover:underline cursor-pointer">
                  {post.comment_count || 0} bình luận
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-6 py-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Like button with reactions */}
            <div className="relative">
              <button
                onMouseEnter={() => setShowReactions(true)}
                onMouseLeave={() => setShowReactions(false)}
                onClick={() => handleReaction('like')}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                  currentReaction 
                    ? `${currentReactionIcon?.color} ${currentReactionIcon?.bgColor} ${currentReactionIcon?.hoverColor}` 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {currentReactionIcon ? (
                  <currentReactionIcon.icon className="h-5 w-5" />
                ) : (
                  <ThumbsUp className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {currentReaction 
                    ? currentReaction.charAt(0).toUpperCase() + currentReaction.slice(1)
                    : 'Thích'
                  }
                </span>
              </button>

              {/* Reactions popup */}
              {showReactions && (
                <div 
                  className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border p-2 flex space-x-2 z-10"
                  onMouseEnter={() => setShowReactions(true)}
                  onMouseLeave={() => setShowReactions(false)}
                >
                  {Object.entries(reactionIcons).map(([reaction, config]) => {
                    const IconComponent = config.icon;
                    return (
                      <button
                        key={reaction}
                        onClick={() => handleReaction(reaction)}
                        className={`p-2 rounded-full transition-all transform hover:scale-110 ${config.bgColor} ${config.hoverColor}`}
                        title={reaction}
                      >
                        <IconComponent className={`h-5 w-5 ${config.color}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comment button */}
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                showComments 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">
                {showComments ? 'Ẩn bình luận' : 'Bình luận'}
                {post.comment_count && post.comment_count > 0 && (
                  <span className="ml-1">({post.comment_count})</span>
                )}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-1">
            {/* Save button */}
            <button
              onClick={() => post.is_saved ? onUnsave?.(post.id) : onSave?.(post.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all font-medium ${
                post.is_saved 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {post.is_saved ? (
                <BookmarkCheck className="h-5 w-5" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
              <span className="font-medium">
                {post.is_saved ? 'Đã lưu' : 'Lưu'}
              </span>
            </button>

            {/* Share button */}
            <button className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-all font-medium">
              <Share2 className="h-5 w-5" />
              <span className="font-medium">Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Comment Section */}
        {showComments && (
          <CommentSection 
            postId={post.id} 
            commentCount={post.comment_count || 0}
            onCommentCountChange={(count) => {
              // Update comment count in parent if needed
              post.comment_count = count;
            }}
          />
        )}
      </div>
    </div>
  );
}