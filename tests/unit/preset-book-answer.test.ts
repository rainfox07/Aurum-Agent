import { afterEach, describe, expect, it, vi } from "vitest";
import { generatePresetBookAnswer, shouldUseBookAnswer } from "@/lib/books/preset-book-answer";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generatePresetBookAnswer", () => {
  it("returns a casual Chinese book answer when no API key is configured", async () => {
    const answer = await generatePresetBookAnswer({
      question: "How should a startup validate a new product idea?",
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: ""
      }
    });

    expect(answer.aiMode).toBe("mock");
    expect(answer.markdown).toContain("《The Lean Startup》");
    expect(answer.markdown).toContain("> 摘录（位置：");
    expect(answer.markdown).toContain("**");
    expect(answer.markdown).not.toContain("[^book_1]");
    expect(answer.selectedBooks).toHaveLength(3);
    expect(answer.citations).toHaveLength(3);

    for (const citation of answer.citations) {
      expect(citation.title).toBeTruthy();
      expect(citation.authorOrDomain).toBeTruthy();
      expect(citation.sourceRef).toBeTruthy();
      expect(citation.quotedText).toBeTruthy();
      expect(citation.quotedText).not.toContain("Validated learning is");
    }
  });

  it("routes follow-up questions to the direct chat path instead of selecting three books again", async () => {
    const answer = await generatePresetBookAnswer({
      question: "那具体第一步怎么做？",
      conversationMessages: [
        {
          role: "assistant",
          content: "《Atomic Habits》会觉得：先改系统。\n\n> 摘录（位置：第一章）：**系统比目标更重要。**"
        }
      ],
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: ""
      }
    });

    expect(answer.selectedBooks).toHaveLength(0);
    expect(answer.citations).toHaveLength(0);
    expect(answer.aiMode).toBe("mock");
  });

  it("answers a quoted single-book follow-up without reusing the three-book format", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  "这句话的意思是：不要凭感觉决定先做什么，而是把判断标准写成可以反复使用的规则。比如先处理最影响结果的事情，再根据结果修正这条规则。"
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generatePresetBookAnswer({
      question: "Principles》会从另一个角度提醒，效率提升不是靠感觉，而是靠一套清晰的决策规则。这是什么意思？",
      conversationMessages: [
        {
          role: "assistant",
          content:
            "《Principles》会从另一个角度提醒，效率提升不是靠感觉，而是靠一套清晰的决策规则。\n\n> 摘录（位置：第二部分：生活原则）：达利欧在生活原则部分强调，原则不是挂在墙上的口号，而是可以反复使用的判断工具。\n\n《The Effective Executive》会补充说，光有决策规则还不够。\n\n《Thinking, Fast and Slow》会从另一个角度提醒，你凭感觉做的决策，往往只是系统1的快速反应。"
        }
      ],
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: "sk-real-test-key"
      }
    });

    expect(answer.aiMode).toBe("live");
    expect(answer.selectedBooks).toHaveLength(0);
    expect(answer.citations).toHaveLength(0);
    expect(answer.markdown).not.toContain("《The Effective Executive》");
    expect(answer.markdown).not.toContain("《Thinking, Fast and Slow》");
    expect(answer.markdown).not.toContain("摘录（位置：");
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(requestBody.messages[0].content).toContain("只解释用户追问的这一本书");
    expect(requestBody.messages[1].content).not.toContain("《The Effective Executive》");
  });

  it("falls back to a single-book answer when a focused follow-up response mentions other books", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  "《Principles》是这个意思。《The Effective Executive》也会补充时间记录，《Thinking, Fast and Slow》则会提醒偏见。"
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generatePresetBookAnswer({
      question: "Principles 这句话是什么意思？",
      conversationMessages: [
        {
          role: "assistant",
          content:
            "《Principles》会从另一个角度提醒，效率提升不是靠感觉，而是靠一套清晰的决策规则。\n\n《The Effective Executive》会补充说，光有决策规则还不够。"
        }
      ],
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: "sk-real-test-key"
      }
    });

    expect(answer.markdown).toContain("《Principles》这里的意思是");
    expect(answer.markdown).not.toContain("《The Effective Executive》");
    expect(answer.markdown).not.toContain("《Thinking, Fast and Slow》");
  });

  it("does not use the three-book flow for concrete personal situations", () => {
    expect(shouldUseBookAnswer("我今天下午只有三小时，怎么安排效率？")).toBe(false);
    expect(shouldUseBookAnswer("我如何提高自己的办事效率")).toBe(true);
    expect(
      shouldUseBookAnswer("Principles》会从另一个角度提醒，效率提升不是靠感觉，而是靠一套清晰的决策规则。这是什么意思？", [
        {
          role: "assistant",
          content: "《Principles》会觉得：先用原则判断。\n\n《The Effective Executive》会补充：先记录时间。"
        }
      ])
    ).toBe(false);
  });

  it("briefly answers non-question messages without selecting books", async () => {
    const answer = await generatePresetBookAnswer({
      question: "你好",
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: ""
      }
    });

    expect(answer.markdown).toContain("你好");
    expect(answer.markdown).toContain("不是大模型响应");
    expect(answer.aiMode).toBe("mock");
    expect(answer.warning).toContain("本地兜底");
    expect(answer.selectedBooks).toHaveLength(0);
    expect(answer.citations).toHaveLength(0);
  });

  it("uses live LLM for assistant meta questions when configured", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "我是 Aurum，当前这条是通过已配置模型接口生成的简短回复。" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generatePresetBookAnswer({
      question: "你现在是大模型响应吗",
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: "sk-real-test-key"
      }
    });

    expect(answer.aiMode).toBe("live");
    expect(answer.markdown).toContain("已配置模型接口");
    expect(answer.selectedBooks).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledWith("https://api.deepseek.com/chat/completions", expect.any(Object));
  });

  it("normalizes inline model quotes into standalone quote blocks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content:
                  "《The Lean Startup》会觉得：先做最小版本。 > 摘录（位置：第三章：学习）：先验证关键假设，再根据用户反应调整。**最小可行产品能让创业者尽快开始学习。**\n\n《Zero to One》会补充：找独特方向。\n> 摘录（位置：第一章：未来的挑战）：不要只复制旧做法。**重复已知做法，只是把世界从 1 推到 n。**\n\n《Poor Charlie's Almanack》会提醒：多模型思考。\n> 摘录（位置：第二讲：基础普世智慧）：多换几个学科视角看问题。**手里只有锤子的人，看什么都像钉子。**"
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const answer = await generatePresetBookAnswer({
      question: "How should a startup validate a new product idea?",
      llmConfig: {
        baseUrl: "https://api.deepseek.com",
        model: "deepseek-chat",
        apiKey: "sk-real-test-key"
      }
    });

    expect(answer.markdown).toContain("。\n\n> 摘录（位置：第三章：学习）：先验证关键假设");
  });
});
