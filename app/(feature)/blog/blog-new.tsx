'use client';

import BlogFeed from '@/components/blog/BlogFeed';

export default function BlogPageNew() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <BlogFeed />
      </div>
    </div>
  );
}