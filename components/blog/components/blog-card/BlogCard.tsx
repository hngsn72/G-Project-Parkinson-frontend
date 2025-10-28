import * as React from "react";
import { Typography, Card, CardContent, CardMedia, IconButton, Box } from "@mui/material";
import { CardData } from "../../types/CardData";
import { Author } from "./Author";
import { Favorite, FavoriteBorder, Bookmark, BookmarkBorder } from "@mui/icons-material";
import "./BlogCard.css";

interface BlogCardProps {
  card: CardData;
  index: number;
  focusedCardIndex: number | null;
  onClick: (index: number) => void;
  sx?: object;
}

export function BlogCard({
  card,
  index,
  focusedCardIndex,
  onClick,
  sx,
}: BlogCardProps) {
  // Local state for like/bookmark (should be replaced by backend state)

  // Like/Bookmark interaction temporarily disabled (no backend API)
  // const [liked, setLiked] = React.useState(card.liked || false);
  // const [bookmarked, setBookmarked] = React.useState(card.bookmarked || false);
  // const [loadingLike, setLoadingLike] = React.useState(false);
  // const [loadingBookmark, setLoadingBookmark] = React.useState(false);
  // const handleLike = () => {};
  // const handleBookmark = () => {};

  return (
    <Card
      variant="outlined"
      onFocus={() => onClick(index)}
      tabIndex={0}
      className={`styled-card ${focusedCardIndex === index ? "Mui-focused" : ""}`}
      sx={sx}
    >
      {card.img && (
        <CardMedia
          component="img"
          alt={card.title}
          image={card.img}
          className="styled-card-media"
        />
      )}
      <CardContent className="styled-card-content">
        <Box display="flex" flexDirection="column" gap={1}>
          <Typography gutterBottom variant="caption" component="div">
            {card.tag}
          </Typography>
          <Typography gutterBottom variant="h6" component="div">
            {card.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            gutterBottom
            className="styled-typography"
          >
            {card.description}
          </Typography>
        </Box>
        {/* Interaction buttons */}
        {/* Interaction buttons temporarily hidden until backend API is available */}
      </CardContent>
      <Author authors={card.authors} />
    </Card>
  );
}
