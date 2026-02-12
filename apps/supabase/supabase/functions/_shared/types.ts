export type ReadingStatus = 'want_to_read' | 'reading' | 'finished' | 'abandoned';
export type Visibility = 'public' | 'friends' | 'private';
export type FeedScope = 'me' | 'friends' | 'all';
export type SortField = 'updated_at' | 'start_date' | 'end_date' | 'created_at';
export type SortDirection = 'asc' | 'desc';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  total_pages: number | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingLog {
  id: string;
  book_id: string;
  status: ReadingStatus;
  current_page: number | null;
  rating: number | null;
  start_date: string | null;
  end_date: string | null;
  visibility: Visibility;
  notion_page_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Quote {
  id: string;
  reading_log_id: string;
  text: string;
  page_number: number;
  noted_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  reading_log_id: string;
  user_id: string;
  content: string;
  page_number: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingRecord {
  book: Book;
  reading_log: ReadingLog;
  quotes: Quote[];
  reviews: Review[];
  profile: { nickname: string; avatar_url: string | null } | null;
}

export interface ReadingRecordFilters {
  status?: ReadingStatus[];
  scope?: FeedScope;
  start_date_from?: string;
  start_date_to?: string;
  end_date_from?: string;
  end_date_to?: string;
  search?: string;
}

export interface ReadingRecordSort {
  field: SortField;
  direction: SortDirection;
}

export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfilePayload {
  nickname?: string;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
