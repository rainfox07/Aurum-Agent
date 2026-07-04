import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePresetBookAnswer } from "@/lib/books/preset-book-answer";

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1)
});

const presetBookAnswerSchema = z.object({
  question: z.string().trim().min(1),
  conversationMessages: z.array(conversationMessageSchema).default([]),
  llmConfig: z
    .object({
      baseUrl: z.string().trim().min(1),
      model: z.string().trim().min(1),
      apiKey: z.string().optional()
    })
    .optional()
});

export async function POST(request: Request) {
  const parsed = presetBookAnswerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const answer = await generatePresetBookAnswer(parsed.data);
  return NextResponse.json(answer);
}
