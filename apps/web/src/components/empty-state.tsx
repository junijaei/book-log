import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  action?: {
    label: string;
    to?: string;
    onClick?: () => void;
  };
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-muted-foreground/30 mb-4">{icon}</div>}
      <p className="text-sm text-muted-foreground">{message}</p>
      {action && (
        <div className="mt-4">
          {action.to ? (
            <Link to={action.to}>
              <Button variant="outline" size="sm">
                {action.label}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
