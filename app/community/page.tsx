import { Users, MessageSquare, Rocket } from "lucide-react";

/**
 * Honest placeholder, not a fabricated feed — a real community feature
 * (discussions, profiles, moderation) needs backend infrastructure this
 * pass doesn't build. This still ships real, on-brand design rather than
 * a bare 404, and says plainly what's not here yet.
 */
export default function CommunityPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Community</h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          Where Tadius learners will connect.
        </p>
      </div>

      <div className="glass-panel flex flex-col items-center gap-4 rounded-xl p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tadius-green-500/10 ring-1 ring-tadius-green-500/30">
          <Users className="h-6 w-6 text-tadius-green-500" strokeWidth={2} />
        </div>
        <div className="max-w-md space-y-1.5">
          <p className="font-heading text-base font-semibold text-white">
            Community is still in the workshop
          </p>
          <p className="font-body text-sm leading-relaxed text-tadius-gray-muted">
            Discussions, profiles, and shared solutions need real backend infrastructure —
            accounts, moderation, storage — that hasn&apos;t been built yet. Rather than fake a
            feed here, we&apos;re leaving this honest until it&apos;s real.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-panel flex items-start gap-3 rounded-xl p-4">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-tadius-gray-muted" strokeWidth={2} />
          <p className="font-body text-xs leading-relaxed text-tadius-gray-muted">
            Planned: per-Lab discussion threads for getting unstuck.
          </p>
        </div>
        <div className="glass-panel flex items-start gap-3 rounded-xl p-4">
          <Rocket className="mt-0.5 h-4 w-4 shrink-0 text-tadius-gray-muted" strokeWidth={2} />
          <p className="font-body text-xs leading-relaxed text-tadius-gray-muted">
            Planned: shared Playground setups and solutions from other learners.
          </p>
        </div>
      </div>
    </div>
  );
}
