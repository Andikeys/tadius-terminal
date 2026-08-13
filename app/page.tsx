import { DashboardGreeting } from "@/components/dashboard/dashboard-greeting";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { DashboardTerminal } from "@/components/terminal/dashboard-terminal";
import { DevOpsDock } from "@/components/dock/devops-dock";

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <DashboardGreeting />

      <StatsGrid />

      <DashboardTerminal />

      <DevOpsDock />
    </div>
  );
}
