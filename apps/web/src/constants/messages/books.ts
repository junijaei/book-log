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
    friends: '친구 공개',
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
    ratingValue: (n: number) => `${n}점`,
    startDate: '시작일',
    endDate: '종료일',
    review: '감상문',
    reflection: '감상',
    reflectionContent: '감상 내용',
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
    addFirstBook: '도서 추가하기',
    addQuote: '인용구 추가',
    addReflection: '감상 추가',
    backToList: '목록으로',
    manualInput: '직접 입력하기',
    editBook: '수정하기',
    recordToday: '독서 기록 추가',
    markAsCompleted: '완독 처리',
    deleteRecord: '기록 삭제',
    clearRating: '평점 삭제',
    showFilters: '검색/필터',
    hideFilters: '검색 결과 보기',
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

  // Reflections (reviews)
  reflections: {
    addNew: '새 감상 추가',
    edit: '감상 수정',
    delete: '감상 삭제',
    empty: '등록된 감상이 없습니다.',
    sectionTitle: '감상',
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
    lookingUpPages: '페이지 조회 중...',
    empty: '등록된 도서가 없습니다.',
    notFound: '도서를 찾을 수 없습니다',
    noFeedBooks: '피드에 표시할 도서가 없습니다.',
    noEditPermission: '본인의 독서 기록만 편집할 수 있습니다.',
    titleAuthorRequired: '제목과 저자는 필수입니다',
    noReadingDates: '독서 기간이 없습니다.',
    invalidPageCount: '페이지 수는 1 이상이어야 합니다',
  },

  // Confirmations
  confirmations: {
    deleteTitle: '독서 기록 삭제',
    deleteContent: '독서 기록 삭제하기. 이 작업은 되돌릴 수 없습니다.',
    deleteMessage: '이 독서 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    deleteBookWarning: '다른 독서 기록이 없어 도서도 함께 삭제됩니다.',
    deleteQuote: '이 인용구를 삭제하시겠습니까?',
    deleteReflection: '이 감상을 삭제하시겠습니까?',
    bookCompletedTitle: '완독 축하합니다! 🎉',
    bookCompleted: '마지막 페이지에 도달했습니다! 완독으로 처리할까요?',
  },

  // Errors
  errors: {
    searchFailed: '도서 검색에 실패했습니다.',
    searchNoResults: '검색 결과가 없습니다. 다른 제목으로 검색해 보세요.',
  },

  // Success messages
  success: {
    quoteAdded: '인용구가 추가되었습니다.',
    reflectionAdded: '감상이 추가되었습니다.',
    recordSaved: '오늘 독서 기록이 저장되었습니다.',
    bookMarkedCompleted: '완독으로 처리되었습니다.',
  },

  // Mobile log flow (multi-step page-replacement UI)
  logFlow: {
    title: '오늘 독서 기록',
    date: '독서 날짜',
    reviewFormTitle: '감상 작성',
    quoteFormTitle: '인용구 작성',
    completedTitle: '기록 완료!',
    viewDetail: '상세 보기',
    addEntry: '항목 추가',
    reviewEntry: (n: number) => `감상 ${n}`,
    quoteEntry: (n: number) => `인용구 ${n}`,
    entryCount: (n: number) => `${n}개`,
  },
} as const;
