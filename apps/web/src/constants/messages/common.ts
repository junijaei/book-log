/**
 * Common Domain Messages
 *
 * Shared UI text used across multiple domains:
 * - Common buttons
 * - Generic states (loading, errors)
 * - Navigation
 */

export const commonMessages = {
  // Navigation labels
  navigation: {
    myBooks: '내 서재',
    feed: '피드',
    myPage: '마이페이지',
  },

  // Common buttons (used across domains)
  buttons: {
    save: '저장',
    saving: '저장 중...',
    cancel: '취소',
    delete: '삭제',
    deleting: '삭제 중...',
    edit: '편집',
    close: '닫기',
    back: '뒤로',
    create: '생성',
    creating: '생성 중...',
    add: '추가',
    next: '다음',
    loadMore: '더 보기',
    signOut: '로그아웃',
  },

  // Common states
  states: {
    loading: '로딩 중...',
    requiredField: '*',
  },

  // Common messages
  messages: {
    unsavedChanges: '변경사항이 저장되지 않습니다. 나가시겠습니까?',
  },

  // Unsaved-changes guard dialog
  guard: {
    title: '저장하지 않은 변경사항',
    cancel: '계속 작성',
    confirm: '나가기',
  },

  // Common errors
  errors: {
    failedToSave: '저장에 실패했습니다',
    failedToDelete: '삭제에 실패했습니다',
    failedToCreate: '생성에 실패했습니다',
    failedToLoad: '불러오기에 실패했습니다',
  },

  // Common success messages
  success: {
    savedSuccessfully: '저장되었습니다.',
  },
} as const;
