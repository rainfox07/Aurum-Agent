import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "end", marginBottom: 40 }}>
      <div>
        <h1 className="display-title">{title}</h1>
        {description ? (
          <p className="muted" style={{ maxWidth: 640, margin: "10px 0 0", fontSize: 16, lineHeight: "26px" }}>
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}

