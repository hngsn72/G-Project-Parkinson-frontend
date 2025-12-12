import { backendApi } from "@/lib/api-client";

export interface NewsCategory {
  id: number;
  name: string;
  display_name: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface NewsArticle {
  id: number;
  author_id: number;
  author: {
    id: number;
    full_name: string;
    avatar_url?: string;
  };
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  images?: string[];
  category_id: number;
  category?: NewsCategory;
  tags: string[];
  source?: string;
  source_url?: string;
  status: string;
  priority: string;
  view_count: number;
  save_count: number;
  published_at: string | null;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewsArticleRequest {
  title: string;
  summary: string;
  content: string;
  content_blocks?: Array<Record<string, unknown>>;
  featured_image?: string;
  images?: string[];
  category_id: number;
  tags: string[];
  source?: string;
  source_url?: string;
  status: string;
  priority?: string;
  published_at?: string;
}

export class NewsArticleService {
  // Public endpoints
  static async getCategories() {
    return backendApi.get<{ data: NewsCategory[] }>("/api/v1/news/categories");
  }

  static async getArticles(
    categoryId?: number,
    priority?: string,
    page: number = 1,
    limit: number = 12
  ) {
    const params = new URLSearchParams();
    if (categoryId) params.append("category_id", categoryId.toString());
    if (priority) params.append("priority", priority);
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    return backendApi.get<{
      data: NewsArticle[];
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    }>(`/api/v1/news/articles?${params.toString()}`);
  }

  static async getArticleBySlug(slug: string) {
    return backendApi.get<{ data: NewsArticle }>(
      `/api/v1/news/articles/slug/${slug}`
    );
  }

  // Authenticated user endpoints
  static async saveArticle(articleId: number) {
    return backendApi.post<{ message: string }>(
      `/api/v1/news/articles/${articleId}/save`
    );
  }

  static async unsaveArticle(articleId: number) {
    return backendApi.delete<{ message: string }>(
      `/api/v1/news/articles/${articleId}/save`
    );
  }

  static async getSavedArticles(page: number = 1, limit: number = 10) {
    return backendApi.get<{
      data: NewsArticle[];
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    }>(`/api/v1/news/saved?page=${page}&limit=${limit}`);
  }

  // Admin endpoints
  static async createCategory(data: Partial<NewsCategory>) {
    return backendApi.post<{ data: NewsCategory }>(
      "/api/v1/news/admin/categories",
      data
    );
  }

  static async createArticle(data: NewsArticleRequest) {
    return backendApi.post<{ data: NewsArticle }>(
      "/api/v1/news/admin/articles",
      data
    );
  }

  static async getAllArticles(page: number = 1, limit: number = 20) {
    return backendApi.get<{
      data: NewsArticle[];
      pagination: {
        page: number;
        limit: number;
        total: number;
      };
    }>(`/api/v1/news/admin/articles?page=${page}&limit=${limit}`);
  }

  static async updateArticle(id: number, data: NewsArticleRequest) {
    return backendApi.put<{ data: NewsArticle }>(
      `/api/v1/news/admin/articles/${id}`,
      data
    );
  }

  static async deleteArticle(id: number) {
    return backendApi.delete<{ message: string }>(
      `/api/v1/news/admin/articles/${id}`
    );
  }
}
