import { backendApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api-config';
import type { 
  BlogPost, 
  CreateBlogPostRequest, 
  ApproveBlogPostRequest, 
  BackendPaginatedResponse
} from '@/lib/api-config';

export class BlogService {
  // Public endpoints - view approved posts
  static async getPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    author_id?: number;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.author_id) queryParams.append('author_id', params.author_id.toString());
    if (params?.search) queryParams.append('search', params.search);

    const url = `${API_ENDPOINTS.backend.blogPosts}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return backendApi.get<BackendPaginatedResponse<BlogPost>>(url);
  }

  static async getPostById(id: string) {
    return backendApi.get<BlogPost>(API_ENDPOINTS.backend.blogPostById(id));
  }

  // Doctor/Admin endpoints - create and manage posts
  static async createPost(data: CreateBlogPostRequest) {
    return backendApi.post<BlogPost>(API_ENDPOINTS.backend.blogPosts, data);
  }

  static async updatePost(id: string, data: Partial<CreateBlogPostRequest>) {
    return backendApi.put<BlogPost>(API_ENDPOINTS.backend.blogPostById(id), data);
  }

  static async deletePost(id: string) {
    return backendApi.delete(API_ENDPOINTS.backend.blogPostById(id));
  }

  // Admin only - approval workflow
  static async approvePost(id: string, data: ApproveBlogPostRequest) {
    return backendApi.put<BlogPost>(API_ENDPOINTS.backend.blogPostApprove(id), data);
  }

  // Get posts by current user (for doctors to see their own posts)
  static async getMyPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    queryParams.append('my_posts', 'true');

    const url = `${API_ENDPOINTS.backend.blogPosts}?${queryParams.toString()}`;
    return backendApi.get<BackendPaginatedResponse<BlogPost>>(url);
  }

  // Admin only - get all posts (including pending)
  static async getAllPosts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    author_id?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.author_id) queryParams.append('author_id', params.author_id.toString());
    queryParams.append('admin_view', 'true');

    const url = `${API_ENDPOINTS.backend.blogPosts}?${queryParams.toString()}`;
    return backendApi.get<BackendPaginatedResponse<BlogPost>>(url);
  }

  // Comment APIs
  static async getComments(postId: string, page: number = 1, limit: number = 10) {
    const url = `${API_ENDPOINTS.backend.blogComments(postId)}?page=${page}&limit=${limit}`;
    const res = await backendApi.get(url);
    return res.data; // { data: Comment[], pagination }
  }

  static async createComment(postId: string, content: string, parentId?: string | number) {
    const payload: { content: string; parent_id?: number } = { content };
    if (parentId !== undefined && parentId !== null && parentId !== '') {
      const n = typeof parentId === 'string' ? Number(parentId) : parentId;
      if (!Number.isNaN(n)) payload.parent_id = n;
    }
    const res = await backendApi.post(API_ENDPOINTS.backend.blogComments(postId), payload);
    return res.data; // { data: Comment }
  }

  static async getReplies(commentId: string, page: number = 1, limit: number = 10) {
    const url = `${API_ENDPOINTS.backend.commentReplies(commentId)}?page=${page}&limit=${limit}`;
    const res = await backendApi.get(url);
    return res.data; // { data: Reply[], pagination }
  }
}