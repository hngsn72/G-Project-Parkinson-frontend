import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Pagination from "@mui/material/Pagination";
import Typography from "@mui/material/Typography";
import * as React from "react";
import { cardData } from "../mockData";
import CreateBlogModal from "./CreateBlogModal/CreateBlogModal";
import { CardData } from "../types/CardData";
import { BlogCard } from "./blog-card";
import { BlogFilter } from "./blog-filter";
import { Filters } from "./blog-filter/BlogFilter";
import Link from "next/link";
import "./MainContent.css"; // ✅ import css
import { useBlog } from "@/hooks/blog/useBlog";
import { Alert, CircularProgress } from "@mui/material";

export default function MainContent() {
  const [focusedCardIndex, setFocusedCardIndex] = React.useState<number | null>(
    null
  );

   const { blogs, loading, error, createBlog } = useBlog();

  const [filters, setFilters] = React.useState<Filters>({
    search: "",
    category: "",
    date: "",
  });

  const handleAddBlog = async (newBlog: CardData) => {
    console.log('newBlog:', newBlog);
    await createBlog(newBlog);
    // setBlogs([newBlog, ...blogs]); // add new blog to top
  };

  const handleClick = (focusedCardIndex) => {
    console.info("You clicked the filter chip.");
  };

  return (
    <Box className="mainContent">
      <div className="mainContent-header">
        <Typography variant="h4" gutterBottom className="page-title">
          Bài Đăng
        </Typography>
      </div>

      <Box className="mainContent-toolbar">
        <CreateBlogModal onSave={handleAddBlog} />
        <Box className="mainContent-filterGroup">
          <BlogFilter filters={filters} onChange={setFilters} />
        </Box>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {/* ✅ Show error */}
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} columns={12}>
        {blogs.map((card, index) => (
          <Grid key={index} size={{ xs: 12, md: 3, sm: 6 }}>
            <Link href={`/blog/${card.id}`}>
              <BlogCard
                card={card}
                index={index}
                focusedCardIndex={focusedCardIndex}
                onClick={handleClick}
                sx={{ height: "100%" }}
              />
            </Link>
          </Grid>
        ))}
      </Grid>

      <Box className="mainContent-pagination">
        <Pagination
          count={10}
          boundaryCount={10}
          color="primary"
          size="large"
        />
      </Box>
    </Box>
  );
}
