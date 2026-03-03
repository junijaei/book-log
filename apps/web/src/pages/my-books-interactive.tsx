/**
 * My Books — interactive full-screen carousel view.
 *
 * Thin orchestrator: delegates filter/sort state to `useMyBooksFilters` and
 * all animation + scroll logic to `useCarouselTween`. Renders the carousel,
 * filter panel, and atmospheric background.
 */
import { useEffect, useState } from 'react';

import { Link } from '@tanstack/react-router';
import { BookOpen, ChevronDown, Loader2, Plus, Search, X } from 'lucide-react';

import { BookCover } from '@/components/book-cover';
import { PageHeader } from '@/components/page-header';
import { SlideMetadataReveal } from '@/components/slide-metadata-reveal';
import { StatusBadge } from '@/components/status-badge';
import { messages } from '@/constants/messages';
import {
  SORT_OPTIONS,
  STATUS_OPTIONS,
  useCarouselTween,
  useCoverLuminance,
  useMyBooksFilters,
  useReadingRecords,
} from '@/hooks';
import { renderRatingStars } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ReadingRecord, ReadingRecordSort, ReadingStatus } from '@/types';

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: ReadingStatus | 'all';
  setStatusFilter: (status: ReadingStatus | 'all') => void;
  sortBy: ReadingRecordSort;
  setSortBy: (sort: ReadingRecordSort) => void;
}

function FilterPanel({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
}: FilterPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bottom-14 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-top-10 duration-200">
      <div className="flex items-center justify-between p-4 border-b border-border/10">
        <h2 className="text-lg font-semibold">{messages.books.buttons.showFilters}</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted/20 active:scale-95 transition-transform"
          aria-label={messages.common.buttons.close}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Search */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            {messages.books.search.title}
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={messages.books.placeholders.search}
              className="w-full pl-10 pr-4 py-3 bg-muted/30 rounded-xl border border-border/10 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            {messages.books.fields.status}
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  statusFilter === option.value
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">
            {messages.books.filters.sortByUpdated}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                onClick={() => setSortBy({ field: option.value, direction: 'desc' })}
                className={cn(
                  'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  sortBy.field === option.value
                    ? 'bg-primary/5 text-primary border border-primary/10'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                )}
              >
                {option.label}
                {sortBy.field === option.value && <ChevronDown className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/10">
        <button
          onClick={onClose}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg active:scale-[0.98] transition-transform"
        >
          {messages.books.buttons.hideFilters}
        </button>
      </div>
    </div>
  );
}

interface BackgroundLayerProps {
  record: ReadingRecord | null;
  isActive: boolean;
}

function BackgroundLayer({ record, isActive }: BackgroundLayerProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 transition-opacity duration-400 ease-in-out',
        isActive ? 'opacity-100' : 'opacity-0'
      )}
    >
      {record?.book.cover_image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center blur-[100px] scale-150 opacity-65 dark:opacity-45"
          style={{ backgroundImage: `url(${record.book.cover_image_url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-b from-muted/50 to-background opacity-50" />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-background/50 via-transparent to-background/70" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-background/75 via-background/25 to-transparent" />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------------

export function MyBooksInteractivePage() {
  // ── Filters ──────────────────────────────────────────────────────────────────
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    isFilterOpen,
    setIsFilterOpen,
    filters,
  } = useMyBooksFilters();

  // ── Data Fetching ────────────────────────────────────────────────────────────
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useReadingRecords(filters, sortBy);

  const records = data?.pages.flatMap(page => page.data) ?? [];

  // ── Carousel & Animation ─────────────────────────────────────────────────────
  const {
    emblaRef,
    perspectiveWrapRef,
    focusedIndex,
    isBookOpening,
    isMetaVisible,
    handleBookClick,
  } = useCarouselTween({ fetchNextPage, hasNextPage });

  // ── Background cross-fade management ─────────────────────────────────────
  const currentRecord = records[focusedIndex] ?? null;

  // ── Luminance-driven contrast adaptation ──────────────────────────────────
  const { isLight: coverIsLight, isResolved: luminanceReady } = useCoverLuminance(
    currentRecord?.book.cover_image_url
  );

  const starColorClass = luminanceReady
    ? coverIsLight
      ? 'text-amber-600 dark:text-amber-400' // dark amber on bright bg, lighter in dark mode
      : 'text-amber-400' // bright amber on dark bg (both modes)
    : 'text-yellow-500'; // neutral fallback while unresolved

  const [bgRecord, setBgRecord] = useState<ReadingRecord | null>(null);
  const [prevBgRecord, setPrevBgRecord] = useState<ReadingRecord | null>(null);

  useEffect(() => {
    if (currentRecord?.book.cover_image_url !== bgRecord?.book.cover_image_url) {
      setPrevBgRecord(bgRecord);
      setBgRecord(currentRecord);
    }
  }, [currentRecord, bgRecord]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <p className="text-destructive mb-4">{messages.common.errors.failedToLoad}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          {messages.common.buttons.loadMore}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ── Book-opening fill overlay ──────────────────────────────────────────
          Fades in during Phase 3 of the book-click animation.
          `pointer-events-none` so it doesn't block the Link's default behavior
          (navigation is handled imperatively after the animation). */}
      {isBookOpening && (
        <div className="fixed inset-0 z-100 bg-background pointer-events-none animate-in fade-in duration-300" />
      )}

      {/* ── Dynamic atmospheric background ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <BackgroundLayer record={prevBgRecord} isActive={false} />
        <BackgroundLayer record={bgRecord} isActive={true} />
      </div>

      {/* ── Page header — matches feed.tsx / my-page.tsx pattern ────────────── */}
      <PageHeader
        left={<h1 className="text-xl font-bold">{messages.common.navigation.myBooks}</h1>}
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="p-2 rounded-full hover:bg-muted/20 transition-colors relative"
              aria-label={messages.books.buttons.showFilters}
            >
              <Search className="w-5 h-5" />
              {(filters.search || filters.status) && (
                <span className="absolute top-1 right-1 text-xs bg-destructive text-destructive-foreground rounded-full size-1" />
              )}
            </button>
            <Link
              to="/books/new"
              className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
              aria-label={messages.books.buttons.addBook}
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        }
        className="z-50"
      />

      {/* ── Filter overlay ──────────────────────────────────────────────────── */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div
        className="absolute inset-x-0 top-0 bottom-0 z-10"
        ref={perspectiveWrapRef}
        style={{ transformOrigin: 'center center' }}
      >
        {isLoading && records.length === 0 ? (
          // Loading skeleton
          <div className="flex flex-col items-center justify-center h-full space-y-8 animate-pulse">
            <div className="w-48 h-72 bg-muted/20 rounded-lg" />
            <div className="w-32 h-4 bg-muted/20 rounded" />
          </div>
        ) : records.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6">
            <div className="p-6 rounded-full bg-muted/10 backdrop-blur-sm border border-white/5">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium">{messages.books.messages.empty}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {messages.books.buttons.addFirstBook}
              </p>
            </div>
            <Link
              to="/books/new"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {messages.books.buttons.addBook}
            </Link>
          </div>
        ) : (
          // Carousel
          <div className="embla overflow-hidden h-full" ref={emblaRef}>
            <div className="embla__container flex flex-col h-full">
              {records.map((record, index) => (
                <div
                  key={record.reading_log.id}
                  className="embla__slide relative flex-none basis-full flex items-center justify-center px-6 py-16"
                >
                  <div className="embla__slide__inner w-full max-w-md flex flex-col items-center origin-center will-change-transform">
                    {/* Book card — click intercepted for animation */}
                    <Link
                      to="/books/$id"
                      params={{ id: record.reading_log.id }}
                      className="group relative flex flex-col items-center w-full"
                      onClick={e => handleBookClick(e, record.reading_log.id, index)}
                    >
                      {/* Cover with shadow */}
                      <div
                        data-type="book-cover"
                        className="slide-cover-wrap relative mb-8 rounded-xl overflow-hidden"
                        style={{
                          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.4)',
                        }}
                      >
                        <BookCover
                          url={record.book.cover_image_url}
                          alt={record.book.title}
                          size="lg"
                        />
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={record.reading_log.status} />
                        </div>
                      </div>

                      {/* Metadata — visibility driven by carousel, animation by SlideMetadataReveal */}
                      <SlideMetadataReveal
                        isVisible={isMetaVisible}
                        className="text-center space-y-2 max-w-xs sm:max-w-sm z-10"
                      >
                        <h2 className="text-xl sm:text-3xl font-bold leading-tight line-clamp-2 break-keep">
                          {record.book.title}
                        </h2>
                        <p className="text-md text-muted-foreground font-medium line-clamp-1">
                          {record.book.author}
                        </p>

                        <div className="flex flex-col items-center">
                          {record.reading_log.rating && (
                            <span
                              className={cn(
                                'text-xl tracking-widest filter-[drop-shadow(0_1px_8px_rgb(0_0_0/0.5))]',
                                starColorClass
                              )}
                            >
                              {renderRatingStars(record.reading_log.rating)}
                            </span>
                          )}
                        </div>
                      </SlideMetadataReveal>
                    </Link>
                  </div>
                </div>
              ))}

              {/* Infinite scroll spinner — only rendered when actively fetching AND more pages exist */}
              {isFetchingNextPage && hasNextPage && (
                <div className="embla__slide relative flex-none basis-full min-h-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="text-sm font-medium">{messages.common.states.loading}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
