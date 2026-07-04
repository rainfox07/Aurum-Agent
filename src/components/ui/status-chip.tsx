import type { ReactNode } from "react";

export function StatusChip({ children }: { children: ReactNode }) {
  return <span className="chip">{children}</span>;
}

