import { ContributionQueue } from "../../../../presentation/components/contribution-queue";

export default async function ContributionsPage({
  params,
}: {
  params: Promise<{ muralId: string }>;
}) {
  const { muralId } = await params;
  return <ContributionQueue muralId={muralId} />;
}
