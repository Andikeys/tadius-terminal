import { PlaygroundsGrid } from "@/components/playgrounds/playgrounds-grid";

export default function PlaygroundsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="flex items-baseline font-heading text-2xl font-bold text-white sm:text-3xl">
          Playgrounds
          <span
            aria-hidden="true"
            className="ml-1.5 inline-block h-6 w-[3px] animate-caret-blink bg-tadius-green-500 sm:h-7"
          />
        </h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          Launch isolated cloud environments.
        </p>
      </div>

      <PlaygroundsGrid />
    </div>
  );
}
