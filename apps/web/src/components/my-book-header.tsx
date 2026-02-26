/**
 * my-book-header.tsx
 *
 * Header panel for the book detail page — owner's perspective.
 * All 4 metadata fields (rating, status, visibility, date range) are editable.
 *
 * Internally branches between:
 *   - MyBookHeaderDesktop: inline Radix Selects + DateRangePicker
 *   - MyBookHeaderMobile: tappable rows + Vaul Drawers via FieldDrawer
 *
 * No `isOwner` prop — this component IS the owner's view.
 * Permission logic stays at the page level (book-detail.tsx).
 */

import { BookCover } from '@/components/book-cover';
import { DateRangeDisplay } from '@/components/date-range-display';
import { DateRangeDrawerCalendar } from '@/components/date-range-drawer-calendar';
import { FieldDrawer } from '@/components/field-drawer';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { messages } from '@/constants/messages';
import { useIsMobile } from '@/hooks';
import { getReadingStatusLabel, getVisibilityLabel, renderRatingStars } from '@/lib/constants';
import type { ReadingRecord, ReadingStatus, Visibility } from '@/types';
import { Loader2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { VisibilityBadge } from './visibility-badge';

// ─── Constants ────────────────────────────────────────────────────────────────

const READING_STATUSES: ReadingStatus[] = ['want_to_read', 'reading', 'finished', 'abandoned'];
const VISIBILITIES: Visibility[] = ['public', 'friends', 'private'];

// ─── Shared props ─────────────────────────────────────────────────────────────

interface MyBookHeaderProps {
  record: ReadingRecord;
  savingField: string | null;
  onSaveRating: (rating: number | null) => Promise<void>;
  onSaveStatus: (status: ReadingStatus) => Promise<void>;
  onSaveDateRange: (start: string | null, end: string | null) => Promise<void>;
  onSaveVisibility: (visibility: Visibility) => Promise<void>;
}

// ─── Local helpers ────────────────────────────────────────────────────────────

/** Shows a saving spinner when active, otherwise a pencil edit hint. */
function RowIndicator({ isSaving }: { isSaving: boolean }) {
  if (isSaving) return <Loader2 className="w-3 h-3 animate-spin text-muted-foreground shrink-0" />;
  return <Pencil className="size-3" />;
}

// ─── Desktop ─────────────────────────────────────────────────────────────────

function MyBookHeaderDesktop({
  record,
  savingField,
  onSaveRating,
  onSaveStatus,
  onSaveDateRange,
  onSaveVisibility,
}: MyBookHeaderProps) {
  const { book, reading_log } = record;
  const visibility = (reading_log.visibility ?? 'public') as Visibility;

  return (
    <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-lg leading-tight line-clamp-2">{book.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
              {book.total_pages != null && (
                <p className="text-sm text-muted-foreground mt-0.5">{book.total_pages}p</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div className="flex flex-col items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {/* Rating */}
        <div className="flex w-full px-3 gap-2 items-center">
          <p className="basis-1/4">별점</p>
          <span className="flex items-center gap-1">
            <Select
              value={reading_log.rating?.toString() ?? ''}
              onValueChange={v => onSaveRating(v === 'clear' ? null : parseInt(v))}
            >
              <SelectTrigger className="w-auto h-auto border-0 bg-transparent shadow-none p-0 [&>svg]:hidden focus:ring-0 focus:ring-offset-0">
                <SelectValue>
                  {reading_log.rating ? (
                    <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
                  ) : (
                    <span className="text-muted-foreground/70 text-sm shrink-0 mb-0.5">☆☆☆☆☆</span>
                  )}
                  <RowIndicator isSaving={savingField === 'rating'} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {([5, 4, 3, 2, 1] as const).map(star => (
                  <SelectItem key={star} value={star.toString()}>
                    <span className="text-amber-500">{renderRatingStars(star)}</span>
                    <span className="text-sm text-muted-foreground ml-2">{star}점</span>
                  </SelectItem>
                ))}
                {reading_log.rating && (
                  <SelectItem value="clear">{messages.books.buttons.clearRating}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </span>
        </div>

        {/* Status */}
        <div className="flex w-full px-3 gap-2 items-center">
          <p className="basis-1/4">독서 상태</p>
          <span className="flex items-center gap-1">
            <Select
              value={reading_log.status}
              onValueChange={v => onSaveStatus(v as ReadingStatus)}
            >
              <SelectTrigger className="w-auto h-auto py-0.5 px-2 text-xs border-0 bg-transparent p-0 [&>svg]:hidden focus:ring-0 focus:ring-offset-0 shadow-none">
                <SelectValue>
                  <StatusBadge status={reading_log.status} />
                  <RowIndicator isSaving={savingField === 'status'} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {READING_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {getReadingStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        </div>

        {/* Visibility */}
        <div className="flex w-full px-3 gap-2 items-center">
          <p className="basis-1/4">{messages.books.fields.visibility}</p>
          <span className="flex items-center gap-1">
            <Select value={visibility} onValueChange={v => onSaveVisibility(v as Visibility)}>
              <SelectTrigger className="w-auto h-auto py-0.5 px-2 text-xs border-0 bg-transparent p-0 [&>svg]:hidden focus:ring-0 focus:ring-offset-0 shadow-none">
                <SelectValue>
                  <Badge>{getVisibilityLabel(visibility)}</Badge>
                  <RowIndicator isSaving={savingField === 'visibility'} />
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map(v => (
                  <SelectItem key={v} value={v}>
                    {getVisibilityLabel(v)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        </div>

        {/* Date range */}
        <div className="flex w-full px-3 gap-2 items-center">
          <p className="basis-1/4">독서 기간</p>
          <span className="flex items-center gap-1">
            <DateRangePicker
              value={{
                from: reading_log.start_date ?? undefined,
                to: reading_log.end_date ?? undefined,
              }}
              onChange={({ from, to }) => onSaveDateRange(from ?? null, to ?? null)}
              disabled={savingField === 'date_range'}
            />
            <RowIndicator isSaving={savingField === 'date_range'} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile ───────────────────────────────────────────────────────────────────

function MyBookHeaderMobile({
  record,
  savingField,
  onSaveRating,
  onSaveStatus,
  onSaveDateRange,
  onSaveVisibility,
}: MyBookHeaderProps) {
  const { book, reading_log } = record;
  const visibility = (reading_log.visibility ?? 'public') as Visibility;

  // Single active drawer — only one field is open at a time.
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  return (
    <div className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="flex flex-col items-center">
          <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-semibold text-lg leading-tight line-clamp-2">{book.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
              {book.total_pages != null && (
                <p className="text-sm text-muted-foreground mt-0.5">{book.total_pages}p</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <hr />

      <div className="flex flex-col items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        {/* Rating */}
        <div className="flex w-full px-3 gap-2 items-center">
          <span className="basis-1/4">{messages.books.fields.rating}</span>
          <button
            type="button"
            onClick={() => setOpenDrawer('rating')}
            aria-label={messages.books.fields.rating}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded inline-flex items-center gap-2"
          >
            {reading_log.rating ? (
              <span className="text-amber-500">{renderRatingStars(reading_log.rating)}</span>
            ) : (
              <span className="text-muted-foreground/70 text-sm shrink-0 mb-0.5">☆☆☆☆☆</span>
            )}
          </button>
          <RowIndicator isSaving={savingField === 'rating'} />
        </div>

        {/* Status */}
        <div className="flex w-full px-3 gap-2 items-center">
          <span className="basis-1/4">{messages.books.fields.status}</span>
          <button
            type="button"
            onClick={() => setOpenDrawer('status')}
            aria-label={messages.books.fields.status}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded inline-flex items-center gap-2"
          >
            <StatusBadge status={reading_log.status} />
            <RowIndicator isSaving={savingField === 'status'} />
          </button>
        </div>

        {/* Visibility */}
        <div className="flex w-full px-3 gap-2 items-center">
          <span className="basis-1/4">{messages.books.fields.visibility}</span>
          <button
            type="button"
            onClick={() => setOpenDrawer('visibility')}
            aria-label={messages.books.fields.visibility}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded inline-flex items-center gap-2"
          >
            <VisibilityBadge visibility={visibility}></VisibilityBadge>
            <RowIndicator isSaving={savingField === 'visibility'} />
          </button>
        </div>

        {/* Date range */}
        <div className="flex w-full px-3 gap-2 items-center">
          <span className="basis-1/4">{messages.books.fields.readingPeriod}</span>
          <button
            type="button"
            onClick={() => setOpenDrawer('date_range')}
            aria-label={messages.books.fields.readingPeriod}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded inline-flex items-center gap-2"
          >
            {reading_log.start_date || reading_log.end_date ? (
              <DateRangeDisplay
                startDate={reading_log.start_date}
                endDate={reading_log.end_date}
                variant="inline"
              />
            ) : (
              <span className="text-xs text-muted-foreground/50">
                {messages.books.fields.readingPeriod}
              </span>
            )}
            <RowIndicator isSaving={savingField === 'date_range'} />
          </button>
        </div>
      </div>

      {/* Rating drawer */}
      <FieldDrawer
        open={openDrawer === 'rating'}
        onOpenChange={open => !open && setOpenDrawer(null)}
        title={messages.books.fields.rating}
      >
        <div className="space-y-1">
          {([5, 4, 3, 2, 1] as const).map(star => (
            <button
              key={star}
              type="button"
              className={
                'w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3' +
                (reading_log.rating === star ? ' bg-primary/10' : ' hover:bg-muted')
              }
              onClick={() => {
                onSaveRating(star);
                setOpenDrawer(null);
              }}
            >
              <span className="text-amber-500">{renderRatingStars(star)}</span>
              <span className="text-sm text-muted-foreground">{star}점</span>
            </button>
          ))}
          {reading_log.rating && (
            <button
              type="button"
              className="w-full text-left px-4 py-3 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => {
                onSaveRating(null);
                setOpenDrawer(null);
              }}
            >
              {messages.books.buttons.clearRating}
            </button>
          )}
        </div>
      </FieldDrawer>

      {/* Status drawer */}
      <FieldDrawer
        open={openDrawer === 'status'}
        onOpenChange={open => !open && setOpenDrawer(null)}
        title={messages.books.fields.status}
      >
        <div className="space-y-1">
          {READING_STATUSES.map(status => (
            <button
              key={status}
              type="button"
              className={
                'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors' +
                (reading_log.status === status ? ' bg-primary/10 text-primary' : ' hover:bg-muted')
              }
              onClick={() => {
                onSaveStatus(status);
                setOpenDrawer(null);
              }}
            >
              {getReadingStatusLabel(status)}
            </button>
          ))}
        </div>
      </FieldDrawer>

      {/* Visibility drawer */}
      <FieldDrawer
        open={openDrawer === 'visibility'}
        onOpenChange={open => !open && setOpenDrawer(null)}
        title={messages.books.fields.visibility}
      >
        <div className="space-y-1">
          {VISIBILITIES.map(v => (
            <button
              key={v}
              type="button"
              className={
                'w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors' +
                (visibility === v ? ' bg-primary/10 text-primary' : ' hover:bg-muted')
              }
              onClick={() => {
                onSaveVisibility(v);
                setOpenDrawer(null);
              }}
            >
              {getVisibilityLabel(v)}
            </button>
          ))}
        </div>
      </FieldDrawer>

      {/* Date range drawer */}
      <FieldDrawer
        open={openDrawer === 'date_range'}
        onOpenChange={open => !open && setOpenDrawer(null)}
        title={messages.books.fields.readingPeriod}
      >
        <DateRangeDrawerCalendar
          value={{
            from: reading_log.start_date ?? undefined,
            to: reading_log.end_date ?? undefined,
          }}
          onChange={({ from, to }) => onSaveDateRange(from ?? null, to ?? null)}
          onClose={() => setOpenDrawer(null)}
        />
      </FieldDrawer>
    </div>
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Owner's editable book header panel.
 * Internally selects between desktop and mobile layouts via useIsMobile().
 */
export function MyBookHeader(props: MyBookHeaderProps) {
  const isMobile = useIsMobile();
  return isMobile ? <MyBookHeaderMobile {...props} /> : <MyBookHeaderDesktop {...props} />;
}
