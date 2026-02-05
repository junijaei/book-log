import type { ReadingStatus } from '@/types';

// Reading Status Labels
export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  want_to_read: '읽고 싶은',
  reading: '읽는 중',
  finished: '완독',
  abandoned: '중단',
};

// Page Titles
export const PAGE_TITLES = {
  BOOK_LIST: '독서 기록',
  BOOK_DETAIL: '도서 상세',
  BOOK_EDIT: '도서 편집',
  BOOK_NEW: '새 도서 추가',
} as const;

// Button Labels
export const BUTTON_LABELS = {
  ADD_BOOK: '도서 추가',
  EDIT: '편집',
  SAVE: '저장',
  SAVING: '저장 중...',
  DELETE: '삭제',
  CANCEL: '취소',
  BACK: '뒤로',
  CREATE: '생성',
  CREATING: '생성 중...',
  ADD_QUOTE: '인용구 추가',
  ADD: '추가',
  REMOVE: '제거',
  CLOSE: '닫기',
  BACK_TO_LIST: '목록으로',
  ADD_FIRST_BOOK: '첫 도서 추가하기',
} as const;

// Field Labels
export const FIELD_LABELS = {
  TITLE: '제목',
  AUTHOR: '저자',
  COVER_IMAGE_URL: '표지 이미지 URL',
  TOTAL_PAGES: '총 페이지',
  STATUS: '읽기 상태',
  CURRENT_PAGE: '현재 페이지',
  RATING: '평점 (1-5)',
  START_DATE: '시작일',
  END_DATE: '종료일',
  REVIEW: '서평',
  QUOTES: '인용구',
  ADD_NEW_QUOTE: '새 인용구 추가',
  QUOTE_TEXT: '인용구 텍스트',
  PAGE_NUMBER: '페이지 번호',
  PROGRESS: '진행률',
  READING_PERIOD: '독서 기간',
} as const;

// Placeholders
export const PLACEHOLDERS = {
  SEARCH: '제목이나 저자로 검색...',
  COVER_IMAGE_URL: 'https://example.com/cover.jpg',
  QUOTE_TEXT: '인용구 텍스트...',
  PAGE_NUMBER: '페이지 번호',
} as const;

// Messages
export const MESSAGES = {
  LOADING: '로딩 중...',
  NO_BOOKS_FOUND: '도서를 찾을 수 없습니다.',
  BOOK_NOT_FOUND: '도서를 찾을 수 없습니다',
  TITLE_AUTHOR_REQUIRED: '제목과 저자는 필수입니다',
  FAILED_TO_SAVE: '저장에 실패했습니다',
  FAILED_TO_DELETE: '삭제에 실패했습니다',
  FAILED_TO_CREATE: '생성에 실패했습니다',
  FAILED_TO_LOAD: '불러오기에 실패했습니다',
  DELETE_CONFIRMATION_TITLE: '독서 기록 삭제',
  DELETE_CONFIRMATION_MESSAGE: '이 독서 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
  DELETE_BOOK_WARNING: '다른 독서 기록이 없어 도서도 함께 삭제됩니다.',
  DELETE_NOT_IMPLEMENTED: '삭제 기능은 아직 구현되지 않았습니다',
  DELETING: '삭제 중...',
  NO_COVER: '표지 없음',
  NO_QUOTES: '등록된 인용구가 없습니다.',
  DELETE_QUOTE_CONFIRMATION: '이 인용구를 삭제하시겠습니까?',
  REQUIRED_FIELD: '*',
} as const;

// Filter Labels
export const FILTER_LABELS = {
  ALL: '전체',
  SORT_BY_UPDATED: '최근 업데이트',
  SORT_BY_START_DATE: '시작일',
  SORT_BY_END_DATE: '완료일',
} as const;

// Misc
export const MISC = {
  PAGES_UNIT: 'P.',
  BOOK_DETAILS: '도서 정보',
  READING_LOG: '독서 기록',
  ADD_NEW_QUOTE: '새 인용구 추가',
  EDIT_QUOTE: '인용구 수정',
  DELETE_QUOTE: '인용구 삭제',
  WILL_BE_ADDED_ON_SAVE: '저장 시 추가됨',
  DELETE_READING_LOG: '독서 기록 삭제',
} as const;

// Constants
export const LOGIN_LABELS = {
  TITLE: '로그인',
  DESCRIPTION: '계정에 로그인하여 독서 기록을 관리하세요',
  EMAIL: '이메일',
  PASSWORD: '비밀번호',
  SUBMIT: '로그인',
  SUBMITTING: '로그인 중...',
  ERROR_GENERIC: '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
} as const;

// Helper function to get reading status label
export function getReadingStatusLabel(status: ReadingStatus): string {
  return READING_STATUS_LABELS[status];
}

// Helper function to format page progress
export function formatPageProgress(currentPage: number | null, totalPages: number | null): string {
  if (!currentPage || !totalPages) return '';
  return `${currentPage} / ${totalPages} ${MISC.PAGES_UNIT}`;
}

// Helper function to format percentage
export function formatPercentage(current: number, total: number): string {
  return `${Math.round((current / total) * 100)}%`;
}

// Helper function to format date range
export function formatDateRange(startDate: string | null, endDate: string | null): string | null {
  const dates = [startDate, endDate].filter(Boolean);
  return dates.length > 0 ? dates.join(' ~ ') : null;
}

// Helper function to render rating stars
export function renderRatingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}
