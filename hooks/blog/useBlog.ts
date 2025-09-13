"use client";

import { CardData } from "@/components/blog/types/CardData";
import { useState, useEffect, useCallback } from "react";
interface UseBlog {
  blogs: CardData[];
  loading: boolean;
  error: string | null;
  fetchBlogs: () => Promise<void>;
  fetchBlogDetail: (id: string) => Promise<CardData | null>;
  createBlog: (newBlog: Omit<CardData, "id">) => Promise<CardData | null>;
}

export function useBlog(
  apiUrl: string = "http://localhost:3029/v1/blogs"
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
      const data: CardData[] = await res.json();
      setBlogs(data);
    } catch (err: any) {
      setError(err.message);
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
        console.log('res', res);
        if (!res.ok) throw new Error("Failed to fetch blog detail");
        return await res.json();
      } catch (err: any) {
        setError(err.message || "Error fetching blog detail");
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
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [apiUrl]
  );

  // Auto load on mount
  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return {
    blogs,
    loading,
    error,
    fetchBlogs,
    fetchBlogDetail,
    createBlog,
  };
}
