import BlogDetail from "@/components/blog/components/blog-detail/BlogDetail";
import { cardData } from "@/components/blog/mockData";

export default function BlogDetailPage({ params }: { params: { id: string } }) {
  const blog = cardData.find((item) => item.id === params.id);

  if (!blog) {
    return <div>Blog not found</div>;
  }

  return <BlogDetail blog={blog} />;
}