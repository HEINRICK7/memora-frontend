import { MuralStudio } from "../../../../presentation/components/mural-studio";

export default async function ConfigureMuralPage({
  params,
}: {
  params: Promise<{ muralId: string }>;
}) {
  const { muralId } = await params;
  return <MuralStudio muralId={muralId} />;
}
