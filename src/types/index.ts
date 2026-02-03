// Database types (direct table mappings)
export type {
  Profile,
  Bench,
  BenchPhoto,
  BenchRating,
  Comment,
  Favorite,
  Follow,
  Notification,
  CommentLike,
  VisitStatus,
} from './database.types';

// API types (composite/derived types)
export type {
  BenchWithDetails,
  CommentWithProfile,
  RatingWithProfile,
  FeedItem,
  ProfileWithStats,
  NotificationWithActor,
  PaginatedResponse,
  ApiError,
  BenchSearchFilters,
  SortOption,
  Coordinates,
  MapBounds,
} from './api.types';
