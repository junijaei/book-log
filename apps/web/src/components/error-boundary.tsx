import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">오류가 발생했습니다</h1>
            <p className="text-sm text-muted-foreground">{this.state.error?.message}</p>
            <Button onClick={() => window.location.reload()}>새로고침</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
