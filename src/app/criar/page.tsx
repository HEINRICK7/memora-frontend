import { MyMurals } from "../../presentation/components/my-murals";
import { AdminGate } from "../../presentation/components/admin-gate";

export default function CreateMuralPage() {
  return <AdminGate><MyMurals mode="create" /></AdminGate>;
}
