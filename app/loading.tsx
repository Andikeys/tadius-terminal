/** Shown by Next.js during route navigation (App Router Suspense boundary,
 * applies to every page under this root). Most Tadius pages resolve near-
 * instantly since they read from in-memory data, so this mostly appears as
 * a brief, branded flash rather than a long wait — but it's there the
 * moment any route does real work. */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-tadius-green-500/25 border-t-tadius-green-500" />
        <p className="font-mono text-xs text-tadius-gray-dim">loading...</p>
      </div>
    </div>
  );
}
