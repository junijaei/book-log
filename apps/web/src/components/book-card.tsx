import { formatDateRange } from '@/lib/constants';
import { messages } from '@/constants/messages';
import type { ReadingRecord } from '@/types';
import { BookOpenText, MessageSquareQuote } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './book-cover';
import { StatusBadge } from './status-badge';
import { QuickRecordResponsive } from './quick-record-responsive';

interface BookCardProps {
  record: ReadingRecord;
  showAuthor?: boolean;
}

export function BookCard({ record, showAuthor }: BookCardProps) {
  const { book, reading_log, quotes, profile } = record;
  const [quickRecordOpen, setQuickRecordOpen] = useState(false);

  const progress =
    book.total_pages && reading_log.current_page
      ? Math.round((reading_log.current_page / book.total_pages) * 100)
      : null;

  const dateRange = formatDateRange(reading_log.start_date, reading_log.end_date);
  const quoteCount = quotes.length;

  return (
    <div className="relative group/card">
      <Link to={`/books/${reading_log.id}`} className="block">
        <div className="flex gap-4 px-4 py-3.5 rounded-xl border bg-card hover:bg-accent/40 hover:border-accent transition-colors duration-150">
          {/* ── 표지 ── */}
          <div className="shrink-0 self-start mt-0.5">
            <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
          </div>

          {/* ── 메인 콘텐츠 ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* 줄 1: 제목 + 평점 */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover/card:text-primary transition-colors">
                {book.title}
              </h3>
              {reading_log.rating !== null && reading_log.rating > 0 && (
                <span className="text-amber-400 text-sm shrink-0 leading-snug">
                  {'★'.repeat(reading_log.rating)}
                  {'☆'.repeat(5 - reading_log.rating)}
                </span>
              )}
            </div>

            {/* 줄 2: 저자 + 상태 배지 + 피드용 닉네임 */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground truncate">{book.author}</span>
              <StatusBadge status={reading_log.status} />
              {showAuthor && profile && (
                <span className="text-xs text-muted-foreground/60">— {profile.nickname}</span>
              )}
            </div>

            {/* 줄 3: 진행률 바 */}
            {progress !== null && (
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                  {reading_log.current_page?.toLocaleString()} /{' '}
                  {book.total_pages?.toLocaleString()}
                  {messages.books.details.pagesUnit}&nbsp;{progress}%
                </span>
              </div>
            )}

            {/* 줄 4: 메타 + 오늘 독서 버튼 */}
            <div className="flex items-center justify-between mt-auto pt-0.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {dateRange && <span className="text-xs text-muted-foreground/70">{dateRange}</span>}
                {quoteCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                    <MessageSquareQuote className="w-3 h-3" />
                    {quoteCount}
                  </span>
                )}
              </div>

              {/* 오늘 독서 버튼 — stops link navigation */}
              <button
                type="button"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuickRecordOpen(true);
                }}
                aria-label={`${book.title} — ${messages.books.buttons.recordToday}`}
                className="inline-flex items-center gap-1 shrink-0 text-xs text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded-md transition-colors"
              >
                <BookOpenText className="w-3.5 h-3.5" />
                {messages.books.buttons.recordToday}
              </button>
            </div>
          </div>
        </div>
      </Link>

      <QuickRecordResponsive
        record={record}
        open={quickRecordOpen}
        onOpenChange={setQuickRecordOpen}
      />
    </div>
  );
}
