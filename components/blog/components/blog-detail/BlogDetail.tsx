"use client";

import React, { useEffect, useState } from "react";
import { Typography, Box } from "@mui/material";
import { CardData } from "../../types/CardData";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "react-toastify";
import { useBlog } from "@/hooks/blog/useBlog";
import Link from "next/link";

interface BlogDetailProps {
  blog: CardData;
}

interface Comment {
  name: string;
  text: string;
  createdAt: string;
}

export default function BlogDetail({ blog }: BlogDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const { saveBlog, unsaveBlog } = useBlog();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setUserName(user.display_name || "Anonymous");
        setUserId(user.user_id);
      }
    } catch (error) {
      console.error("Failed to parse auth_user:", error);
    }
  }, []);

  const handleToggleSave = async () => {
    setIsSaved((prev) => !prev);
    toast.info("Chưa có API lưu bài viết!");
    // if (!userId) {
    //   toast.warning("Vui lòng đăng nhập để lưu bài viết!");
    //   return;
    // }

    // setLoading(true);
    // try {
    //   if (!isSaved) {
    //     await saveBlog(blog.id.toString(), userId);
    //     toast.success("Bài viết đã được lưu!");
    //   } else {
    //     await unsaveBlog(blog.id.toString(), userId);
    //     toast.info("Đã bỏ lưu bài viết.");
    //   }
    //   setIsSaved((prev) => !prev);
    // } catch (error: any) {
    //   toast.error(error.message || "Có lỗi xảy ra khi lưu bài viết!");
    // } finally {
    //   setLoading(false);
    // }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newEntry: Comment = {
        name: userName || "Anonymous",
        text: newComment,
        createdAt: new Date().toLocaleString(),
      };
      setComments((prev) => [...prev, newEntry]);
      setNewComment("");
    }
  };

  return (
    <Box sx={{ maxWidth: "800px", margin: "0 auto", p: 3 }}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
        <div>
          <Typography variant="h4" gutterBottom className="!mb-2">
            {blog.title}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {blog.tag}
          </Typography>
        </div>

        <button
          onClick={handleToggleSave}
          className={`inline-flex items-center gap-2 px-4 h-10 min-h-[40px] rounded-lg font-medium transition-all border select-none 
    ${
      isSaved
        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
    }`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="w-5 h-5" />
              <span className="leading-none">Đã lưu</span>
            </>
          ) : (
            <>
              <Bookmark className="w-5 h-5" />
              <span className="leading-none">Lưu</span>
            </>
          )}
        </button>
      </div>

      {/* Image */}
      <Box
        component="img"
        src={blog.img}
        alt={blog.title}
        sx={{ width: "100%", borderRadius: 2, mb: 3 }}
      />

      {/* Content from ReactQuill */}
      <Box
        sx={{
          typography: "body1",
          "& img": { maxWidth: "100%", borderRadius: 1 },
        }}
        dangerouslySetInnerHTML={{ __html: blog.description }}
      />

      {/* Authors */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6">Tác giả</Typography>
        {blog.authors.map((author, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <img
              src={author.avatar}
              alt={author.name}
              width={32}
              height={32}
              style={{ borderRadius: "50%", marginRight: "8px" }}
            />
            <Typography>{author.name}</Typography>
          </Box>
        ))}
      </Box>

      {/* Comment Section */}
      <div className="mt-12 border-t border-gray-200 pt-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          💬 Bình luận
        </h3>

        {/* Add Comment */}
        {userName ? (
          <div className="bg-gray-50 p-5 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <p className="text-sm text-gray-600 mb-2">
              Bình luận dưới tên{" "}
              <span className="font-medium text-blue-600">{userName}</span>
            </p>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Hãy chia sẻ suy nghĩ của bạn..."
              className="w-full border border-gray-300 rounded-xl p-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAddComment}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-xl shadow-sm transition-transform hover:scale-105"
              >
                Gửi bình luận
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Bạn cần{" "}
            <Link
              href="/signin"
              className="text-blue-600 font-medium hover:underline"
            >
              đăng nhập
            </Link>{" "}
            để bình luận.
          </p>
        )}

        {/* Comment List */}
        {comments.length > 0 ? (
          <ul className="space-y-5">
            {comments.map((comment, index) => (
              <li
                key={index}
                className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
              >
                {/* Avatar Placeholder */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {comment.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">
                      {comment.name}
                    </p>
                    <span className="text-sm text-gray-500">
                      {comment.createdAt}
                    </span>
                  </div>
                  <p className="text-gray-700 mt-1 leading-relaxed">
                    {comment.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-6 italic">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ của
            bạn!
          </p>
        )}
      </div>
    </Box>
  );
}
