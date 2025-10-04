'use client'

import BlogDetail from "@/components/blog/components/blog-detail/BlogDetail";
import { CardData } from "@/components/blog/types/CardData";
import { useBlog } from "@/hooks/blog/useBlog";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BlogDetailPage() {
  const { id } = useParams();
  const { fetchBlogDetail, loading, error } = useBlog();
  const [blog, setBlog] = useState<CardData | null>(null);

  useEffect(() => {
    if (id) {
      fetchBlogDetail(id as string).then((data) => {
        if (data) setBlog(data);
      });
    }
  }, [id, fetchBlogDetail]);

  if (loading) {
    return (
      <Box  display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!blog) {
    return <Alert severity="info">Blog not found</Alert>;
  }

  return <BlogDetail blog={blog} loading={loading} />;
}