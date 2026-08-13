import { ProgressOverview } from "@/components/progress/progress-overview";

export default function ProgressPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Progress</h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          Driven by what you actually launch and complete.
        </p>
      </div>

      <ProgressOverview />
    </div>
  );
}
