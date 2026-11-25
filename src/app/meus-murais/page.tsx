import { MyMurals } from "../../presentation/components/my-murals";
import { AdminGate } from "../../presentation/components/admin-gate";

export default function MyMuralsPage() {
  return <AdminGate><MyMurals /></AdminGate>;
}
