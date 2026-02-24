import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { useAuth } from './hooks/use-auth';
import { AuthProvider } from './lib/auth/auth-provider';
import { ThemeProvider } from './lib/theme-provider';
import { router } from './router';

function InnerApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <InnerApp />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
