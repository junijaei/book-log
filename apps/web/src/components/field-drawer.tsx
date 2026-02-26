/**
 * field-drawer.tsx
 *
 * Thin Vaul Drawer shell for mobile field editing.
 * No business logic — purely structural.
 * Consumers provide open state, title, and children.
 */

import type { ReactNode } from 'react';
import { Drawer } from 'vaul';

interface FieldDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Short label shown as the drawer title. */
  title: string;
  children: ReactNode;
}

export function FieldDrawer({ open, onOpenChange, title, children }: FieldDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background"
          aria-describedby={undefined}
        >
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted" />
          <div className="p-4 pt-3 overflow-hidden">
            <Drawer.Title className="text-base font-semibold mb-4">{title}</Drawer.Title>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
