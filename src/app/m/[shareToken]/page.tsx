import type { Metadata } from "next";
import { SharedMuralView } from "../../../presentation/components/shared-mural-view";

export const metadata: Metadata = {
  title: "Memora",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export const dynamic = "force-dynamic";

export default async function SharedMuralPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  return <SharedMuralView shareToken={shareToken} />;
}
