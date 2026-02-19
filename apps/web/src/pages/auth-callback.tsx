/**
 * Auth Callback Page
 *
 * PKCE 흐름에서 매직 링크 또는 Google OAuth 클릭 후 리다이렉트되는 페이지.
 * Supabase SDK의 detectSessionInUrl이 URL의 code 파라미터를 자동으로
 * 처리하므로, 이 페이지는 세션 수립을 기다렸다가 홈으로 이동합니다.
 *
 * 만약 token_hash 파라미터가 있는 경우(커스텀 이메일 템플릿 사용 시)
 * verifyOtpToken을 직접 호출합니다.
 *
 * 매직링크로 로그인 + 비밀번호 미설정 + 최초 1회에 한해
 * 비밀번호 설정 팝업을 보여줍니다.
 */

import { verifyOtpToken } from '@/api/auth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { AUTH_CALLBACK_LABELS, PASSWORD_SETUP_LABELS } from '@/lib/constants';
import { BookOpen, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

type CallbackState = 'loading' | 'error' | 'ready';

/** localStorage 키: 비밀번호 설정 팝업을 이미 보여줬는지 여부 */
const promptedKey = (userId: string) => `password_setup_prompted_${userId}`;

/**
 * 비밀번호 설정 팝업 표시 여부를 판단합니다.
 * - app_metadata.providers에 'email'이 포함된 경우(이미 비밀번호 로그인 가능) 제외
 * - 이미 팝업을 본 경우(localStorage) 제외
 */
function shouldShowPasswordPrompt(user: ReturnType<typeof useAuth>['user']): boolean {
  if (!user) return false;

  const providers = (user.app_metadata?.providers ?? []) as string[];

  // 이미 이메일/비밀번호 로그인이 가능한 유저는 제외
  if (providers.includes('email')) return false;

  // 이미 한 번 팝업을 봤으면 제외
  if (localStorage.getItem(promptedKey(user.id)) === 'true') return false;

  return true;
}

// =============================================================================
// SetPasswordDialog
// =============================================================================

interface SetPasswordDialogProps {
  open: boolean;
  onSkip: () => void;
  onSaved: () => void;
}

function SetPasswordDialog({ open, onSkip, onSaved }: SetPasswordDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { updatePassword } = useAuth();

  const handleSave = async () => {
    setError(null);

    if (password.length < 6) {
      setError(PASSWORD_SETUP_LABELS.MIN_LENGTH_ERROR);
      return;
    }
    if (password !== confirmPassword) {
      setError(PASSWORD_SETUP_LABELS.MISMATCH_ERROR);
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      toast.success(PASSWORD_SETUP_LABELS.SUCCESS);
      onSaved();
    } catch (err) {
      console.error('Password update error:', err);
      setError(err instanceof Error ? err.message : '비밀번호 설정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 다이얼로그가 닫힐 때 폼 상태 초기화
  useEffect(() => {
    if (!open) {
      setShowForm(false);
      setPassword('');
      setConfirmPassword('');
      setError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">
            {PASSWORD_SETUP_LABELS.DIALOG_TITLE}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {PASSWORD_SETUP_LABELS.DIALOG_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>

        {!showForm ? (
          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onSkip}>
              {PASSWORD_SETUP_LABELS.LATER}
            </Button>
            <Button className="flex-1" onClick={() => setShowForm(true)}>
              {PASSWORD_SETUP_LABELS.SET_NOW}
            </Button>
          </DialogFooter>
        ) : (
          <div className="space-y-4 pt-1">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">{PASSWORD_SETUP_LABELS.NEW_PASSWORD}</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={PASSWORD_SETUP_LABELS.PASSWORD_PLACEHOLDER}
                disabled={saving}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{PASSWORD_SETUP_LABELS.CONFIRM_PASSWORD}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={PASSWORD_SETUP_LABELS.CONFIRM_PLACEHOLDER}
                disabled={saving}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                {PASSWORD_SETUP_LABELS.CANCEL}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? PASSWORD_SETUP_LABELS.SAVING : PASSWORD_SETUP_LABELS.SAVE}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// AuthCallbackPage
// =============================================================================

export function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 비밀번호 팝업 여부 판단을 한 번만 수행하기 위한 ref
  const promptChecked = useRef(false);

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as 'email' | 'magiclink' | null;

    // Case 1: Custom email template sends token_hash — verify manually
    if (tokenHash) {
      verifyOtpToken(tokenHash, type ?? 'email')
        .then(() => {
          setState('ready');
        })
        .catch((err: unknown) => {
          console.error('[AuthCallback] verifyOtpToken failed:', err);
          setErrorMessage(
            err instanceof Error ? err.message : AUTH_CALLBACK_LABELS.ERROR_DESCRIPTION
          );
          setState('error');
        });
      return;
    }

    // Case 2: Standard PKCE flow — SDK handles `code` param automatically via
    // detectSessionInUrl. We just wait for the user to be set via onAuthStateChange.
    // A timeout fallback handles broken/expired links.
    const timeout = setTimeout(() => {
      if (!user) {
        setState('error');
      }
    }, 8_000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 세션 수립 후 비밀번호 팝업 여부 확인 → 팝업 표시 or 홈 이동
  useEffect(() => {
    if (!user) return;
    if (state === 'error') return;
    if (promptChecked.current) return;

    promptChecked.current = true;
    setState('ready');

    if (shouldShowPasswordPrompt(user)) {
      // 팝업을 보여줬다고 기록
      localStorage.setItem(promptedKey(user.id), 'true');
      setShowPasswordDialog(true);
    } else {
      navigate('/', { replace: true });
    }
  }, [user, state, navigate]);

  const handlePasswordDialogClose = () => {
    setShowPasswordDialog(false);
    navigate('/', { replace: true });
  };

  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 gap-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">{AUTH_CALLBACK_LABELS.ERROR_TITLE}</h1>
          <p className="text-sm text-muted-foreground">
            {errorMessage ?? AUTH_CALLBACK_LABELS.ERROR_DESCRIPTION}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/login', { replace: true })}>
          {AUTH_CALLBACK_LABELS.GO_TO_LOGIN}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{AUTH_CALLBACK_LABELS.LOADING}</p>
      </div>

      <SetPasswordDialog
        open={showPasswordDialog}
        onSkip={handlePasswordDialogClose}
        onSaved={handlePasswordDialogClose}
      />
    </>
  );
}
