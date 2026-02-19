/**
 * Books Domain Messages
 *
 * All UI text related to books and reading records:
 * - Book management (CRUD)
 * - Reading status
 * - Quotes
 * - Reviews
 * - Book search
 */

import type { ReadingStatus, Visibility } from '@/types';

export const booksMessages = {
  // Reading status labels
  status: {
    want_to_read: '읽고 싶은',
    reading: '읽는 중',
    finished: '완독',
    abandoned: '중단',
  } as Record<ReadingStatus, string>,

  // Visibility labels
  visibility: {
    public: '전체 공개',
    friends: '친구만',
    private: '비공개',
  } as Record<Visibility, string>,

  // Page titles
  pages: {
    list: '독서 기록',
    detail: '도서 상세',
    edit: '도서 편집',
    new: '새 도서 추가',
    feed: '피드',
  },

  // Field labels
  fields: {
    title: '제목',
    author: '저자',
    coverImageUrl: '표지 이미지 URL',
    totalPages: '총 페이지',
    status: '읽기 상태',
    currentPage: '현재 페이지',
    rating: '평점 (1-5)',
    startDate: '시작일',
    endDate: '종료일',
    review: '감상문',
    quotes: '인용구',
    quoteText: '인용구 텍스트',
    pageNumber: 'P.',
    progress: '진행률',
    readingPeriod: '독서 기간',
    visibility: '공개 범위',
  },

  // Placeholders
  placeholders: {
    search: '제목이나 저자로 검색...',
    bookSearch: '책 제목을 입력하세요...',
    coverImageUrl: 'https://example.com/cover.jpg',
    quoteText: '인용구 텍스트...',
    pageNumber: '페이지',
  },

  // Filter labels
  filters: {
    all: '전체',
    sortByUpdated: '최근 업데이트',
    sortByStartDate: '시작일',
    sortByEndDate: '완료일',
  },

  // Buttons
  buttons: {
    addBook: '도서 추가',
    addFirstBook: '첫 도서 추가하기',
    addQuote: '인용구 추가',
    backToList: '목록으로',
    manualInput: '직접 입력하기',
    editBook: '수정하기',
  },

  // Book search
  search: {
    title: '도서 검색',
    resultHint: '원하는 책을 선택하세요',
  },

  // Quotes
  quotes: {
    addNew: '새 인용구 추가',
    edit: '인용구 수정',
    delete: '인용구 삭제',
    empty: '등록된 인용구가 없습니다.',
    willBeAddedOnSave: '저장 시 추가됨',
  },

  // Book details
  details: {
    bookInfo: '도서 정보',
    readingLog: '독서 기록',
    pagesUnit: '페이지',
    noCover: '표지 없음',
    hasReview: '감상',
  },

  // Messages
  messages: {
    empty: '도서를 찾을 수 없습니다.',
    notFound: '도서를 찾을 수 없습니다',
    noFeedBooks: '피드에 표시할 도서가 없습니다.',
    noEditPermission: '본인의 독서 기록만 편집할 수 있습니다.',
    titleAuthorRequired: '제목과 저자는 필수입니다',
  },

  // Confirmations
  confirmations: {
    deleteTitle: '독서 기록 삭제',
    deleteContent: '독서 기록 삭제하기. 이 작업은 되돌릴 수 없습니다.',
    deleteMessage: '이 독서 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    deleteBookWarning: '다른 독서 기록이 없어 도서도 함께 삭제됩니다.',
    deleteQuote: '이 인용구를 삭제하시겠습니까?',
  },

  // Errors
  errors: {
    searchFailed: '도서 검색에 실패했습니다.',
    searchNoResults: '검색 결과가 없습니다. 다른 제목으로 검색해 보세요.',
  },

  // Success messages
  success: {
    quoteAdded: '인용구가 추가되었습니다.',
  },
} as const;
