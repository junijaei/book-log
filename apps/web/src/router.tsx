import { AppLayout } from '@/components/app-layout';
import { Toaster } from '@/components/ui/sonner';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { ScrollToTop } from '@/lib/scroll-to-top';
import { AuthCallbackPage } from '@/pages/auth-callback';
import { BookDetailPage } from '@/pages/book-detail';
import { BookNewPage } from '@/pages/book-new';
import { ErrorPage } from '@/pages/error';
import { FeedPage } from '@/pages/feed';
import { LoginPage } from '@/pages/login';
import { MyPage } from '@/pages/my-page';
import { NotFoundPage } from '@/pages/not-found';
import type { AuthContextType } from '@/types/auth';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { MyBooksInteractivePage } from './pages/my-books-interactive';

// ── Router context ──────────────────────────────────────────────────────────

interface RouterContext {
  auth: Pick<AuthContextType, 'user' | 'loading'>;
}

// ── Root route ──────────────────────────────────────────────────────────────

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <ScrollToTop />
      <Outlet />
      <Toaster />
    </>
  ),
  notFoundComponent: NotFoundPage,
});

// ── Public routes ───────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (!context.auth.loading && context.auth.user) {
      throw redirect({ to: '/', replace: true });
    }
  },
});

const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token_hash: typeof search.token_hash === 'string' ? search.token_hash : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
  }),
});

const errorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/error',
  component: ErrorPage,
});

// ── Authenticated layout (pathless) ─────────────────────────────────────────

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.loading && !context.auth.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
        replace: true,
      });
    }
  },
  component: () => {
    const { loading } = useAuth();
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }
    return <Outlet />;
  },
});

// ── AppLayout layout (pathless, under _authenticated) ───────────────────────

const layoutRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  id: '_layout',
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

// ── Pages with AppLayout ────────────────────────────────────────────────────

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: MyBooksInteractivePage,
});

const feedRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/feed',
  component: FeedPage,
});

const myPageRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/mypage',
  component: MyPage,
});

// ── Pages without AppLayout (authenticated only) ────────────────────────────

const bookNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/books/new',
  component: BookNewPage,
});

const bookDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/books/$id',
  component: BookDetailPage,
});

// ── Route tree ──────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  loginRoute,
  authCallbackRoute,
  errorRoute,
  authenticatedRoute.addChildren([
    layoutRoute.addChildren([indexRoute, feedRoute, myPageRoute]),
    bookNewRoute,
    bookDetailRoute,
  ]),
]);

// ── Router ──────────────────────────────────────────────────────────────────

export const router = createRouter({
  routeTree,
  context: {
    auth: { user: null, loading: true },
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
