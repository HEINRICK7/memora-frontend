import { ShareGrantsPanel } from "../../../../presentation/components/share-grants-panel";

export default async function ShareMuralPage({
  params,
  searchParams,
}: {
  params: Promise<{ muralId: string }>;
  searchParams?: Promise<{ gerarQr?: string }>;
}) {
  const queryPromise: Promise<{ gerarQr?: string }> = searchParams ?? Promise.resolve({});
  const [{ muralId }, query] = await Promise.all([
    params,
    queryPromise,
  ]);
  return <ShareGrantsPanel muralId={muralId} autoCreate={query.gerarQr === "1"} />;
}
