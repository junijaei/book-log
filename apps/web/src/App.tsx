import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/app-layout';
import { AuthGuard } from './components/auth-guard';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './lib/auth/auth-provider';
import { ThemeProvider } from './lib/theme-provider';
import { AuthCallbackPage } from './pages/auth-callback';
import { BookDetailPage } from './pages/book-detail';
import { BookEditPage } from './pages/book-edit';
import { BookNewPage } from './pages/book-new';
import { ErrorPage } from './pages/error';
import { FeedPage } from './pages/feed';
import { LoginPage } from './pages/login';
import { MyBooksPage } from './pages/my-books';
import { MyPage } from './pages/my-page';
import { NotFoundPage } from './pages/not-found';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            <Route
              path="/"
              element={
                <AuthGuard>
                  <AppLayout>
                    <MyBooksPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/feed"
              element={
                <AuthGuard>
                  <AppLayout>
                    <FeedPage />
                  </AppLayout>
                </AuthGuard>
              }
            />
            <Route
              path="/mypage"
              element={
                <AuthGuard>
                  <AppLayout>
                    <MyPage />
                  </AppLayout>
                </AuthGuard>
              }
            />

            <Route
              path="/books/new"
              element={
                <AuthGuard>
                  <BookNewPage />
                </AuthGuard>
              }
            />
            <Route
              path="/books/:id"
              element={
                <AuthGuard>
                  <BookDetailPage />
                </AuthGuard>
              }
            />
            <Route
              path="/books/:id/edit"
              element={
                <AuthGuard>
                  <BookEditPage />
                </AuthGuard>
              }
            />

            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
