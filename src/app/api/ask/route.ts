import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingQuestion } from "@/lib/mock-data";

const askSchema = z.object({
  question: z.string().trim().min(1),
  conversationId: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = askSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  return NextResponse.json(createPendingQuestion(parsed.data.question));
}

