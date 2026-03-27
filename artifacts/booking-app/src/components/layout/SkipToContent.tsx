/**
 * Accessibility: Skip-to-content link.
 * Visually hidden until focused via keyboard Tab.
 * Each page layout must have an element with id="main-content".
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-3 left-3 z-[9999]
        px-4 py-2 rounded-lg
        bg-primary text-primary-foreground
        text-sm font-bold
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background
        transition-all duration-150
      "
    >
      Skip to main content
    </a>
  );
}
