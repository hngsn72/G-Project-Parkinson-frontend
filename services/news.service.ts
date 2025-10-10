import { backendApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import type { 
  NewsArticle, 
  NewsCategory, 
  CreateNewsArticleRequest, 
  CreateNewsCategoryRequest,
  BackendPaginatedResponse
} from '@/lib/api-config';

export class NewsService {
  // Public endpoints - anyone can view
  static async getCategories() {
    return backendApi.get<NewsCategory[]>(API_ENDPOINTS.backend.newsCategories);
  }

  static async getArticles(params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_ENDPOINTS.backend.newsArticles}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return backendApi.get<BackendPaginatedResponse<NewsArticle>>(url);
  }

  static async getArticleById(id: string) {
    return backendApi.get<NewsArticle>(API_ENDPOINTS.backend.newsArticleById(id));
  }

  static async getArticleBySlug(slug: string) {
    return backendApi.get<NewsArticle>(API_ENDPOINTS.backend.newsArticleBySlug(slug));
  }

  // Admin endpoints - require admin role
  static async getAdminCategories() {
    return backendApi.get<NewsCategory[]>(API_ENDPOINTS.backend.adminNewsCategories);
  }

  static async createCategory(data: CreateNewsCategoryRequest) {
    return backendApi.post<NewsCategory>(API_ENDPOINTS.backend.adminNewsCategories, data);
  }

  static async updateCategory(id: string, data: Partial<CreateNewsCategoryRequest>) {
    return backendApi.put<NewsCategory>(API_ENDPOINTS.backend.adminNewsCategoryById(id), data);
  }

  static async deleteCategory(id: string) {
    return backendApi.delete(API_ENDPOINTS.backend.adminNewsCategoryById(id));
  }

  static async getAdminArticles(params?: {
    page?: number;
    limit?: number;
    category_id?: number;
    status?: string;
    priority?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_ENDPOINTS.backend.adminNewsArticles}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return backendApi.get<BackendPaginatedResponse<NewsArticle>>(url);
  }

  static async createArticle(data: CreateNewsArticleRequest) {
    return backendApi.post<NewsArticle>(API_ENDPOINTS.backend.adminNewsArticles, data);
  }

  static async updateArticle(id: string, data: Partial<CreateNewsArticleRequest>) {
    return backendApi.put<NewsArticle>(API_ENDPOINTS.backend.adminNewsArticleById(id), data);
  }

  static async deleteArticle(id: string) {
    return backendApi.delete(API_ENDPOINTS.backend.adminNewsArticleById(id));
  }

  static async getAdminArticleById(id: string) {
    return backendApi.get<NewsArticle>(API_ENDPOINTS.backend.adminNewsArticleById(id));
  }
}