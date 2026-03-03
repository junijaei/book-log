import { useState, useEffect } from 'react';

export interface CoverLuminanceResult {
  /** Perceived average luminance, 0 (darkest) → 1 (lightest). */
  luminance: number;
  /** true when luminance > 0.5. */
  isLight: boolean;
  /** true when luminance ≤ 0.5. */
  isDark: boolean;
  /**
   * false until the first successful pixel read completes.
   * Stays false when CORS blocks pixel access — callers should
   * treat the result as unknown and fall back to a safe default.
   */
  isResolved: boolean;
}

const NEUTRAL: CoverLuminanceResult = {
  luminance: 0.5,
  isLight: false,
  isDark: false,
  isResolved: false,
};

/**
 * Estimates the average perceived luminance of a book cover image.
 *
 * Draws the cover into an off-screen 80×80 canvas and computes the
 * WCAG relative-luminance formula (L = 0.2126R + 0.7152G + 0.0722B)
 * averaged across all sampled pixels.
 *
 * Requires `crossOrigin="anonymous"` support from the image host.
 * Falls back to {@link NEUTRAL} (isResolved = false) when CORS blocks
 * pixel access — callers should handle this gracefully.
 *
 * @param imageUrl - The cover image URL to sample. Accepts null/undefined
 *                   (resets to NEUTRAL and skips the canvas read).
 */
export function useCoverLuminance(imageUrl: string | null | undefined): CoverLuminanceResult {
  const [result, setResult] = useState<CoverLuminanceResult>(NEUTRAL);

  useEffect(() => {
    if (!imageUrl) {
      setResult(NEUTRAL);
      return;
    }

    let cancelled = false;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;

      try {
        const W = 80;
        const H = 80;

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, W, H);

        const { data } = ctx.getImageData(0, 0, W, H);

        let r = 0;
        let g = 0;
        let b = 0;
        const pixels = W * H;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        // WCAG relative luminance, normalised to [0, 1]
        const luminance =
          (0.2126 * (r / pixels) + 0.7152 * (g / pixels) + 0.0722 * (b / pixels)) / 255;

        if (!cancelled) {
          setResult({
            luminance,
            isLight: luminance > 0.5,
            isDark: luminance <= 0.5,
            isResolved: true,
          });
        }
      } catch {
        // CORS-blocked — keep NEUTRAL (isResolved stays false)
      }
    };

    img.onerror = () => {
      if (!cancelled) setResult(NEUTRAL);
    };

    // Assign src last so the handlers are already attached
    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return result;
}
