# Embla Implementation References

This document defines the external references to follow for key interaction behaviors.  
Actual implementation details must follow the official examples linked below.

---

## 1. Scale Animation Example

- Reference  
  https://codesandbox.io/p/sandbox/m8f6gy?file=%2Fsrc%2Fjs%2FEmblaCarousel.tsx%3A10%2C14

### Guideline

- Follow the official scale interpolation example.
- Use Embla’s `scroll` event and `scrollProgress()` for interpolation.
- Apply transform-based scaling directly to slide nodes.
- Extend the same interpolation logic for:
  - brightness / opacity
  - rotation (e.g., slight 3D effect)
  - depth illusion if needed

All animation must be derived from Embla’s internal progress — not from React state toggling.

---

## 2. Infinite Scroll Example

- Reference  
  https://codesandbox.io/p/sandbox/embla-carousel-infinite-scroll-react-forked-xrls94?file=%2Fsrc%2Fjs%2FEmblaCarousel.tsx%3A101%2C55

### Guideline

- Follow the official infinite scroll example.
- Implement data-based infinite loading (append new items when reaching the end).
- Guard against duplicate fetch calls.

---

All interactive behavior must align with Embla’s official patterns.
