import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import * as React from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./CreateBlogModal.css";
import { CardData } from "../../types/CardData";
// @ts-ignore
import ImageResize from "quill-image-resize-module-react";
import { BLOG_CATEGORIES } from "../../contains";
import { toast } from "react-toastify";
interface BlogFormData {
  title: string;
  category: string;
  content: string;
  authors: string;
  img: string;
}

interface CreateBlogModalProps {
  onSave: (blog: CardData) => void;
}

Quill.register("modules/imageResize", ImageResize);

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "image"],
    ["clean"],
  ],
  imageResize: {
    parchment: Quill.import("parchment"),
    modules: ["Resize", "DisplaySize", "Toolbar"],
  },
};

export default function CreateBlogModal({ onSave }: CreateBlogModalProps) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<BlogFormData>({
    title: "",
    category: "",
    content: "",
    authors: "",
    img: "",
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContentChange = (value: string) => {
    setFormData({ ...formData, content: value });
  };

  const handleSubmit = () => {
    const authorsArray = formData.authors.split(",").map((name) => ({
      name: name.trim(),
      avatar: "/static/images/avatar/default.jpg",
    }));

    const newBlog: CardData = {
      ...formData,
      id: String(Math.random()),
      description: formData.content,
      tag: formData.category,
      authors: authorsArray,
    };

    console.log("new blog: ", newBlog);

    onSave(newBlog);

    toast.success("Bài viết đã được tạo thành công!");

    handleClose();
    setFormData({ title: "", category: "", content: "", authors: "", img: "" });
  };

  return (
    <div>
      <Button variant="contained" className="create-btn" onClick={handleOpen}>
        Tạo bài đăng
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="create-blog-title"
        aria-describedby="create-blog-description"
      >
        <Box className="create-blog-modal">
          <Typography
            id="create-blog-title"
            variant="h6"
            component="h2"
            gutterBottom
          >
            Tạo bài đăng
          </Typography>
          <Stack spacing={2}>
            {/* Title */}
            <TextField
              label="Tiêu đề"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
            />

            {/* Category */}
            <TextField
              select
              label="Danh mục"
              name="category"
              value={formData.category}
              onChange={handleChange}
              fullWidth
            >
              {BLOG_CATEGORIES.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </TextField>

            {/* Content */}
            <div>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Nội dung
              </Typography>
              <ReactQuill
                value={formData.content}
                onChange={handleContentChange}
                theme="snow"
                modules={modules}
                className="create-blog-editor"
              />
            </div>

            {/* Authors */}
            <TextField
              label="Nguồn (tác giả)"
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              fullWidth
            />

            {/* Actions */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button variant="outlined" onClick={handleClose}>
                Hủy bỏ
              </Button>
              <Button variant="contained" onClick={handleSubmit}>
                Tạo bài viết
              </Button>
            </Box>
          </Stack>
        </Box>
      </Modal>
    </div>
  );
}
