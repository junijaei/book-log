/**
 * Quick Record Responsive Wrapper
 *
 * Renders a vaul bottom-sheet on mobile and a Dialog on desktop.
 * Both contain the same QuickRecordForm content.
 */

import { useIsMobile } from '@/hooks';
import type { ReadingRecord } from '@/types';
import { Drawer } from 'vaul';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { QuickRecordForm } from './quick-record-form';

interface QuickRecordResponsiveProps {
  record: ReadingRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DRAWER_TITLE = '오늘 독서 기록';

export function QuickRecordResponsive({ record, open, onOpenChange }: QuickRecordResponsiveProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <Drawer.Content
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] flex flex-col rounded-t-2xl bg-background"
            aria-describedby={undefined}
          >
            {/* Drag handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted shrink-0" />

            <div className="p-4 pt-3 overflow-y-auto flex-1">
              <Drawer.Title className="text-base font-semibold mb-4">{DRAWER_TITLE}</Drawer.Title>
              <QuickRecordForm
                record={record}
                onSuccess={() => onOpenChange(false)}
                onCancel={() => onOpenChange(false)}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{DRAWER_TITLE}</DialogTitle>
        </DialogHeader>
        <QuickRecordForm
          record={record}
          onSuccess={() => onOpenChange(false)}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
