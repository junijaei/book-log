/**
 * Login Page
 *
 * 이메일/비밀번호 입력이 메인. 하단 버튼으로 매직링크/구글 로그인으로 전환.
 */

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { messages } from '@/constants/messages';
import { Mail, Send } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LocationState {
  from?: { pathname: string };
}

// =============================================================================
// Google Icon SVG
// =============================================================================

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// =============================================================================
// Magic Link Form (인라인, 하단 버튼 클릭 시 표시)
// =============================================================================

interface MagicLinkFormProps {
  onBack: () => void;
}

function MagicLinkForm({ onBack }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { signInWithMagicLink } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithMagicLink(email);
      setSent(true);
    } catch (err) {
      console.error('Magic link error:', err);
      setError(err instanceof Error ? err.message : messages.auth.errors.magicLinkFailed);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-5 py-4 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Send className="w-7 h-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <p className="font-semibold text-base">{messages.auth.magicLink.sentTitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {messages.auth.magicLink.sentDescription(email)}
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            {messages.auth.magicLink.sentChangeEmailButton}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setSent(false)}>
            {messages.auth.magicLink.sentResendButton}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full" onClick={onBack}>
          {messages.auth.login.backToPassword}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="magic-email">{messages.auth.login.emailLabel}</Label>
          <Input
            id="magic-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={messages.auth.magicLink.emailPlaceholder}
            required
            autoComplete="email"
            disabled={loading}
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          <Mail className="w-4 h-4 mr-2" />
          {loading ? messages.auth.magicLink.submitting : messages.auth.magicLink.submitButton}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        {messages.auth.login.autoSignupHint}
      </p>

      <Button variant="ghost" size="sm" className="w-full" onClick={onBack}>
        {messages.auth.login.backToPassword}
      </Button>
    </div>
  );
}

// =============================================================================
// Password Form (기본 메인 폼)
// =============================================================================

function PasswordForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as LocationState)?.from?.pathname || '/';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : messages.auth.errors.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password-email">{messages.auth.login.emailLabel}</Label>
        <Input
          id="password-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{messages.auth.login.passwordLabel}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? messages.auth.login.submitting : messages.auth.login.submitButton}
      </Button>
    </form>
  );
}

// =============================================================================
// Login Page
// =============================================================================

type LoginView = 'password' | 'magic-link';

export function LoginPage() {
  const { resolvedTheme } = useTheme();
  const [view, setView] = useState<LoginView>('password');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const { signInWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // signInWithOAuth은 Google 페이지로 리다이렉트하므로 이후 코드는 실행되지 않음
    } catch (err) {
      console.error('Google login error:', err);
      setGoogleError(err instanceof Error ? err.message : messages.auth.errors.googleLoginFailed);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            {resolvedTheme === 'dark' ? (
              <img src="/logo-black.png" className="w-12 h-12" />
            ) : (
              <img src="/logo-white.png" className="w-12 h-12" />
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">독서 기록</h1>
            <p className="text-sm text-muted-foreground mt-1">
              읽은 책, 읽고 싶은 책을 한 곳에서 관리하세요
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-center">{messages.auth.login.title}</CardTitle>
            <CardDescription className="text-center text-sm">
              {messages.auth.login.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 메인 폼: 이메일/비밀번호 또는 매직링크 */}
            {view === 'password' ? (
              <PasswordForm />
            ) : (
              <MagicLinkForm onBack={() => setView('password')} />
            )}

            {/* 하단 구분선 + 소셜 로그인 버튼 (비밀번호 뷰에서만 표시) */}
            {view === 'password' && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {messages.auth.login.orDivider}
                    </span>
                  </div>
                </div>

                {googleError && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {googleError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                  >
                    <GoogleIcon />
                    <span className="ml-2">
                      {googleLoading
                        ? messages.auth.login.googleLoading
                        : messages.auth.login.googleButton}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setView('magic-link')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {messages.auth.login.magicLinkButton}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
