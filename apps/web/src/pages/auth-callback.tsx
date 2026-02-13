/**
 * Auth Callback Page
 *
 * PKCE 흐름에서 매직 링크 클릭 후 리다이렉트되는 페이지.
 * Supabase SDK의 detectSessionInUrl이 URL의 code 파라미터를 자동으로
 * 처리하므로, 이 페이지는 세션 수립을 기다렸다가 홈으로 이동합니다.
 *
 * 만약 token_hash 파라미터가 있는 경우(커스텀 이메일 템플릿 사용 시)
 * verifyOtpToken을 직접 호출합니다.
 */

import { verifyOtpToken } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { AUTH_CALLBACK_LABELS } from '@/lib/constants';
import { BookOpen, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type CallbackState = 'loading' | 'error';

export function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash');
    const type = searchParams.get('type') as 'email' | 'magiclink' | null;

    console.log([...searchParams.entries()], tokenHash, type);

    // Case 1: Custom email template sends token_hash — verify manually
    if (tokenHash) {
      verifyOtpToken(tokenHash, type ?? 'email')
        .then(() => {
          navigate('/', { replace: true });
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

  // Once the SDK resolves the session, navigate home
  useEffect(() => {
    if (user && state === 'loading') {
      navigate('/', { replace: true });
    }
  }, [user, state, navigate]);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{AUTH_CALLBACK_LABELS.LOADING}</p>
    </div>
  );
}
