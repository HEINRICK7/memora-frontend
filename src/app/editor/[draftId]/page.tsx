import { CompositionEditor } from "../../../presentation/components/composition-editor";

type CompositionEditorPageProps = {
  params: Promise<{ draftId: string }>;
};

export default async function CompositionEditorPage({
  params,
}: CompositionEditorPageProps) {
  const { draftId } = await params;
  return <CompositionEditor draftId={draftId} />;
}
