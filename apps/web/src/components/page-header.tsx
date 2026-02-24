import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  tabs?: ReactNode;
  maxWidth?: string;
  className?: string;
}

export function PageHeader({
  left,
  center,
  right,
  tabs,
  maxWidth = 'max-w-4xl',
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn('sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b', className)}
    >
      <div className={cn('mx-auto px-4 py-3', maxWidth)}>
        {center ? (
          <div className="flex items-center">
            <div className="flex-1 flex justify-start">{left}</div>
            <div className="flex-shrink-0">{center}</div>
            <div className="flex-1 flex justify-end">{right}</div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>{left}</div>
            <div>{right}</div>
          </div>
        )}
        {tabs && <div className="mt-3">{tabs}</div>}
      </div>
    </header>
  );
}
