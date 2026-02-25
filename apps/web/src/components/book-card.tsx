import { messages } from '@/constants/messages';
import { formatDateRange } from '@/lib/constants';
import type { ReadingRecord } from '@/types';
import { Link } from '@tanstack/react-router';
import { MessageSquareQuote, MessageSquareText, User } from 'lucide-react';
import { useState } from 'react';
import { BookCover } from './book-cover';
import { QuickRecordResponsive } from './quick-record-responsive';
import { StatusBadge } from './status-badge';

interface BookCardProps {
  record: ReadingRecord;
  isFeed?: boolean;
}

export function BookCard({ record, isFeed }: BookCardProps) {
  const { book, reading_log, quotes, reviews, profile } = record;
  const [quickRecordOpen, setQuickRecordOpen] = useState(false);

  const dateRange = formatDateRange(reading_log.start_date, reading_log.end_date);
  const quoteCount = quotes.length;
  const reviewCount = reviews.length;

  return (
    <div className="relative group/card">
      <Link to="/books/$id" params={{ id: reading_log.id }} className="block">
        <div className="flex gap-4 px-4 py-3.5 rounded-xl border bg-card hover:bg-accent/40 hover:border-accent transition-colors duration-150">
          {/* ── 표지 ── */}
          <div className="shrink-0 self-start mt-0.5 relative">
            <div className="relative">
              <BookCover url={book.cover_image_url} alt={book.title} size="sm" />
              <div className="absolute rounded inset-0 size-full bg-gradient-to-t from-foreground to-transparent opacity-70" />
            </div>
            <StatusBadge className="absolute bottom-1 left-0.5" status={reading_log.status} />
          </div>

          {/* ── 메인 콘텐츠 ── */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            {/* 줄 1: 제목 + 평점 */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-base leading-snug line-clamp-1 group-hover/card:text-primary transition-colors line-clamp-2">
                {book.title}
              </h3>
            </div>

            {/* 줄 2: 저자 */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-sm text-muted-foreground truncate text-ellipsis shrink line-clamp-2">
                {book.author}
              </span>
            </div>

            {/* 줄 3: 독서 기록 + 별점 || 메타 정보 */}
            {/* <div className="flex justify-between items-center mt-0.5">
            </div> */}

            {/* 줄 4: 메타 + 오늘 독서 버튼 */}
            <div className="flex items-center justify-between mt-auto">
              {isFeed ? (
                <div className="flex w-full items-center gap-x-3 gap-y-1 overflow-hidden">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 min-w-0 overflow-hidden w-full">
                    <User className="w-3 h-3 shirink-0" />
                    <span className="w-full min-w-0 truncate">{profile?.nickname || ''}</span>
                  </span>
                  {/* 인용구 수 */}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                    <MessageSquareQuote className="w-3 h-3 shirink-0" />
                    {quoteCount}
                  </span>
                  {/* 감상문 수 */}
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                    <MessageSquareText className="w-3 h-3 shirink-0" />
                    {reviewCount}
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                    {dateRange ? dateRange : messages.books.messages.noReadingDates}
                  </span>
                  {reading_log.rating !== null && reading_log.rating > 0 ? (
                    <span className="text-amber-400 text-sm shrink-0 mb-0.5 ">
                      {'★'.repeat(reading_log.rating)}
                      {'☆'.repeat(5 - reading_log.rating)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/70 text-sm shrink-0 mb-0.5">☆☆☆☆☆</span>
                  )}
                </>
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
