import { notFound } from "next/navigation";

import { getLabById, LABS } from "@/lib/labs";
import { LabDetail } from "@/components/labs/lab-detail";

export function generateStaticParams() {
  return LABS.map((lab) => ({ labId: lab.id }));
}

export default async function LabDetailPage({
  params,
}: {
  params: Promise<{ labId: string }>;
}) {
  const { labId } = await params;
  const lab = getLabById(labId);

  if (!lab) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Pass only the id (a plain string) across the server/client
          boundary — the full Lab object carries a `icon: LucideIcon`
          component reference, which React Server Components can't
          serialize into a Client Component prop. LabDetail resolves the
          rest client-side via getLabById, which is free (LABS is a
          static array bundled either way). */}
      <LabDetail labId={lab.id} />
    </div>
  );
}
