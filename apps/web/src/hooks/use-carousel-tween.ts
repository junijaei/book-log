import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useNavigate } from '@tanstack/react-router';
import type { EmblaCarouselType, EmblaEventType } from 'embla-carousel';
import useEmblaCarousel from 'embla-carousel-react';

const TWEEN_FACTOR_BASE = 0.52;
/** Max viewport-level rotateX during scroll (degrees). Subtle — above 6 causes nausea. */
const PERSPECTIVE_MAX_DEG = 4;
/** Milliseconds after scroll stops before metadata fades in. */
const META_REVEAL_DELAY = 150;
/** Scroll-stop detection window (ms). */
const SCROLL_STOP_MS = 0;

const numberWithinRange = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

interface UseCarouselTweenOptions {
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
}

/**
 * Manages all Embla Carousel animation, tween, perspective, and infinite-scroll
 * logic for the My Books interactive carousel.
 *
 * Encapsulates embla setup, all animation refs, scroll-stop detection, metadata
 * reveal, and the 3-phase book-click cinematic animation.
 *
 * @param options.fetchNextPage - Called when the last slide enters view (infinite scroll)
 * @param options.hasNextPage   - Whether more pages are available from the query
 */
export function useCarouselTween({ fetchNextPage, hasNextPage }: UseCarouselTweenOptions) {
  const navigate = useNavigate();

  // ── Embla Setup ──────────────────────────────────────────────────────────────
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    loop: false,
    align: 'center',
    dragFree: false,
    skipSnaps: false,
  });

  const [focusedIndex, setFocusedIndex] = useState(0);
  /** Controls the full-screen fill overlay during book-open animation. */
  const [isBookOpening, setIsBookOpening] = useState(false);
  /** Controls metadata visibility — true when carousel is at rest, false while scrolling. */
  const [isMetaVisible, setIsMetaVisible] = useState(false);

  // ── Refs: Tween ──────────────────────────────────────────────────────────────
  const tweenFactor = useRef(0);
  const tweenNodes = useRef<HTMLElement[]>([]);
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
        const rotateXDeg = Math.sign(diffToTarget) * (1 - scale) * 30;
        const brightness = 0.12 + scale * 0.88;
        const blurPx = (1 - scale) * 8;

        tweenNode.style.transform = `perspective(300px) scale(${slideScale}) rotateX(${rotateXDeg}deg)`;
        tweenNode.style.opacity = String(slideOpacity);
        tweenNode.style.filter =
          scale > 0.97 ? 'none' : `brightness(${brightness}) blur(${blurPx}px)`;
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
      setIsMetaVisible(true);
    }, META_REVEAL_DELAY);
  }, []);

  // ── Embla: scroll handler (meta hide + infinite load) ───────────────────────
  const onScroll = useCallback(
    (api: EmblaCarouselType) => {
      // ── Meta visibility ────────────────────────────────────────────────────
      const wasScrolling = isScrollingRef.current;
      isScrollingRef.current = true;

      if (!wasScrolling) {
        // First scroll event of a gesture — instantly hide metadata via state
        setIsMetaVisible(false);
      }

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
    (e: MouseEvent, recordId: string, slideIdx: number) => {
      e.preventDefault();
      if (isBookOpeningRef.current) return;
      isBookOpeningRef.current = true;

      const slideInner = tweenNodes.current[slideIdx];
      const bookCover = slideInner?.querySelector('[data-type="book-cover"]') as HTMLElement | null;

      // Blur and fade every slide that isn't being opened
      tweenNodes.current.forEach((node, i) => {
        if (i !== slideIdx && node) {
          node.style.transition = 'filter 220ms ease, opacity 220ms ease';
          node.style.filter = 'blur(20px)';
          node.style.opacity = '0';
        }
      });

      // Phase 1: shrink (tactile press)
      if (bookCover) {
        bookCover.style.transition = 'transform 180ms cubic-bezier(0.4, 0, 1, 1)';
        bookCover.style.transformOrigin = 'center center';
        bookCover.style.transform = 'perspective(600px) scale(0.88)';
      }

      // Phase 2: expand + book-open rotateY
      // rotateY(-15deg) with center origin → right side swings toward viewer,
      // appearing larger than the left — simulates a book cover opening.
      setTimeout(() => {
        if (!bookCover) return;
        bookCover.style.transition = 'transform 440ms cubic-bezier(0.34, 1.56, 0.64, 1)';
        bookCover.style.transformOrigin = 'center center';
        bookCover.style.transform = 'perspective(400px) scale(1.08) rotateY(-15deg)';
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

  // ── Sync hasNextPage to ref ──────────────────────────────────────────────
  useEffect(() => {
    hasMoreToLoadRef.current = !!hasNextPage;
  }, [hasNextPage]);

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

    // Reveal metadata once the carousel has settled on mount
    const initTimer = setTimeout(() => setIsMetaVisible(true), 100);

    return () => {
      clearTimeout(initTimer);
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

  return {
    emblaRef,
    perspectiveWrapRef,
    focusedIndex,
    isBookOpening,
    isMetaVisible,
    handleBookClick,
  };
}

export type UseCarouselTweenReturn = ReturnType<typeof useCarouselTween>;
