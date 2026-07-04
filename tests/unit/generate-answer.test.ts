import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAuthorModeAnswer, generateGroundedAnswer } from "@/lib/answers/generate-answer";
import type { EvidenceItem } from "@/lib/types";

const originalEnv = { ...process.env };

const evidence: EvidenceItem[] = [
  {
    evidenceId: "ev_1",
    sourceId: "principles",
    title: "Principles",
    authorOrDomain: "Ray Dalio",
    sourceRef: "Part II",
    quotedText: "Make decisions from explicit principles."
  }
];

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("generateGroundedAnswer", () => {
  it("keeps live model output and repairs missing citation markers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "先把决策原则写下来，再根据现实反馈修正。" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generateGroundedAnswer({
      question: "如何做决策？",
      evidence,
      llmConfig: {
        baseUrl: "https://example.test/v1",
        apiKey: "sk-user-provided-key",
        model: "custom-model"
      }
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(answer.aiMode).toBe("live");
    expect(answer.model).toBe("custom-model");
    expect(answer.markdown).toBe("先把决策原则写下来，再根据现实反馈修正。 [^ev_1]");
  });

  it("normalizes unknown citation markers from live output", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "先写下原则，再复盘。 [^ev_9]" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generateGroundedAnswer({
      question: "如何做决策？",
      evidence,
      llmConfig: {
        baseUrl: "https://example.test/v1",
        apiKey: "sk-user-provided-key",
        model: "custom-model"
      }
    });

    expect(answer.aiMode).toBe("live");
    expect(answer.markdown).toBe("先写下原则，再复盘。 [^ev_1]");
  });
});

describe("generateAuthorModeAnswer", () => {
  it("uses per-request API config and builds an AI simulation prompt", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "书镜：AI 模拟作者。以这本书的视角，我会先要求你把判断原则写清楚。 [^ev_1]"
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generateAuthorModeAnswer({
      author: "Ray Dalio",
      title: "Principles",
      userMessage: "我该怎么做决策？",
      evidence,
      llmConfig: {
        baseUrl: "https://example.test/v1",
        apiKey: "sk-user-provided-key",
        model: "custom-model"
      }
    });

    expect(answer.aiMode).toBe("live");
    expect(answer.model).toBe("custom-model");
    expect(answer.citations).toHaveLength(1);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(requestBody.messages[0].content).toContain("书镜：AI 模拟作者");
    expect(requestBody.messages[0].content).toContain("不要声称自己是真实的 Ray Dalio");
    expect(requestBody.messages[0].content).toContain("不要把作者困在这一本书里");
  });

  it("keeps uncited live author-mode output instead of forcing book citations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "书镜：AI 模拟作者。先把判断规则写清楚，再用现实反馈修正。"
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generateAuthorModeAnswer({
      author: "Ray Dalio",
      title: "Principles",
      userMessage: "我应该怎样做？",
      evidence,
      llmConfig: {
        baseUrl: "https://example.test/v1",
        apiKey: "sk-user-provided-key",
        model: "custom-model"
      }
    });

    expect(answer.aiMode).toBe("live");
    expect(answer.model).toBe("custom-model");
    expect(answer.warning).toBeUndefined();
    expect(answer.citations).toHaveLength(0);
    expect(answer.markdown).toBe("书镜：AI 模拟作者。先把判断规则写清楚，再用现实反馈修正。");
  });
});
