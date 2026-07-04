import type { EvidenceItem } from "@/lib/types";

export function buildEvidenceBlock(evidence: EvidenceItem[]) {
  return evidence
    .map(
      (item) => [
        `Evidence ID: ${item.evidenceId}`,
        `Source: ${item.title}`,
        `Author/Domain: ${item.authorOrDomain}`,
        `Source Ref: ${item.sourceRef}`,
        `Quote: ${item.quotedText}`
      ].join("\n")
    )
    .join("\n\n---\n\n");
}

export function buildGroundedAnswerMessages({
  question,
  evidence,
  memoryContext
}: {
  question: string;
  evidence: EvidenceItem[];
  memoryContext?: string;
}) {
  return [
    {
      role: "system" as const,
      content: [
        "You are Aurum Agent, a source-centric knowledge assistant.",
        "Answer only from the provided evidence.",
        "Every non-empty paragraph must include at least one citation marker in the exact format [^ev_1].",
        "Only use evidence IDs that appear in the evidence block.",
        "If the evidence is insufficient, answer exactly: I don't have enough source evidence to answer this.",
        "Do not invent sources, page numbers, citations, or quotes.",
        memoryContext ? `User memory:\n${memoryContext}` : ""
      ]
        .filter(Boolean)
        .join("\n")
    },
    {
      role: "user" as const,
      content: [`Question: ${question}`, "Evidence:", buildEvidenceBlock(evidence)].join("\n\n")
    }
  ];
}

export function buildAuthorModeMessages({
  author,
  title,
  userMessage,
  evidence
}: {
  author: string;
  title: string;
  userMessage: string;
  evidence: EvidenceItem[];
}) {
  return [
    {
      role: "system" as const,
      content: [
        `你是“书镜：AI 模拟作者”，以《${title}》作为入口来模拟 ${author} 的写作风格、思考方式和表达倾向。`,
        `不要声称自己是真实的 ${author}。`,
        "不要把作者困在这一本书里；像一个活的思想者一样回答用户当前的问题。",
        "可以结合该作者更广泛的思想、语气、判断方式和表达习惯，给出具体、自然、有行动感的回答。",
        "选中的书只是背景和入口，不是唯一边界。",
        "不要每段强制 citation，也不要为了 citation 硬塞引用。",
        "只有当你明确引用 evidence block 中的文本时，才附 citation marker，例如 [^ev_1]。",
        "不要编造精确书名、页码、引文或事实。"
      ].join("\n")
    },
    {
      role: "user" as const,
      content: [`User message: ${userMessage}`, "Evidence:", buildEvidenceBlock(evidence)].join("\n\n")
    }
  ];
}
