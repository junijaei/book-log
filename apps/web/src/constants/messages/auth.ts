/**
 * Authentication Domain Messages
 *
 * All UI text related to authentication flows:
 * - Login (password, magic link, OAuth)
 * - Password setup/change
 * - Auth callbacks
 */

export const authMessages = {
  // Login page
  login: {
    title: '로그인',
    description: '계정에 로그인하여 독서 기록을 관리하세요',
    emailLabel: '이메일',
    passwordLabel: '비밀번호',
    submitButton: '로그인',
    submitting: '로그인 중...',
    orDivider: '또는',
    magicLinkButton: '이메일 링크로 로그인',
    googleButton: 'Google로 로그인',
    googleLoading: 'Google 연결 중...',
    backToPassword: '← 비밀번호 로그인으로',
    noPasswordHint: '비밀번호가 없으신가요? 이메일 링크 또는 Google 로그인을 이용하세요.',
    autoSignupHint: '계정이 없으면 자동으로 가입됩니다.',
  },

  // Magic link
  magicLink: {
    tabLabel: '이메일 링크',
    tabPassword: '비밀번호',
    title: '독서 기록에 오신 것을 환영합니다',
    description: '이메일로 로그인 링크를 받아 시작하세요. 가입도 동시에 진행됩니다.',
    emailPlaceholder: 'name@example.com',
    submitButton: '로그인 링크 받기',
    submitting: '전송 중...',
    sentTitle: '이메일을 확인하세요',
    sentDescription: (email: string) =>
      `${email} 으로 로그인 링크를 보냈습니다. 이메일의 링크를 클릭하면 바로 입장됩니다.`,
    sentResendButton: '다시 보내기',
    sentChangeEmailButton: '이메일 변경',
  },

  // Password setup (after magic link login)
  passwordSetup: {
    dialogTitle: '빠른 로그인을 위해 비밀번호를 설정하세요',
    dialogDescription:
      '비밀번호를 설정하면 다음 로그인부터 이메일과 비밀번호로 빠르게 접속할 수 있습니다.',
    setNowButton: '지금 설정',
    laterButton: '나중에 하기',
    newPasswordLabel: '비밀번호',
    confirmPasswordLabel: '비밀번호 확인',
    saveButton: '저장',
    saving: '저장 중...',
    cancelButton: '취소',
    passwordPlaceholder: '6자 이상 입력하세요',
    confirmPlaceholder: '비밀번호를 다시 입력하세요',
    changeTitleDialog: '비밀번호 변경',
    addTitleDialog: '비밀번호 추가',
    changeButton: '비밀번호 변경',
    addButton: '비밀번호 추가',
    changeDescription: '새 비밀번호를 입력하세요.',
    addDescription: '비밀번호를 추가하면 이메일과 비밀번호로도 로그인할 수 있습니다.',
    passwordStatus: {
      hasPassword: '비밀번호가 설정되어 있습니다.',
      noPassword: '비밀번호가 설정되어 있지 않습니다.',
    },
  },

  // Auth callback
  callback: {
    loading: '로그인 중...',
    errorTitle: '로그인에 실패했습니다',
    errorDescription: '링크가 만료되었거나 이미 사용된 링크입니다. 다시 시도해주세요.',
    goToLoginButton: '로그인 페이지로',
  },

  // Error messages
  errors: {
    loginFailed: '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
    magicLinkFailed: '링크 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
    passwordMismatch: '비밀번호가 일치하지 않습니다.',
    passwordTooShort: '비밀번호는 6자 이상이어야 합니다.',
    passwordSetupFailed: '비밀번호 설정에 실패했습니다.',
    googleLoginFailed: 'Google 로그인에 실패했습니다.',
  },

  // Success messages
  success: {
    passwordSet: '비밀번호가 설정되었습니다.',
  },
} as const;
