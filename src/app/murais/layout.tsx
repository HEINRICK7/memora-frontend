import type { ReactNode } from "react";
import { AdminGate } from "../../presentation/components/admin-gate";

export default function PrivateMuralsLayout({ children }: { children: ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
