import { NextResponse } from "next/server";
import { z } from "zod";
import { createChatCompletion, LlmNotConfiguredError, LlmRequestError } from "@/lib/ai/chat-client";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1)
});

const chatSchema = z.object({
  message: z.string().trim().min(1),
  conversationMessages: z.array(chatMessageSchema).default([]),
  llmConfig: z
    .object({
      baseUrl: z.string().trim().min(1),
      model: z.string().trim().min(1),
      apiKey: z.string().min(1)
    })
    .optional()
});

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  try {
    const completion = await createChatCompletion(
      {
        messages: [
          {
            role: "system",
            content: "You are Aurum Agent. Answer the user's message directly and naturally. Do not require source evidence or citation markers."
          },
          ...parsed.data.conversationMessages.slice(-12),
          {
            role: "user",
            content: parsed.data.message
          }
        ],
        temperature: 0.3
      },
      parsed.data.llmConfig
    );

    return NextResponse.json({
      messageId: `asst-${Date.now()}`,
      markdown: completion.content,
      model: completion.model
    });
  } catch (error) {
    if (error instanceof LlmNotConfiguredError) {
      return NextResponse.json({ error: "API key is not configured. Add it in Settings > API 配置." }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: error instanceof LlmRequestError ? error.message : "Model request failed."
      },
      { status: 502 }
    );
  }
}
