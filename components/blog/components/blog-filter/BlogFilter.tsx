import * as React from "react";
import {
  Box,
  FormControl,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
  TextField,  
  InputLabel,
} from "@mui/material";
import { BLOG_CATEGORIES } from "../../contains";
import "./BlogFilter.css";

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
      <FormControl className="searchInput" variant="outlined" size="small">
        <OutlinedInput
          id="search"
          placeholder="Từ khóa"
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          startAdornment={
            <InputAdornment position="start" sx={{ color: "text.secondary" }}>
              🔍
            </InputAdornment>
          }
          inputProps={{ "aria-label": "search" }}
        />
      </FormControl>

      {/* Category */}
      <FormControl className="categorySelect" size="small">
        <InputLabel id="category-label">Danh mục</InputLabel>
        <Select
          labelId="category-label"
          value={filters.category}
          onChange={(e) => handleChange("category", e.target.value)}
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {BLOG_CATEGORIES.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>
              {cat.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Date */}
      <TextField
        className="datePicker"
        size="small"
        type="date"
        label="Ngày"
        InputLabelProps={{ shrink: true }}
        value={filters.date}
        onChange={(e) => handleChange("date", e.target.value)}
      />
    </Box>
  );
}
