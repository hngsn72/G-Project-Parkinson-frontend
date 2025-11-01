'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { NewsService } from '@/services/news.service';
import type { NewsArticle, NewsCategory } from '@/lib/api-config';
import { 
  Search, 
  Calendar, 
  Eye, 
  ArrowRight, 
  Tag,
  Plus,
  Newspaper,
  Globe,
  ExternalLink
} from 'lucide-react';

export default function NewsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load categories
      const categoriesRes = await NewsService.getCategories();
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      // Load articles
      const articlesRes = await NewsService.getArticles({
        page: currentPage,
        limit: 12,
        category_id: selectedCategory || undefined,
        priority: selectedPriority || undefined,
        search: searchTerm || undefined,
        status: 'published'
      });

      if (articlesRes.success && articlesRes.data) {
        console.log('📰 News articles response:', articlesRes.data);
        setArticles(articlesRes.data.data);
        const pagination = articlesRes.data.pagination;
        if (pagination) {
          const totalPages = Math.ceil(pagination.total / pagination.limit);
          setTotalPages(totalPages);
          console.log('📄 News Pagination:', { total: pagination.total, limit: pagination.limit, totalPages });
        }
      }
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, selectedPriority, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Newspaper className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tin tức Y khoa</h1>
              <p className="text-gray-600">Cập nhật thông tin mới nhất về Parkinson và Y khoa</p>
            </div>
          </div>
          
          {isAdmin() && (
            <button
              onClick={() => router.push('/admin/news')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Quản lý tin tức</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search */}
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm tin tức..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tìm kiếm
            </button>
          </div>

          {/* Category and Priority Filters */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <select
                value={selectedCategory || ''}
                onChange={(e) => {
                  setSelectedCategory(e.target.value ? parseInt(e.target.value) : null);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả danh mục</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả mức độ</option>
                <option value="high">Quan trọng</option>
                <option value="normal">Bình thường</option>
                <option value="low">Thấp</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(`/news/${article.slug}`)}
            >
              {/* Featured Image */}
              {article.featured_image && (
                <div className="relative h-48 overflow-hidden rounded-t-lg">
                  <Image
                    src={article.featured_image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {article.priority === 'high' && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                        Quan trọng
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6">
                {/* Category */}
                {article.category && (
                  <div className="flex items-center space-x-2 mb-3">
                    <span 
                      className="px-2 py-1 text-xs font-medium rounded-full border"
                      style={{ 
                        backgroundColor: article.category.color ? `${article.category.color}20` : '#f3f4f6',
                        color: article.category.color || '#6b7280',
                        borderColor: article.category.color || '#d1d5db'
                      }}
                    >
                      {article.category.icon} {article.category.display_name}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {article.summary}
                </p>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full flex items-center"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(article.published_at || article.created_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{article.view_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">Đọc thêm</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Source */}
                {article.source && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Globe className="h-3 w-3" />
                      <span>Nguồn: {article.source}</span>
                      {article.source_url && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có tin tức nào</h3>
          <p className="text-gray-600">Hiện tại chưa có tin tức nào được đăng tải.</p>
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