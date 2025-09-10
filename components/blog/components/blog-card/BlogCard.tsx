import * as React from "react";
import { Typography, Card, CardContent, CardMedia } from "@mui/material";
import { CardData } from "../../types/CardData";
import { Author } from "./Author";
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
  return (
    <Card
      variant="outlined"
      onFocus={() => onClick(index)}
      tabIndex={0}
      className={`styled-card ${
        focusedCardIndex === index ? "Mui-focused" : ""
      }`}
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
        <div>
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
        </div>
      </CardContent>
      <Author authors={card.authors} />
    </Card>
  );
}
