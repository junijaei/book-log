import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Plus, X, Filter, BookOpen, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { useInfiniteScroll, useReadingRecords } from '@/hooks';
import { BookCover } from '@/components/book-cover';
import { StatusBadge } from '@/components/status-badge';
import { PageHeader } from '@/components/page-header';
import { messages } from '@/constants/messages';
import { formatDateRange, renderRatingStars, formatPercentage } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type {
  ReadingRecord,
  ReadingRecordFilters,
  ReadingRecordSort,
  ReadingStatus,
} from '@/types';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Tween sensitivity — controls how quickly off-center slides scale down. */
const TWEEN_FACTOR = 0.52;
/** Constant rotateX offset — top edge always appears wider than the bottom. */
const BASE_TILT_DEG = -2;
/** Duration (ms) for the CSS opacity transition on slide metadata. */
const META_FADE_DURATION = 200;

const numberWithinRange = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

type SortField = 'updated_at' | 'start_date' | 'end_date';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updated_at', label: messages.books.filters.sortByUpdated },
  { value: 'start_date', label: messages.books.filters.sortByStartDate },
  { value: 'end_date', label: messages.books.filters.sortByEndDate },
];

const STATUS_OPTIONS: { value: ReadingStatus | 'all'; label: string }[] = [
  { value: 'all', label: messages.books.filters.all },
  { value: 'want_to_read', label: messages.books.status.want_to_read },
  { value: 'reading', label: messages.books.status.reading },
  { value: 'finished', label: messages.books.status.finished },
  { value: 'abandoned', label: messages.books.status.abandoned },
];

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
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-top-10 duration-200">
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
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------------

export function MyBooksInteractivePage() {
  // ── State ───────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReadingStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<ReadingRecordSort>({
    field: 'updated_at',
    direction: 'desc',
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  /** Controls the full-screen fill overlay during book-open animation. */
  const [isBookOpening, setIsBookOpening] = useState(false);

  const navigate = useNavigate();

  // ── Debounce Search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Data Fetching ────────────────────────────────────────────────────────────
  const filters: ReadingRecordFilters = {
    scope: 'me',
    status: statusFilter === 'all' ? undefined : [statusFilter],
    search: debouncedSearch || undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useReadingRecords(filters, sortBy);

  const records = data?.pages.flatMap(page => page.data) ?? [];

  // ── Infinite Scroll ──────────────────────────────────────────────────────────
  const { observerTarget } = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage });

  // ── Refs: DOM nodes ─────────────────────────────────────────────────────────
  /** Outer `h-dvh` wrappers — one per slide. Used for IntersectionObserver. */
  const slideElsRef = useRef<(HTMLElement | null)[]>([]);
  /** `.slide-inner` divs — tween target (scale / rotateX / opacity). */
  const slideInnerElsRef = useRef<(HTMLElement | null)[]>([]);
  /** `.slide-metadata` divs — opacity driven by scrollend event. */
  const metaElsRef = useRef<(HTMLElement | null)[]>([]);
  /** True while book-click animation is in flight — freezes tween. */
  const isBookOpeningRef = useRef(false);

  // ── Scroll tween: scale / opacity / rotateX / blur ──────────────────────────
  // Runs on every `window.scroll` event.
  // BASE_TILT_DEG (-2) is added to every slide's rotateX so the top edge is
  // always wider than the bottom — no direction-dependent branching.
  useEffect(() => {
    const applyTween = () => {
      if (isBookOpeningRef.current) return;
      const vh = window.innerHeight;

      slideInnerElsRef.current.forEach((inner, i) => {
        if (!inner) return;
        const slide = slideElsRef.current[i];
        if (!slide) return;

        const rect = slide.getBoundingClientRect();
        const distFromCenter = rect.top + rect.height / 2 - vh / 2;
        const tweenValue = numberWithinRange(
          1 - Math.abs(distFromCenter / vh) * TWEEN_FACTOR,
          0,
          1
        );

        const scale = numberWithinRange(0.65 + tweenValue * 0.35, 0.65, 1.0);
        const opacity = numberWithinRange(0.07 + tweenValue * 0.93, 0.07, 1.0);
        // Signed rotation: slides above center tilt back (−), below tilt forward (+).
        // BASE_TILT_DEG shifts the entire range so top is always wider.
        const rotateXDeg = Math.sign(distFromCenter) * (1 - tweenValue) * 22 + BASE_TILT_DEG;
        const brightness = 0.12 + tweenValue * 0.88;
        const blurPx = (1 - tweenValue) * 8;

        inner.style.transform = `perspective(600px) scale(${scale}) rotateX(${rotateXDeg}deg)`;
        inner.style.opacity = String(opacity);
        inner.style.filter =
          tweenValue > 0.97 ? 'none' : `brightness(${brightness}) blur(${blurPx}px)`;

        const meta = metaElsRef.current[i];
        if (meta) meta.style.transform = `translateY(${(1 - tweenValue) * 24}px)`;
      });
    };

    window.addEventListener('scroll', applyTween, { passive: true });
    // Apply immediately so initial paint is correct before any scroll.
    applyTween();
    return () => window.removeEventListener('scroll', applyTween);
  }, [records.length]);

  // ── Meta reveal: hide on scroll, show on scrollend ───────────────────────────
  // No setTimeout — relies on the native `scrollend` browser event.
  useEffect(() => {
    const onScroll = () => {
      metaElsRef.current.forEach(el => {
        if (el) el.style.opacity = '0';
      });
    };
    const onScrollEnd = () => {
      metaElsRef.current.forEach(el => {
        if (el) el.style.opacity = '1';
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scrollend', onScrollEnd, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('scrollend', onScrollEnd);
    };
  }, []);

  // ── IntersectionObserver: focused slide index ────────────────────────────────
  useEffect(() => {
    if (records.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.intersectionRatio >= 0.5) {
            const idx = slideElsRef.current.indexOf(entry.target as HTMLElement);
            if (idx !== -1) setFocusedIndex(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    slideElsRef.current.forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [records.length]);

  // ── Background cross-fade management ─────────────────────────────────────────
  const currentRecord = records[focusedIndex] ?? null;
  const [bgRecord, setBgRecord] = useState<ReadingRecord | null>(null);
  const [prevBgRecord, setPrevBgRecord] = useState<ReadingRecord | null>(null);

  useEffect(() => {
    if (currentRecord?.book.cover_image_url !== bgRecord?.book.cover_image_url) {
      setPrevBgRecord(bgRecord);
      setBgRecord(currentRecord);
    }
  }, [currentRecord, bgRecord]);

  // ── Book-click: 3-phase cinematic animation ───────────────────────────────────
  // Phase 1 (0–180ms)  : book shrinks — tactile press feedback
  // Phase 2 (180–620ms): book expands with rightward rotateY — book-opening 3D
  // Phase 3 (550ms+)   : background fills screen → navigate
  const handleBookClick = useCallback(
    (e: React.MouseEvent, recordId: string, slideIdx: number) => {
      e.preventDefault();
      if (isBookOpeningRef.current) return;
      isBookOpeningRef.current = true;

      const slideInner = slideInnerElsRef.current[slideIdx];
      const metaNode = metaElsRef.current[slideIdx];

      // Blur and fade every slide that isn't being opened
      slideInnerElsRef.current.forEach((node, i) => {
        if (i !== slideIdx && node) {
          node.style.transition = 'filter 220ms ease, opacity 220ms ease';
          node.style.filter = 'blur(20px)';
          node.style.opacity = '0';
        }
      });

      // Instantly hide metadata
      if (metaNode) {
        metaNode.style.transition = 'opacity 100ms ease';
        metaNode.style.opacity = '0';
      }

      // Phase 1: shrink (tactile press)
      if (slideInner) {
        slideInner.style.transition = 'transform 180ms cubic-bezier(0.4, 0, 1, 1)';
        slideInner.style.transformOrigin = 'center center';
        slideInner.style.transform = 'perspective(600px) scale(0.88)';
      }

      // Phase 2: expand + book-open rotateY
      // rotateY(-15deg) with center origin → right side swings toward viewer,
      // appearing larger than the left — simulates a book cover opening.
      setTimeout(() => {
        if (!slideInner) return;
        slideInner.style.transition = 'transform 440ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        slideInner.style.transformOrigin = 'center center';
        slideInner.style.transform = 'perspective(400px) scale(1.08) rotateY(-15deg)';
      }, 180);

      // Phase 3: trigger full-screen overlay
      setTimeout(() => {
        setIsBookOpening(true);
      }, 550);

      // Navigate after animation completes
      setTimeout(() => {
        void navigate({ to: '/books/$id', params: { id: recordId } });
      }, 800);
    },
    [navigate]
  );

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
      {/* ── Book-opening fill overlay ────────────────────────────────────────────
          Fades in during Phase 3 of the book-click animation.
          `pointer-events-none` so it doesn't block the Link's default behavior
          (navigation is handled imperatively after the animation). */}
      {isBookOpening && (
        <div className="fixed inset-0 z-[100] bg-background pointer-events-none animate-in fade-in duration-300" />
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
              className="p-2 rounded-full hover:bg-muted/20 transition-colors"
              aria-label={messages.books.buttons.showFilters}
            >
              {filters.search || filters.status ? (
                <Filter className="w-5 h-5 text-primary" />
              ) : (
                <Search className="w-5 h-5" />
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

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      {isLoading && records.length === 0 ? (
        // Loading skeleton
        <div className="flex flex-col items-center justify-center h-[80dvh] space-y-8 animate-pulse">
          <div className="w-48 h-72 bg-muted/20 rounded-lg" />
          <div className="w-32 h-4 bg-muted/20 rounded" />
        </div>
      ) : records.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center h-[80dvh] p-8 text-center space-y-6">
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
        <>
          {/* Slides — document flow, each occupies one viewport height */}
          <div className="relative z-10">
            {records.map((record, index) => (
              <div
                key={record.reading_log.id}
                ref={el => {
                  slideElsRef.current[index] = el;
                }}
                className="h-dvh flex items-center justify-center px-6"
              >
                <div
                  ref={el => {
                    slideInnerElsRef.current[index] = el;
                  }}
                  className="w-full max-w-md flex flex-col items-center origin-center will-change-transform"
                >
                  <Link
                    to="/books/$id"
                    params={{ id: record.reading_log.id }}
                    className="group relative flex flex-col items-center w-full"
                    onClick={e => handleBookClick(e, record.reading_log.id, index)}
                  >
                    {/* Cover with shadow */}
                    <div
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

                    {/* Metadata — opacity driven by scrollend event, translateY by tween */}
                    <div
                      ref={el => {
                        metaElsRef.current[index] = el;
                      }}
                      className="slide-metadata text-center space-y-3 max-w-xs sm:max-w-sm will-change-transform"
                      style={{
                        transition: `opacity ${META_FADE_DURATION}ms ease, transform 300ms ease`,
                      }}
                    >
                      <h2 className="text-2xl sm:text-3xl font-bold leading-tight line-clamp-2 drop-shadow-md">
                        {record.book.title}
                      </h2>
                      <p className="text-lg text-muted-foreground font-medium line-clamp-1">
                        {record.book.author}
                      </p>

                      <div className="flex flex-col items-center gap-2 mt-4">
                        {record.reading_log.status === 'reading' && record.book.total_pages && (
                          <div className="w-full space-y-1">
                            <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm">
                              <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{
                                  width: `${((record.reading_log.current_page ?? 0) / record.book.total_pages) * 100}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatPercentage(
                                record.reading_log.current_page ?? 0,
                                record.book.total_pages
                              )}
                            </p>
                          </div>
                        )}

                        {record.reading_log.rating && (
                          <span className="text-xl tracking-widest text-yellow-500 drop-shadow-sm">
                            {renderRatingStars(record.reading_log.rating)}
                          </span>
                        )}

                        {(record.reading_log.start_date || record.reading_log.end_date) && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mt-1 bg-background/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {formatDateRange(
                                record.reading_log.start_date,
                                record.reading_log.end_date
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div
              ref={observerTarget}
              className="flex items-center justify-center py-8 text-muted-foreground"
            >
              {isFetchingNextPage && hasNextPage && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-medium">{messages.common.states.loading}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Pagination dots (fixed, above bottom nav) ──────────────────── */}
          <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="flex gap-1.5 px-4 py-2 bg-background/20 backdrop-blur-xl rounded-full border border-white/5 shadow-lg">
              {records.map((_, idx) => {
                if (Math.abs(idx - focusedIndex) > 3) return null;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'h-2 rounded-full transition-all duration-300',
                      idx === focusedIndex ? 'bg-primary w-4' : 'bg-muted-foreground/40 w-2'
                    )}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
