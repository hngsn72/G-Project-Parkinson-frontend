'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { NewsService } from '@/services/news.service';
import type { NewsArticle } from '@/lib/api-config';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  Edit,
  Trash2,
  Share2,
  Heart,
  MessageCircle,
  Eye,
  Globe,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function NewsDetailPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params?.slug as string;

  const loadArticle = async () => {
    if (!slug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Loading news article with slug:', slug);
      const res = await NewsService.getArticleBySlug(slug);
      console.log('📡 Full news API response:', res);
      
      if (res.success && res.data) {
        console.log('✅ News API response success');
        console.log('🔍 Raw news response data:', JSON.stringify(res.data, null, 2));
        console.log('🔍 News data keys:', Object.keys(res.data));
        console.log('🔍 First news key:', Object.keys(res.data)[0]);
        
        // Check if data is nested (common in some APIs)
        let actualData: NewsArticle = res.data;
        const rawData = res.data as unknown as Record<string, unknown>;
        
        if (rawData.data && Object.keys(res.data).length === 1) {
          console.log('🔄 Detected nested news data structure, unwrapping...');
          actualData = rawData.data as NewsArticle;
          console.log('🔍 Unwrapped news data:', JSON.stringify(actualData, null, 2));
        }
        
        console.log('📝 Final news data to set:', actualData);
        console.log('📝 Has content?', !!actualData.content);
        console.log('📝 Has title?', !!actualData.title);
        console.log('📝 Has category?', !!actualData.category);
        console.log('📝 Article title:', actualData.title);
        console.log('📝 Article content preview:', actualData.content?.substring(0, 100) + '...');
        console.log('🏷️ Article category:', actualData.category);
        console.log('📅 Article status:', actualData.status);
        
        setArticle(actualData);
        
        // Load related articles from the same category
        if (actualData.category_id) {
          loadRelatedArticles(actualData.category_id, actualData.id);
        }
      } else {
        console.error('❌ News API failed:', res.error);
        setError(res.error || 'Không tìm thấy bài viết');
      }
    } catch (error) {
      console.error('💥 Exception loading news article:', error);
      setError('Có lỗi xảy ra khi tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedArticles = async (categoryId: number, excludeId: number) => {
    try {
      const res = await NewsService.getArticles({
        category_id: categoryId,
        limit: 4,
        status: 'published'
      });

      if (res.success && res.data) {
        let actualData = res.data;
        const rawData = res.data as unknown as Record<string, unknown>;
        
        if (rawData.data && Array.isArray(rawData.data)) {
          console.log('🔄 Detected nested related articles structure, unwrapping...');
          actualData = { ...res.data, data: rawData.data };
        }
        
        const filteredArticles = actualData.data
          .filter((art: NewsArticle) => art.id !== excludeId)
          .slice(0, 4);
        
        console.log('📰 Setting related articles:', filteredArticles.length, 'articles');
        setRelatedArticles(filteredArticles);
      }
    } catch (error) {
      console.error('💥 Error loading related articles:', error);
    }
  };

  useEffect(() => {
    if (slug) {
      loadArticle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleDelete = async () => {
    if (!article || !window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    
    try {
      const res = await NewsService.deleteArticle(article.id.toString());
      if (res.success) {
        toast.success('Xóa bài viết thành công');
        router.push('/news');
      } else {
        toast.error(res.error || 'Có lỗi xảy ra khi xóa bài viết');
      }
    } catch (error) {
      console.error('Error deleting news article:', error);
      toast.error('Có lỗi xảy ra khi xóa bài viết');
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

  const canEdit = isAdmin();

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

  if (error || !article) {
    console.log('📰 News error state:', { error, article: !!article });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy bài viết</h2>
          <p className="text-gray-600 mb-4">{error || 'Bài viết không tồn tại hoặc đã bị xóa'}</p>
          <button
            onClick={() => router.push('/news')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại danh sách tin tức
          </button>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering news detail page with article:', article);

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
              <h1 className="text-2xl font-bold text-gray-900">Chi tiết tin tức</h1>
              <p className="text-gray-600">Đọc tin tức y khoa mới nhất</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Action Buttons */}
            {canEdit && (
              <button
                onClick={() => router.push(`/news/edit/${article.id}`)}
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
            {/* Category and Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {article.category && (
                  <span className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
                    <Tag className="h-3 w-3 mr-1" />
                    {article.category.name}
                  </span>
                )}
                {article.author && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{article.author.display_name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(article.created_at)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Globe className="h-4 w-4" />
                  <span>Đã xuất bản</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{article.view_count || 0} lượt xem</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4" />
                  <span>28 thích</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>7 bình luận</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{article.title}</h1>

            {/* Summary */}
            {article.summary && (
              <p className="text-lg text-gray-600 leading-relaxed">{article.summary}</p>
            )}

            {/* Featured Image */}
            {article.featured_image && (
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <Image
                  src={article.featured_image}
                  alt={article.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDgwMCAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iMjU2IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQwMCIgeT0iMTI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <div className="p-8">
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content || '') }} />
          </article>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Thẻ</h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>Tin tức được xuất bản vào {formatDate(article.created_at)}</p>
              {article.updated_at !== article.created_at && (
                <p>Cập nhật lần cuối: {formatDate(article.updated_at)}</p>
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

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tin tức liên quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((relatedArticle) => (
              <div
                key={relatedArticle.id}
                className="group cursor-pointer"
                onClick={() => router.push(`/news/${relatedArticle.slug}`)}
              >
                <div className="space-y-3">
                  {relatedArticle.featured_image && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <Image
                        src={relatedArticle.featured_image}
                        alt={relatedArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDMwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iNjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8c3ZnPgo=';
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {relatedArticle.title}
                    </h4>
                    {relatedArticle.summary && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{relatedArticle.summary}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(relatedArticle.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}