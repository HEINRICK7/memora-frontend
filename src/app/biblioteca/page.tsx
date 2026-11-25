import { PhotoLibrary } from "../../presentation/components/photo-library";
import { AdminGate } from "../../presentation/components/admin-gate";

export default function PhotoLibraryPage() {
  return <AdminGate><PhotoLibrary /></AdminGate>;
}
