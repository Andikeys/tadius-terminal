import { SettingsOverview } from "@/components/settings/settings-overview";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">Settings</h1>
        <p className="font-body text-sm font-medium text-tadius-green-500">
          Your profile, notifications, and session.
        </p>
      </div>

      <SettingsOverview />
    </div>
  );
}
