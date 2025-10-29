export interface Comment {
    id: number;
    post_id: number;
    user_id: number;
    content: string;
    parent_id?: number | null;
    status: string;
    created_at: string;
    updated_at: string;
    user?: {
      id: number;
      display_name: string;
      email: string;
    };
    reply_count?: number;
  }

  // For display purposes
  export interface CommentDisplay {
    id: number;
    name: string;
    avatar?: string;
    createdAt: string;
    text: string;
    reply_count: number;
    repliedToName?: string;
  }
