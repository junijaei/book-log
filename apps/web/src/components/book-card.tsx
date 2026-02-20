import { messages } from '@/constants/messages';
import { useAuth } from '@/hooks/use-auth';
import { formatDateRange } from '@/lib/constants';
import type { ReadingRecord } from '@/types';
import { MessageSquareQuote, MessageSquareText, NotebookPen, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookCover } from './book-cover';
import { QuickRecordResponsive } from './quick-record-responsive';
import { StatusBadge } from './status-badge';
import { Button } from './ui/button';

interface BookCardProps {
  record: ReadingRecord;
  showAuthor?: boolean;
}

export function BookCard({ record, showAuthor }: BookCardProps) {
  const { book, reading_log, quotes, reviews, profile } = record;
  const [quickRecordOpen, setQuickRecordOpen] = useState(false);
  const { user } = useAuth();

  const progress =
    book.total_pages && reading_log.current_page
      ? Math.round((reading_log.current_page / book.total_pages) * 100)
      : 0;

  const dateRange = formatDateRange(reading_log.start_date, reading_log.end_date);
  const quoteCount = quotes.length;
  const reviewCount = reviews.length;
  const isMine = user?.id === reading_log?.user_id;

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
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-sm text-muted-foreground truncate text-ellipsis shrink">
                {book.author}
              </span>
              <StatusBadge status={reading_log.status} />
            </div>

            {/* 줄 3: 진행률 바 */}
            <div className="flex items-center gap-2 mt-0.5">
              {progress !== null && (
                <>
                  <div className="flex-1 bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                    {progress}%
                  </span>
                </>
              )}
              <span className="text-xs text-muted-foreground/70 basis-2/3 text-right">
                {dateRange ? dateRange : messages.books.messages.noReadingDates}
              </span>
            </div>

            <hr className="w-full mt-auto" />

            {/* 줄 4: 메타 + 오늘 독서 버튼 */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {/* 인용구 수 */}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                  <MessageSquareQuote className="w-3 h-3" />
                  {quoteCount}
                </span>
                {/* 감상문 수 */}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                  <MessageSquareText className="w-3 h-3" />
                  {reviewCount}
                </span>
              </div>

              {isMine && !showAuthor && (
                /* 오늘 독서 버튼 — stops link navigation */
                <Button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuickRecordOpen(true);
                  }}
                  aria-label={`${book.title} — ${messages.books.buttons.recordToday}`}
                  size="sm"
                  variant="secondary"
                >
                  <NotebookPen className="w-3.5 h-3.5" />
                  {messages.books.buttons.recordToday}
                </Button>
              )}
              {showAuthor && profile && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 whitespace-nowrap">
                  <User className="w-3 h-3" />
                  {profile.nickname}
                </span>
              )}
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
