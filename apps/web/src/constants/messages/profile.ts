/**
 * Profile Domain Messages
 *
 * All UI text related to user profiles:
 * - Profile viewing and editing
 * - Avatar and bio
 * - Nickname management
 */

export const profileMessages = {
  // Page title
  pages: {
    myPage: '마이페이지',
    editProfile: '프로필 편집',
  },

  // Section titles
  sections: {
    myInfo: '내 정보',
  },

  // Field labels
  fields: {
    nickname: '닉네임',
    bio: '자기소개',
    avatarUrl: '프로필 이미지 URL',
    userId: '사용자 ID',
  },

  // Placeholders
  placeholders: {
    nickname: '닉네임을 입력하세요',
    bio: '자기소개를 입력하세요',
    avatarUrl: 'https://example.com/avatar.png',
    userId: '사용자 ID를 입력하세요',
  },

  // Buttons
  buttons: {
    editProfile: '프로필 편집',
  },

  // Errors
  errors: {
    nicknameLengthError: '닉네임은 2~20자 사이여야 합니다.',
    nicknameTaken: '이미 사용 중인 닉네임입니다.',
  },

  // Success messages
  success: {
    profileUpdated: '프로필이 업데이트되었습니다.',
  },
} as const;
