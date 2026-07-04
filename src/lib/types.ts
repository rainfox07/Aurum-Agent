export type SourceType = "book" | "media";

export type BookSource = {
  id: string;
  type: "book";
  title: string;
  author: string;
  publisher: string;
  tags: string[];
  credibility: "High";
  updatedAt: string;
  summary: string;
};

export type MediaDomain = {
  id: string;
  domain: string;
  label: string;
};

export type SourceCandidate = {
  sourceId: string;
  type: "book";
  title: string;
  author: string;
  reason: string;
};

export type EvidenceItem = {
  evidenceId: string;
  sourceId: string;
  title: string;
  authorOrDomain: string;
  sourceRef: string;
  quotedText: string;
  relevanceReason?: string;
  url?: string;
};

export type CitationView = EvidenceItem & {
  id: string;
};

export type SelectedBookSourceView = {
  id: string;
  title: string;
  author: string;
  sourceRef?: string;
  quotedText?: string;
  relevanceReason?: string;
};

export type BookMirrorView = {
  sourceId: string;
  title: string;
  author: string;
  sourceRef?: string;
  quotedText?: string;
  conversationId?: string;
  branchId?: string;
};

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  citations?: CitationView[];
  selectedBooks?: SelectedBookSourceView[];
  bookMirror?: BookMirrorView;
  lowConfidence?: boolean;
  aiMode?: "live" | "mock";
  model?: string;
  warning?: string;
  createdAt: string;
};

export type PendingQuestion = {
  id: string;
  conversationId: string;
  branchId: string;
  question: string;
  createdAt: string;
};

export type MemoryStatus = "suggested" | "active" | "deleted";
export type MemoryCategory = "profile" | "preference" | "instruction";

export type MemoryView = {
  id: string;
  status: MemoryStatus;
  category: MemoryCategory;
  content: string;
  updatedAt: string;
};

export type BranchNodeView = {
  id: string;
  title: string;
  parentBranchId: string | null;
  forkedFromMessageId: string | null;
};

export type SidechatView = {
  id: string;
  title: string;
  anchorMessageId: string;
  messages: ChatMessageView[];
};

export type ConversationView = {
  id: string;
  title: string;
  updatedAt: string;
  branches: BranchNodeView[];
  sidechats: SidechatView[];
  messages: ChatMessageView[];
};
