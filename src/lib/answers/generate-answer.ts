import { createChatCompletion, isLiveLlmConfigured, LlmRequestError, type LlmConfigInput } from "@/lib/ai/chat-client";
import { CitationValidationError, validateCitedAnswer } from "@/lib/citation-validator";
import { buildGroundedAnswer as buildMockGroundedAnswer } from "@/lib/mock-data";
import type { CitationView, EvidenceItem } from "@/lib/types";
import { buildAuthorModeMessages, buildGroundedAnswerMessages } from "@/lib/answers/prompt";

export type AiMode = "live" | "mock";

export type GeneratedAnswer = {
  markdown: string;
  citations: CitationView[];
  aiMode: AiMode;
  model: string;
  warning?: string;
};

export async function generateGroundedAnswer({
  question,
  evidence,
  llmConfig
}: {
  question: string;
  evidence: EvidenceItem[];
  llmConfig?: LlmConfigInput;
}): Promise<GeneratedAnswer> {
  if (evidence.length === 0) {
    return {
      markdown: "I don't have enough source evidence to answer this.",
      citations: [],
      aiMode: "mock",
      model: "none",
      warning: "No source evidence was available."
    };
  }

  if (!isLiveLlmConfigured(llmConfig)) {
    const fallback = buildMockGroundedAnswer(question, evidence);
    return {
      ...fallback,
      aiMode: "mock",
      model: "local-source-grounded-fallback",
      warning: "Live AI is not configured. Set LLM_API_KEY or DEEPSEEK_API_KEY to call a real model."
    };
  }

  try {
    const completion = await createChatCompletion({
      messages: buildGroundedAnswerMessages({ question, evidence })
    }, llmConfig);
    const citedMarkdown = ensureCitationMarkers(completion.content, evidence);
    validateCitedAnswer(citedMarkdown, evidence);
    return {
      markdown: citedMarkdown,
      citations: toCitations(evidence),
      aiMode: "live",
      model: completion.model
    };
  } catch (error) {
    const fallback = buildMockGroundedAnswer(question, evidence);
    return {
      ...fallback,
      aiMode: "mock",
      model: "local-source-grounded-fallback",
      warning:
        error instanceof LlmRequestError
          ? error.message
          : error instanceof CitationValidationError
            ? "Live AI returned unsupported citation markers. Served local cited fallback."
          : "Live AI failed or returned an uncited answer. Served local cited fallback."
    };
  }
}

export async function generateAuthorModeAnswer({
  author,
  title,
  userMessage,
  evidence,
  llmConfig
}: {
  author: string;
  title: string;
  userMessage: string;
  evidence: EvidenceItem[];
  llmConfig?: LlmConfigInput;
}): Promise<GeneratedAnswer> {
  if (!isLiveLlmConfigured(llmConfig)) {
    return {
      markdown: buildAuthorModeFallback({ author, title, evidence }),
      citations: [],
      aiMode: "mock",
      model: "local-author-mode-fallback",
      warning: "当前没有配置可用模型，已使用本地书镜 fallback。"
    };
  }

  try {
    const completion = await createChatCompletion({
      messages: buildAuthorModeMessages({ author, title, userMessage, evidence })
    }, llmConfig);
    return {
      markdown: completion.content,
      citations: citationsUsedInMarkdown(completion.content, evidence),
      aiMode: "live",
      model: completion.model
    };
  } catch (error) {
    return {
      markdown: buildAuthorModeFallback({ author, title, evidence }),
      citations: [],
      aiMode: "mock",
      model: "local-author-mode-fallback",
      warning: error instanceof LlmRequestError ? "模型请求失败，已使用本地书镜 fallback。" : "书镜生成失败，已使用本地 fallback。"
    };
  }
}

function buildAuthorModeFallback({
  author,
  title,
  evidence
}: {
  author: string;
  title: string;
  evidence: EvidenceItem[];
}) {
  return `书镜：AI 模拟作者。作为从《${title}》进入的 ${author} 模拟，我不会只围着这一本书打转；我会把你的问题当成一个现实问题来处理，先抓住关键判断，再给出可执行的下一步。`;
}

function toCitations(evidence: EvidenceItem[]): CitationView[] {
  return evidence.map((item, index) => ({
    ...item,
    id: `cite-${index + 1}`
  }));
}

function citationsUsedInMarkdown(markdown: string, evidence: EvidenceItem[]) {
  const citationIds = new Set(Array.from(markdown.matchAll(/\[\^([a-z]+_\d+)\]/g), (match) => match[1]));
  return toCitations(evidence).filter((citation) => citationIds.has(citation.evidenceId));
}

function ensureCitationMarkers(markdown: string, evidence: EvidenceItem[]) {
  try {
    validateCitedAnswer(markdown, evidence);
    return markdown;
  } catch (error) {
    if (!(error instanceof CitationValidationError) || evidence.length === 0) {
      throw error;
    }
  }

  const fallbackCitation = `[^${evidence[0].evidenceId}]`;
  const evidenceIds = new Set(evidence.map((item) => item.evidenceId));
  return markdown
    .split(/\n{2,}/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        return trimmed;
      }
      const normalized = trimmed.replace(/\[\^(ev_\d+)\]/g, (marker, citationId: string) =>
        evidenceIds.has(citationId) ? marker : fallbackCitation
      );
      return /\[\^ev_\d+\]/.test(normalized) ? normalized : `${normalized} ${fallbackCitation}`;
    })
    .filter(Boolean)
    .join("\n\n");
}
