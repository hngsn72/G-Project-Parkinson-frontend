"use client";

import React from "react";
import { Typography, Box } from "@mui/material";
import { CardData } from "../../types/CardData";

interface BlogDetailProps {
  blog: CardData;
}

export default function BlogDetail({ blog }: BlogDetailProps) {
  return (
    <Box sx={{ maxWidth: "800px", margin: "0 auto", p: 3 }}>
      {/* Title */}
      <Typography variant="h4" gutterBottom>
        {blog.title}
      </Typography>

      {/* Category */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {blog.tag}
      </Typography>

      {/* Image */}
      <Box component="img"
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
    </Box>
  );
}
