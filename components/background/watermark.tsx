/**
 * Oversized, low-opacity "TADIUS" wordmark behind all page content.
 * Server component (no interactivity needed) — purely decorative,
 * `aria-hidden` and `select-none` so it never interferes with a11y tree
 * or accidental text selection.
 *
 * Sizing uses clamp() so it scales down gracefully on small viewports
 * instead of overflowing / forcing horizontal scroll (parent has
 * overflow-x hidden as a second safety net, see globals.css).
 */
export function Watermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center select-none"
    >
      <span
        className="whitespace-nowrap font-heading font-extrabold tracking-tight text-white/[0.06]"
        style={{
          fontSize: "clamp(6rem, 22vw, 22rem)",
          filter: "drop-shadow(0 0 55px rgba(34,197,94,0.25))",
        }}
      >
        TADIUS
      </span>
    </div>
  );
}
