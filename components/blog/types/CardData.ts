export interface Author {
  name: string;
  avatar: string;
}

export interface CardData {
  id: string;
  img: string;
  tag: string;
  title: string;
  description: string;
  authors: Author[];
}
