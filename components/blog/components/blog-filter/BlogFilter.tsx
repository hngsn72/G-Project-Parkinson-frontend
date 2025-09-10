import * as React from "react";
import {
  Box,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { BLOG_CATEGORIES } from "../../contains";
import './BlogFilter.css'

export interface Filters {
  search: string;
  category: string;
  date: string;
}

interface BlogFilterProps {
  filters: Filters;
  onChange: (updated: Filters) => void;
}

export function BlogFilter({ filters, onChange }: BlogFilterProps) {
  const handleChange = (field: keyof Filters, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <Box className="blogFilter">
      {/* Search */}
      <FormControl className="searchInput" variant="outlined">
        <OutlinedInput
          size="small"
          id="search"
          placeholder="Từ khóa..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          startAdornment={
            <InputAdornment position="start" sx={{ color: "text.primary" }}>
              🔍
            </InputAdornment>
          }
          inputProps={{ "aria-label": "search" }}
        />
      </FormControl>

      {/* Category */}
      <FormControl className="categorySelect">
        <Select
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
        >
          {BLOG_CATEGORIES.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date */}
      <TextField
        size="small"
        type="date"
        value={filters.date}
        onChange={(e) => handleChange("date", e.target.value)}
      />
    </Box>
  );
}
