import type { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

interface SlideMetadataRevealProps {
  /** Drives visibility — carousel passes this; animation layer owns the motion. */
  isVisible: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Animation wrapper for carousel slide metadata (title, author, rating, dates).
 *
 * Decouples animation responsibility from carousel state: the carousel only
 * controls `isVisible`; all transform/opacity/easing logic lives here.
 *
 * Enter : slides up from y=12 and fades in (300ms, ease-out spring)
 * Exit  : slides down to y=8 and fades out (150ms, ease-in — fast to keep
 *         scroll feeling crisp)
 */
export function SlideMetadataReveal({ isVisible, className, children }: SlideMetadataRevealProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: 12, height: 0 }}
          animate={{
            opacity: 1,
            y: 0,
            height: 'auto',
            transition: {
              opacity: { duration: 0.35, ease: 'easeOut' },
              y: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
            },
          }}
          exit={{
            opacity: 0,
            y: 8,
            height: 0,
            transition: {
              opacity: { duration: 0.15, ease: 'easeIn' },
              y: { duration: 0.15, ease: 'easeIn' },
            },
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
