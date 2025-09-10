"use client";

import * as React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import MainContent from "./components/MainContent";
import Container from "@mui/material/Container";
import "./BlogPage.css";

export default function BlogPage(props: { disableCustomTheme?: boolean }) {
  return (
    <div>
      <CssBaseline enableColorScheme />
      <Container maxWidth="lg" className="blog-container">
        <MainContent />
      </Container>
    </div>
  );
}
