import { BookmarksOverview } from "@/components/bookmarks/bookmarks-overview";

export default function BookmarksPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Bookmarks</h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          Labs you've saved for later.
        </p>
      </div>

      <BookmarksOverview />
    </div>
  );
}
