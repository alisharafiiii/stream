export interface Comment {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  message: string;
  timestamp: number;
  position?: number; // Random Y position for floating
}

export interface CommentWithPosition extends Comment {
  position: number;
  key: string; // Unique key for React animation
}
