import type { CitationView, SelectedBookSourceView } from "@/lib/types";
import { StatusChip } from "@/components/ui/status-chip";

export function CitationPanel({
  selectedSources,
  citations,
}: {
  selectedSources: SelectedBookSourceView[];
  citations: CitationView[];
}) {
  return (
    <div style={{ display: "grid", gap: 32 }}>
      <section>
        <h2 className="meta" style={{ textTransform: "uppercase", margin: "0 0 14px" }}>
          自动选中的书
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          {selectedSources.length === 0 ? (
            <p className="muted label">具体问题会自动选 3 本书。</p>
          ) : (
            selectedSources.map((source) => (
              <div key={source.id} className="surface-card" style={{ padding: 14 }}>
                <div className="label" style={{ fontWeight: 700 }}>
                  {source.title}
                </div>
                <div className="meta" style={{ marginTop: 4 }}>
                  {source.author}
                </div>
                {source.sourceRef ? (
                  <div className="meta" style={{ marginTop: 8 }}>
                    {source.sourceRef}
                  </div>
                ) : null}
                {source.relevanceReason ? (
                  <p className="muted" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "20px" }}>
                    {source.relevanceReason}
                  </p>
                ) : null}
                {source.quotedText ? (
                  <p className="quote-text muted" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "20px" }}>
                    "{source.quotedText}"
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="meta" style={{ textTransform: "uppercase", margin: "0 0 14px" }}>
          参考语料
        </h2>
        <div style={{ display: "grid", gap: 12 }}>
          {citations.length === 0 ? (
            <p className="muted label">有书籍参考时，这里会显示本次用到的语料。</p>
          ) : (
            citations.map((citation, index) => (
              <article key={citation.id} id={citation.id} className="surface-card" style={{ padding: 14 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <StatusChip>{index + 1}</StatusChip>
                  <strong className="label">{citation.title}</strong>
                </div>
                <p className="meta" style={{ margin: "0 0 8px" }}>
                  {citation.authorOrDomain} · {citation.sourceRef}
                </p>
                <p className="quote-text muted" style={{ margin: 0, fontSize: 13, lineHeight: "20px" }}>
                  "{citation.quotedText}"
                </p>
                {citation.relevanceReason ? (
                  <p className="muted" style={{ margin: "10px 0 0", fontSize: 13, lineHeight: "20px" }}>
                    {citation.relevanceReason}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
