import type {
  Bench,
  BenchPhoto,
  BenchRating,
  Comment,
  Profile,
  Favorite,
  VisitStatus,
} from './database.types';

// Bench with all related data
export type BenchWithDetails = Bench & {
  profiles: Profile;
  bench_photos: BenchPhoto[];
  bench_ratings: BenchRating[];
  comments: CommentWithProfile[];
  favorites: Favorite[];
  visit_statuses: VisitStatus[];
  distance?: number;
  averageViewRating?: number;
  averageComfortRating?: number;
  totalRatings?: number;
  favoriteCount?: number;
  isFavorited?: boolean;
  visitStatus?: 'visited' | 'want_to_visit' | null;
};

// Comment with author profile
export type CommentWithProfile = Comment & {
  profiles: Profile;
  likeCount?: number;
  isLiked?: boolean;
};

// Rating with user profile
export type RatingWithProfile = BenchRating & {
  profiles: Profile;
};

// Feed item (bench with minimal data for list display)
export type FeedItem = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  view_type?: Bench['view_type'];
  created_at: string;
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  primaryPhoto?: string;
  averageRating?: number;
  distance?: number;
  favoriteCount?: number;
  isFavorited?: boolean;
};

// User profile with stats
export type ProfileWithStats = Profile & {
  benchCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
};

// Notification with actor profile
export type NotificationWithActor = {
  id: string;
  type: 'new_follower' | 'new_comment' | 'new_rating' | 'new_favorite' | 'comment_like';
  actor: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  bench?: Pick<Bench, 'id' | 'title'>;
  comment?: Pick<Comment, 'id' | 'text'>;
  read: boolean;
  created_at: string;
};

// API Response types
export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
};

// Search and filter types
export type BenchSearchFilters = {
  viewType?: Bench['view_type'];
  minRating?: number;
  maxDistance?: number;
  userId?: string;
  favorited?: boolean;
  visited?: boolean;
  wantToVisit?: boolean;
};

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'highest_rated'
  | 'most_favorited'
  | 'nearest';

// Coordinates type
export type Coordinates = {
  latitude: number;
  longitude: number;
};

// Map bounds for fetching benches in visible area
export type MapBounds = {
  northEast: Coordinates;
  southWest: Coordinates;
};
