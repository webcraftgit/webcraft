import { notFound } from "next/navigation";
import { loadPortal } from "@/lib/portal/data";
import IntakeForm from "@/components/portal/IntakeForm";
import ProjectView from "@/components/portal/ProjectView";

export const dynamic = "force-dynamic"; // per-client data behind a secret: never cache

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const portal = await loadPortal(token);
  // Unknown, malformed, revoked and archived links all look the same.
  if (!portal) notFound();

  // Questionnaire first. Once it's sent, the portal becomes the project page:
  // the clock, the stages and any checkpoint waiting for review.
  if (portal.status === "intake") return <IntakeForm token={token} portal={portal} />;
  return <ProjectView token={token} portal={portal} now={new Date().toISOString()} />;
}
