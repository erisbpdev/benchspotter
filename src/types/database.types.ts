export type Profile = {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
};

export type Bench = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  view_type?: 'ocean' | 'mountain' | 'urban' | 'forest' | 'lake' | 'river' | 'desert' | 'valley' | 'other';
  accessibility_notes?: string;
  created_at: string;
  updated_at: string;
};

export type BenchPhoto = {
  id: string;
  bench_id: string;
  photo_url: string;
  is_primary: boolean;
  uploaded_at: string;
};

export type BenchRating = {
  id: string;
  bench_id: string;
  user_id: string;
  view_rating: number;
  comfort_rating: number;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  bench_id: string;
  user_id: string;
  text: string;
  created_at: string;
  updated_at: string;
};

export type Favorite = {
  user_id: string;
  bench_id: string;
  created_at: string;
};

export type Follow = {
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'new_follower' | 'new_comment' | 'new_rating' | 'new_favorite' | 'comment_like';
  actor_id: string;
  bench_id?: string;
  comment_id?: string;
  read: boolean;
  created_at: string;
};

export type CommentLike = {
  user_id: string;
  comment_id: string;
  created_at: string;
};

export type VisitStatus = {
  user_id: string;
  bench_id: string;
  status: 'visited' | 'want_to_visit';
  visited_at?: string;
  created_at: string;
  updated_at: string;
};