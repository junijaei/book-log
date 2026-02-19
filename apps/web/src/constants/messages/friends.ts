/**
 * Friends Domain Messages
 *
 * All UI text related to friends and social features:
 * - Friend list
 * - Friend requests (sent/received)
 * - Search users
 * - Blocking
 */

export const friendsMessages = {
  // Page titles
  pages: {
    friends: '친구',
    requests: '친구 요청',
  },

  // Sections
  sections: {
    friendList: '친구 목록',
    receivedRequests: '받은 요청',
    sentRequests: '보낸 요청',
  },

  // Buttons
  buttons: {
    sendRequest: '친구 요청',
    sending: '전송 중...',
    accept: '수락',
    accepting: '수락 중...',
    reject: '거절',
    rejecting: '거절 중...',
    remove: '제거',
    removeFriend: '친구 삭제',
    block: '차단',
    unblock: '차단 해제',
    cancelRequest: '요청 취소',
  },

  // Field labels
  fields: {
    friendSince: '친구가 된 날',
    requestedAt: '요청일',
  },

  // Filters
  filters: {
    friendsOnly: '친구',
    scopeAll: '전체',
    scopeFriends: '친구',
  },

  // Placeholders
  placeholders: {
    searchNickname: '닉네임으로 검색...',
  },

  // Empty states
  empty: {
    noFriends: '아직 친구가 없습니다.',
    noReceivedRequests: '받은 친구 요청이 없습니다.',
    noSentRequests: '보낸 친구 요청이 없습니다.',
    noSearchResults: '검색 결과가 없습니다.',
  },

  // Confirmations
  confirmations: {
    removeFriend: '이 친구를 삭제하시겠습니까?',
    cancelRequest: '이 친구 요청을 취소하시겠습니까?',
    block: '이 사용자를 차단하시겠습니까? 차단하면 친구 관계가 해제됩니다.',
  },

  // Messages
  messages: {
    searchMinLength: '2자 이상 입력하세요.',
  },

  // Success messages
  success: {
    requestSent: '친구 요청을 보냈습니다.',
    requestAccepted: '친구 요청을 수락했습니다.',
    requestRejected: '친구 요청을 거절했습니다.',
    friendRemoved: '친구를 삭제했습니다.',
    autoAccepted: '서로 친구 요청을 보내 자동으로 친구가 되었습니다.',
  },
} as const;
