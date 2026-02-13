/**
 * Login Page
 *
 * 매직 링크(기본)와 이메일/비밀번호 두 가지 로그인 방식을 탭으로 제공합니다.
 */

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { LOGIN_LABELS, MAGIC_LINK_LABELS } from '@/lib/constants';
import { Mail, Send } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LocationState {
  from?: { pathname: string };
}

// =============================================================================
// Magic Link Form
// =============================================================================

function MagicLinkForm() {
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
      setError(err instanceof Error ? err.message : MAGIC_LINK_LABELS.ERROR_GENERIC);
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
          <p className="font-semibold text-base">{MAGIC_LINK_LABELS.SENT_TITLE}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {MAGIC_LINK_LABELS.SENT_DESCRIPTION(email)}
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
            {MAGIC_LINK_LABELS.SENT_CHANGE_EMAIL}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => {
              setSent(false);
            }}
          >
            {MAGIC_LINK_LABELS.SENT_RESEND}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="magic-email">{LOGIN_LABELS.EMAIL}</Label>
        <Input
          id="magic-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={MAGIC_LINK_LABELS.EMAIL_PLACEHOLDER}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        <Mail className="w-4 h-4 mr-2" />
        {loading ? MAGIC_LINK_LABELS.SUBMITTING : MAGIC_LINK_LABELS.SUBMIT}
      </Button>

      <p className="text-xs text-center text-muted-foreground pt-1">
        계정이 없으면 자동으로 가입됩니다.
      </p>
    </form>
  );
}

// =============================================================================
// Password Form
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
      setError(err instanceof Error ? err.message : LOGIN_LABELS.ERROR_GENERIC);
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
        <Label htmlFor="password-email">{LOGIN_LABELS.EMAIL}</Label>
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
        <Label htmlFor="password">{LOGIN_LABELS.PASSWORD}</Label>
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
        {loading ? LOGIN_LABELS.SUBMITTING : LOGIN_LABELS.SUBMIT}
      </Button>
    </form>
  );
}

// =============================================================================
// Login Page
// =============================================================================

export function LoginPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Logo / branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
            {/* <BookOpen className="w-6 h-6 text-primary-foreground" /> */}
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
            <CardTitle className="text-lg text-center">{LOGIN_LABELS.TITLE}</CardTitle>
            <CardDescription className="text-center text-sm">
              {LOGIN_LABELS.DESCRIPTION}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="magic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="magic">{MAGIC_LINK_LABELS.TAB_MAGIC}</TabsTrigger>
                <TabsTrigger value="password">{MAGIC_LINK_LABELS.TAB_PASSWORD}</TabsTrigger>
              </TabsList>

              <TabsContent value="magic">
                <MagicLinkForm />
              </TabsContent>

              <TabsContent value="password">
                <PasswordForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
