import type { ReadingStatus, Visibility } from '@/types';

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
  MY_PAGE: '마이페이지',
  EDIT_PROFILE: '프로필 편집',
  FRIENDS: '친구',
  FRIEND_REQUESTS: '친구 요청',
  FEED: '피드',
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
  ACCEPT: '수락',
  REJECT: '거절',
  ACCEPTING: '수락 중...',
  REJECTING: '거절 중...',
  SEND_REQUEST: '친구 요청',
  SENDING: '전송 중...',
  BLOCK: '차단',
  UNBLOCK: '차단 해제',
  SIGN_OUT: '로그아웃',
  EDIT_PROFILE: '프로필 편집',
  REMOVE_FRIEND: '친구 삭제',
  CANCEL_REQUEST: '요청 취소',
  LOAD_MORE: '더 보기',
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
  REVIEW: '감상문',
  QUOTES: '인용구',
  ADD_NEW_QUOTE: '새 인용구 추가',
  QUOTE_TEXT: '인용구 텍스트',
  PAGE_NUMBER: 'P.',
  PROGRESS: '진행률',
  READING_PERIOD: '독서 기간',
  DELETE_RECORD: '독서 기록 삭제',
  NICKNAME: '닉네임',
  BIO: '자기소개',
  AVATAR_URL: '프로필 이미지 URL',
  VISIBILITY: '공개 범위',
  USER_ID: '사용자 ID',
} as const;

// Placeholders
export const PLACEHOLDERS = {
  SEARCH: '제목이나 저자로 검색...',
  COVER_IMAGE_URL: 'https://example.com/cover.jpg',
  QUOTE_TEXT: '인용구 텍스트...',
  PAGE_NUMBER: '페이지',
  NICKNAME: '닉네임을 입력하세요',
  BIO: '자기소개를 입력하세요',
  AVATAR_URL: 'https://example.com/avatar.png',
  USER_ID: '사용자 ID를 입력하세요',
  SEARCH_NICKNAME: '닉네임으로 검색...',
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
  DELETE_CONFIRMATION_CONTENT: '독서 기록 삭제하기. 이 작업은 되돌릴 수 없습니다.',
  DELETE_CONFIRMATION_MESSAGE: '이 독서 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
  DELETE_BOOK_WARNING: '다른 독서 기록이 없어 도서도 함께 삭제됩니다.',
  DELETING: '삭제 중...',
  NO_COVER: '표지 없음',
  NO_QUOTES: '등록된 인용구가 없습니다.',
  DELETE_QUOTE_CONFIRMATION: '이 인용구를 삭제하시겠습니까?',
  REQUIRED_FIELD: '*',
  NO_FRIENDS: '아직 친구가 없습니다.',
  NO_RECEIVED_REQUESTS: '받은 친구 요청이 없습니다.',
  NO_SENT_REQUESTS: '보낸 친구 요청이 없습니다.',
  FRIEND_REQUEST_SENT: '친구 요청을 보냈습니다.',
  FRIEND_REQUEST_ACCEPTED: '친구 요청을 수락했습니다.',
  FRIEND_REQUEST_REJECTED: '친구 요청을 거절했습니다.',
  FRIEND_REMOVED: '친구를 삭제했습니다.',
  FRIEND_REQUEST_AUTO_ACCEPTED: '서로 친구 요청을 보내 자동으로 친구가 되었습니다.',
  PROFILE_UPDATED: '프로필이 업데이트되었습니다.',
  NICKNAME_LENGTH_ERROR: '닉네임은 2~20자 사이여야 합니다.',
  NICKNAME_TAKEN: '이미 사용 중인 닉네임입니다.',
  REMOVE_FRIEND_CONFIRMATION: '이 친구를 삭제하시겠습니까?',
  CANCEL_REQUEST_CONFIRMATION: '이 친구 요청을 취소하시겠습니까?',
  BLOCK_CONFIRMATION: '이 사용자를 차단하시겠습니까? 차단하면 친구 관계가 해제됩니다.',
  NO_FEED_BOOKS: '피드에 표시할 도서가 없습니다.',
  NO_EDIT_PERMISSION: '본인의 독서 기록만 편집할 수 있습니다.',
  NO_SEARCH_RESULTS: '검색 결과가 없습니다.',
  SEARCH_MIN_LENGTH: '2자 이상 입력하세요.',
  QUOTE_ADDED: '인용구가 추가되었습니다.',
  SAVED_SUCCESSFULLY: '저장되었습니다.',
  UNSAVED_CHANGES_WARNING: '변경사항이 저장되지 않습니다. 나가시겠습니까?',
} as const;

// Filter Labels
export const FILTER_LABELS = {
  ALL: '전체',
  SORT_BY_UPDATED: '최근 업데이트',
  SORT_BY_START_DATE: '시작일',
  SORT_BY_END_DATE: '완료일',
  FRIENDS_ONLY: '친구',
  SCOPE_ALL: '전체',
  SCOPE_FRIENDS: '친구',
} as const;

// Misc
export const MISC = {
  PAGES_UNIT: '페이지',
  BOOK_DETAILS: '도서 정보',
  READING_LOG: '독서 기록',
  ADD_NEW_QUOTE: '새 인용구 추가',
  EDIT_QUOTE: '인용구 수정',
  DELETE_QUOTE: '인용구 삭제',
  WILL_BE_ADDED_ON_SAVE: '저장 시 추가됨',
  DELETE_READING_LOG: '독서 기록 삭제',
  RECEIVED_REQUESTS: '받은 요청',
  SENT_REQUESTS: '보낸 요청',
  MY_PAGE: '내 정보',
  FRIEND_LIST: '친구 목록',
  FRIEND_SINCE: '친구가 된 날',
  REQUESTED_AT: '요청일',
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

// Magic Link Labels
export const MAGIC_LINK_LABELS = {
  TAB_MAGIC: '이메일 링크',
  TAB_PASSWORD: '비밀번호',
  TITLE: '독서 기록에 오신 것을 환영합니다',
  DESCRIPTION: '이메일로 로그인 링크를 받아 시작하세요. 가입도 동시에 진행됩니다.',
  EMAIL_PLACEHOLDER: 'name@example.com',
  SUBMIT: '로그인 링크 받기',
  SUBMITTING: '전송 중...',
  SENT_TITLE: '이메일을 확인하세요',
  SENT_DESCRIPTION: (email: string) =>
    `${email} 으로 로그인 링크를 보냈습니다. 이메일의 링크를 클릭하면 바로 입장됩니다.`,
  SENT_RESEND: '다시 보내기',
  SENT_CHANGE_EMAIL: '이메일 변경',
  ERROR_GENERIC: '링크 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
} as const;

// Auth Callback Labels
export const AUTH_CALLBACK_LABELS = {
  LOADING: '로그인 중...',
  ERROR_TITLE: '로그인에 실패했습니다',
  ERROR_DESCRIPTION: '링크가 만료되었거나 이미 사용된 링크입니다. 다시 시도해주세요.',
  GO_TO_LOGIN: '로그인 페이지로',
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

// Visibility Labels
export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: '전체 공개',
  friends: '친구만',
  private: '비공개',
};

export function getVisibilityLabel(visibility: Visibility): string {
  return VISIBILITY_LABELS[visibility];
}

// Navigation Labels
export const NAV_LABELS = {
  MY_BOOKS: '내 서재',
  FEED: '피드',
  MY_PAGE: '마이페이지',
} as const;

export function renderRatingStars(rating: number): string {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}
