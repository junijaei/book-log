/**
 * Form Types
 *
 * Types for form state and validation.
 */

import type { ReadingStatus, Visibility } from '@book-log/database';

/** Book form data */
export interface BookFormData {
  title: string;
  author: string;
  cover_image_url: string;
  total_pages: string;
}

/** Reading log form data */
export interface ReadingLogFormData {
  status: ReadingStatus;
  current_page: string;
  rating: string;
  start_date: string;
  end_date: string;
  review: string;
  visibility: Visibility;
}

/** Combined book edit form data */
export interface BookEditFormData extends BookFormData, ReadingLogFormData {}

/** Local quote state for editing */
// We use a loose type here because form inputs might be in progress
export interface LocalQuote {
  id?: string;
  text: string;
  page_number: number;
  noted_at: string | null;
  isNew?: boolean;
}

/** New quote form data */
export interface NewQuoteFormData {
  text: string;
  page_number: string;
}

/** Quick reading record form data (today's session) */
export interface QuickRecordFormData {
  current_page: string;
  reflection: string;
  quote_text: string;
}
