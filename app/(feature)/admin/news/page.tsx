"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Send } from "lucide-react";
import { NewsArticleService, NewsArticle, NewsArticleRequest } from "@/services/news-article.service";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

const CATEGORIES = [
  { value: "parkinson_basics", label: "Kiến thức cơ bản" },
  { value: "treatment", label: "Điều trị" },
  { value: "lifestyle", label: "Lối sống" },
  { value: "research", label: "Nghiên cứu" },
  { value: "nutrition", label: "Dinh dưỡng" },
  { value: "exercise", label: "Vận động" },
  { value: "prevention", label: "Phòng ngừa" },
];

const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="border-b p-2 flex gap-1 flex-wrap">
      <Button
        type="button"
        size="sm"
        variant={editor.isActive("bold") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive("italic") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive("heading", { level: 2 }) ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive("heading", { level: 3 }) ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive("bulletList") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </Button>
      <Button
        type="button"
        size="sm"
        variant={editor.isActive("orderedList") ? "default" : "outline"}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          const url = prompt("Enter image URL:");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
      >
        Image
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          const url = prompt("Enter link URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
      >
        Link
      </Button>
    </div>
  );
};

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [form, setForm] = useState<Partial<NewsArticleRequest>>({
    title: "",
    summary: "",
    content: "",
    featured_image: "",
    category: "parkinson_basics",
    tags: [],
    meta_description: "",
    meta_keywords: "",
    status: "draft",
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: form.content || "",
    onUpdate: ({ editor }) => {
      setForm({ ...form, content: editor.getHTML() });
    },
  });

  useEffect(() => {
    fetchArticles();
  }, [filterStatus]);

  useEffect(() => {
    if (editor && form.content) {
      editor.commands.setContent(form.content);
    }
  }, [editor, showDialog]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await NewsArticleService.getAllArticles(filterStatus, 50, 0);
      setArticles(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingArticle(null);
    setForm({
      title: "",
      summary: "",
      content: "",
      featured_image: "",
      category: "parkinson_basics",
      tags: [],
      meta_description: "",
      meta_keywords: "",
      status: "draft",
    });
    setTagsInput("");
    if (editor) {
      editor.commands.setContent("");
    }
    setShowDialog(true);
  };

  const handleEdit = async (article: NewsArticle) => {
    setEditingArticle(article);
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      featured_image: article.featured_image,
      category: article.category,
      tags: article.tags,
      meta_description: article.meta_description,
      meta_keywords: article.meta_keywords,
      status: article.status as "draft" | "published",
    });
    setTagsInput(article.tags.join(", "));
    setShowDialog(true);
  };

  const handleSave = async (publish: boolean = false) => {
    try {
      const tags = tagsInput.split(",").map((t) => t.trim()).filter((t) => t);
      const data: NewsArticleRequest = {
        ...form,
        tags,
        status: publish ? "published" : "draft",
      } as NewsArticleRequest;

      if (editingArticle) {
        await NewsArticleService.updateArticle(editingArticle.id, data);
        alert(publish ? "Đã xuất bản bài viết!" : "Đã cập nhật bài viết!");
      } else {
        await NewsArticleService.createArticle(data);
        alert(publish ? "Đã tạo và xuất bản bài viết!" : "Đã tạo bản nháp!");
      }

      setShowDialog(false);
      fetchArticles();
    } catch (error) {
      console.error("Error saving article:", error);
      alert("Lỗi khi lưu bài viết");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;

    try {
      await NewsArticleService.deleteArticle(id);
      alert("Đã xóa bài viết!");
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      alert("Lỗi khi xóa bài viết");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Bản nháp</Badge>;
      case "published":
        return <Badge variant="default">Đã xuất bản</Badge>;
      case "archived":
        return <Badge variant="outline">Lưu trữ</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Bài Viết</h1>
          <p className="text-gray-600">Tạo và quản lý nội dung giáo dục</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo Bài Viết Mới
        </Button>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Select value={filterStatus} onValueChange={(value: string) => setFilterStatus(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tất cả</SelectItem>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
              <SelectItem value="archived">Lưu trữ</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Articles List */}
      <div className="grid gap-4">
        {articles.map((article) => (
          <Card key={article.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{article.title}</h3>
                    {getStatusBadge(article.status)}
                    <Badge variant="outline">{CATEGORIES.find((c) => c.value === article.category)?.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      <Eye className="inline h-3 w-3 mr-1" />
                      {article.view_count} lượt xem
                    </span>
                    <span>Tạo: {new Date(article.created_at).toLocaleDateString("vi-VN")}</span>
                    {article.published_at && (
                      <span>Xuất bản: {new Date(article.published_at).toLocaleDateString("vi-VN")}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(article)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? "Chỉnh Sửa Bài Viết" : "Tạo Bài Viết Mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="title">Tiêu Đề *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Nhập tiêu đề bài viết..."
              />
            </div>

            <div>
              <Label htmlFor="summary">Tóm Tắt</Label>
              <Textarea
                id="summary"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                rows={2}
                placeholder="Tóm tắt ngắn gọn về bài viết..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Danh Mục *</Label>
                <Select
                  value={form.category}
                  onValueChange={(value: string) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="featured_image">Ảnh Đại Diện (URL)</Label>
                <Input
                  id="featured_image"
                  value={form.featured_image}
                  onChange={(e) => setForm({ ...form, featured_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (phân cách bằng dấu phẩy)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <Label>Nội Dung *</Label>
              <div className="border rounded-lg overflow-hidden">
                <EditorToolbar editor={editor} />
                <EditorContent
                  editor={editor}
                  className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="meta_description">Meta Description (SEO)</Label>
              <Textarea
                id="meta_description"
                value={form.meta_description}
                onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                rows={2}
                placeholder="Mô tả cho công cụ tìm kiếm..."
              />
            </div>

            <div>
              <Label htmlFor="meta_keywords">Meta Keywords (SEO)</Label>
              <Input
                id="meta_keywords"
                value={form.meta_keywords}
                onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
                placeholder="từ khóa 1, từ khóa 2, từ khóa 3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Hủy
            </Button>
            <Button variant="secondary" onClick={() => handleSave(false)}>
              Lưu Bản Nháp
            </Button>
            <Button onClick={() => handleSave(true)}>
              <Send className="mr-2 h-4 w-4" />
              Xuất Bản
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
