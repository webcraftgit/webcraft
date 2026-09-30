import { notFound } from "next/navigation";
import { loadPortal } from "@/lib/portal/data";
import IntakeForm from "@/components/portal/IntakeForm";

export const dynamic = "force-dynamic"; // per-client data behind a secret: never cache

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await loadPortal(token);
  // Unknown, malformed, revoked and archived links all look the same.
  if (!portal) notFound();

  return <IntakeForm token={token} portal={portal} />;
}
