'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { BlogPost } from '@/lib/api-config';
import { 
  Clock, 
  Eye, 
  Bookmark, 
  BookmarkCheck, 
  Share2,
  ExternalLink,
  Calendar,
  User,
  Shield
} from 'lucide-react';

interface NewsCardProps {
  post: BlogPost;
  onSave?: (postId: number) => void;
  onUnsave?: (postId: number) => void;
  className?: string;
}

export default function NewsCard({ 
  post, 
  onSave, 
  onUnsave,
  className = ''
}: NewsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Đã duyệt
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Đang chờ
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    const stripped = stripHtml(content);
    return stripped.length > maxLength 
      ? stripped.substring(0, maxLength) + '...'
      : stripped;
  };

  return (
    <article className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${className}`}>
      {/* Header with official badge */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-600">TIN TỨC CHÍNH THỨC</h4>
              <p className="text-xs text-gray-500">Từ Ban Quản Trị</p>
            </div>
          </div>
          {getStatusBadge(post.status)}
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative h-48 bg-gray-100">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
          {post.title}
        </h2>

        {/* Summary */}
        {post.summary && (
          <p className="text-gray-700 font-medium mb-3 leading-relaxed">
            {post.summary}
          </p>
        )}

        {/* Content Preview */}
        <div className="text-gray-600 leading-relaxed">
          <p>
            {isExpanded 
              ? stripHtml(post.content)
              : truncateContent(post.content)
            }
          </p>
          
          {stripHtml(post.content).length > 200 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
            >
              {isExpanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.created_at)}</span>
              </div>
              
              {post.author?.display_name && (
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{post.author.display_name}</span>
                </div>
              )}
              
              {post.view_count && post.view_count > 0 && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{post.view_count} lượt xem</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Save/Unsave Button */}
              <button
                onClick={() => post.is_saved ? onUnsave?.(post.id) : onSave?.(post.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  post.is_saved 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {post.is_saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4" />
                    <span className="font-medium">Đã lưu</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    <span className="font-medium">Lưu tin</span>
                  </>
                )}
              </button>

              {/* Share Button */}
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Chia sẻ</span>
              </button>
            </div>

            {/* Read More Link */}
            <a
              href={`/news/${post.id}`}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <span className="font-medium">Đọc đầy đủ</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}