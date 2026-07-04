import { afterEach, describe, expect, it, vi } from "vitest";
import { createChatCompletion, getLlmConfig, LlmNotConfiguredError } from "@/lib/ai/chat-client";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

describe("getLlmConfig", () => {
  it("uses DeepSeek-compatible defaults without exposing a fake live mode", () => {
    delete process.env.LLM_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.LLM_BASE_URL;
    delete process.env.LLM_MODEL;

    expect(getLlmConfig()).toMatchObject({
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      configured: false
    });
  });
});

describe("createChatCompletion", () => {
  it("throws when live AI is not configured", async () => {
    process.env.LLM_API_KEY = "";
    delete process.env.DEEPSEEK_API_KEY;

    await expect(
      createChatCompletion({
        messages: [{ role: "user", content: "hello" }]
      })
    ).rejects.toBeInstanceOf(LlmNotConfiguredError);
  });

  it("sends an OpenAI-compatible chat completions request", async () => {
    process.env.LLM_API_KEY = "sk-test-real-looking-key";
    process.env.LLM_BASE_URL = "https://example.test/v1";
    process.env.LLM_MODEL = "deepseek-chat";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "A cited answer. [^ev_1]" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await createChatCompletion({
      messages: [{ role: "user", content: "hello" }],
      temperature: 0.1
    });

    expect(result.content).toBe("A cited answer. [^ev_1]");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test-real-looking-key",
          "Content-Type": "application/json"
        })
      })
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "hello" }],
      temperature: 0.1,
      stream: false
    });
  });

  it("uses per-request API config from the client settings flow", async () => {
    process.env.LLM_API_KEY = "";
    process.env.LLM_BASE_URL = "https://env-should-not-be-used.test";
    process.env.LLM_MODEL = "env-model";

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Configured answer. [^ev_1]" } }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await createChatCompletion(
      {
        messages: [{ role: "user", content: "hello" }]
      },
      {
        baseUrl: "https://custom-provider.test/v1",
        apiKey: "sk-user-provided-key",
        model: "custom-model"
      }
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://custom-provider.test/v1/chat/completions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer sk-user-provided-key"
        })
      })
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      model: "custom-model"
    });
  });
});
