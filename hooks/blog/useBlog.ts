"use client";

import { useState, useEffect, useCallback } from "react";
import { CardData } from "@/components/blog/types/CardData";
import type { BlogPost } from "@/lib/api-config";
import { BlogService } from "@/services/blog.service";

export interface CommentItem {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  parent_id?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface UseBlog {
  blogs: CardData[];
  loading: boolean;
  error: string | null;
  fetchBlogs: () => Promise<void>;
  fetchBlogDetail: (id: string) => Promise<CardData | null>;
  createBlog: (newBlog: Omit<CardData, "id">) => Promise<CardData | null>;
  saveBlog: (postId: string, userId: string) => Promise<void>;
  unsaveBlog: (postId: string, userId: string) => Promise<void>;
  fetchComments: (postId: string, page?: number, limit?: number) => Promise<Paginated<CommentItem>>;
  fetchReplies: (commentId: string, page?: number, limit?: number) => Promise<Paginated<CommentItem>>;
  createComment: (postId: string, content: string, parentId?: string | number) => Promise<CommentItem>;
}

export function useBlog(
  apiUrl: string = "http://localhost:3009/v1/blogs"
): UseBlog {
  const [blogs, setBlogs] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch list of blogs
  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch blogs");
      const data: { data: BlogPost[] } = await res.json();
      const blogPosts = data.data || [];
      const cardDataList: CardData[] = blogPosts.map((post: BlogPost) => ({
        id: String(post.id),
        img: post.featured_image || "",
        tag: post.tags?.[0] || "",
        title: post.title,
        description: post.summary || post.content?.slice(0, 120) || "",
        authors: post.author ? [{ name: post.author.display_name, avatar: "" }] : [],
      }));
      setBlogs(cardDataList);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Fetch blog detail
  const fetchBlogDetail = useCallback(
    async (id: string): Promise<CardData | null> => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${apiUrl}/${id}`);
        if (!res.ok) throw new Error("Failed to fetch blog detail");
        const post: BlogPost = await res.json();
        const cardData: CardData = {
          id: String(post.id),
          img: post.featured_image || "",
          tag: post.tags?.[0] || "",
          title: post.title,
          description: post.summary || post.content?.slice(0, 120) || "",
          authors: post.author ? [{ name: post.author.display_name, avatar: "" }] : [],
        };
        return cardData;
      } catch (err) {
        setError((err as Error).message || "Error fetching blog detail");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  // Create new blog
  const createBlog = useCallback(
    async (newBlog: Omit<CardData, "id">): Promise<CardData | null> => {
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newBlog),
        });
        if (!res.ok) throw new Error("Failed to create blog");
        const created = await res.json();
        setBlogs((prev) => [created, ...prev]);
        return created;
      } catch (err) {
        setError((err as Error).message);
        return null;
      }
    },
    [apiUrl]
  );

  const saveBlog = useCallback(async (postId: string, userId: string) => {
    const res = await fetch(`${apiUrl}/${postId}/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to save blog");
    }
  }, [apiUrl]);

  const unsaveBlog = useCallback(async (postId: string, userId: string) => {
    const res = await fetch(`${apiUrl}/${postId}/save`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || "Failed to unsave blog");
    }
  }, [apiUrl]);

  // Comment APIs
  const fetchComments = useCallback(
    async (postId: string, page: number = 1, limit: number = 10): Promise<Paginated<CommentItem>> => {
      const res = await BlogService.getComments(postId, page, limit) as Paginated<CommentItem>;
      return { data: res?.data ?? [], pagination: res?.pagination };
    },
    []
  );

  const createComment = useCallback(
    async (postId: string, content: string, parentId?: string | number): Promise<CommentItem> => {
      const res = await BlogService.createComment(postId, content, parentId) as { data?: CommentItem } | CommentItem;
      return (res as { data?: CommentItem }).data ?? (res as CommentItem);
    },
    []
  );

  // Auto load on mount
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const fetchReplies = useCallback(
    async (commentId: string, page: number = 1, limit: number = 10): Promise<Paginated<CommentItem>> => {
      const res = await BlogService.getReplies(commentId, page, limit) as Paginated<CommentItem>;
      return { data: res?.data ?? [], pagination: res?.pagination };
    },
    []
  );

  return {
    blogs,
    loading,
    error,
    fetchBlogs,
    fetchBlogDetail,
    createBlog,
    saveBlog,
    unsaveBlog,
    fetchComments,
    fetchReplies,
    createComment,
  };
}
