import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import useEmblaCarousel from 'embla-carousel-react';
import { Search, Plus, X, Filter, BookOpen, Calendar, ChevronDown, Loader2 } from 'lucide-react';
import { useReadingRecords } from '@/hooks';
import { BookCover } from '@/components/book-cover';
import { StatusBadge } from '@/components/status-badge';
import { messages } from '@/constants/messages';
import { formatDateRange, renderRatingStars, formatPercentage } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { EmblaCarouselType, EmblaEventType } from 'embla-carousel';
import type {
  ReadingRecord,
  ReadingRecordFilters,
  ReadingRecordSort,
  ReadingStatus,
} from '@/types';
import { PageHeader } from '@/components/page-header';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const TWEEN_FACTOR_BASE = 0.52;
/** Max viewport-level rotateX during scroll (degrees). Subtle — above 6 causes nausea. */
const PERSPECTIVE_MAX_DEG = 4;
/** Milliseconds after scroll stops before metadata fades in. */
const META_REVEAL_DELAY = 0;
/** Scroll-stop detection window (ms). */
const SCROLL_STOP_MS = 0;

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

const numberWithinRange = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

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

  // ── Embla Setup ──────────────────────────────────────────────────────────────
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: false,
    align: 'center',
    dragFree: false,
    skipSnaps: false,
  });

  // ── Refs: Tween ──────────────────────────────────────────────────────────────
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);
  const metaNodes = useRef<HTMLElement[]>([]);
  const listenForScrollRef = useRef(true);
  const hasMoreToLoadRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // ── Refs: Perspective & scroll tracking ─────────────────────────────────────
  /** Carousel section div — receives viewport-level rotateX during scroll. */
  const perspectiveWrapRef = useRef<HTMLDivElement | null>(null);
  /** Last known scroll progress for per-frame velocity calculation. */
  const prevScrollProgressRef = useRef(0);
  /** Debounce timer for scroll-stop detection. */
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Delay timer before metadata fades in after scroll stops. */
  const metaRevealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** True while the user is actively scrolling. */
  const isScrollingRef = useRef(false);

  // ── Refs: Book opening animation ─────────────────────────────────────────────
  /** True while the book-click animation is in flight — freezes tweenScale. */
  const isBookOpeningRef = useRef(false);

  // ── Embla: node / factor helpers ────────────────────────────────────────────
  const setTweenNodes = useCallback((api: EmblaCarouselType) => {
    tweenNodes.current = api
      .slideNodes()
      .map(n => n.querySelector('.embla__slide__inner') as HTMLElement);
    metaNodes.current = api.slideNodes().map(n => {
      const el = n.querySelector('.slide-metadata') as HTMLElement;
      // CSS transitions for opacity (reveal) and transform (translateY) on meta
      if (el) el.style.transition = 'opacity 400ms ease, transform 300ms ease';
      return el;
    });
  }, []);

  const setTweenFactor = useCallback((api: EmblaCarouselType) => {
    tweenFactor.current = TWEEN_FACTOR_BASE * api.scrollSnapList().length;
  }, []);

  // ── Embla: per-frame tween (scale + opacity + rotateX + perspective tilt) ───
  const tweenScale = useCallback((api: EmblaCarouselType, eventName?: EmblaEventType) => {
    // Freeze all DOM writes while book-open animation is in flight
    if (isBookOpeningRef.current) return;

    const engine = api.internalEngine();
    const scrollProgress = api.scrollProgress();
    const slidesInView = api.slidesInView();
    const isScrollEvent = eventName === 'scroll';

    // ── Viewport-level perspective tilt ──────────────────────────────────
    // Driven by scroll velocity (progress delta between frames).
    // Scrolling DOWN  → top wider, bottom narrower (rotateX negative)
    // Scrolling UP    → bottom wider, top narrower (rotateX positive)
    // CSS transition is REMOVED during active scroll so each frame snaps;
    // it's restored by handleScrollStop for the smooth return to neutral.
    if (isScrollEvent && perspectiveWrapRef.current) {
      const velocity = scrollProgress - prevScrollProgressRef.current;
      const angle = numberWithinRange(-velocity * 600, -PERSPECTIVE_MAX_DEG, PERSPECTIVE_MAX_DEG);
      perspectiveWrapRef.current.style.transition = 'none';
      perspectiveWrapRef.current.style.transform = `rotateX(${angle}deg)`;
    }
    prevScrollProgressRef.current = scrollProgress;

    // ── Per-slide scale / opacity / rotateX / blur ───────────────────────
    api.scrollSnapList().forEach((scrollSnap, snapIndex) => {
      const diffToTarget = scrollSnap - scrollProgress;
      const slidesInSnap = engine.slideRegistry[snapIndex];

      slidesInSnap.forEach(slideIndex => {
        if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

        const tweenNode = tweenNodes.current[slideIndex];
        if (!tweenNode) return;

        const tweenValue = 1 - Math.abs(diffToTarget * tweenFactor.current);
        const scale = numberWithinRange(tweenValue, 0, 1);
        const slideScale = numberWithinRange(0.65 + scale * 0.35, 0.65, 1.0);
        const slideOpacity = numberWithinRange(0.07 + scale * 0.93, 0.07, 1.0);
        // Signed rotateX — slides above tilt back (−), slides below tilt forward (+)
        const rotateXDeg = Math.sign(diffToTarget) * (1 - scale) * 22;
        const brightness = 0.12 + scale * 0.88;
        const blurPx = (1 - scale) * 8;

        tweenNode.style.transform = `perspective(600px) scale(${slideScale}) rotateX(${rotateXDeg}deg)`;
        tweenNode.style.opacity = String(slideOpacity);
        tweenNode.style.filter =
          scale > 0.97 ? 'none' : `brightness(${brightness}) blur(${blurPx}px)`;

        // translateY on metadata — opacity is managed by the scroll system, NOT here
        const metaNode = metaNodes.current[slideIndex];
        if (metaNode) {
          metaNode.style.transform = `translateY(${(1 - scale) * 24}px)`;
        }
      });
    });
  }, []);

  // ── Scroll stop handler ──────────────────────────────────────────────────────
  // Called ~150ms after the last scroll event. Restores perspective and
  // schedules the metadata fade-in after an intentional pause.
  const handleScrollStop = useCallback(() => {
    isScrollingRef.current = false;

    // Restore perspective tilt with an ease-out transition
    if (perspectiveWrapRef.current) {
      perspectiveWrapRef.current.style.transition = 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)';
      perspectiveWrapRef.current.style.transform = 'none';
    }

    // Reveal metadata after intentional delay — if scroll resumes, this is cancelled
    if (metaRevealTimerRef.current) clearTimeout(metaRevealTimerRef.current);
    metaRevealTimerRef.current = setTimeout(() => {
      metaNodes.current.forEach(node => {
        if (node) node.style.opacity = '1';
      });
    }, META_REVEAL_DELAY);
  }, []);

  // ── Embla: scroll handler (meta hide + infinite load) ───────────────────────
  const onScroll = useCallback(
    (api: EmblaCarouselType) => {
      // ── Meta visibility ────────────────────────────────────────────────────
      const wasScrolling = isScrollingRef.current;
      isScrollingRef.current = true;

      metaNodes.current.forEach(node => {
        if (!node) return;
        if (!wasScrolling) {
          // First scroll event of a gesture: suppress transition for instant hide
          const saved = node.style.transition;
          node.style.transition = 'none';
          node.style.opacity = '0';
          requestAnimationFrame(() => {
            if (node) node.style.transition = saved;
          });
        } else {
          node.style.opacity = '0';
        }
      });

      // Cancel any pending meta reveal (scroll resumed before delay completed)
      if (metaRevealTimerRef.current) {
        clearTimeout(metaRevealTimerRef.current);
        metaRevealTimerRef.current = null;
      }

      // Re-arm scroll-stop detection
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
      scrollStopTimerRef.current = setTimeout(handleScrollStop, SCROLL_STOP_MS);

      // ── Infinite scroll ────────────────────────────────────────────────────
      if (!listenForScrollRef.current || !hasMoreToLoadRef.current) return;

      const lastSlide = api.slideNodes().length - 1;
      const lastSlideInView = api.slidesInView().includes(lastSlide);

      if (lastSlideInView && !loadingMoreRef.current) {
        listenForScrollRef.current = false;
        loadingMoreRef.current = true;
        fetchNextPage();
      }
    },
    [fetchNextPage, handleScrollStop]
  );

  // ── Embla: engine reload on slide addition ────────────────────────────────
  const onSlideChanges = useCallback((api: EmblaCarouselType) => {
    const reloadEmbla = () => {
      const oldEngine = api.internalEngine();
      api.reInit();
      const newEngine = api.internalEngine();

      const copyModules = [
        'scrollBody',
        'location',
        'offsetLocation',
        'previousLocation',
        'target',
      ] as const;
      copyModules.forEach(m => {
        Object.assign(newEngine[m], oldEngine[m]);
      });

      newEngine.translate.to(oldEngine.location.get());
      const { index } = newEngine.scrollTarget.byDistance(0, false);
      newEngine.index.set(index);
      newEngine.animation.start();

      loadingMoreRef.current = false;
      listenForScrollRef.current = true;
    };

    const engine = api.internalEngine();
    if (hasMoreToLoadRef.current && engine.dragHandler.pointerDown()) {
      api.on('pointerUp', reloadEmbla);
    } else {
      reloadEmbla();
    }
  }, []);

  // ── Embla: focused slide tracking ────────────────────────────────────────
  const onSelect = useCallback((api: EmblaCarouselType) => {
    setFocusedIndex(api.selectedScrollSnap());
  }, []);

  // ── Book-click: 3-phase cinematic animation ───────────────────────────────
  // Phase 1 (0–180ms)  : book shrinks — tactile press feedback
  // Phase 2 (180–620ms): book expands with rightward rotateY — book-opening 3D
  // Phase 3 (550ms+)   : background fills screen → navigate
  const handleBookClick = useCallback(
    (e: React.MouseEvent, recordId: string, slideIdx: number) => {
      e.preventDefault();
      if (isBookOpeningRef.current) return;
      isBookOpeningRef.current = true;

      const slideInner = tweenNodes.current[slideIdx];
      const metaNode = metaNodes.current[slideIdx];

      // Blur and fade every slide that isn't being opened
      tweenNodes.current.forEach((node, i) => {
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

  // ── Embla: initialization & event binding ────────────────────────────────
  useEffect(() => {
    if (!emblaApi) return;

    setTweenNodes(emblaApi);
    setTweenFactor(emblaApi);
    tweenScale(emblaApi);

    emblaApi
      .on('reInit', setTweenNodes)
      .on('reInit', setTweenFactor)
      .on('reInit', tweenScale)
      .on('scroll', tweenScale)
      .on('slideFocus', tweenScale)
      .on('scroll', onScroll)
      .on('slidesChanged', onSlideChanges)
      .on('select', onSelect);

    return () => {
      emblaApi
        .off('reInit', setTweenNodes)
        .off('reInit', setTweenFactor)
        .off('reInit', tweenScale)
        .off('scroll', tweenScale)
        .off('slideFocus', tweenScale)
        .off('scroll', onScroll)
        .off('slidesChanged', onSlideChanges)
        .off('select', onSelect);
    };
  }, [emblaApi, tweenScale, onScroll, onSlideChanges, onSelect, setTweenNodes, setTweenFactor]);

  // ── Timer cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
      if (metaRevealTimerRef.current) clearTimeout(metaRevealTimerRef.current);
    };
  }, []);

  // ── Sync hasNextPage to ref ──────────────────────────────────────────────
  useEffect(() => {
    hasMoreToLoadRef.current = !!hasNextPage;
  }, [hasNextPage]);

  // ── Background cross-fade management ─────────────────────────────────────
  const currentRecord = records[focusedIndex] ?? null;
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

      {/* ── Carousel section ────────────────────────────────────────────────────
          This div is the perspective-tilt target. During scroll, tweenScale
          applies rotateX here (no transition). On scroll stop, handleScrollStop
          restores it with an ease-out transition.
          `transformOrigin: center center` rotates around the visual midpoint. */}
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

                      {/* Metadata — opacity & translateY driven by scroll system */}
                      <div className="slide-metadata text-center space-y-3 max-w-xs sm:max-w-sm will-change-transform">
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

      {/* ── Pagination dots ────────────────────────────────────────────────────
      {records.length > 0 && (
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
      )} */}
    </>
  );
}
