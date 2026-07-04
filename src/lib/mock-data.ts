import type {
  BookSource,
  BranchNodeView,
  ChatMessageView,
  CitationView,
  ConversationView,
  EvidenceItem,
  MediaDomain,
  MemoryView,
  PendingQuestion,
  SidechatView,
  SourceCandidate
} from "@/lib/types";

const now = () => new Date().toISOString();

export const bookSources: BookSource[] = [
  {
    id: "principles",
    type: "book",
    title: "Principles",
    author: "Ray Dalio",
    publisher: "Simon & Schuster",
    tags: ["Decision Making", "Principles", "Management"],
    credibility: "High",
    updatedAt: "2026-06-26",
    summary:
      "A practical framework for explicit principles, decision logs, and repeated feedback loops."
  },
  {
    id: "thinking-fast-slow",
    type: "book",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    publisher: "Farrar, Straus and Giroux",
    tags: ["Cognitive Science", "Bias", "Judgment"],
    credibility: "High",
    updatedAt: "2026-06-25",
    summary:
      "A foundational text on System 1, System 2, bias, framing, and probabilistic judgment."
  },
  {
    id: "poor-charlies-almanack",
    type: "book",
    title: "Poor Charlie's Almanack",
    author: "Charlie Munger",
    publisher: "Stripe Press",
    tags: ["Mental Models", "Investing", "Judgment"],
    credibility: "High",
    updatedAt: "2026-06-22",
    summary:
      "A collection of multidisciplinary mental models for clearer reasoning and better choices."
  }
];

export const mediaDomains: MediaDomain[] = [
  { id: "ft", domain: "ft.com", label: "Financial Times" },
  { id: "mit", domain: "technologyreview.com", label: "MIT Technology Review" }
];

export const activeMemories: MemoryView[] = [
  {
    id: "mem-1",
    status: "active",
    category: "preference",
    content: "The user prefers concise answers with clear source hierarchy.",
    updatedAt: "2026-06-29"
  },
  {
    id: "mem-2",
    status: "active",
    category: "profile",
    content: "The user is building Aurum Agent as a source-centric knowledge agent.",
    updatedAt: "2026-06-30"
  }
];

export const suggestedMemories: MemoryView[] = [
  {
    id: "mem-s1",
    status: "suggested",
    category: "instruction",
    content: "Prefer Chinese labels in product planning documents.",
    updatedAt: "2026-06-30"
  }
];

export const seedMessages: ChatMessageView[] = [
  {
    id: "msg-1",
    role: "user",
    content: "关于决策过程，这些书籍有什么建议？",
    createdAt: "2026-06-30T10:42:00.000Z"
  },
  {
    id: "msg-2",
    role: "assistant",
    content:
      "这些书共同强调：先把判断过程显性化，再用可复盘的原则和反偏见机制修正直觉。[^ev_1]\n\n实际执行时，可以把重要决策拆成假设、证据、反证和复盘四个部分，避免只凭当下确信感行动。[^ev_2]",
    createdAt: "2026-06-30T10:43:00.000Z",
    citations: [
      {
        id: "cite-1",
        evidenceId: "ev_1",
        sourceId: "principles",
        title: "Principles",
        authorOrDomain: "Ray Dalio",
        sourceRef: "Part II, Life Principles",
        quotedText:
          "Use principles as explicit decision rules that can be tested against reality."
      },
      {
        id: "cite-2",
        evidenceId: "ev_2",
        sourceId: "thinking-fast-slow",
        title: "Thinking, Fast and Slow",
        authorOrDomain: "Daniel Kahneman",
        sourceRef: "Chapter 3, The Lazy Controller",
        quotedText:
          "Slow reasoning helps check intuitive conclusions when stakes are high."
      }
    ]
  }
];

export const branches: BranchNodeView[] = [
  {
    id: "branch-main",
    title: "Main Branch",
    parentBranchId: null,
    forkedFromMessageId: null
  },
  {
    id: "branch-compare",
    title: "Compare Mental Models",
    parentBranchId: "branch-main",
    forkedFromMessageId: "msg-2"
  }
];

export const sidechats: SidechatView[] = [
  {
    id: "side-1",
    title: "Bias follow-up",
    anchorMessageId: "msg-2",
    messages: [
      {
        id: "side-msg-1",
        role: "user",
        content: "这里的偏见主要指什么？",
        createdAt: "2026-06-30T10:45:00.000Z"
      },
      {
        id: "side-msg-2",
        role: "assistant",
        content: "主要是过度自信、可得性偏差和锚定效应。[^ev_2]",
        createdAt: "2026-06-30T10:45:10.000Z"
      }
    ]
  }
];

export const conversations: ConversationView[] = [
  {
    id: "conv-1",
    title: "关于决策过程的书籍研究",
    updatedAt: "2026-06-30T10:45:10.000Z",
    branches,
    sidechats,
    messages: seedMessages
  }
];

const pendingQuestions = new Map<string, PendingQuestion>();

export function listBookCandidates(question: string): SourceCandidate[] {
  const normalizedQuestion = question.toLowerCase();
  const scored = bookSources.map((book) => {
    const tagHit = book.tags.some((tag) => normalizedQuestion.includes(tag.toLowerCase()));
    const decisionHit = /decision|判断|决策|bias|偏见|原则/.test(normalizedQuestion);
    return {
      book,
      score: (tagHit ? 2 : 0) + (decisionHit ? 1 : 0)
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ book }) => ({
      sourceId: book.id,
      type: "book",
      title: book.title,
      author: book.author,
      reason: `${book.title} contains relevant ideas on ${book.tags.slice(0, 2).join(" and ")}.`
    }));
}

export function createPendingQuestion(question: string): {
  pendingQuestionId: string;
  conversationId: string;
  branchId: string;
  candidates: SourceCandidate[];
} {
  const pendingQuestionId = `pq-${Date.now()}`;
  const pending: PendingQuestion = {
    id: pendingQuestionId,
    conversationId: "conv-1",
    branchId: "branch-main",
    question,
    createdAt: now()
  };
  pendingQuestions.set(pendingQuestionId, pending);
  return {
    pendingQuestionId,
    conversationId: pending.conversationId,
    branchId: pending.branchId,
    candidates: listBookCandidates(question)
  };
}

export function getPendingQuestion(id: string): PendingQuestion | undefined {
  return pendingQuestions.get(id);
}

export function buildEvidence(selectedBookSourceIds: string[]): EvidenceItem[] {
  return selectedBookSourceIds
    .map((sourceId, index): EvidenceItem | null => {
      const source = bookSources.find((book) => book.id === sourceId);
      if (!source) {
        return null;
      }

      const sourceRef =
        source.id === "principles"
          ? "Part II, Life Principles"
          : source.id === "thinking-fast-slow"
            ? "Chapter 3, The Lazy Controller"
            : "Talk Two, A Lesson on Elementary Worldly Wisdom";

      const quotedText =
        source.id === "principles"
          ? "Make decisions from explicit principles and compare outcomes against reality."
          : source.id === "thinking-fast-slow"
            ? "Deliberate reasoning is needed when intuitive judgment may be biased."
            : "Use multiple mental models so one narrow lens does not dominate judgment.";

      return {
        evidenceId: `ev_${index + 1}`,
        sourceId: source.id,
        title: source.title,
        authorOrDomain: source.author,
        sourceRef,
        quotedText
      };
    })
    .filter((item): item is EvidenceItem => item !== null);
}

export function buildGroundedAnswer(question: string, evidence: EvidenceItem[]): {
  markdown: string;
  citations: CitationView[];
} {
  if (evidence.length === 0) {
    return {
      markdown: "I don't have enough source evidence to answer this.",
      citations: []
    };
  }

  const primary = evidence[0];
  const secondary = evidence[1] ?? evidence[0];
  const markdown = [
    `基于《${primary.title}》，Aurum 会先把判断从“感觉正确”转成可复盘的原则和证据清单，再根据结果修正原则本身。[^${primary.evidenceId}]`,
    `结合《${secondary.title}》，高风险决策需要刻意放慢：列出假设、反证、替代解释和复盘时间，避免直觉偏见直接控制结论。[^${secondary.evidenceId}]`
  ].join("\n\n");

  return {
    markdown,
    citations: evidence.map((item, index) => ({
      ...item,
      id: `cite-${index + 1}`
    }))
  };
}

export function normalizeDomain(input: string): string {
  const withProtocol = input.includes("://") ? input : `https://${input}`;
  const url = new URL(withProtocol);
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (!hostname.includes(".") || hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    throw new Error("Invalid media domain");
  }

  return hostname;
}

