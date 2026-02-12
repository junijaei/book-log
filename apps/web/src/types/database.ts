/**
 * Database Types
 *
 * Auto-generated types should be placed here using:
 * `npx supabase gen types typescript --project-id <project-id> > src/types/database.ts`
 *
 * The types below are manually defined to match the expected schema.
 */

import type { ReadingStatus } from './entities';

/**
 * Database type definition matching Supabase schema.
 */
export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          title: string;
          author: string;
          cover_image_url: string | null;
          total_pages: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          author: string;
          cover_image_url?: string | null;
          total_pages?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          author?: string;
          cover_image_url?: string | null;
          total_pages?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reading_logs: {
        Row: {
          id: string;
          book_id: string;
          user_id: string;
          status: ReadingStatus;
          current_page: number | null;
          rating: number | null;
          start_date: string | null;
          end_date: string | null;
          review: string | null;
          notion_page_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          user_id?: string;
          status?: ReadingStatus;
          current_page?: number | null;
          rating?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          review?: string | null;
          notion_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          user_id?: string;
          status?: ReadingStatus;
          current_page?: number | null;
          rating?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          review?: string | null;
          notion_page_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          reading_log_id: string;
          text: string;
          page_number: number;
          noted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reading_log_id: string;
          text: string;
          page_number: number;
          noted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reading_log_id?: string;
          text?: string;
          page_number?: number;
          noted_at?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      reading_status: ReadingStatus;
    };
  };
}

/** Type helper: Get Row type for a table */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

/** Type helper: Get Insert type for a table */
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

/** Type helper: Get Update type for a table */
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
