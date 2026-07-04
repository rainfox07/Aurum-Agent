import type { PresetBookEvidenceItem } from "@/lib/books/book-evidence";

export function buildPresetBookAnswerMessages({
  question,
  evidence
}: {
  question: string;
  evidence: PresetBookEvidenceItem[];
}) {
  return [
    {
      role: "system" as const,
      content: [
        "You are Aurum Agent, a relaxed Chinese book-grounded assistant.",
        "",
        "Your task:",
        "1. 用中文回答。",
        "2. 只参考 evidence block 里的三本书，不要引入别的书或来源。",
        "3. 这是一个大问题回答场景；语气轻松一点，像普通聊天，不要写成论文、报告或严肃项目分析。",
        "4. 不要输出 citation marker，不要写 [^book_1]、[^book_2]、[^book_3]。",
        "5. 不要编造页码、章节、引用或书里没有的信息。",
        "6. 回答要分别提到三本书，可以用“《书名》会觉得...”这种自然表达。",
        "7. 每提到一本书后，立刻用 Markdown blockquote 放一段对应 Long Excerpt，格式是：> 摘录（位置：书中部分）：...。",
        "8. 每段摘录必须保留 evidence 里的 **加粗重点**，并写出 Source Ref 作为位置。",
        "9. 控制在 4-8 个短段落以内。"
      ].join("\n")
    },
    {
      role: "user" as const,
      content: [
        "User question:",
        question,
        "",
        "Selected preset books:",
        buildEvidenceBlock(evidence),
        "",
        "Required output format:",
        "",
        `《${evidence[0]?.title ?? "书名"}》会觉得：...`,
        `> 摘录（位置：${evidence[0]?.sourceRef ?? "书中部分"}）：${evidence[0]?.quotedTexts[0] ?? "..."}`,
        "",
        `《${evidence[1]?.title ?? "书名"}》会补充：...`,
        `> 摘录（位置：${evidence[1]?.sourceRef ?? "书中部分"}）：${evidence[1]?.quotedTexts[0] ?? "..."}`,
        "",
        `《${evidence[2]?.title ?? "书名"}》会从另一个角度提醒：...`,
        `> 摘录（位置：${evidence[2]?.sourceRef ?? "书中部分"}）：${evidence[2]?.quotedTexts[0] ?? "..."}`,
        "",
        "合起来看：..."
      ].join("\n")
    }
  ];
}

function buildEvidenceBlock(evidence: PresetBookEvidenceItem[]) {
  return evidence
    .map((item, index) =>
      [
        `${index + 1}. Evidence ID: ${item.evidenceId}`,
        `   Source ID: ${item.sourceId}`,
        `   Title: ${item.title}`,
        `   Author: ${item.author}`,
        `   Source Ref: ${item.sourceRef}`,
        `   Relevance Reason: ${item.relevanceReason}`,
        "   Long Excerpt:",
        ...item.quotedTexts.map((quote) => `   - ${quote}`)
      ].join("\n")
    )
    .join("\n\n");
}
