import { ChallengesOverview } from "@/components/challenges/challenges-overview";

export default function ChallengesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Challenges</h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          Every checkpoint, across every Lab, in one place.
        </p>
      </div>

      <ChallengesOverview />
    </div>
  );
}
