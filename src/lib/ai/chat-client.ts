export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionInput = {
  messages: ChatMessage[];
  temperature?: number;
  responseFormat?: "text" | "json_object";
};

export type ChatCompletionOutput = {
  content: string;
  model: string;
  raw: unknown;
};

export type LlmConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  configured: boolean;
};

export type LlmConfigInput = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("LLM is not configured. Set LLM_API_KEY or DEEPSEEK_API_KEY to use live AI.");
  }
}

export class LlmRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export function getLlmConfig(): LlmConfig {
  const apiKey = process.env.LLM_API_KEY ?? process.env.DEEPSEEK_API_KEY ?? "";
  const baseUrl = process.env.LLM_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.LLM_MODEL ?? "deepseek-chat";

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    model,
    configured: isRealApiKey(apiKey)
  };
}

export function getRequestLlmConfig(config?: LlmConfigInput): LlmConfig {
  if (!config) {
    return getLlmConfig();
  }

  const baseUrl = config.baseUrl || process.env.LLM_BASE_URL || "https://api.deepseek.com";
  const apiKey = config.apiKey || "";
  const model = config.model || process.env.LLM_MODEL || "deepseek-chat";

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ""),
    model,
    configured: isRealApiKey(apiKey)
  };
}

export function isLiveLlmConfigured(config?: LlmConfigInput) {
  return getRequestLlmConfig(config).configured;
}

export async function createChatCompletion(input: ChatCompletionInput, overrideConfig?: LlmConfigInput): Promise<ChatCompletionOutput> {
  const config = getRequestLlmConfig(overrideConfig);

  if (!config.configured) {
    throw new LlmNotConfiguredError();
  }

  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages: input.messages,
    temperature: input.temperature ?? 0.2,
    stream: false
  };

  if (input.responseFormat === "json_object") {
    requestBody.response_format = { type: "json_object" };
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new LlmRequestError(`LLM request failed with ${response.status}: ${body.slice(0, 500)}`);
  }

  const raw = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = raw.choices?.[0]?.message?.content;

  if (!content) {
    throw new LlmRequestError("LLM response did not include choices[0].message.content.");
  }

  return {
    content,
    model: config.model,
    raw
  };
}

function isRealApiKey(apiKey: string) {
  const trimmed = apiKey.trim();
  return Boolean(trimmed) && !trimmed.includes("xxx") && !trimmed.includes("replace-with");
}
