/**
 * Domain Entity Types
 *
 * Core data models representing database entities.
 */

/** Reading status enum values */
export type ReadingStatus = 'want_to_read' | 'reading' | 'finished' | 'abandoned';

/** Visibility level for reading logs */
export type Visibility = 'public' | 'friends' | 'private';

/** Feed scope for listing reading records */
export type FeedScope = 'me' | 'friends' | 'all';

/** Book entity */
export interface Book {
  id: string;
  title: string;
  author: string;
  cover_image_url: string | null;
  total_pages: number | null;
  created_at: string;
  updated_at: string;
}

/** Reading log entity */
export interface ReadingLog {
  id: string;
  book_id: string;
  status: ReadingStatus;
  current_page: number | null;
  rating: number | null;
  start_date: string | null;
  end_date: string | null;
  review: string | null;
  visibility: Visibility;
  notion_page_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

/** User profile summary (embedded in ReadingRecord) */
export interface UserProfile {
  nickname: string;
  avatar_url: string | null;
}

/** Full user profile entity */
export interface Profile {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

/** Quote entity */
export interface Quote {
  id: string;
  reading_log_id: string;
  text: string;
  page_number: number;
  noted_at: string | null;
  created_at: string;
}

/** Composite reading record (book + log + quotes + profile) */
export interface ReadingRecord {
  book: Book;
  reading_log: ReadingLog;
  quotes: Quote[];
  profile: UserProfile | null;
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export type FriendAction =
  | 'request'
  | 'accept'
  | 'reject'
  | 'delete'
  | 'block'
  | 'unblock'
  | 'list'
  | 'received'
  | 'sent';

export interface ProfileInfo {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
}

export interface FriendListItem {
  friendship_id: string;
  friend: ProfileInfo;
  since: string;
}

export interface ReceivedRequestItem {
  friendship_id: string;
  requester: ProfileInfo;
  requested_at: string;
}

export interface SentRequestItem {
  friendship_id: string;
  addressee: ProfileInfo;
  requested_at: string;
}

/** Public profile (no timestamps, subset of Profile) */
export type PublicProfile = ProfileInfo;
